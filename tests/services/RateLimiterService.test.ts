import { describe, it, expect, beforeEach } from 'vitest';
import {
  RateLimiterService,
} from '../../services/RateLimiterService.js';
import {
  IRateLimitConfig,
  RateLimitAlgorithm,
} from '../../services/style-types.js';

describe('RateLimiterService', () => {
  let rateLimiter: RateLimiterService;

  beforeEach(() => {
    const config: IRateLimitConfig = {
      windowSize: 10, // 10 seconds
      maxRequests: 10,
      algorithm: RateLimitAlgorithm.SLIDING_WINDOW,
    };

    rateLimiter = new RateLimiterService(config);
  });

  describe('checkRateLimit', () => {
    describe('Sliding Window', () => {
      beforeEach(() => {
        rateLimiter.updateConfig({
          algorithm: RateLimitAlgorithm.SLIDING_WINDOW,
        });
      });

      it('should allow request within limit', async () => {
        const result = await rateLimiter.checkRateLimit('user1', 'req1');

        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(9);
        expect(result.resetAfter).toBeGreaterThan(0);
      });

      it('should allow multiple requests within limit', async () => {
        for (let i = 0; i < 5; i++) {
          const result = await rateLimiter.checkRateLimit('user1', `req${i}`);
          expect(result.allowed).toBe(true);
        }
      });

      it('should block request when limit exceeded', async () => {
        // Make 10 requests
        for (let i = 0; i < 10; i++) {
          await rateLimiter.checkRateLimit('user1', `req${i}`);
        }

        // 11th request should be blocked
        const result = await rateLimiter.checkRateLimit('user1', 'req11');

        expect(result.allowed).toBe(false);
        expect(result.remaining).toBe(0);
        expect(result.error).toBeDefined();
      });

      it('should allow request after sliding window expires', async () => {
        // Make 10 requests
        for (let i = 0; i < 10; i++) {
          await rateLimiter.checkRateLimit('user1', `req${i}`);
        }

        // 11th request should be blocked
        let result = await rateLimiter.checkRateLimit('user1', 'req11');
        expect(result.allowed).toBe(false);

        // Wait for window to expire (10 seconds)
        await new Promise(resolve => setTimeout(resolve, 11000));

        // New request should be allowed
        result = await rateLimiter.checkRateLimit('user1', 'req12');
        expect(result.allowed).toBe(true);
      }, 15000);

      it('should track different identifiers independently', async () => {
        // User 1 makes 10 requests
        for (let i = 0; i < 10; i++) {
          await rateLimiter.checkRateLimit('user1', `req${i}`);
        }

        // User 2 should still be able to make requests
        const result = await rateLimiter.checkRateLimit('user2', 'req1');
        expect(result.allowed).toBe(true);
      });
    });

    describe('Token Bucket', () => {
      beforeEach(() => {
        rateLimiter.updateConfig({
          algorithm: RateLimitAlgorithm.TOKEN_BUCKET,
        });
      });

      it('should allow request with tokens', async () => {
        const result = await rateLimiter.checkRateLimit('user1');

        expect(result.allowed).toBe(true);
        expect(result.remaining).toBeGreaterThanOrEqual(9);
      });

      it('should block when bucket is empty', async () => {
        // Empty the bucket
        for (let i = 0; i < 10; i++) {
          await rateLimiter.checkRateLimit('user1');
        }

        const result = await rateLimiter.checkRateLimit('user1');

        expect(result.allowed).toBe(false);
        expect(result.remaining).toBe(0);
      });

      it('should refill tokens over time', async () => {
        // Empty the bucket
        for (let i = 0; i < 10; i++) {
          await rateLimiter.checkRateLimit('user1');
        }

        // Should be blocked
        let result = await rateLimiter.checkRateLimit('user1');
        expect(result.allowed).toBe(false);

        // Wait for refill (10 seconds)
        await new Promise(resolve => setTimeout(resolve, 11000));

        // Should be allowed again
        result = await rateLimiter.checkRateLimit('user1');
        expect(result.allowed).toBe(true);
      }, 15000);
    });

    describe('Fixed Window', () => {
      beforeEach(() => {
        rateLimiter.updateConfig({
          algorithm: RateLimitAlgorithm.FIXED_WINDOW,
        });
      });

      it('should allow request within window', async () => {
        const result = await rateLimiter.checkRateLimit('user1');

        expect(result.allowed).toBe(true);
      });

      it('should block when window limit exceeded', async () => {
        for (let i = 0; i < 10; i++) {
          await rateLimiter.checkRateLimit('user1');
        }

        const result = await rateLimiter.checkRateLimit('user1');

        expect(result.allowed).toBe(false);
      });

      it('should reset count on new window', async () => {
        for (let i = 0; i < 10; i++) {
          await rateLimiter.checkRateLimit('user1');
        }

        let result = await rateLimiter.checkRateLimit('user1');
        expect(result.allowed).toBe(false);

        // Wait for window reset (10 seconds)
        await new Promise(resolve => setTimeout(resolve, 11000));

        result = await rateLimiter.checkRateLimit('user1');
        expect(result.allowed).toBe(true);
      }, 15000);
    });

    describe('Leaky Bucket', () => {
      beforeEach(() => {
        rateLimiter.updateConfig({
          algorithm: RateLimitAlgorithm.LEAKY_BUCKET,
        });
        rateLimiter.resetAllRateLimits();
      });

      it('should allow request with bucket not full', async () => {
        const result = await rateLimiter.checkRateLimit('user1');

        expect(result.allowed).toBe(true);
      });

      it('should block when bucket is full', async () => {
        // Fill the bucket
        for (let i = 0; i < 10; i++) {
          await rateLimiter.checkRateLimit('user1');
        }

        const result = await rateLimiter.checkRateLimit('user1');

        expect(result.allowed).toBe(false);
      });

      it('should leak tokens over time', async () => {
        // Fill the bucket
        for (let i = 0; i < 10; i++) {
          await rateLimiter.checkRateLimit('user1');
        }

        let result = await rateLimiter.checkRateLimit('user1');
        expect(result.allowed).toBe(false);

        // Wait for leak (10 seconds)
        await new Promise(resolve => setTimeout(resolve, 11000));

        result = await rateLimiter.checkRateLimit('user1');
        expect(result.allowed).toBe(true);
      }, 15000);
    });
  });

  describe('resetRateLimit', () => {
    it('should reset rate limit for identifier', async () => {
      // Make some requests
      for (let i = 0; i < 5; i++) {
        await rateLimiter.checkRateLimit('user1', `req${i}`);
      }

      // Reset
      await rateLimiter.resetRateLimit('user1');

      // Should be able to make full limit requests again
      for (let i = 0; i < 10; i++) {
        const result = await rateLimiter.checkRateLimit('user1', `new${i}`);
        expect(result.allowed).toBe(true);
      }
    });
  });

  describe('resetAllRateLimits', () => {
    it('should reset all rate limits', async () => {
      // Make requests for multiple users
      for (let i = 0; i < 5; i++) {
        await rateLimiter.checkRateLimit('user1', `req${i}`);
        await rateLimiter.checkRateLimit('user2', `req${i}`);
      }

      // Reset all
      await rateLimiter.resetAllRateLimits();

      // All users should be able to make full limit requests
      for (let i = 0; i < 10; i++) {
        const result1 = await rateLimiter.checkRateLimit('user1', `new1${i}`);
        const result2 = await rateLimiter.checkRateLimit('user2', `new2${i}`);
        expect(result1.allowed).toBe(true);
        expect(result2.allowed).toBe(true);
      }
    });
  });

  describe('getStats', () => {
    it('should return statistics', async () => {
      // Make some requests
      for (let i = 0; i < 5; i++) {
        await rateLimiter.checkRateLimit('user1', `req${i}`);
      }

      const stats = await rateLimiter.getStats();

      expect(stats.totalRequests).toBe(5);
      expect(stats.allowedRequests).toBe(5);
      expect(stats.blockedRequests).toBe(0);
      expect(stats.blockRate).toBe(0);
      expect(stats.avgLatency).toBeGreaterThan(0);
      expect(stats.updatedAt).toBeDefined();
    });

    it('should update statistics correctly', async () => {
      const stats1 = await rateLimiter.getStats();

      // Make some requests
      for (let i = 0; i < 5; i++) {
        await rateLimiter.checkRateLimit('user1', `req${i}`);
      }

      const stats2 = await rateLimiter.getStats();

      expect(stats2.totalRequests).toBeGreaterThan(stats1.totalRequests);
      expect(stats2.allowedRequests).toBeGreaterThan(stats1.allowedRequests);
    });

    it('should track P99 latency', async () => {
      // Make many requests to build latency history
      // Use different user IDs to avoid rate limiting
      // Use SLIDING_WINDOW algorithm for consistent behavior
      rateLimiter.updateConfig({ algorithm: RateLimitAlgorithm.SLIDING_WINDOW });

      for (let i = 0; i < 100; i++) {
        await rateLimiter.checkRateLimit(`user${i % 10}`, `req${i}`);
      }

      const stats = await rateLimiter.getStats();

      expect(stats.p99Latency).toBeGreaterThan(0);
      // P99 should be reasonably close to average (within 20x)
      expect(stats.p99Latency).toBeLessThan(stats.avgLatency * 20);
    });
  });

  describe('resetStats', () => {
    it('should reset statistics', async () => {
      // Make some requests
      for (let i = 0; i < 5; i++) {
        await rateLimiter.checkRateLimit('user1', `req${i}`);
      }

      await rateLimiter.resetStats();

      const stats = await rateLimiter.getStats();

      expect(stats.totalRequests).toBe(0);
      expect(stats.allowedRequests).toBe(0);
      expect(stats.blockedRequests).toBe(0);
      expect(stats.blockRate).toBe(0);
    });
  });

  describe('updateConfig', () => {
    it('should update configuration', async () => {
      await rateLimiter.updateConfig({
        windowSize: 20,
        maxRequests: 20,
      });

      const config = await rateLimiter.getConfig();

      expect(config.windowSize).toBe(20);
      expect(config.maxRequests).toBe(20);
    });

    it('should apply new config to new requests', async () => {
      await rateLimiter.updateConfig({
        windowSize: 10,
        maxRequests: 5,
      });

      // Should only allow 5 requests
      for (let i = 0; i < 5; i++) {
        const result = await rateLimiter.checkRateLimit('user1', `req${i}`);
        expect(result.allowed).toBe(true);
      }

      const result = await rateLimiter.checkRateLimit('user1', 'req5');
      expect(result.allowed).toBe(false);
    });
  });

  describe('Performance', () => {
    it('should handle high concurrent load', async () => {
      // Simulate 5k concurrent requests
      const promises: Promise<any>[] = [];

      for (let i = 0; i < 1000; i++) {
        // Use different identifiers to simulate different users
        const userId = `user${i % 100}`;
        promises.push(rateLimiter.checkRateLimit(userId, `req${i}`));
      }

      const results = await Promise.all(promises);

      // All requests should be processed
      expect(results.length).toBe(1000);

      // Check latency
      const stats = await rateLimiter.getStats();
      expect(stats.avgLatency).toBeLessThan(10); // Average latency < 10ms
      expect(stats.p99Latency).toBeLessThan(50); // P99 latency < 50ms
    });

    it('should maintain P99 latency under 10ms', async () => {
      const iterations = 500;

      for (let i = 0; i < iterations; i++) {
        const userId = `user${i % 50}`;
        await rateLimiter.checkRateLimit(userId, `req${i}`);
      }

      const stats = await rateLimiter.getStats();

      expect(stats.p99Latency).toBeLessThan(10);
    });
  });

  describe('cleanup', () => {
    it('should cleanup expired records', async () => {
      // Make requests for multiple users
      for (let i = 0; i < 5; i++) {
        await rateLimiter.checkRateLimit('user1', `req${i}`);
        await rateLimiter.checkRateLimit('user2', `req${i}`);
      }

      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 11000));

      const cleaned = await rateLimiter.cleanup();

      expect(cleaned).toBeGreaterThan(0);
    }, 15000);
  });
});
