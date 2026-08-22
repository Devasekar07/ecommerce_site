import { env } from "./config/env.js";
import { createApp } from "./app.js";
import { logger } from "./lib/logger.js";
import { prisma } from "./lib/prisma.js";

const app = createApp();
const server = app.listen(env.PORT, env.HOST, () => {
  logger.info("Commerce API listening", {
    host: env.HOST,
    port: env.PORT,
    environment: env.NODE_ENV
  });
});

async function shutdown(signal: string) {
  logger.info("Commerce API shutting down", { signal });

  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});
