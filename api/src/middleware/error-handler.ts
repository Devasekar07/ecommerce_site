import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { env } from "../config/env.js";
import { AppError } from "../lib/errors.js";
import { logger } from "../lib/logger.js";

export function notFoundHandler(request: Request, _response: Response, next: NextFunction) {
  next(new AppError(`Route not found: ${request.method} ${request.originalUrl}`, 404, "ROUTE_NOT_FOUND"));
}

export function errorHandler(error: unknown, request: Request, response: Response, _next: NextFunction) {
  const normalized = normalizeError(error);

  logger.error("Request failed", {
    requestId: request.requestId,
    method: request.method,
    path: request.originalUrl,
    statusCode: normalized.statusCode,
    code: normalized.code,
    message: normalized.message,
    details: normalized.details
  });

  response.status(normalized.statusCode).json({
    error: {
      code: normalized.code,
      message: normalized.message,
      details: normalized.details,
      requestId: request.requestId,
      stack: env.NODE_ENV === "production" ? undefined : normalized.stack
    }
  });
}

function normalizeError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof ZodError) {
    return new AppError("Request validation failed.", 400, "VALIDATION_FAILED", error.flatten());
  }

  if (error instanceof Error) {
    return new AppError(error.message, 500, "INTERNAL_ERROR", undefined);
  }

  return new AppError("Unexpected server error.", 500, "INTERNAL_ERROR");
}
