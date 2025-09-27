import type { RateLimitHeaders, RateLimitError } from "./types/index.js";

/**
 * Utility functions for working with MailerLite API rate limits
 */
export class RateLimitUtils {
  /**
   * Check if an error is a rate limit error
   */
  static isRateLimitError(error: any): error is RateLimitError {
    return Boolean(error && error.isRateLimitError === true);
  }

  /**
   * Extract rate limit information from an error
   */
  static getRateLimitInfo(error: RateLimitError): RateLimitHeaders | null {
    if (!this.isRateLimitError(error)) {
      return null;
    }
    return error.rateLimitHeaders;
  }

  /**
   * Calculate how long to wait before making another request
   */
  static getWaitTime(headers: RateLimitHeaders): number {
    const now = new Date();
    const resetTime = new Date(headers.reset);

    // If reset time has passed, no wait needed
    if (resetTime <= now) {
      return 0;
    }

    // If we have remaining requests, calculate optimal spacing
    if (headers.remaining > 0) {
      const timeUntilReset = resetTime.getTime() - now.getTime();
      return Math.ceil(timeUntilReset / headers.remaining);
    }

    // No requests remaining, wait until reset
    return resetTime.getTime() - now.getTime();
  }

  /**
   * Check if we should pause before making more requests
   */
  static shouldPause(headers: RateLimitHeaders, threshold = 10): boolean {
    return headers.remaining <= threshold;
  }

  /**
   * Get a human-readable description of rate limit status
   */
  static getRateLimitStatus(headers: RateLimitHeaders): string {
    const remaining = headers.remaining;
    const total = headers.limit;
    const resetTime = headers.reset.toLocaleTimeString();

    if (remaining === 0) {
      return `Rate limit reached (0/${total}). Resets at ${resetTime}`;
    }

    if (remaining <= 5) {
      return `Rate limit warning: Only ${remaining}/${total} requests remaining. Resets at ${resetTime}`;
    }

    return `Rate limit status: ${remaining}/${total} requests remaining. Resets at ${resetTime}`;
  }

  /**
   * Create a delay function that respects rate limits
   */
  static async waitForRateLimit(headers: RateLimitHeaders): Promise<void> {
    const waitTime = this.getWaitTime(headers);
    if (waitTime > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  /**
   * Calculate the percentage of rate limit used
   */
  static getRateLimitUsagePercent(headers: RateLimitHeaders): number {
    const used = headers.limit - headers.remaining;
    return Math.round((used / headers.limit) * 100);
  }

  /**
   * Estimate requests per second based on current usage
   */
  static estimateRequestsPerSecond(headers: RateLimitHeaders): number {
    const now = new Date();
    const resetTime = new Date(headers.reset);
    const timeUntilReset = resetTime.getTime() - now.getTime();

    if (timeUntilReset <= 0) {
      return 0;
    }

    const usedRequests = headers.limit - headers.remaining;
    const elapsedSeconds = (60000 - timeUntilReset) / 1000; // 60 seconds total window

    return elapsedSeconds > 0 ? usedRequests / elapsedSeconds : 0;
  }

  /**
   * Create a rate limit aware delay for batch operations
   */
  static calculateBatchDelay(
    headers: RateLimitHeaders,
    remainingOperations: number,
  ): number {
    if (headers.remaining <= 0) {
      // No requests remaining, wait until reset
      const now = new Date();
      const resetTime = new Date(headers.reset);
      return Math.max(0, resetTime.getTime() - now.getTime());
    }

    if (remainingOperations <= headers.remaining) {
      // We have enough requests for all remaining operations
      return 0;
    }

    // Calculate delay to spread requests evenly
    const now = new Date();
    const resetTime = new Date(headers.reset);
    const timeUntilReset = resetTime.getTime() - now.getTime();

    if (timeUntilReset <= 0) {
      return 0;
    }

    // Distribute remaining requests over the time period
    return Math.ceil(timeUntilReset / headers.remaining);
  }

  /**
   * Format rate limit headers for logging
   */
  static formatRateLimitHeaders(
    headers: RateLimitHeaders,
  ): Record<string, any> {
    return {
      limit: headers.limit,
      remaining: headers.remaining,
      resetTime: headers.reset.toISOString(),
      retryAfterSeconds: headers.retryAfter,
      usagePercent: this.getRateLimitUsagePercent(headers),
      status: this.getRateLimitStatus(headers),
    };
  }

  /**
   * Check if rate limit will be exceeded with additional requests
   */
  static willExceedRateLimit(
    headers: RateLimitHeaders,
    additionalRequests: number,
  ): boolean {
    return headers.remaining < additionalRequests;
  }

  /**
   * Get optimal batch size based on current rate limit status
   */
  static getOptimalBatchSize(
    headers: RateLimitHeaders,
    maxBatchSize = 50,
  ): number {
    // Leave some buffer (10% of limit or minimum of 5)
    const buffer = Math.max(5, Math.floor(headers.limit * 0.1));
    const safeRemaining = Math.max(0, headers.remaining - buffer);

    return Math.min(maxBatchSize, safeRemaining);
  }
}

/**
 * Decorator function to add automatic rate limit handling to async functions
 */
export function withRateLimit<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  maxRetries = 3,
) {
  return async (...args: T): Promise<R> => {
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn(...args);
      } catch (error) {
        lastError = error;

        if (RateLimitUtils.isRateLimitError(error)) {
          const rateLimitInfo = RateLimitUtils.getRateLimitInfo(error);

          if (rateLimitInfo && attempt < maxRetries) {
            console.warn(
              `Rate limit hit (attempt ${attempt + 1}/${maxRetries + 1}). Waiting ${rateLimitInfo.retryAfter} seconds...`,
            );

            await RateLimitUtils.waitForRateLimit(rateLimitInfo);
            continue;
          }
        }

        // If it's not a rate limit error or we've exceeded retries, throw
        throw error;
      }
    }

    throw lastError;
  };
}

/**
 * Rate limit aware batch processor
 */
export class RateLimitBatchProcessor<T, R> {
  private items: T[];
  private processor: (item: T) => Promise<R>;
  private results: R[] = [];
  private errors: Array<{ item: T; error: any }> = [];

  constructor(items: T[], processor: (item: T) => Promise<R>) {
    this.items = items;
    this.processor = processor;
  }

  /**
   * Process all items with automatic rate limit handling
   */
  async processAll(
    onProgress?: (
      completed: number,
      total: number,
      rateLimitInfo?: RateLimitHeaders,
    ) => void,
    batchSize = 10,
  ): Promise<{ results: R[]; errors: Array<{ item: T; error: any }> }> {
    const total = this.items.length;
    let completed = 0;

    for (let i = 0; i < this.items.length; i += batchSize) {
      const batch = this.items.slice(i, i + batchSize);

      for (const item of batch) {
        try {
          const result = await this.processor(item);
          this.results.push(result);
        } catch (error) {
          this.errors.push({ item, error });

          // If it's a rate limit error, handle it
          if (RateLimitUtils.isRateLimitError(error)) {
            const rateLimitInfo = RateLimitUtils.getRateLimitInfo(error);
            if (rateLimitInfo) {
              if (onProgress) {
                onProgress(completed, total, rateLimitInfo);
              }
              await RateLimitUtils.waitForRateLimit(rateLimitInfo);
            }
          }
        }

        completed++;
        if (onProgress) {
          onProgress(completed, total);
        }
      }

      // Small delay between batches to be respectful
      if (i + batchSize < this.items.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    return {
      results: this.results,
      errors: this.errors,
    };
  }
}
