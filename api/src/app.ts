import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import { getVersionMetadata } from "./config/version.js";
import { env } from "./config/env.js";
import { catalogRouter } from "./modules/catalog/catalog.routes.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { cartRouter } from "./modules/cart/cart.routes.js";
import { customerRouter } from "./modules/customer/customer.routes.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { requestContext } from "./middleware/request-context.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.CLIENT_ORIGIN.split(",").map((origin) => origin.trim()),
      credentials: true
    })
  );
  app.use(cookieParser());
  app.use(express.json({ limit: "1mb" }));
  app.use(requestContext);

  app.get("/health", (_request, response) => {
    response.json({
      status: "ok",
      service: "commerce-api",
      version: env.APP_VERSION,
      uptimeSeconds: Math.round(process.uptime())
    });
  });

  app.get("/api/v1/version", (_request, response) => {
    response.json(getVersionMetadata());
  });

  app.use("/api/v1", catalogRouter);
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/cart", cartRouter);
  app.use("/api/v1/account", customerRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
