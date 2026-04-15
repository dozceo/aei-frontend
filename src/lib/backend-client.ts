import { getCurrentIdToken } from "@/lib/auth-client";

const DEFAULT_TIMEOUT_MS = 15_000;

export interface BackendRequestOptions extends RequestInit {
  requireAuth?: boolean;
  timeoutMs?: number;
}

function getBackendBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured.");
  }

  return baseUrl.replace(/\/$/, "");
}

async function buildHeaders(initHeaders: HeadersInit | undefined, requireAuth: boolean): Promise<Headers> {
  const headers = new Headers(initHeaders);

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (requireAuth) {
    const token = await getCurrentIdToken();

    if (!token) {
      throw new Error("No Firebase user token available. Please sign in again.");
    }

    headers.set("Authorization", `Bearer ${token}`);
  }

  return headers;
}

export async function backendRequest<T>(path: string, options: BackendRequestOptions = {}): Promise<T> {
  const { requireAuth = true, timeoutMs = DEFAULT_TIMEOUT_MS, ...requestInit } = options;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers = await buildHeaders(requestInit.headers, requireAuth);
    const response = await fetch(`${getBackendBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`, {
      ...requestInit,
      headers,
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Backend request failed with status ${response.status}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

export function backendGet<T>(path: string, options: Omit<BackendRequestOptions, "method"> = {}): Promise<T> {
  return backendRequest<T>(path, { ...options, method: "GET" });
}

export function backendPost<T>(path: string, body?: unknown, options: Omit<BackendRequestOptions, "method" | "body"> = {}): Promise<T> {
  return backendRequest<T>(path, {
    ...options,
    method: "POST",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
