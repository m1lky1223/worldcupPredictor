import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the @worldcup/domain module so we never connect to a real database.
vi.mock("@worldcup/domain", () => ({
  db: { insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) }) },
  providerLogs: {},
}));

// We import after mocking so TheStatsApiClient uses the mocked db.
import { TheStatsApiClient } from "../base-client.js";

/**
 * Helper: create a minimal Response-like object.
 * Vitest runs on Node where Response is available (Node 18+).
 */
function mockResponse(
  status: number,
  body: unknown = null,
  headers: Record<string, string> = {},
): Response {
  return new Response(body !== null ? JSON.stringify(body) : null, {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

describe("TheStatsApiClient", () => {
  let client: TheStatsApiClient;

  beforeEach(() => {
    vi.clearAllMocks();
    // TheStatsApiClient uses no-arg constructor; set env for test
    process.env.THESTATSAPI_KEY = "test-api-key";
    client = new (class extends TheStatsApiClient {
      // Expose protected request for testing
      public testRequest<T>(path: string, entityType: string, options?: RequestInit) {
        return this.request<T>(path, entityType, options);
      }
    })();
  });

  describe("request retry behavior", () => {
    it("should succeed on first attempt when response is 200", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
        mockResponse(200, { data: "ok" }),
      );

      const result = await (client as any).testRequest("/test", "test_entity");
      expect(result).toEqual({ data: "ok" });
      expect(fetchSpy).toHaveBeenCalledTimes(1);

      fetchSpy.mockRestore();
    });

    it("should retry up to 3 times on 429 and then succeed", async () => {
      let callCount = 0;
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
        callCount++;
        if (callCount < 3) {
          return mockResponse(429, null, { "Retry-After": "0" });
        }
        return mockResponse(200, { data: "recovered" });
      });

      const result = await (client as any).testRequest("/test", "test_entity");
      expect(result).toEqual({ data: "recovered" });
      expect(callCount).toBe(3);

      fetchSpy.mockRestore();
    });

    it("should retry up to 3 times on 500 and then succeed", async () => {
      let callCount = 0;
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
        callCount++;
        if (callCount < 3) {
          return mockResponse(500);
        }
        return mockResponse(200, { data: "recovered" });
      });

      const result = await (client as any).testRequest("/test", "test_entity");
      expect(result).toEqual({ data: "recovered" });
      expect(callCount).toBe(3);

      fetchSpy.mockRestore();
    });

    it("should throw after exhausting all 3 retry attempts on persistent 429", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
        mockResponse(429, null, { "Retry-After": "0" }),
      );

      await expect((client as any).testRequest("/test", "test_entity")).rejects.toThrow();
      expect(fetchSpy).toHaveBeenCalledTimes(3);

      fetchSpy.mockRestore();
    });

    it("should throw after exhausting all 3 retry attempts on persistent 500", { timeout: 15000 }, async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
        mockResponse(500),
      );

      await expect((client as any).testRequest("/test", "test_entity")).rejects.toThrow();
      expect(fetchSpy).toHaveBeenCalledTimes(3);

      fetchSpy.mockRestore();
    });

    it("should throw on non-retryable 4xx error (e.g. 404)", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
        mockResponse(404, { error: "Not found" }),
      );

      await expect((client as any).testRequest("/test", "test_entity")).rejects.toThrow();

      // Should NOT retry on 4xx
      expect(fetchSpy).toHaveBeenCalledTimes(1);

      fetchSpy.mockRestore();
    });

    it("should retry on network error and then succeed", async () => {
      let callCount = 0;
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
        callCount++;
        if (callCount < 3) {
          throw new Error("Network failure");
        }
        return mockResponse(200, { data: "recovered" });
      });

      const result = await (client as any).testRequest("/test", "test_entity");
      expect(result).toEqual({ data: "recovered" });
      expect(callCount).toBe(3);

      fetchSpy.mockRestore();
    });
  });
});
