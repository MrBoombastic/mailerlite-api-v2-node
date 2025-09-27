import MailerLite, {
  RateLimitUtils,
  RateLimitBatchProcessor,
  withRateLimit,
  type RateLimitHeaders,
  type RateLimitError,
} from '../src/index.js';

// Example 1: Basic rate limit handling with callbacks
function basicRateLimitExample() {
  const client = MailerLite('your-api-key', {
    enableRateLimit: true,
    rateLimitRetryAttempts: 3,
    rateLimitRetryDelay: 1000,

    // Callback when rate limit is hit
    onRateLimitHit: (headers: RateLimitHeaders) => {
      console.log('⚠️ Rate limit hit!', RateLimitUtils.formatRateLimitHeaders(headers));
    },

    // Callback on each retry attempt
    onRateLimitRetry: (attempt: number, headers: RateLimitHeaders) => {
      console.log(`🔄 Retry attempt ${attempt}. ${RateLimitUtils.getRateLimitStatus(headers)}`);
    },
  });

  return client;
}

// Example 2: Manual rate limit error handling
async function manualRateLimitHandling() {
  const client = MailerLite('your-api-key', {
    enableRateLimit: false, // Disable automatic handling
  });

  try {
    const subscribers = await client.getSubscribers();
    console.log('✅ Successfully fetched subscribers:', subscribers.length);
  } catch (error: any) {
    if (RateLimitUtils.isRateLimitError(error)) {
      const rateLimitInfo = RateLimitUtils.getRateLimitInfo(error);

      if (rateLimitInfo) {
        console.log('❌ Rate limit exceeded:', RateLimitUtils.getRateLimitStatus(rateLimitInfo));

        // Wait for rate limit to reset
        console.log('⏳ Waiting for rate limit to reset...');
        await RateLimitUtils.waitForRateLimit(rateLimitInfo);

        // Retry the request
        console.log('🔄 Retrying request...');
        const subscribers = await client.getSubscribers();
        console.log('✅ Successfully fetched subscribers after waiting:', subscribers.length);
      }
    } else {
      console.error('❌ Other error:', error.message);
    }
  }
}

// Example 3: Using the withRateLimit decorator
async function decoratorExample() {
  const client = MailerLite('your-api-key', {
    enableRateLimit: false, // Handle manually with decorator
  });

  // Wrap API calls with automatic rate limit handling
  const getSubscribersWithRateLimit = withRateLimit(
    async () => await client.getSubscribers(),
    3 // max retries
  );

  const getGroupsWithRateLimit = withRateLimit(
    async () => await client.getGroups(),
    3
  );

  try {
    console.log('📥 Fetching data with rate limit handling...');
    const [subscribers, groups] = await Promise.all([
      getSubscribersWithRateLimit(),
      getGroupsWithRateLimit(),
    ]);

    console.log('✅ Successfully fetched:');
    console.log(`  - Subscribers: ${subscribers.length}`);
    console.log(`  - Groups: ${groups.length}`);
  } catch (error) {
    console.error('❌ Failed to fetch data:', error);
  }
}

// Example 4: Batch processing with rate limit awareness
async function batchProcessingExample() {
  const client = MailerLite('your-api-key');

  // Sample data to process
  const emailsToAdd = [
    { email: 'user1@example.com', name: 'User 1' },
    { email: 'user2@example.com', name: 'User 2' },
    { email: 'user3@example.com', name: 'User 3' },
    // ... more emails
  ];

  // Create a batch processor
  const processor = new RateLimitBatchProcessor(
    emailsToAdd,
    async (subscriber) => {
      return await client.addSubscriber(subscriber);
    }
  );

  // Process all items with progress tracking
  const { results, errors } = await processor.processAll(
    (completed, total, rateLimitInfo) => {
      console.log(`📊 Progress: ${completed}/${total}`);

      if (rateLimitInfo) {
        console.log(`⚠️ Rate limit info:`, RateLimitUtils.formatRateLimitHeaders(rateLimitInfo));
      }
    },
    5 // batch size
  );

  console.log('✅ Batch processing completed:');
  console.log(`  - Successful: ${results.length}`);
  console.log(`  - Errors: ${errors.length}`);

  // Log errors if any
  if (errors.length > 0) {
    console.log('❌ Errors encountered:');
    errors.forEach(({ item, error }) => {
      console.log(`  - ${item.email}: ${error.message}`);
    });
  }
}

// Example 5: Rate limit monitoring and adaptive behavior
async function rateLimitMonitoringExample() {
  const client = MailerLite('your-api-key', {
    enableRateLimit: true,
    onRateLimitHit: (headers: RateLimitHeaders) => {
      const usage = RateLimitUtils.getRateLimitUsagePercent(headers);
      const rps = RateLimitUtils.estimateRequestsPerSecond(headers);

      console.log('📈 Rate Limit Metrics:');
      console.log(`  - Usage: ${usage}%`);
      console.log(`  - Requests/sec: ${rps.toFixed(2)}`);
      console.log(`  - Should pause: ${RateLimitUtils.shouldPause(headers)}`);
    },
  });

  // Monitor rate limits during operations
  async function monitoredOperation(operationName: string, operation: () => Promise<any>) {
    console.log(`🚀 Starting ${operationName}...`);

    try {
      const result = await operation();
      console.log(`✅ ${operationName} completed successfully`);
      return result;
    } catch (error: any) {
      if (RateLimitUtils.isRateLimitError(error)) {
        const headers = RateLimitUtils.getRateLimitInfo(error);
        if (headers) {
          console.log(`⚠️ ${operationName} hit rate limit:`, RateLimitUtils.formatRateLimitHeaders(headers));
        }
      }
      throw error;
    }
  }

  // Example operations with monitoring
  await monitoredOperation('Get Account Info', () => client.getAccount());
  await monitoredOperation('Get Stats', () => client.getStats());
  await monitoredOperation('Get Subscribers', () => client.getSubscribers({ limit: 100 }));
}

// Example 6: Smart batch sizing based on rate limits
async function smartBatchSizingExample() {
  const client = MailerLite('your-api-key');

  // Simulate getting current rate limit status from a previous request
  const mockRateLimitHeaders: RateLimitHeaders = {
    limit: 60,
    remaining: 25,
    reset: new Date(Date.now() + 30000), // 30 seconds from now
    retryAfter: 0,
  };

  // Calculate optimal batch size
  const optimalBatchSize = RateLimitUtils.getOptimalBatchSize(mockRateLimitHeaders, 50);
  console.log(`📏 Optimal batch size: ${optimalBatchSize}`);

  // Check if we can perform a large operation
  const plannedOperations = 30;
  if (RateLimitUtils.willExceedRateLimit(mockRateLimitHeaders, plannedOperations)) {
    const delay = RateLimitUtils.calculateBatchDelay(mockRateLimitHeaders, plannedOperations);
    console.log(`⏳ Need to wait ${delay}ms before processing ${plannedOperations} operations`);
  }

  // Display detailed rate limit status
  console.log('📊 Current Rate Limit Status:');
  console.log(RateLimitUtils.formatRateLimitHeaders(mockRateLimitHeaders));
}

// Example 7: Configuration options showcase
function configurationExample() {
  // Minimal configuration (uses defaults)
  const clientMinimal = MailerLite('your-api-key');

  // Full configuration with custom rate limit settings
  const clientFull = MailerLite('your-api-key', {
    // Rate limit configuration
    enableRateLimit: true,
    rateLimitRetryAttempts: 5,       // Retry up to 5 times
    rateLimitRetryDelay: 2000,       // Base delay of 2 seconds

    // Callbacks for monitoring
    onRateLimitHit: (headers) => {
      // Custom logging or metrics collection
      console.log('🚨 Rate limit hit - logging to monitoring system');
      // logToMonitoringSystem('rate_limit_hit', headers);
    },

    onRateLimitRetry: (attempt, headers) => {
      // Progress tracking for long-running operations
      console.log(`🔄 Rate limit retry ${attempt}/5`);
      // updateProgressBar(attempt, 5);
    },

    // Other MailerLite options
    useCaseConverter: true,
    headers: {
      'Custom-Header': 'custom-value',
    },
  });

  return { clientMinimal, clientFull };
}

// Example usage
async function runExamples() {
  console.log('🎯 MailerLite Rate Limit Examples\n');

  try {
    // Run examples (uncomment to test with real API key)
    // await manualRateLimitHandling();
    // await decoratorExample();
    // await batchProcessingExample();
    // await rateLimitMonitoringExample();

    // These examples work without API calls
    smartBatchSizingExample();
    configurationExample();

    console.log('\n✅ All examples completed successfully!');
  } catch (error) {
    console.error('\n❌ Example failed:', error);
  }
}

// Export examples for testing
export {
  basicRateLimitExample,
  manualRateLimitHandling,
  decoratorExample,
  batchProcessingExample,
  rateLimitMonitoringExample,
  smartBatchSizingExample,
  configurationExample,
  runExamples,
};

// Run examples if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runExamples();
}
