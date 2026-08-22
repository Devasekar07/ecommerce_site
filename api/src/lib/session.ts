import type { Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "./errors.js";

export const sessionCookieName = "fashion_rail_session";
export const sessionDurationMs = 7 * 24 * 60 * 60 * 1000;

export type SessionPayload = {
  customerId: string;
  email: string;
};

export function createSessionToken(payload: SessionPayload) {
  return jwt.sign(
    {
      email: payload.email
    },
    getJwtSecret(),
    {
      expiresIn: "7d",
      subject: payload.customerId
    }
  );
}

export function verifySessionToken(token: string): SessionPayload {
  const decoded = jwt.verify(token, getJwtSecret());

  if (!isSessionJwtPayload(decoded)) {
    throw new AppError("Invalid session.", 401, "INVALID_SESSION");
  }

  return {
    customerId: decoded.sub,
    email: decoded.email
  };
}

export function setSessionCookie(response: Response, token: string) {
  response.cookie(sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    maxAge: sessionDurationMs,
    path: "/"
  });
}

export function clearSessionCookie(response: Response) {
  response.clearCookie(sessionCookieName, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/"
  });
}

function getJwtSecret() {
  if (!env.JWT_SECRET) {
    throw new AppError("JWT_SECRET is not configured.", 500, "AUTH_NOT_CONFIGURED");
  }

  return env.JWT_SECRET;
}

function isSessionJwtPayload(value: string | JwtPayload): value is JwtPayload & { sub: string; email: string } {
  return typeof value !== "string" && typeof value.sub === "string" && typeof value.email === "string";
}
