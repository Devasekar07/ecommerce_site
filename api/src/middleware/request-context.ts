import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { logger } from "../lib/logger.js";

export function requestContext(request: Request, response: Response, next: NextFunction) {
  const requestId = randomUUID();
  request.requestId = requestId;
  response.setHeader("x-request-id", requestId);

  const startedAt = Date.now();

  response.on("finish", () => {
    logger.info("HTTP request completed", {
      requestId,
      method: request.method,
      path: request.originalUrl,
      statusCode: response.statusCode,
      durationMs: Date.now() - startedAt
    });
  });

  next();
}
