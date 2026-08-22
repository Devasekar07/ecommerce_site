import { API_BASE_URL } from "./config";
import { isBrowserOffline } from "./networkStatus";

const offlineMessage = "You are offline. Check your connection and try again.";

export class ApiClientError extends Error {
  public readonly status: number;
  public readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
  }
}

type JsonRequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
};

export async function getJson<T>(path: string, options: Omit<JsonRequestOptions, "method" | "body"> = {}): Promise<T> {
  return requestJson<T>(path, { ...options, method: "GET" });
}

export async function postJson<T>(path: string, body?: unknown, options: Omit<JsonRequestOptions, "method" | "body"> = {}) {
  return requestJson<T>(path, { ...options, method: "POST", body });
}

export async function patchJson<T>(path: string, body?: unknown, options: Omit<JsonRequestOptions, "method" | "body"> = {}) {
  return requestJson<T>(path, { ...options, method: "PATCH", body });
}

export async function deleteJson<T>(path: string, options: Omit<JsonRequestOptions, "method" | "body"> = {}) {
  return requestJson<T>(path, { ...options, method: "DELETE" });
}

async function requestJson<T>(path: string, options: JsonRequestOptions): Promise<T> {
  if (isBrowserOffline()) {
    throw new ApiClientError(offlineMessage, 0, "OFFLINE");
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...options.headers
  };

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    credentials: "include",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  }).catch((error: unknown) => {
    if (isBrowserOffline()) {
      throw new ApiClientError(offlineMessage, 0, "OFFLINE");
    }

    throw error;
  });

  const payload = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    const apiError = payload as { error?: { message?: string; code?: string } } | null;
    throw new ApiClientError(
      apiError?.error?.message ?? "The catalogue could not be loaded.",
      response.status,
      apiError?.error?.code
    );
  }

  return payload as T;
}
