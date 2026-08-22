import { PrismaClient } from "@prisma/client";
import { logger } from "./logger.js";

export const prisma = new PrismaClient({
  log: [
    { emit: "event", level: "warn" },
    { emit: "event", level: "error" }
  ]
});

prisma.$on("warn", (event) => {
  logger.warn("Prisma warning", { message: event.message, target: event.target });
});

prisma.$on("error", (event) => {
  logger.error("Prisma error", { message: event.message, target: event.target });
});
