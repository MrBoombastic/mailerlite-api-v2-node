import type { RateLimitHeaders, RateLimitError } from "../src/types/index.js";
import { RateLimitUtils } from "../src/rateLimitUtils.js";

// Mock types to avoid axios dependency in tests
type MockAxiosResponse = {
  headers: Record<string, string>;
};

type MockAxiosError = {
  response?: { status: number; headers?: Record<string, string> };
};

describe("RateLimitUtils", () => {
  const mockRateLimitHeaders: RateLimitHeaders = {
    limit: 60,
    remaining: 30,
    reset: new Date(Date.now() + 30000), // 30 seconds in future
    retryAfter: 30,
  };

  describe("isRateLimitError", () => {
    it("should identify rate limit errors correctly", () => {
      const rateLimitError = {
        isRateLimitError: true,
        rateLimitHeaders: mockRateLimitHeaders,
      } as RateLimitError;

      const regularError = new Error("Regular error");

      expect(RateLimitUtils.isRateLimitError(rateLimitError)).toBe(true);
      expect(RateLimitUtils.isRateLimitError(regularError)).toBe(false);
      expect(RateLimitUtils.isRateLimitError(null)).toBe(false);
      expect(RateLimitUtils.isRateLimitError(undefined)).toBe(false);
    });
  });

  describe("getRateLimitInfo", () => {
    it("should extract rate limit headers from error", () => {
      const rateLimitError = {
        isRateLimitError: true,
        rateLimitHeaders: mockRateLimitHeaders,
      } as RateLimitError;

      const info = RateLimitUtils.getRateLimitInfo(rateLimitError);

      expect(info).toEqual(mockRateLimitHeaders);
    });

    it("should return null for non-rate-limit errors", () => {
      const regularError = new Error("Regular error");

      const info = RateLimitUtils.getRateLimitInfo(regularError as any);

      expect(info).toBeNull();
    });
  });

  describe("getWaitTime", () => {
    it("should return 0 when reset time has passed", () => {
      const pastHeaders = {
        ...mockRateLimitHeaders,
        reset: new Date(Date.now() - 1000), // 1 second ago
      };

      const waitTime = RateLimitUtils.getWaitTime(pastHeaders);

      expect(waitTime).toBe(0);
    });

    it("should calculate wait time for remaining requests", () => {
      const headers = {
        ...mockRateLimitHeaders,
        remaining: 10,
        reset: new Date(Date.now() + 30000), // 30 seconds in future
      };

      const waitTime = RateLimitUtils.getWaitTime(headers);

      expect(waitTime).toBeGreaterThan(0);
      expect(waitTime).toBeLessThan(30000);
    });

    it("should return time until reset when no requests remaining", () => {
      const headers = {
        ...mockRateLimitHeaders,
        remaining: 0,
        reset: new Date(Date.now() + 15000), // 15 seconds in future
      };

      const waitTime = RateLimitUtils.getWaitTime(headers);

      expect(waitTime).toBeGreaterThan(14000);
      expect(waitTime).toBeLessThan(16000);
    });
  });

  describe("shouldPause", () => {
    it("should recommend pause when below threshold", () => {
      const lowHeaders = {
        ...mockRateLimitHeaders,
        remaining: 5,
      };

      expect(RateLimitUtils.shouldPause(lowHeaders, 10)).toBe(true);
      expect(RateLimitUtils.shouldPause(lowHeaders, 5)).toBe(true);
      expect(RateLimitUtils.shouldPause(lowHeaders, 3)).toBe(false);
    });
  });

  describe("getRateLimitUsagePercent", () => {
    it("should calculate usage percentage correctly", () => {
      const headers = {
        limit: 60,
        remaining: 15,
        reset: new Date(),
        retryAfter: 0,
      };

      const usage = RateLimitUtils.getRateLimitUsagePercent(headers);

      expect(usage).toBe(75); // 45 used out of 60 = 75%
    });

    it("should handle zero remaining correctly", () => {
      const headers = {
        limit: 60,
        remaining: 0,
        reset: new Date(),
        retryAfter: 0,
      };

      const usage = RateLimitUtils.getRateLimitUsagePercent(headers);

      expect(usage).toBe(100);
    });
  });

  describe("getOptimalBatchSize", () => {
    it("should return conservative batch size when rate limit is low", () => {
      const lowHeaders = {
        limit: 60,
        remaining: 10,
        reset: new Date(),
        retryAfter: 0,
      };

      const batchSize = RateLimitUtils.getOptimalBatchSize(lowHeaders, 50);

      expect(batchSize).toBeLessThan(10);
      expect(batchSize).toBeGreaterThanOrEqual(0);
    });

    it("should return max batch size when plenty of requests remain", () => {
      const highHeaders = {
        limit: 60,
        remaining: 55,
        reset: new Date(),
        retryAfter: 0,
      };

      const batchSize = RateLimitUtils.getOptimalBatchSize(highHeaders, 20);

      expect(batchSize).toBe(20);
    });
  });

  describe("willExceedRateLimit", () => {
    it("should detect when additional requests will exceed limit", () => {
      const headers = {
        limit: 60,
        remaining: 5,
        reset: new Date(),
        retryAfter: 0,
      };

      expect(RateLimitUtils.willExceedRateLimit(headers, 3)).toBe(false);
      expect(RateLimitUtils.willExceedRateLimit(headers, 5)).toBe(false);
      expect(RateLimitUtils.willExceedRateLimit(headers, 6)).toBe(true);
      expect(RateLimitUtils.willExceedRateLimit(headers, 10)).toBe(true);
    });
  });

  describe("getRateLimitStatus", () => {
    it("should return appropriate status messages", () => {
      const headers = {
        limit: 60,
        remaining: 30,
        reset: new Date(),
        retryAfter: 0,
      };

      const status = RateLimitUtils.getRateLimitStatus(headers);
      expect(status).toContain("30/60");
      expect(status).toContain("requests remaining");
    });

    it("should handle zero remaining requests", () => {
      const headers = {
        limit: 60,
        remaining: 0,
        reset: new Date(),
        retryAfter: 0,
      };

      const status = RateLimitUtils.getRateLimitStatus(headers);
      expect(status).toContain("Rate limit reached");
      expect(status).toContain("0/60");
    });

    it("should show warning for low remaining requests", () => {
      const headers = {
        limit: 60,
        remaining: 3,
        reset: new Date(),
        retryAfter: 0,
      };

      const status = RateLimitUtils.getRateLimitStatus(headers);
      expect(status).toContain("Rate limit warning");
      expect(status).toContain("3/60");
    });
  });

  describe("formatRateLimitHeaders", () => {
    it("should format headers for logging", () => {
      const headers = {
        limit: 60,
        remaining: 25,
        reset: new Date("2024-01-01T12:00:00Z"),
        retryAfter: 10,
      };

      const formatted = RateLimitUtils.formatRateLimitHeaders(headers);

      expect(formatted.limit).toBe(60);
      expect(formatted.remaining).toBe(25);
      expect(formatted.retryAfterSeconds).toBe(10);
      expect(formatted.usagePercent).toBe(58); // (60-25)/60 * 100
      expect(formatted.resetTime).toBe("2024-01-01T12:00:00.000Z");
      expect(formatted.status).toContain("25/60");
    });
  });
});
