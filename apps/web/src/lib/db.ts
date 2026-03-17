import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

// Graceful shutdown -- release DB connections on SIGTERM (Docker stop/deploy)
process.on("SIGTERM", async () => {
  await db.$disconnect();
});
