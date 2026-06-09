import { db, providerLogs } from "@worldcup/domain";

// ────────── Shared HTTP Client ──────────
//
// Handles authentication, rate-limiting, retries with
// exponential backoff + jitter, and asynchronous logging
// of raw responses to the database (provider_logs).

/**
 * Error class for non-retryable HTTP responses (4xx except 429).
 * These are thrown immediately without retry attempts.
 */
class NonRetryableHttpError extends Error {
  constructor(status: number, statusText: string) {
    super(`[TheStatsApiClient] HTTP Error: ${status} ${statusText}`);
    this.name = "NonRetryableHttpError";
  }
}

export class TheStatsApiClient {
  protected apiKey: string;
  protected baseUrl: string;

  constructor() {
    this.apiKey = process.env.THESTATSAPI_KEY || "";
    this.baseUrl = "https://api.thestatsapi.com/v1";
  }

  /**
   * Perform an authenticated HTTP request with automatic retry and
   * rate-limit handling.
   *
   * - 429 (Too Many Requests): wait for Retry-After header or exponential backoff
   * - 5xx (Server Error):      exponential backoff with random jitter
   * - Network drops:           caught in the catch block, retried
   *
   * Maximum 3 retry attempts. On success the raw payload is written
   * asynchronously to `provider_logs`.
   */
  protected async request<T>(path: string, entityType: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers = {
      ...options.headers,
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };

    let attempts = 0;
    const maxRetries = 3;

    while (attempts < maxRetries) {
      try {
        const response = await fetch(url, { ...options, headers });

        // ── Rate limited (429) ──
        if (response.status === 429) {
          const retryAfterHeader = response.headers.get("Retry-After");
          const waitMs = retryAfterHeader
            ? parseInt(retryAfterHeader, 10) * 1000
            : Math.pow(2, attempts) * 1000;
          console.warn(
            `[TheStatsApiClient] Rate limited (429) on ${path}. ` +
              `Retrying in ${waitMs}ms (attempt ${attempts + 1}/${maxRetries})...`,
          );
          await new Promise((resolve) => setTimeout(resolve, waitMs));
          attempts++;
          continue;
        }

        // ── Server errors (5xx) ──
        if (!response.ok && response.status >= 500) {
          const waitMs = Math.pow(2, attempts) * 1000 + Math.random() * 200;
          console.warn(
            `[TheStatsApiClient] Server error (${response.status}) on ${path}. ` +
              `Retrying in ${Math.round(waitMs)}ms (attempt ${attempts + 1}/${maxRetries})...`,
          );
          await new Promise((resolve) => setTimeout(resolve, waitMs));
          attempts++;
          continue;
        }

        // ── Other HTTP errors (non-retryable) ──
        if (!response.ok) {
          throw new NonRetryableHttpError(response.status, response.statusText);
        }

        const data = (await response.json()) as T;

        // Fire-and-forget: log raw response to DB (non-blocking)
        this.logRawPayload(entityType, data).catch((err) =>
          console.error("[TheStatsApiClient] Failed to persist provider log:", err),
        );

        return data;
      } catch (error) {
        // Non-retryable HTTP errors (4xx except 429) throw immediately
        if (error instanceof NonRetryableHttpError) {
          throw error;
        }
        attempts++;
        if (attempts >= maxRetries) {
          throw error;
        }
        // Catch block handles network drops — wait a short jittered
        // backoff before the next attempt.
        const waitMs = Math.pow(2, attempts) * 500 + Math.random() * 500;
        console.warn(
          `[TheStatsApiClient] Request failed on ${path} (attempt ${attempts}/${maxRetries}). ` +
            `Retrying in ${Math.round(waitMs)}ms...`,
        );
        await new Promise((resolve) => setTimeout(resolve, waitMs));
      }
    }

    throw new Error(`[TheStatsApiClient] Max retry attempts (${maxRetries}) reached for ${path}.`);
  }

  /**
   * Asynchronously write the raw provider payload to the database
   * audit log.  This is intentionally fire-and-forget so it never
   * delays the HTTP response to the caller.
   */
  private async logRawPayload(entityType: string, rawJson: unknown): Promise<void> {
    await db.insert(providerLogs).values({
      provider: "TheStatsAPI",
      entityType,
      rawJsonb: rawJson as Record<string, unknown>,
    });
  }
}
