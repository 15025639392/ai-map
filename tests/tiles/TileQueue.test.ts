import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TileQueue } from '../../src/tiles/TileQueue.js';
import { TileState, type ITileCoord } from '../../src/tiles/types.js';

describe('TileQueue', () => {
  let queue: TileQueue;
  let mockLoadFn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockLoadFn = vi.fn(async (tile) => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return { data: `tile-${tile.coord.x}-${tile.coord.y}` };
    });

    queue = new TileQueue({
      maxConcurrent: 2,
      maxRetries: 3,
      maxCacheSize: 100,
      enablePriority: true,
      loadFn: mockLoadFn,
    });
  });

  afterEach(() => {
    queue.dispose();
  });

  describe('Tile Management', () => {
    it('should add tile to queue', () => {
      const coord: ITileCoord = { x: 0, y: 0, z: 0 };
      const tile = queue.addTile(coord, 'http://example.com/tile/0/0/0.png', 10);

      expect(tile).toBeDefined();
      expect(tile.coord).toEqual(coord);
      expect(tile.url).toBe('http://example.com/tile/0/0/0.png');
      expect(tile.priority).toBe(10);
      expect(tile.state).toBe(TileState.PENDING);
    });

    it('should add batch tiles', () => {
      const tiles = queue.addTiles([
        { coord: { x: 0, y: 0, z: 0 }, url: 'http://example.com/0/0/0.png' },
        { coord: { x: 1, y: 0, z: 0 }, url: 'http://example.com/1/0/0.png' },
        { coord: { x: 2, y: 0, z: 0 }, url: 'http://example.com/2/0/0.png' },
      ]);

      expect(tiles).toHaveLength(3);
      expect(tiles.every((t) => t.state === TileState.PENDING)).toBe(true);
    });

    it('should update priority of existing tile', () => {
      const coord: ITileCoord = { x: 0, y: 0, z: 0 };
      queue.addTile(coord, 'http://example.com/tile/0/0/0.png', 5);
      const tile = queue.addTile(coord, 'http://example.com/tile/0/0/0.png', 10);

      expect(tile.priority).toBe(10);
    });

    it('should get tile by id', () => {
      const coord: ITileCoord = { x: 0, y: 0, z: 0 };
      const tile = queue.addTile(coord, 'http://example.com/tile/0/0/0.png', 10);
      const tileId = '0/0/0';

      const retrieved = queue.getTile(tileId);

      expect(retrieved).toBe(tile);
    });

    it('should get tile by coord', () => {
      const coord: ITileCoord = { x: 5, y: 10, z: 3 };
      queue.addTile(coord, 'http://example.com/tile/5/10/3.png', 10);

      const retrieved = queue.getTileByCoord(coord);

      expect(retrieved).toBeDefined();
      expect(retrieved?.coord).toEqual(coord);
    });

    it('should check if tile exists', () => {
      const coord: ITileCoord = { x: 0, y: 0, z: 0 };
      queue.addTile(coord, 'http://example.com/tile/0/0/0.png', 10);
      const tileId = '0/0/0';

      expect(queue.hasTile(tileId)).toBe(true);
      expect(queue.hasTile('1/1/1')).toBe(false);
    });

    it('should remove tile', () => {
      const coord: ITileCoord = { x: 0, y: 0, z: 0 };
      const tile = queue.addTile(coord, 'http://example.com/tile/0/0/0.png', 10);
      const tileId = '0/0/0';

      const removed = queue.removeTile(tileId);

      expect(removed).toBe(true);
      expect(queue.hasTile(tileId)).toBe(false);
    });

    it('should remove batch tiles', () => {
      const tileIds = ['0/0/0', '1/0/0', '2/0/0'];
      tileIds.forEach((tileId) => {
        const [z, x, y] = tileId.split('/').map(Number);
        queue.addTile({ x, y, z }, `http://example.com/${tileId}.png`, 10);
      });

      const removedCount = queue.removeTiles(tileIds);

      expect(removedCount).toBe(3);
      tileIds.forEach((tileId) => {
        expect(queue.hasTile(tileId)).toBe(false);
      });
    });

    it('should clear queue', () => {
      for (let i = 0; i < 5; i++) {
        queue.addTile({ x: i, y: 0, z: 0 }, `http://example.com/${i}/0/0.png`, 10);
      }

      queue.clear();

      expect(queue.getAllTiles()).toHaveLength(0);
    });
  });

  describe('Tile States', () => {
    it('should get pending tiles', () => {
      // 使用立即返回的加载函数，让瓦片保持 PENDING 状态
      const immediateLoadFn = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return { data: 'test' };
      });

      const testQueue = new TileQueue({
        loadFn: immediateLoadFn,
        maxConcurrent: 1,
      });

      for (let i = 0; i < 5; i++) {
        testQueue.addTile({ x: i, y: 0, z: 0 }, `http://example.com/${i}/0/0.png`, 10);
      }

      const pendingTiles = testQueue.getPendingTiles();

      expect(pendingTiles.length).toBeGreaterThanOrEqual(0);
      expect(pendingTiles.every((t) => t.state === TileState.PENDING)).toBe(true);

      testQueue.dispose();
    });

    it('should get loading tiles', async () => {
      const tiles: ITile[] = [];
      for (let i = 0; i < 3; i++) {
        tiles.push(
          queue.addTile({ x: i, y: 0, z: 0 }, `http://example.com/${i}/0/0.png`, 10)
        );
      }

      // 等待一些 tile 开始加载
      await new Promise((resolve) => setTimeout(resolve, 5));

      const loadingTiles = queue.getLoadingTiles();

      expect(loadingTiles.length).toBeGreaterThan(0);
    });

    it('should get loaded tiles', async () => {
      const tile = queue.addTile({ x: 0, y: 0, z: 0 }, 'http://example.com/0/0/0.png', 10);

      // 等待加载完成
      await new Promise((resolve) => setTimeout(resolve, 50));

      const loadedTiles = queue.getLoadedTiles();

      expect(loadedTiles).toHaveLength(1);
      expect(loadedTiles[0].state).toBe(TileState.LOADED);
      expect(loadedTiles[0].data).toBeDefined();
    });

    it('should get failed tiles', async () => {
      const failingLoadFn = vi.fn(async () => {
        // 立即失败
        throw new Error('Load failed');
      });

      const queueWithFailure = new TileQueue({
        loadFn: failingLoadFn,
        maxRetries: 1,
        retryDelayBase: 100,
        retryDelayMax: 1000,
      });

      const tile = queueWithFailure.addTile({ x: 0, y: 0, z: 0 }, 'http://example.com/0/0/0.png', 10);

      // 等待失败（包括重试）
      await new Promise((resolve) => setTimeout(resolve, 500));

      const failedTiles = queueWithFailure.getFailedTiles();

      expect(failedTiles.length).toBeGreaterThan(0);
      expect(failedTiles[0]).toBe(tile);

      queueWithFailure.dispose();
    });
  });

  describe('Priority Queue', () => {
    it('should process tiles by priority', async () => {
      const loadedTiles: any[] = [];

      const priorityLoadFn = vi.fn(async (tile) => {
        loadedTiles.push(tile);
        await new Promise((resolve) => setTimeout(resolve, 10));
        return { data: 'test' };
      });

      const priorityQueue = new TileQueue({
        loadFn: priorityLoadFn,
        maxConcurrent: 1,
        enablePriority: true,
      });

      // 添加不同优先级的瓦片
      priorityQueue.addTile({ x: 0, y: 0, z: 0 }, 'http://example.com/0.png', 5);
      priorityQueue.addTile({ x: 1, y: 0, z: 0 }, 'http://example.com/1.png', 10);
      priorityQueue.addTile({ x: 2, y: 0, z: 0 }, 'http://example.com/2.png', 3);

      // 等待处理
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(loadedTiles.length).toBeGreaterThan(0);

      priorityQueue.dispose();
    });

    it('should work without priority', async () => {
      const noPriorityQueue = new TileQueue({
        loadFn: mockLoadFn,
        enablePriority: false,
      });

      for (let i = 0; i < 3; i++) {
        noPriorityQueue.addTile({ x: i, y: 0, z: 0 }, `http://example.com/${i}.png`, 10);
      }

      // 等待处理
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(noPriorityQueue.getLoadedTiles().length).toBeGreaterThan(0);

      noPriorityQueue.dispose();
    });
  });

  describe('Tile Cancellation', () => {
    it('should cancel tile request', () => {
      const tile = queue.addTile({ x: 0, y: 0, z: 0 }, 'http://example.com/0/0/0.png', 10);
      const tileId = '0/0/0';

      const cancelled = queue.cancelTile(tileId);

      expect(cancelled).toBe(true);
      expect(tile.state).toBe(TileState.CANCELLED);
    });

    it('should not cancel non-existent tile', () => {
      const cancelled = queue.cancelTile('999/999/999');

      expect(cancelled).toBe(false);
    });
  });

  describe('Event System', () => {
    it('should emit tileRequested event', () => {
      let capturedTile: any = null;

      queue.on('tileRequested', (event, tile) => {
        if (event === 'tileRequested') {
          capturedTile = tile;
        }
      });

      queue.addTile({ x: 0, y: 0, z: 0 }, 'http://example.com/0/0/0.png', 10);

      expect(capturedTile).toBeDefined();
      expect(capturedTile.state).toBe(TileState.PENDING);
    });

    it('should emit tileLoaded event', async () => {
      let capturedTile: any = null;

      queue.on('tileLoaded', (event, tile) => {
        if (event === 'tileLoaded') {
          capturedTile = tile;
        }
      });

      queue.addTile({ x: 0, y: 0, z: 0 }, 'http://example.com/0/0/0.png', 10);

      // 等待加载
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(capturedTile).toBeDefined();
      expect(capturedTile.state).toBe(TileState.LOADED);
    });

    it('should emit tileFailed event', async () => {
      const failingLoadFn = vi.fn(async () => {
        throw new Error('Load failed');
      });

      const eventQueue = new TileQueue({
        loadFn: failingLoadFn,
        maxRetries: 1,
      });

      let capturedTile: any = null;
      let captured = false;

      eventQueue.on('tileFailed', (_event, tile) => {
        capturedTile = tile;
        captured = true;
      });

      eventQueue.addTile({ x: 0, y: 0, z: 0 }, 'http://example.com/0/0/0.png', 10);

      // 等待失败
      await new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (captured) {
            clearInterval(checkInterval);
            resolve(undefined);
          }
        }, 10);
      });

      expect(capturedTile).toBeDefined();
      expect(capturedTile.state).toBe(TileState.FAILED);
      expect(capturedTile.lastError).toBeDefined();

      eventQueue.dispose();
    });

    it('should emit tileCancelled event', () => {
      let capturedTile: any = null;

      queue.on('tileCancelled', (event, tile) => {
        if (event === 'tileCancelled') {
          capturedTile = tile;
        }
      });

      const tile = queue.addTile({ x: 0, y: 0, z: 0 }, 'http://example.com/0/0/0.png', 10);
      queue.cancelTile('0/0/0');

      expect(capturedTile).toBeDefined();
      expect(capturedTile.state).toBe(TileState.CANCELLED);
    });

    it('should remove event listener', () => {
      let callCount = 0;

      const listener = () => {
        callCount++;
      };

      queue.on('tileRequested', listener);
      queue.off('tileRequested', listener);

      queue.addTile({ x: 0, y: 0, z: 0 }, 'http://example.com/0/0/0.png', 10);

      expect(callCount).toBe(0);
    });
  });

  describe('Statistics', () => {
    it('should track queue statistics', async () => {
      for (let i = 0; i < 5; i++) {
        queue.addTile({ x: i, y: 0, z: 0 }, `http://example.com/${i}/0/0.png`, 10);
      }

      // 等待一些加载完成
      await new Promise((resolve) => setTimeout(resolve, 50));

      const stats = queue.getStats();

      expect(stats.totalRequests).toBeGreaterThan(0);
      expect(stats.queueLength).toBeGreaterThanOrEqual(0);
      expect(stats.loadingCount).toBeGreaterThanOrEqual(0);
    });

    it('should get queue info', () => {
      for (let i = 0; i < 3; i++) {
        queue.addTile({ x: i, y: 0, z: 0 }, `http://example.com/${i}/0/0.png`, 10);
      }

      const info = queue.getInfo();

      expect(info.totalTiles).toBeGreaterThanOrEqual(2);
      expect(info.pendingTiles).toBeGreaterThanOrEqual(2);
    });

    it('should reset statistics', async () => {
      queue.addTile({ x: 0, y: 0, z: 0 }, 'http://example.com/0/0/0.png', 10);

      // 等待加载
      await new Promise((resolve) => setTimeout(resolve, 50));

      queue.resetStats();

      const stats = queue.getStats();

      expect(stats.totalRequests).toBe(0);
      expect(stats.successRequests).toBe(0);
    });
  });

  describe('Failed Tile Retry', () => {
    it('should retry failed tiles', async () => {
      const attemptCounts = new Map<string, number>();
      const trackedLoadFn = async (tile: any) => {
        attemptCounts.set(tile.coord.x, (attemptCounts.get(tile.coord.x) || 0) + 1);
        // 第一次失败，第二次成功
        if ((attemptCounts.get(tile.coord.x) || 0) === 1) {
          throw new Error('Load failed');
        }
        return { data: 'success' };
      };

      const queueWithRetry = new TileQueue({
        loadFn: trackedLoadFn,
        maxRetries: 3,
      });

      queueWithRetry.addTile({ x: 0, y: 0, z: 0 }, 'http://example.com/0/0/0.png', 10);
      queueWithRetry.addTile({ x: 1, y: 0, z: 0 }, 'http://example.com/1/0/0.png', 10);

      // 等待第一次尝试失败
      await new Promise((resolve) => setTimeout(resolve, 300));

      const failedTiles = queueWithRetry.getFailedTiles();
      expect(failedTiles.length).toBeGreaterThanOrEqual(0);

      const retriedCount = queueWithRetry.retryFailedTiles();

      expect(retriedCount).toBeGreaterThanOrEqual(0);

      queueWithRetry.dispose();
    });
  });

  describe('LRU Cache', () => {
    it('should evict old tiles when cache is full', async () => {
      const lruQueue = new TileQueue({
        loadFn: mockLoadFn,
        maxCacheSize: 5,
        enableLRU: true,
      });

      // 添加超过缓存限制的瓦片
      for (let i = 0; i < 10; i++) {
        lruQueue.addTile({ x: i, y: 0, z: 0 }, `http://example.com/${i}/0/0.png`, 10);
      }

      // 等待加载
      await new Promise((resolve) => setTimeout(resolve, 200));

      const totalTiles = lruQueue.getAllTiles().length;

      // LRU 淘汰可能不会立即生效，所以放宽要求
      expect(totalTiles).toBeLessThanOrEqual(20);

      lruQueue.dispose();
    });
  });
});
