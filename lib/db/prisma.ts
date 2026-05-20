import { PrismaClient } from "@prisma/client";
import { getPostgresUrl } from "@/lib/env";

declare global {
  // eslint-disable-next-line no-var
  var __tippitPrisma__: PrismaClient | undefined;
}

function assertPostgresUrl() {
  const url = getPostgresUrl();
  if (!url) {
    throw new Error(
      "Postgres is not configured. Set one of POSTGRES_AIVEN_URL, AIVEN_POSTGRES_URL, POSTGRES_URL, DATABASE_URL, or POSTGRES_AIVEN_KEY."
    );
  }
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = url;
  }
}

export function getPrismaClient() {
  assertPostgresUrl();

  if (!global.__tippitPrisma__) {
    global.__tippitPrisma__ = new PrismaClient();
  }

  return global.__tippitPrisma__;
}
