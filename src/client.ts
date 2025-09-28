import axios, { type AxiosInstance, type AxiosError } from "axios";
import camelCase from "camelcase-keys";
import snakeCase from "snakecase-keys";
import type { Options } from "./types/index.js";
import { RateLimitHandler } from "./rateLimit.js";
import JSONbigint from "json-bigint";

const JSONBigIntParser = JSONbigint({
  storeAsString: true,
  useNativeBigInt: false,
});

const idReviver = (key: string, value: any) => {
  console.log(key, value);
  if (
    (key === "id" ||
      key.toLowerCase().endsWith("id") ||
      key.toLowerCase().endsWith("_id")) &&
    (typeof value === "number" || typeof value === "bigint")
  ) {
    return String(value);
  }
  return value;
};

export default function MailerLiteClient(
  apiKey: string,
  {
    axiosOptions = {
      transformResponse: (data: any) => {
        if (!data) return data;
        const parsed = JSONBigIntParser.parse(data);
        return JSON.parse(JSON.stringify(parsed), idReviver);
      },
    },
    baseURL = "https://api.mailerlite.com/api/v2/",
    useCaseConverter = true,
    headers = {},
    enableRateLimit = true,
    rateLimitRetryAttempts = 3,
    rateLimitRetryDelay = 1000,
    onRateLimitHit,
    onRateLimitRetry,
  }: Options = {},
): AxiosInstance {
  if (typeof apiKey !== "string") throw new Error("No API key provided");

  const axiosConfig = {
    ...axiosOptions,

    baseURL,
    headers: {
      "Content-Type": "application/json",
      "X-MailerLite-ApiKey": apiKey,
      "User-Agent": "MailerLite API v2 Node",
      ...headers,
    },
  };

  const client: AxiosInstance = axios.create(axiosConfig);

  // Initialize rate limit handler if enabled
  const rateLimitHandler = enableRateLimit
    ? new RateLimitHandler({
        enableRateLimit,
        rateLimitRetryAttempts,
        rateLimitRetryDelay,
        onRateLimitHit,
        onRateLimitRetry,
      })
    : null;

  if (useCaseConverter) {
    client.interceptors.request.use(
      (request) => {
        if (request.data != null && typeof request.data === "object") {
          request.data = snakeCase(request.data, { deep: true });
        }

        return request;
      },
      async (error) => await Promise.reject(error),
    );
  }

  client.interceptors.response.use(
    (response) => {
      // Handle rate limit information in successful responses
      if (rateLimitHandler && response.headers) {
        const rateLimitHeaders =
          rateLimitHandler.parseRateLimitHeaders(response);
        if (rateLimitHeaders && rateLimitHeaders.remaining <= 5) {
          // Warn when approaching rate limit
          console.warn(
            `MailerLite API: Rate limit warning - ${rateLimitHeaders.remaining} requests remaining`,
          );
        }
      }

      if (!useCaseConverter) return response.data;

      return camelCase(response.data, { deep: true });
    },
    async (error: AxiosError) => {
      // Handle rate limit errors if rate limiting is enabled
      if (rateLimitHandler && rateLimitHandler.isRateLimitError(error)) {
        try {
          // Create a retry function that repeats the original request
          const retryFn = async () => {
            const config = error.config;
            if (!config) throw error;

            // Make the request again with the same configuration
            const retryResponse = await client.request(config);
            return retryResponse;
          };

          // Handle the rate limit with automatic retry
          const retryResponse = await rateLimitHandler.handleRateLimit(
            error,
            retryFn,
          );

          // Apply the same response transformation as successful responses
          if (!useCaseConverter) return retryResponse.data;
          return camelCase(retryResponse.data, { deep: true });
        } catch (rateLimitError) {
          // If rate limit handling fails, reject with the rate limit error
          return await Promise.reject(rateLimitError);
        }
      }

      // For non-rate-limit errors, reject as usual
      return await Promise.reject(error);
    },
  );

  return client;
}
