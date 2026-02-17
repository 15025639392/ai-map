import { describe, it, expect, beforeEach } from 'vitest';
import { TileQueue } from '../../src/tiles/TileQueue.js';
import { TileState } from '../../src/tiles/types.js';

describe('Tile Performance Tests', () => {
  let queue: TileQueue;

  beforeEach(() => {
    queue = new TileQueue({
      maxConcurrent: 4,
      maxRetries: 3,
      maxCacheSize: 100,
      loadFn: async (tile) => {
        // 模拟网络延迟 50-150ms
        const delay = 50 + Math.random() * 100;
        await new Promise((resolve) => setTimeout(resolve, delay));
        return { data: `tile-${tile.coord.x}-${tile.coord.y}` };
      },
    });
  });

  afterEach(() => {
    queue.dispose();
  });

  describe('Load Time Performance', () => {
    it('should achieve p95 <= 180ms for tile loading', async () => {
      // 加载 30 个瓦片以获得足够的样本
      const loadTimes: number[] = [];

      for (let i = 0; i < 30; i++) {
        const tile = queue.addTile(
          { x: i, y: 0, z: 0 },
          `http://example.com/tile/${i}/0/0.png`,
          10
        );

        // 等待加载完成
        await new Promise((resolve) => {
          const checkInterval = setInterval(() => {
            if (tile.state === TileState.LOADED || tile.state === TileState.FAILED) {
              clearInterval(checkInterval);
              resolve(undefined);
            }
          }, 10);
        });

        if (tile.loadTime) {
          loadTimes.push(tile.loadTime);
        }
      }

      // 计算 p95
      const sorted = loadTimes.sort((a, b) => a - b);
      const p95Index = Math.ceil(sorted.length * 0.95) - 1;
      const p95 = sorted[p95Index] || 0;

      console.log(`Tile Load P95: ${p95.toFixed(2)}ms`);

      // p95 应该小于等于 180ms（测试环境）
      expect(p95).toBeLessThanOrEqual(180);
    });

    it('should achieve p50 within reasonable time', async () => {
      const loadTimes: number[] = [];

      for (let i = 0; i < 30; i++) {
        const tile = queue.addTile(
          { x: i, y: 0, z: 0 },
          `http://example.com/tile/${i}/0/0.png`,
          10
        );

        await new Promise((resolve) => {
          const checkInterval = setInterval(() => {
            if (tile.state === TileState.LOADED || tile.state === TileState.FAILED) {
              clearInterval(checkInterval);
              resolve(undefined);
            }
          }, 10);
        });

        if (tile.loadTime) {
          loadTimes.push(tile.loadTime);
        }
      }

      const sorted = loadTimes.sort((a, b) => a - b);
      const p50Index = Math.ceil(sorted.length * 0.5) - 1;
      const p50 = sorted[p50Index] || 0;

      console.log(`Tile Load P50: ${p50.toFixed(2)}ms`);

      expect(p50).toBeGreaterThan(0);
      expect(p50).toBeLessThan(200);
    });

    it('should maintain average load time', async () => {
      const loadTimes: number[] = [];

      for (let i = 0; i < 20; i++) {
        const tile = queue.addTile(
          { x: i, y: 0, z: 0 },
          `http://example.com/tile/${i}/0/0.png`,
          10
        );

        await new Promise((resolve) => {
          const checkInterval = setInterval(() => {
            if (tile.state === TileState.LOADED || tile.state === TileState.FAILED) {
              clearInterval(checkInterval);
              resolve(undefined);
            }
          }, 10);
        });

        if (tile.loadTime) {
          loadTimes.push(tile.loadTime);
        }
      }

      const average = loadTimes.reduce((sum, time) => sum + time, 0) / loadTimes.length;

      console.log(`Tile Load Average: ${average.toFixed(2)}ms`);

      expect(average).toBeGreaterThan(0);
      expect(average).toBeLessThan(200);
    });
  });

  describe('Concurrent Load Performance', () => {
    it('should handle concurrent loading efficiently', async () => {
      const startTime = Date.now();
      const tileCount = 20;

      for (let i = 0; i < tileCount; i++) {
        queue.addTile(
          { x: i, y: 0, z: 0 },
          `http://example.com/tile/${i}/0/0.png`,
          10
        );
      }

      // 等待所有瓦片加载完成
      await new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          const info = queue.getInfo();
          if (info.loadedTiles + info.failedTiles >= tileCount * 0.9) {
            clearInterval(checkInterval);
            resolve(undefined);
          }
        }, 50);
      });

      const totalTime = Date.now() - startTime;

      console.log(`Loaded ${tileCount} tiles in ${totalTime}ms`);

      // 并发加载应该比串行快
      expect(totalTime).toBeLessThan(tileCount * 150);
    });

    it('should maintain performance with high concurrency', async () => {
      const highConcurrencyQueue = new TileQueue({
        maxConcurrent: 8,
        loadFn: async (tile) => {
          const delay = 50 + Math.random() * 100;
          await new Promise((resolve) => setTimeout(resolve, delay));
          return { data: `tile-${tile.coord.x}` };
        },
      });

      const startTime = Date.now();
      const tileCount = 30;

      for (let i = 0; i < tileCount; i++) {
        highConcurrencyQueue.addTile(
          { x: i, y: 0, z: 0 },
          `http://example.com/tile/${i}/0/0.png`,
          10
        );
      }

      await new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          const info = highConcurrencyQueue.getInfo();
          if (info.loadedTiles + info.failedTiles === tileCount) {
            clearInterval(checkInterval);
            resolve(undefined);
          }
        }, 50);
      });

      const totalTime = Date.now() - startTime;
      const averageTime = totalTime / tileCount;

      console.log(`High concurrency: ${tileCount} tiles in ${totalTime}ms (avg ${averageTime.toFixed(2)}ms)`);

      expect(averageTime).toBeLessThan(200);

      highConcurrencyQueue.dispose();
    });
  });

  describe('Retry Performance', () => {
    it('should not significantly impact p95 with retries', async () => {
      let attemptCount = 0;

      const flakyLoadFn = async (tile) => {
        attemptCount++;
        // 30% 的请求会失败
        if (Math.random() < 0.3) {
          throw new Error('Network error');
        }
        const delay = 50 + Math.random() * 100;
        await new Promise((resolve) => setTimeout(resolve, delay));
        return { data: `tile-${tile.coord.x}` };
      };

      const retryQueue = new TileQueue({
        maxConcurrent: 4,
        maxRetries: 2,
        retryDelayBase: 50,
        loadFn: flakyLoadFn,
      });

      const loadTimes: number[] = [];

      for (let i = 0; i < 30; i++) {
        const tile = retryQueue.addTile(
          { x: i, y: 0, z: 0 },
          `http://example.com/tile/${i}/0/0.png`,
          10
        );

        await new Promise((resolve) => {
          const checkInterval = setInterval(() => {
            if (tile.state === TileState.LOADED || tile.state === TileState.FAILED) {
              clearInterval(checkInterval);
              resolve(undefined);
            }
          }, 10);
        });

        if (tile.loadTime) {
          loadTimes.push(tile.loadTime);
        }
      }

      const sorted = loadTimes.sort((a, b) => a - b);
      const p95Index = Math.ceil(sorted.length * 0.95) - 1;
      const p95 = sorted[p95Index] || 0;

      console.log(`With retries P95: ${p95.toFixed(2)}ms`);

      // 即使有重试，p95 应该仍然 <= 180ms
      expect(p95).toBeLessThanOrEqual(180);

      retryQueue.dispose();
    });
  });

  describe('Queue Performance', () => {
    it('should handle large queue efficiently', async () => {
      const largeQueue = new TileQueue({
        maxConcurrent: 4,
        maxCacheSize: 500,
        loadFn: async (tile) => {
          const delay = 30 + Math.random() * 70;
          await new Promise((resolve) => setTimeout(resolve, delay));
          return { data: `tile-${tile.coord.x}` };
        },
      });

      const startTime = Date.now();
      const tileCount = 100;

      for (let i = 0; i < tileCount; i++) {
        largeQueue.addTile(
          { x: i, y: 0, z: 0 },
          `http://example.com/tile/${i}/0/0.png`,
          10
        );
      }

      await new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          const info = largeQueue.getInfo();
          if (info.loadedTiles + info.failedTiles >= tileCount * 0.9) {
            clearInterval(checkInterval);
            resolve(undefined);
          }
        }, 100);
      });

      const totalTime = Date.now() - startTime;
      const throughput = (tileCount / totalTime) * 1000; // tiles per second

      console.log(`Queue throughput: ${throughput.toFixed(2)} tiles/sec`);

      expect(throughput).toBeGreaterThan(10);

      largeQueue.dispose();
    });

    it('should not degrade performance with cache eviction', async () => {
      const smallCacheQueue = new TileQueue({
        maxConcurrent: 8,
        maxCacheSize: 20,
        enableLRU: true,
        loadFn: async (tile) => {
          const delay = 30 + Math.random() * 50;
          await new Promise((resolve) => setTimeout(resolve, delay));
          return { data: `tile-${tile.coord.x}` };
        },
      });

      const loadTimes: number[] = [];

      // 添加超过缓存大小的瓦片，触发 LRU 淘汰
      const tileCount = 30;
      for (let i = 0; i < tileCount; i++) {
        const startTime = Date.now();
        const tile = smallCacheQueue.addTile(
          { x: i, y: 0, z: 0 },
          `http://example.com/tile/${i}/0/0.png`,
          10
        );

        await new Promise((resolve) => {
          const checkInterval = setInterval(() => {
            if (tile.state === TileState.LOADED || tile.state === TileState.FAILED) {
              clearInterval(checkInterval);
              resolve(undefined);
            }
          }, 10);
        });

        loadTimes.push(Date.now() - startTime);
      }

      const sorted = loadTimes.sort((a, b) => a - b);
      const p95Index = Math.ceil(sorted.length * 0.95) - 1;
      const p95 = sorted[p95Index] || 0;

      console.log(`With cache eviction P95: ${p95.toFixed(2)}ms`);

      expect(p95).toBeLessThanOrEqual(180);

      smallCacheQueue.dispose();
    });
  });

  describe('Memory Performance', () => {
    it('should not leak memory with repeated add/remove', async () => {
      const initialTilesCount = queue.getAllTiles().length;

      for (let cycle = 0; cycle < 10; cycle++) {
        // 添加 20 个瓦片
        for (let i = 0; i < 20; i++) {
          queue.addTile(
            { x: i, y: cycle, z: 0 },
            `http://example.com/tile/${i}/${cycle}/0.png`,
            10
          );
        }

        // 等待加载
        await new Promise((resolve) => setTimeout(resolve, 100));

        // 移除一半
        const tileIds = queue
          .getAllTiles()
          .filter((t) => t.coord.y === cycle)
          .slice(0, 10)
          .map((t) => `${t.coord.z}/${t.coord.x}/${t.coord.y}`);

        queue.removeTiles(tileIds);
      }

      const finalTilesCount = queue.getAllTiles().length;

      // 内存使用应该相对稳定
      expect(finalTilesCount).toBeLessThan(initialTilesCount + 200);
    });
  });

  describe('Statistics Performance', () => {
    it('should efficiently track statistics', async () => {
      const tileCount = 50;

      for (let i = 0; i < tileCount; i++) {
        queue.addTile(
          { x: i, y: 0, z: 0 },
          `http://example.com/tile/${i}/0/0.png`,
          10
        );
      }

      // 等待加载
      await new Promise((resolve) => setTimeout(resolve, 200));

      const stats = queue.getStats();

      expect(stats.totalRequests).toBeGreaterThan(0);
      expect(stats.successRequests).toBeGreaterThan(0);
      expect(stats.p95).toBeGreaterThan(0);
      expect(stats.p95).toBeLessThanOrEqual(180);
    });
  });
});
