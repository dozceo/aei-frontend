/**
 * Next.js adapter for the ported 02dev ML client.
 * Uses NEXT_PUBLIC_ML_SERVICE_URL (or Express proxy in production).
 */
import { MlServingClient } from "@/lib/intelligence/ml/ml-client";

const baseUrl =
  process.env.NEXT_PUBLIC_ML_SERVICE_URL?.replace(/\/+$/, "") ||
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") + "/api/ml" ||
  "https://ml-training-production-a139.up.railway.app";

export const mlClient = new MlServingClient({ baseUrl });

export { MlServingClient };
export * from "@/lib/intelligence/ml/index";
