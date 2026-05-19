import net from "node:net";
import tls from "node:tls";

const valkeyUrl = process.env.AIVEN_VALKEY_URL || process.env.VALKEY_URL || process.env.REDIS_URL;

if (!valkeyUrl) {
  console.error("Valkey is not configured. Set AIVEN_VALKEY_URL, VALKEY_URL, or REDIS_URL first.");
  process.exit(1);
}

const parsed = new URL(valkeyUrl);
const tlsEnabled = parsed.protocol === "rediss:";
const dbSegment = parsed.pathname.replace("/", "").trim();
const port = parsed.port ? Number(parsed.port) : tlsEnabled ? 6380 : 6379;

const key = `ghostpay:valkey-healthcheck:${Date.now()}`;
const commands = [];

if (parsed.password) {
  commands.push(parsed.username ? ["AUTH", parsed.username, parsed.password] : ["AUTH", parsed.password]);
}

if (dbSegment) {
  commands.push(["SELECT", String(Number(dbSegment) || 0)]);
}

commands.push(["SET", key, "ok"]);
commands.push(["GET", key]);
commands.push(["DEL", key]);

function encodeCommand(args) {
  return `*${args.length}\r\n${args.map((arg) => `$${Buffer.byteLength(arg)}\r\n${arg}\r\n`).join("")}`;
}

function parseValue(input, start = 0) {
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

  throw new Error(`Unsupported Valkey response prefix: ${prefix}`);
}

const socket = tlsEnabled
  ? tls.connect({ host: parsed.hostname, port, servername: parsed.hostname })
  : net.connect({ host: parsed.hostname, port });

let buffer = "";
let replies = 0;
let getValue = null;
let settled = false;

function finish(code, message) {
  if (settled) return;
  settled = true;
  if (!socket.destroyed) socket.destroy();
  const method = code === 0 ? "log" : "error";
  console[method](message);
  process.exit(code);
}

socket.setEncoding("utf8");
socket.setTimeout(10_000);

socket.on("connect", () => {
  socket.write(commands.map(encodeCommand).join(""));
});

socket.on("data", (chunk) => {
  buffer += chunk;

  try {
    while (replies < commands.length) {
      const parsedValue = parseValue(buffer);
      if (!parsedValue) break;
      replies += 1;
      if (replies === commands.length - 1) {
        getValue = parsedValue.value;
      }
      buffer = buffer.slice(parsedValue.next);
    }

    if (replies === commands.length) {
      finish(getValue === "ok" ? 0 : 1, getValue === "ok" ? "Valkey healthcheck passed." : "Valkey healthcheck failed: unexpected GET value.");
    }
  } catch (error) {
    finish(1, `Valkey healthcheck failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
});

socket.on("timeout", () => finish(1, "Valkey healthcheck failed: connection timed out."));
socket.on("error", (error) => finish(1, `Valkey healthcheck failed: ${error.message}`));
socket.on("end", () => {
  if (replies < commands.length) {
    finish(1, "Valkey healthcheck failed: connection closed before all responses were received.");
  }
});
