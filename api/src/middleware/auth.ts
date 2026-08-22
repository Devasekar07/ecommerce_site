import type { NextFunction, Request, Response } from "express";
import { AppError } from "../lib/errors.js";
import { sessionCookieName, verifySessionToken } from "../lib/session.js";

export function optionalAuth(request: Request, _response: Response, next: NextFunction) {
  const token = request.cookies?.[sessionCookieName];

  if (!token || typeof token !== "string") {
    next();
    return;
  }

  try {
    request.auth = verifySessionToken(token);
  } catch {
    request.auth = undefined;
  }

  next();
}

export function requireAuth(request: Request, _response: Response, next: NextFunction) {
  if (!request.auth) {
    next(new AppError("You need to sign in to continue.", 401, "AUTH_REQUIRED"));
    return;
  }

  next();
}
