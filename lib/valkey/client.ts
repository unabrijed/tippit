import net from "node:net";
import tls from "node:tls";

type RedisValue = string | number | null | RedisValue[];

type ValkeyConfig = {
  host: string;
  port: number;
  username?: string;
  password?: string;
  db: number;
  tls: boolean;
};

function getValkeyUrl() {
  return process.env.AIVEN_VALKEY_URL || process.env.VALKEY_URL || process.env.REDIS_URL || null;
}

function parseConfig(): ValkeyConfig | null {
  const url = getValkeyUrl();
  if (!url) return null;

  const parsed = new URL(url);
  const isTls = parsed.protocol === "rediss:";
  const dbSegment = parsed.pathname.replace("/", "").trim();

  return {
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : isTls ? 6380 : 6379,
    username: parsed.username || undefined,
    password: parsed.password || undefined,
    db: dbSegment ? Number(dbSegment) || 0 : 0,
    tls: isTls
  };
}

function encodeCommand(args: string[]) {
  return `*${args.length}\r\n${args.map((arg) => `$${Buffer.byteLength(arg)}\r\n${arg}\r\n`).join("")}`;
}

function parseValue(input: string, start = 0): { value: RedisValue; next: number } | null {
  const prefix = input[start];
  const lineEnd = input.indexOf("\r\n", start);
  if (lineEnd === -1) return null;

  if (prefix === "+") {
    return { value: input.slice(start + 1, lineEnd), next: lineEnd + 2 };
  }

  if (prefix === "-") {
    throw new Error(input.slice(start + 1, lineEnd));
  }

  if (prefix === ":") {
    return { value: Number(input.slice(start + 1, lineEnd)), next: lineEnd + 2 };
  }

  if (prefix === "$") {
    const length = Number(input.slice(start + 1, lineEnd));
    if (length === -1) return { value: null, next: lineEnd + 2 };
    const valueStart = lineEnd + 2;
    const valueEnd = valueStart + length;
    if (input.length < valueEnd + 2) return null;
    return { value: input.slice(valueStart, valueEnd), next: valueEnd + 2 };
  }

  if (prefix === "*") {
    const count = Number(input.slice(start + 1, lineEnd));
    if (count === -1) return { value: null, next: lineEnd + 2 };
    let next = lineEnd + 2;
    const values: RedisValue[] = [];
    for (let index = 0; index < count; index += 1) {
      const parsed = parseValue(input, next);
      if (!parsed) return null;
      values.push(parsed.value);
      next = parsed.next;
    }
    return { value: values, next };
  }

  throw new Error(`Unsupported Valkey response prefix: ${prefix}`);
}

async function send(commands: string[][]) {
  const config = parseConfig();
  if (!config) {
    throw new Error("Valkey is not configured.");
  }

  return new Promise<RedisValue[]>((resolve, reject) => {
    const socket = config.tls
      ? tls.connect({ host: config.host, port: config.port, servername: config.host })
      : net.connect({ host: config.host, port: config.port });

    const pipeline: string[][] = [];
    if (config.password) {
      pipeline.push(config.username ? ["AUTH", config.username, config.password] : ["AUTH", config.password]);
    }
    if (config.db > 0) {
      pipeline.push(["SELECT", String(config.db)]);
    }
    pipeline.push(...commands);

    let buffer = "";
    const values: RedisValue[] = [];
    let settled = false;

    const cleanup = () => {
      socket.removeAllListeners();
      if (!socket.destroyed) socket.destroy();
    };

    socket.setEncoding("utf8");

    socket.on("connect", () => {
      socket.write(pipeline.map(encodeCommand).join(""));
    });

    socket.on("data", (chunk) => {
      buffer += chunk;
      try {
        while (values.length < pipeline.length) {
          const parsed = parseValue(buffer);
          if (!parsed) break;
          values.push(parsed.value);
          buffer = buffer.slice(parsed.next);
        }

        if (values.length === pipeline.length && !settled) {
          settled = true;
          cleanup();
          resolve(values.slice(pipeline.length - commands.length));
        }
      } catch (error) {
        if (!settled) {
          settled = true;
          cleanup();
          reject(error);
        }
      }
    });

    socket.on("error", (error) => {
      if (!settled) {
        settled = true;
        cleanup();
        reject(error);
      }
    });

    socket.on("end", () => {
      if (!settled && values.length < pipeline.length) {
        settled = true;
        cleanup();
        reject(new Error("Valkey connection closed before the response completed."));
      }
    });
  });
}

export function isValkeyConfigured() {
  return Boolean(getValkeyUrl());
}

export function getValkeyClient() {
  if (!isValkeyConfigured()) return null;

  return {
    async get(key: string) {
      const [value] = await send([["GET", key]]);
      return typeof value === "string" ? value : null;
    },
    async set(key: string, value: string) {
      await send([["SET", key, value]]);
    },
    async del(key: string) {
      await send([["DEL", key]]);
    }
  };
}
