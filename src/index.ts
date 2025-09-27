import account from "./api/account.js";
import axiosClient from "./client.js";
import batch from "./api/batch.js";
import campaigns from "./api/campaigns.js";
import fields from "./api/fields.js";
import groups from "./api/groups.js";
import segments from "./api/segments.js";
import settings from "./api/settings.js";
import stats from "./api/stats.js";
import subscribers from "./api/subscribers.js";
import timezones from "./api/timezones.js";
import webhooks from "./api/webhooks.js";
import type { Options } from "./types/index.js";
import {
  RateLimitUtils,
  RateLimitBatchProcessor,
  withRateLimit,
} from "./rateLimitUtils.js";
import { RateLimitHandler } from "./rateLimit.js";

const MailerLite: (apiKey: string, options?: Options) => any = (
  apiKey: string,
  options: Options = {},
) => {
  const client = axiosClient(apiKey, options);

  return {
    ...account(client),
    ...batch(client),
    ...campaigns(client),
    ...fields(client),
    ...groups(client),
    ...segments(client),
    ...settings(client),
    ...stats(client),
    ...subscribers(client),
    ...timezones(client),
    ...webhooks(client),
  };
};

export default MailerLite;

// Named export for better ESM support
export { MailerLite };

// Export types for consumers
export type * from "./types/index.js";

// Export rate limit utilities
export {
  RateLimitUtils,
  RateLimitBatchProcessor,
  withRateLimit,
  RateLimitHandler,
};
