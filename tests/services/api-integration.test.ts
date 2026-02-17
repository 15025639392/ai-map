import { describe, it, expect, beforeEach } from 'vitest';
import {
  AuthenticationService,
} from '../../services/AuthenticationService.js';
import {
  RateLimiterService,
} from '../../services/RateLimiterService.js';
import {
  StyleService,
} from '../../services/StyleService.js';
import {
  APIMiddleware,
  APIResponse,
  createAPIHandler,
} from '../../services/APIMiddleware.js';
import {
  IAPIContext,
  IAPIMiddlewareConfig,
  AuthType,
  IRateLimitConfig,
  RateLimitAlgorithm,
  ICreateStyleConfig,
  StyleType,
} from '../../services/style-types.js';

describe('API Integration Tests', () => {
  let authService: AuthenticationService;
  let rateLimiterService: RateLimiterService;
  let styleService: StyleService;
  let middleware: APIMiddleware;

  beforeEach(() => {
    // Initialize services
    authService = new AuthenticationService({
      jwtConfig: {
        secret: 'test-secret-key',
        expiresIn: 3600,
      },
    });

    const rateLimitConfig: IRateLimitConfig = {
      windowSize: 10,
      maxRequests: 100, // Allow more requests for performance tests
      algorithm: RateLimitAlgorithm.SLIDING_WINDOW,
    };

    rateLimiterService = new RateLimiterService(rateLimitConfig);

    styleService = new StyleService();

    const middlewareConfig: IAPIMiddlewareConfig = {
      enableAuth: true,
      enableRateLimit: true,
      enableLogging: false,
      rateLimitConfig,
    };

    middleware = new APIMiddleware(middlewareConfig, authService, rateLimiterService);
  });

  describe('Full API Flow', () => {
    it('should handle complete API request flow', async () => {
      // 1. Create API key
      const apiKey = await authService.createAPIKey({
        userId: 'user123',
        scopes: ['styles:read', 'styles:write'],
      });

      // 2. Create context
      const context = middleware.createContext(
        'req-001',
        '127.0.0.1',
        apiKey.key,
        '/api/styles',
        'GET',
        'Mozilla/5.0'
      );

      // 3. Create business handler
      const businessHandler = async (ctx: IAPIContext) => {
        return {
          message: 'Hello, API!',
          userId: ctx.attributes?.userId,
          scopes: ctx.attributes?.scopes,
        };
      };

      // 4. Handle request
      const response = await middleware.handleRequest(context, {
        businessHandler,
      });

      // 5. Verify response
      expect(response.data.success).toBe(true);
      expect(response.data.data).toBeDefined();
      expect(response.data.data.userId).toBe('user123');
      expect(response.data.data.scopes).toEqual(['styles:read', 'styles:write']);
      expect(response.data.requestId).toBe('req-001');
    });

    it('should reject request with invalid API key', async () => {
      const context = middleware.createContext(
        'req-002',
        '127.0.0.1',
        'invalid-api-key',
        '/api/styles',
        'GET'
      );

      const businessHandler = async () => ({ message: 'Hello' });

      const response = await middleware.handleRequest(context, {
        businessHandler,
      });

      expect(response.data.success).toBe(false);
      expect(response.data.errorCode).toBe('INVALID_API_KEY');
    });

    it('should block request after rate limit exceeded', async () => {
      // Create API key with rate limit
      const apiKey = await authService.createAPIKey({
        userId: 'user123',
        scopes: ['read'],
        rateLimit: 10,
      });

      // Set stricter rate limit for this test
      await rateLimiterService.updateConfig({
        windowSize: 10,
        maxRequests: 10,
        algorithm: RateLimitAlgorithm.SLIDING_WINDOW,
      });

      // Make 10 requests
      for (let i = 0; i < 10; i++) {
        const context = middleware.createContext(
          `req-${i}`,
          '127.0.0.1',
          apiKey.key,
          '/api/styles',
          'GET'
        );

        const businessHandler = async () => ({ message: 'Hello' });

        const response = await middleware.handleRequest(context, {
          businessHandler,
        });

        expect(response.data.success).toBe(true);
      }

      // 11th request should be blocked
      const context = middleware.createContext(
        'req-11',
        '127.0.0.1',
        apiKey.key,
        '/api/styles',
        'GET'
      );

      const businessHandler = async () => ({ message: 'Hello' });

      const response = await middleware.handleRequest(context, {
        businessHandler,
      });

      expect(response.data.success).toBe(false);
      expect(response.data.errorCode).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('should check required scopes', async () => {
      // Create API key with limited scopes
      const apiKey = await authService.createAPIKey({
        userId: 'user123',
        scopes: ['styles:read'],
      });

      const context = middleware.createContext(
        'req-003',
        '127.0.0.1',
        apiKey.key,
        '/api/styles',
        'POST'
      );

      const businessHandler = async () => ({ message: 'Created' });

      const response = await middleware.handleRequest(context, {
        businessHandler,
        authHandler: async (ctx) => {
          const authResult = await authService.verifyCredential(
            ctx.credential,
            AuthType.API_KEY
          );

          if (!authResult.success) {
            return authResult;
          }

          // Check required scopes
          const permission = await authService.checkPermission(
            authResult.userId!,
            ['styles:write'],
            authResult.scopes!
          );

          if (!permission.granted) {
            return {
              success: false,
              error: permission.error,
              errorCode: 'INSUFFICIENT_SCOPES',
            };
          }

          return authResult;
        },
      });

      expect(response.data.success).toBe(false);
      expect(response.data.errorCode).toBe('INSUFFICIENT_SCOPES');
    });
  });

  describe('Style Management API Flow', () => {
    it('should create and retrieve style', async () => {
      // Create API key
      const apiKey = await authService.createAPIKey({
        userId: 'user123',
        scopes: ['styles:write', 'styles:read'],
      });

      // Create style
      const createConfig: ICreateStyleConfig = {
        name: 'Test Style',
        type: StyleType.VECTOR,
        definition: JSON.stringify({ version: 8, layers: [] }),
        createdBy: 'user123',
      };

      const style = await styleService.createStyle(createConfig);

      // Create context to retrieve style
      const context = middleware.createContext(
        'req-004',
        '127.0.0.1',
        apiKey.key,
        '/api/styles/' + style.id,
        'GET'
      );

      const businessHandler = async () => {
        const fetchedStyle = await styleService.getStyle(style.id);
        return fetchedStyle;
      };

      const response = await middleware.handleRequest(context, {
        businessHandler,
      });

      expect(response.data.success).toBe(true);
      expect(response.data.data).toBeDefined();
      expect(response.data.data.id).toBe(style.id);
      expect(response.data.data.name).toBe('Test Style');
    });

    it('should handle batch style operations', async () => {
      const apiKey = await authService.createAPIKey({
        userId: 'user123',
        scopes: ['styles:write', 'styles:read'],
      });

      // Create multiple styles
      const styleIds: string[] = [];
      for (let i = 0; i < 5; i++) {
        const style = await styleService.createStyle({
          name: `Style ${i}`,
          type: StyleType.VECTOR,
          definition: JSON.stringify({}),
          createdBy: 'user123',
        });
        styleIds.push(style.id);
      }

      // Query all styles
      const context = middleware.createContext(
        'req-005',
        '127.0.0.1',
        apiKey.key,
        '/api/styles',
        'GET'
      );

      const businessHandler = async () => {
        return styleService.queryStyles({ createdBy: 'user123' });
      };

      const response = await middleware.handleRequest(context, {
        businessHandler,
      });

      expect(response.data.success).toBe(true);
      expect(response.data.data.styles.length).toBe(5);
    });
  });

  describe('Error Handling', () => {
    it('should handle business logic errors', async () => {
      const apiKey = await authService.createAPIKey({
        userId: 'user123',
        scopes: ['read'],
      });

      const context = middleware.createContext(
        'req-006',
        '127.0.0.1',
        apiKey.key,
        '/api/error',
        'GET'
      );

      const businessHandler = async () => {
        throw new Error('Business logic failed');
      };

      const response = await middleware.handleRequest(context, {
        businessHandler,
      });

      expect(response.data.success).toBe(false);
      expect(response.data.error).toBe('Business logic failed');
      expect(response.data.errorCode).toBe('INTERNAL_ERROR');
    });

    it('should include request ID in error response', async () => {
      const apiKey = await authService.createAPIKey({
        userId: 'user123',
        scopes: ['read'],
      });

      const context = middleware.createContext(
        'req-007',
        '127.0.0.1',
        apiKey.key,
        '/api/error',
        'GET'
      );

      const businessHandler = async () => {
        throw new Error('Error');
      };

      const response = await middleware.handleRequest(context, {
        businessHandler,
      });

      expect(response.data.requestId).toBe('req-007');
      expect(response.data.timestamp).toBeDefined();
    });
  });

  describe('createAPIHandler helper', () => {
    it('should create API handler with defaults', async () => {
      const apiKey = await authService.createAPIKey({
        userId: 'user123',
        scopes: ['read'],
      });

      const handler = createAPIHandler(middleware, async (ctx) => {
        return { message: 'Hello' };
      });

      const context = middleware.createContext(
        'req-008',
        '127.0.0.1',
        apiKey.key,
        '/api/test',
        'GET'
      );

      const response = await handler(context);

      expect(response.data.success).toBe(true);
      expect(response.data.data.message).toBe('Hello');
    });

    it('should enforce required scopes', async () => {
      const apiKey = await authService.createAPIKey({
        userId: 'user123',
        scopes: ['read'],
      });

      const handler = createAPIHandler(
        middleware,
        async (ctx) => {
          return { message: 'Created' };
        },
        {
          requiredScopes: ['write'],
        }
      );

      const context = middleware.createContext(
        'req-009',
        '127.0.0.1',
        apiKey.key,
        '/api/test',
        'POST'
      );

      const response = await handler(context);

      expect(response.data.success).toBe(false);
      expect(response.data.errorCode).toBe('INSUFFICIENT_SCOPES');
    });

    it('should use custom rate limit identifier', async () => {
      const apiKey = await authService.createAPIKey({
        userId: 'user123',
        scopes: ['read'],
      });

      const handler = createAPIHandler(
        middleware,
        async (ctx) => {
          return { message: 'Hello' };
        },
        {
          customRateLimitIdentifier: (ctx) => ctx.clientIp,
        }
      );

      const context = middleware.createContext(
        'req-010',
        '192.168.1.1',
        apiKey.key,
        '/api/test',
        'GET'
      );

      const response = await handler(context);

      expect(response.data.success).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should handle high concurrent requests', async () => {
      const apiKey = await authService.createAPIKey({
        userId: 'user123',
        scopes: ['read'],
        rateLimit: 5000,
      });

      // Set more permissive rate limit for performance test
      await rateLimiterService.updateConfig({
        windowSize: 10,
        maxRequests: 10000, // Allow many requests
        algorithm: RateLimitAlgorithm.SLIDING_WINDOW,
      });

      const promises: Promise<APIResponse>[] = [];

      // Simulate 1000 concurrent requests
      // Use different IP addresses to avoid per-IP rate limiting
      for (let i = 0; i < 1000; i++) {
        const context = middleware.createContext(
          `req-${i}`,
          `127.0.0.${i % 256}`,
          apiKey.key,
          '/api/test',
          'GET'
        );

        const handler = createAPIHandler(middleware, async () => ({
          message: 'Hello',
          index: i,
        }));

        promises.push(handler(context));
      }

      const startTime = performance.now();
      const responses = await Promise.all(promises);
      const duration = performance.now() - startTime;

      // All requests should be processed
      expect(responses.length).toBe(1000);

      // Most should succeed (some might be rate limited)
      const successCount = responses.filter(r => r.data.success).length;
      expect(successCount).toBeGreaterThan(900);

      // Performance check: should complete within reasonable time
      expect(duration).toBeLessThan(5000); // < 5 seconds for 1000 requests

      // Average latency per request
      const avgLatency = duration / 1000;
      expect(avgLatency).toBeLessThan(10); // < 10ms per request
    });

    it('should maintain P99 latency under load', async () => {
      const apiKey = await authService.createAPIKey({
        userId: 'user123',
        scopes: ['read'],
        rateLimit: 5000,
      });

      const latencies: number[] = [];

      // Make 500 requests and measure latency
      for (let i = 0; i < 500; i++) {
        const context = middleware.createContext(
          `req-${i}`,
          '127.0.0.1',
          apiKey.key,
          '/api/test',
          'GET'
        );

        const handler = createAPIHandler(middleware, async () => ({
          message: 'Hello',
        }));

        const startTime = performance.now();
        await handler(context);
        const latency = performance.now() - startTime;
        latencies.push(latency);
      }

      // Calculate P99
      const sorted = [...latencies].sort((a, b) => a - b);
      const p99Index = Math.floor(sorted.length * 0.99);
      const p99Latency = sorted[p99Index];

      expect(p99Latency).toBeLessThan(10); // P99 < 10ms
    });
  });

  describe('APIResponse Utilities', () => {
    it('should convert to HTTP response with correct status code', async () => {
      const successResponse = new APIResponse({
        success: true,
        data: { message: 'Hello' },
        requestId: 'req-001',
        timestamp: Date.now(),
      });

      const httpSuccess = successResponse.toHTTPResponse();

      expect(httpSuccess.statusCode).toBe(200);

      const errorResponse = new APIResponse({
        success: false,
        error: 'Unauthorized',
        errorCode: 'INVALID_API_KEY',
        requestId: 'req-002',
        timestamp: Date.now(),
      });

      const httpError = errorResponse.toHTTPResponse();

      expect(httpError.statusCode).toBe(401);
    });

    it('should include rate limit headers', async () => {
      const response = new APIResponse({
        success: true,
        data: {},
        requestId: 'req-001',
        timestamp: Date.now(),
        attributes: {
          rateLimitRemaining: 95,
          rateLimitResetAfter: 60,
        },
      });

      const headers = response.getHeaders();

      expect(headers['X-Request-Id']).toBeDefined();
      expect(headers['X-RateLimit-Remaining']).toBe('95');
      expect(headers['X-RateLimit-Reset']).toBe('60');
    });

    it('should serialize to JSON', async () => {
      const response = new APIResponse({
        success: true,
        data: { message: 'Hello' },
        requestId: 'req-001',
        timestamp: Date.now(),
      });

      const json = response.toJSON();

      expect(json.success).toBe(true);
      expect(json.data.message).toBe('Hello');
      expect(json.requestId).toBe('req-001');
    });
  });

  describe('Cleanup and Reset', () => {
    it('should clean up services', async () => {
      // Create some data
      await authService.createAPIKey({
        userId: 'user123',
        scopes: ['read'],
      });

      await styleService.createStyle({
        name: 'Test',
        type: StyleType.VECTOR,
        definition: JSON.stringify({}),
        createdBy: 'user123',
      });

      // Make some rate limit requests
      for (let i = 0; i < 5; i++) {
        await rateLimiterService.checkRateLimit('user1');
      }

      // Clean up
      await authService.clearAll();
      await styleService.clearAll();
      await rateLimiterService.resetAllRateLimits();

      // Verify cleanup
      const authStats = await authService.getAPIKeyStats();
      expect(authStats.total).toBe(0);

      const styleStats = await styleService.getStats();
      expect(styleStats.totalStyles).toBe(0);

      const rateLimitStats = await rateLimiterService.getStats();
      expect(rateLimitStats.totalRequests).toBeGreaterThan(0); // Stats are not reset
    });
  });
});
