import type { AxiosResponse, AxiosError } from "axios";
import type { RateLimitHeaders, RateLimitError, RateLimitOptions } from "./types/index.js";

export class RateLimitHandler {
  private rateLimitRetryAttempts: number;
  private rateLimitRetryDelay: number;
  private onRateLimitHit?: (headers: RateLimitHeaders) => void;
  private onRateLimitRetry?: (attempt: number, headers: RateLimitHeaders) => void;

  constructor(options: RateLimitOptions = {}) {
    this.rateLimitRetryAttempts = options.rateLimitRetryAttempts ?? 3;
    this.rateLimitRetryDelay = options.rateLimitRetryDelay ?? 1000;
    this.onRateLimitHit = options.onRateLimitHit;
    this.onRateLimitRetry = options.onRateLimitRetry;
  }

  /**
   * Parse rate limit headers from API response
   */
  parseRateLimitHeaders(response: AxiosResponse): RateLimitHeaders | null {
    const headers = response.headers;

    const limit = headers["x-ratelimit-limit"];
    const remaining = headers["x-ratelimit-remaining"];
    const reset = headers["x-ratelimit-reset"];
    const retryAfter = headers["x-ratelimit-retry-after"];

    // If any required header is missing, return null
    if (!limit || !remaining || !reset || !retryAfter) {
      return null;
    }

    return {
      limit: parseInt(limit, 10),
      remaining: parseInt(remaining, 10),
      reset: new Date(reset),
      retryAfter: parseInt(retryAfter, 10),
    };
  }

  /**
   * Check if the error is a rate limit error (429 status)
   */
  isRateLimitError(error: AxiosError): boolean {
    return error.response?.status === 429;
  }

  /**
   * Create a RateLimitError from an AxiosError
   */
  createRateLimitError(error: AxiosError): RateLimitError {
    const rateLimitHeaders = error.response
      ? this.parseRateLimitHeaders(error.response)
      : null;

    const rateLimitError = new Error(
      `Rate limit exceeded. ${rateLimitHeaders ? `Retry after ${rateLimitHeaders.retryAfter} seconds.` : "Please try again later."}`
    ) as RateLimitError;

    rateLimitError.name = "RateLimitError";
    rateLimitError.isRateLimitError = true;
    rateLimitError.rateLimitHeaders = rateLimitHeaders || {
      limit: 60,
      remaining: 0,
      reset: new Date(Date.now() + 60000),
      retryAfter: 60,
    };

    return rateLimitError;
  }

  /**
   * Handle rate limit by waiting and retrying
   */
  async handleRateLimit(
    error: AxiosError,
    retryFn: () => Promise<any>,
    attempt = 0
  ): Promise<any> {
    if (!this.isRateLimitError(error) || attempt >= this.rateLimitRetryAttempts) {
      throw this.createRateLimitError(error);
    }

    const rateLimitHeaders = error.response
      ? this.parseRateLimitHeaders(error.response)
      : null;

    if (rateLimitHeaders) {
      // Trigger the rate limit hit callback
      if (this.onRateLimitHit && attempt === 0) {
        this.onRateLimitHit(rateLimitHeaders);
      }

      // Trigger the retry callback
      if (this.onRateLimitRetry) {
        this.onRateLimitRetry(attempt + 1, rateLimitHeaders);
      }

      // Calculate delay: use retryAfter from headers, but add some buffer
      const delayMs = (rateLimitHeaders.retryAfter * 1000) + this.rateLimitRetryDelay;

      await this.sleep(delayMs);

      try {
        return await retryFn();
      } catch (retryError) {
        if (retryError instanceof Error && "response" in retryError) {
          return await this.handleRateLimit(
            retryError as AxiosError,
            retryFn,
            attempt + 1
          );
        }
        throw retryError;
      }
    } else {
      // Fallback delay if headers are not available
      const fallbackDelay = Math.pow(2, attempt) * this.rateLimitRetryDelay;
      await this.sleep(fallbackDelay);

      try {
        return await retryFn();
      } catch (retryError) {
        if (retryError instanceof Error && "response" in retryError) {
          return await this.handleRateLimit(
            retryError as AxiosError,
            retryFn,
            attempt + 1
          );
        }
        throw retryError;
      }
    }
  }

  /**
   * Check if we're approaching rate limit and should slow down
   */
  shouldThrottle(response: AxiosResponse): boolean {
    const rateLimitHeaders = this.parseRateLimitHeaders(response);
    if (!rateLimitHeaders) return false;

    // Throttle if we have less than 10% of requests remaining
    const throttleThreshold = Math.max(1, Math.floor(rateLimitHeaders.limit * 0.1));
    return rateLimitHeaders.remaining <= throttleThreshold;
  }

  /**
   * Calculate suggested delay to avoid hitting rate limits
   */
  getThrottleDelay(response: AxiosResponse): number {
    const rateLimitHeaders = this.parseRateLimitHeaders(response);
    if (!rateLimitHeaders) return 0;

    // Calculate time until reset
    const timeUntilReset = rateLimitHeaders.reset.getTime() - Date.now();

    // If reset time has passed, no delay needed
    if (timeUntilReset <= 0) return 0;

    // Calculate delay to spread remaining requests evenly
    const delayBetweenRequests = timeUntilReset / Math.max(1, rateLimitHeaders.remaining);

    // Cap the delay at a reasonable maximum (30 seconds)
    return Math.min(delayBetweenRequests, 30000);
  }

  /**
   * Utility function to sleep for a given number of milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Log rate limit information for debugging
   */
  logRateLimitInfo(response: AxiosResponse): void {
    const rateLimitHeaders = this.parseRateLimitHeaders(response);
    if (rateLimitHeaders) {
      console.log("Rate Limit Info:", {
        limit: rateLimitHeaders.limit,
        remaining: rateLimitHeaders.remaining,
        resetTime: rateLimitHeaders.reset.toISOString(),
        retryAfter: rateLimitHeaders.retryAfter,
      });
    }
  }
}
