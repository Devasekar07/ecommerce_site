import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { env } from "./env.js";
import { logger } from "../lib/logger.js";

type LatestMetadata = {
  version: string;
  releasedAt: string | null;
  message: string;
};

const fallbackLatest: LatestMetadata = {
  version: "0.0.0",
  releasedAt: null,
  message: "No release metadata available."
};

function readLatestMetadata(): LatestMetadata {
  const candidatePaths = [
    resolve(process.cwd(), "../latest.json"),
    resolve(process.cwd(), "latest.json")
  ];

  for (const filePath of candidatePaths) {
    try {
      const parsed = JSON.parse(readFileSync(filePath, "utf8")) as LatestMetadata;
      if (typeof parsed.version === "string" && typeof parsed.message === "string") {
        return parsed;
      }
    } catch {
      continue;
    }
  }

  logger.warn("Could not read latest.json metadata", { triedPaths: candidatePaths });
  return fallbackLatest;
}

export function getVersionMetadata() {
  return {
    currentVersion: env.APP_VERSION,
    latest: readLatestMetadata()
  };
}
