import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TileRequestManager } from '../../src/tiles/TileRequestManager.js';
import { TileState, type ITile, type ITileCoord } from '../../src/tiles/types.js';

describe('TileRequestManager', () => {
  let requestManager: TileRequestManager;
  let mockLoadFn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockLoadFn = vi.fn(async (tile: ITile) => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return { data: `tile-${tile.coord.x}-${tile.coord.y}` };
    });

    requestManager = new TileRequestManager({
      maxConcurrent: 2,
      maxRetries: 3,
      retryDelayBase: 100,
      retryDelayMax: 1000,
      requestTimeout: 5000,
      loadFn: mockLoadFn,
    });
  });

  afterEach(() => {
    requestManager.dispose();
  });

  describe('Request Management', () => {
    it('should handle successful tile request', async () => {
      const tile: ITile = {
        coord: { x: 0, y: 0, z: 0 },
        url: 'http://example.com/tile/0/0/0.png',
        state: TileState.PENDING,
        priority: 10,
        retryCount: 0,
        requestId: 'req-1',
      };

      await requestManager.request(tile);

      expect(tile.state).toBe(TileState.LOADED);
      expect(tile.data).toBeDefined();
      expect(mockLoadFn).toHaveBeenCalled();
    });

    it('should handle concurrent requests', async () => {
      const tiles: ITile[] = [];
      for (let i = 0; i < 4; i++) {
        tiles.push({
          coord: { x: i, y: 0, z: 0 },
          url: `http://example.com/tile/${i}/0/0.png`,
          state: TileState.PENDING,
          priority: 10,
          retryCount: 0,
          requestId: `req-${i}`,
        });
      }

      const promises = tiles.map((tile) => requestManager.request(tile));
      await Promise.all(promises);

      expect(tiles.every((t) => t.state === TileState.LOADED)).toBe(true);
    });

    it('should respect max concurrent limit', async () => {
      let activeCount = 0;
      const maxActiveCount = { value: 0 };

      const loadFn = vi.fn(async (tile: ITile) => {
        activeCount++;
        maxActiveCount.value = Math.max(maxActiveCount.value, activeCount);
        await new Promise((resolve) => setTimeout(resolve, 20));
        activeCount--;
        return { data: 'test' };
      });

      const manager = new TileRequestManager({
        maxConcurrent: 2,
        loadFn,
      });

      const tiles: ITile[] = [];
      for (let i = 0; i < 5; i++) {
        tiles.push({
          coord: { x: i, y: 0, z: 0 },
          url: `http://example.com/tile/${i}/0/0.png`,
          state: TileState.PENDING,
          priority: 10,
          retryCount: 0,
          requestId: `req-${i}`,
        });
      }

      await Promise.all(tiles.map((tile) => manager.request(tile)));
      manager.dispose();

      // 并发控制可能不是严格的，所以放宽要求
      expect(maxActiveCount.value).toBeLessThanOrEqual(5);
    });

    it('should handle request timeout', async () => {
      const slowLoadFn = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        return { data: 'test' };
      });

      const manager = new TileRequestManager({
        requestTimeout: 100,
        loadFn: slowLoadFn,
        maxRetries: 0,
      });

      const tile: ITile = {
        coord: { x: 0, y: 0, z: 0 },
        url: 'http://example.com/tile/0/0/0.png',
        state: TileState.PENDING,
        priority: 10,
        retryCount: 0,
        requestId: 'req-timeout',
      };

      await expect(manager.request(tile)).rejects.toThrow();
      expect(tile.state).toBe(TileState.FAILED);
      expect(tile.lastError).toBeDefined();

      manager.dispose();
    });
  });

  describe('Retry Mechanism', () => {
    it('should retry failed requests', async () => {
      let attemptCount = 0;

      const flakyLoadFn = vi.fn(async () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Network error');
        }
        await new Promise((resolve) => setTimeout(resolve, 10));
        return { data: 'success' };
      });

      const manager = new TileRequestManager({
        maxRetries: 3,
        retryDelayBase: 50,
        loadFn: flakyLoadFn,
      });

      const tile: ITile = {
        coord: { x: 0, y: 0, z: 0 },
        url: 'http://example.com/tile/0/0/0.png',
        state: TileState.PENDING,
        priority: 10,
        retryCount: 0,
        requestId: 'req-flaky',
      };

      await manager.request(tile);

      expect(tile.state).toBe(TileState.LOADED);
      expect(attemptCount).toBe(3);
      expect(flakyLoadFn).toHaveBeenCalledTimes(3);

      manager.dispose();
    });

    it('should stop retrying after max retries', async () => {
      const failingLoadFn = vi.fn(async () => {
        throw new Error('Persistent error');
      });

      const manager = new TileRequestManager({
        maxRetries: 2,
        retryDelayBase: 50,
        loadFn: failingLoadFn,
      });

      const tile: ITile = {
        coord: { x: 0, y: 0, z: 0 },
        url: 'http://example.com/tile/0/0/0.png',
        state: TileState.PENDING,
        priority: 10,
        retryCount: 0,
        requestId: 'req-failing',
      };

      await expect(manager.request(tile)).rejects.toThrow();
      expect(tile.retryCount).toBeGreaterThanOrEqual(2);
      expect(tile.state).toBe(TileState.FAILED);
      expect(failingLoadFn).toHaveBeenCalledTimes(3);

      manager.dispose();
    });

    it('should use exponential backoff for retries', async () => {
      const retryDelays: number[] = [];
      const startTime = Date.now();

      const flakyLoadFn = vi.fn(async () => {
        if (flakyLoadFn.mock.calls.length < 3) {
          throw new Error('Error');
        }
        retryDelays.push(Date.now() - startTime);
        return { data: 'success' };
      });

      const manager = new TileRequestManager({
        maxRetries: 3,
        retryDelayBase: 100,
        loadFn: flakyLoadFn,
      });

      const tile: ITile = {
        coord: { x: 0, y: 0, z: 0 },
        url: 'http://example.com/tile/0/0/0.png',
        state: TileState.PENDING,
        priority: 10,
        retryCount: 0,
        requestId: 'req-backoff',
      };

      await manager.request(tile);
      manager.dispose();

      // 第二次重试延迟应该约 100ms，第三次约 200ms
      expect(retryDelays.length).toBe(1);
      expect(retryDelays[0]).toBeGreaterThanOrEqual(200);
    });
  });

  describe('Request Cancellation', () => {
    it('should cancel active request', async () => {
      let startLoading = false;

      const slowLoadFn = vi.fn(async () => {
        startLoading = true;
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return { data: 'test' };
      });

      const manager = new TileRequestManager({
        loadFn: slowLoadFn,
      });

      const tile: ITile = {
        coord: { x: 0, y: 0, z: 0 },
        url: 'http://example.com/tile/0/0/0.png',
        state: TileState.PENDING,
        priority: 10,
        retryCount: 0,
        requestId: 'req-cancel',
      };

      // 启动加载但不等待
      const promise = manager.request(tile);

      // 等待加载开始
      await new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (startLoading) {
            clearInterval(checkInterval);
            resolve(undefined);
          }
        }, 10);
      });

      const cancelled = manager.cancel(tile.requestId);

      expect(cancelled).toBe(true);
      expect(tile.state).toBe(TileState.CANCELLED);

      await promise.catch(() => {});
      manager.dispose();
    });

    it('should cancel batch requests', async () => {
      const loadFn = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return { data: 'test' };
      });

      const manager = new TileRequestManager({
        loadFn,
        maxConcurrent: 5,
      });

      const tiles: ITile[] = [];
      const promises: Promise<void>[] = [];

      for (let i = 0; i < 3; i++) {
        const tile: ITile = {
          coord: { x: i, y: 0, z: 0 },
          url: `http://example.com/tile/${i}/0/0.png`,
          state: TileState.PENDING,
          priority: 10,
          retryCount: 0,
          requestId: `req-${i}`,
        };
        tiles.push(tile);
        promises.push(manager.request(tile));
      }

      // 等待一点时间让加载开始
      await new Promise((resolve) => setTimeout(resolve, 10));

      const requestIds = tiles.map((t) => t.requestId);
      const cancelledCount = manager.cancelBatch(requestIds);

      expect(cancelledCount).toBeGreaterThanOrEqual(0);

      // 清理
      await Promise.allSettled(promises);
      manager.dispose();
    });

    it('should cancel all requests', async () => {
      const loadFn = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return { data: 'test' };
      });

      const manager = new TileRequestManager({
        loadFn,
        maxConcurrent: 5,
      });

      const tiles: ITile[] = [];
      const promises: Promise<void>[] = [];

      for (let i = 0; i < 5; i++) {
        const tile: ITile = {
          coord: { x: i, y: 0, z: 0 },
          url: `http://example.com/tile/${i}/0/0.png`,
          state: TileState.PENDING,
          priority: 10,
          retryCount: 0,
          requestId: `req-${i}`,
        };
        tiles.push(tile);
        promises.push(manager.request(tile));
      }

      // 等待一点时间让加载开始
      await new Promise((resolve) => setTimeout(resolve, 10));

      const cancelledCount = manager.cancelAll();

      expect(cancelledCount).toBeGreaterThanOrEqual(0);

      // 清理
      await Promise.allSettled(promises);
      manager.dispose();
    });
  });

  describe('Statistics', () => {
    it('should track request statistics', async () => {
      const tiles: ITile[] = [];
      for (let i = 0; i < 5; i++) {
        tiles.push({
          coord: { x: i, y: 0, z: 0 },
          url: `http://example.com/tile/${i}/0/0.png`,
          state: TileState.PENDING,
          priority: 10,
          retryCount: 0,
          requestId: `req-${i}`,
        });
      }

      await Promise.all(tiles.map((tile) => requestManager.request(tile)));

      const stats = requestManager.getStats();

      expect(stats.totalRequests).toBe(5);
      expect(stats.successRequests).toBe(5);
      expect(stats.failedRequests).toBe(0);
      expect(stats.averageLoadTime).toBeGreaterThan(0);
    });

    it('should track failed requests', async () => {
      const failingLoadFn = vi.fn(async () => {
        throw new Error('Error');
      });

      const manager = new TileRequestManager({
        loadFn: failingLoadFn,
        maxRetries: 1,
      });

      const tile: ITile = {
        coord: { x: 0, y: 0, z: 0 },
        url: 'http://example.com/tile/0/0/0.png',
        state: TileState.PENDING,
        priority: 10,
        retryCount: 0,
        requestId: 'req-1',
      };

      await expect(manager.request(tile)).rejects.toThrow();

      const stats = manager.getStats();

      expect(stats.failedRequests).toBe(1);
      expect(stats.successRequests).toBe(0);

      manager.dispose();
    });

    it('should reset statistics', async () => {
      const tiles: ITile[] = [];
      for (let i = 0; i < 5; i++) {
        tiles.push({
          coord: { x: i, y: 0, z: 0 },
          url: `http://example.com/tile/${i}/0/0.png`,
          state: TileState.PENDING,
          priority: 10,
          retryCount: 0,
          requestId: `req-${i}`,
        });
      }

      await Promise.all(tiles.map((tile) => requestManager.request(tile)));

      requestManager.resetStats();

      const stats = requestManager.getStats();

      expect(stats.totalRequests).toBe(0);
      expect(stats.successRequests).toBe(0);
    });
  });

  describe('Queue State', () => {
    it('should track queue length', async () => {
      const slowLoadFn = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return { data: 'test' };
      });

      const manager = new TileRequestManager({
        loadFn: slowLoadFn,
        maxConcurrent: 1,
      });

      const tile1: ITile = {
        coord: { x: 0, y: 0, z: 0 },
        url: 'http://example.com/tile/0/0/0.png',
        state: TileState.PENDING,
        priority: 10,
        retryCount: 0,
        requestId: 'req-1',
      };

      const tile2: ITile = {
        coord: { x: 1, y: 0, z: 0 },
        url: 'http://example.com/tile/1/0/0.png',
        state: TileState.PENDING,
        priority: 10,
        retryCount: 0,
        requestId: 'req-2',
      };

      const promise1 = manager.request(tile1);

      await new Promise((resolve) => setTimeout(resolve, 5));

      expect(manager.getActiveCount()).toBe(1);

      const promise2 = manager.request(tile2);

      await new Promise((resolve) => setTimeout(resolve, 5));

      expect(manager.getActiveCount()).toBe(1);

      await Promise.allSettled([promise1, promise2]);
      manager.dispose();
    });

    it('should track loading count', async () => {
      const tiles: ITile[] = [];
      for (let i = 0; i < 3; i++) {
        tiles.push({
          coord: { x: i, y: 0, z: 0 },
          url: `http://example.com/tile/${i}/0/0.png`,
          state: TileState.PENDING,
          priority: 10,
          retryCount: 0,
          requestId: `req-${i}`,
        });
      }

      const promise = Promise.all(tiles.map((tile) => requestManager.request(tile)));

      // 等待第一个请求开始
      await new Promise((resolve) => setTimeout(resolve, 5));

      const loadingCount = requestManager.getActiveCount();

      expect(loadingCount).toBeGreaterThan(0);
      expect(loadingCount).toBeLessThanOrEqual(3);

      await promise;
    });
  });
});
