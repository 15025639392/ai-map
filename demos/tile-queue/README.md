# 瓦片队列 - 瓦片管理示例

这个 demo 展示了如何使用 `TileQueue` 类智能加载和管理地图瓦片。

## 功能特性

- **智能瓦片加载**: 支持并发控制和优先级队列
- **自动重试**: 失败瓦片自动重试
- **LRU 缓存**: 最近最少使用的缓存策略
- **实时统计**: 瓦片加载性能统计
- **动态配置**: 可调整缩放级别和并发数
- **状态监控**: 实时显示瓦片加载状态

## 技术实现

### TileQueue

瓦片队列管理器，支持智能瓦片加载。

#### 核心功能

1. **并发控制**
   - 限制同时加载的瓦片数量
   - 避免过多的网络请求

2. **优先级队列**
   - 根据重要性优先加载瓦片
   - 视口中心的瓦片优先级更高

3. **自动重试**
   - 失败的瓦片自动重试
   - 指数退避策略

4. **LRU 缓存**
   - 最近最少使用的缓存策略
   - 自动清理最少使用的瓦片

### 瓦片状态

```typescript
enum TileState {
  PENDING = 'pending',    // 等待中
  LOADING = 'loading',    // 加载中
  LOADED = 'loaded',      // 已加载
  FAILED = 'failed',      // 加载失败
  CANCELLED = 'cancelled' // 已取消
}
```

### TileStats

瓦片统计工具，提供详细的性能指标。

```typescript
interface ITileStats {
  totalRequests: number;       // 总请求数
  successRequests: number;     // 成功请求数
  failedRequests: number;      // 失败请求数
  cancelledRequests: number;   // 取消请求数
  averageLoadTime: number;    // 平均加载时间（ms）
  p50: number;               // P50 加载时间
  p95: number;               // P95 加载时间
  p99: number;               // P99 加载时间
  queueLength: number;         // 当前队列长度
  loadingCount: number;        // 当前加载中的数量
}
```

## 使用方法

### 基础使用

```javascript
import { TileQueue, TileState } from './lib/index.js';

// 创建瓦片队列
const tileQueue = new TileQueue({
  loadFn: async (tile) => {
    const url = `https://tile.openstreetmap.org/${tile.z}/${tile.x}/${tile.y}.png`;
    const response = await fetch(url);
    return response.arrayBuffer();
  },
  maxConcurrent: 6,
  maxRetries: 3,
  enablePriority: true,
  enableLRU: true,
  maxCacheSize: 100
});

// 监听瓦片事件
tileQueue.on('tileRequested', (tile) => {
  console.log('请求瓦片:', tile.coord);
});

tileQueue.on('tileLoaded', (tile) => {
  console.log('瓦片加载完成:', tile.coord, '时间:', tile.loadTime);
});

tileQueue.on('tileFailed', (tile) => {
  console.error('瓦片加载失败:', tile.coord, tile.lastError);
});

// 添加瓦片到队列
tileQueue.add({
  x: 0,
  y: 0,
  z: 10
});
```

### 瓦片加载函数

```javascript
// 异步加载瓦片
async function loadTile(tile) {
  const startTime = performance.now();

  try {
    const url = `https://tile.openstreetmap.org/${tile.z}/${tile.x}/${tile.y}.png`;
    const response = await fetch(url, {
      signal: AbortSignal.timeout(30000) // 30秒超时
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const blob = await response.blob();
    const image = await createImageBitmap(blob);
    const loadTime = performance.now() - startTime;

    return image;

  } catch (error) {
    console.error('瓦片加载失败:', tile.coord, error);
    throw error;
  }
}

// 使用在队列中
const tileQueue = new TileQueue({
  loadFn: loadTile,
  maxConcurrent: 6
});
```

### 动态配置

```javascript
// 修改并发数
tileQueue.setConfig({ maxConcurrent: 8 });

// 修改重试策略
tileQueue.setConfig({
  maxRetries: 5,
  retryDelayBase: 2000,
  retryDelayMax: 10000
});

// 修改缓存配置
tileQueue.setConfig({
  maxCacheSize: 200,
  enableLRU: false
});

// 修改超时设置
tileQueue.setConfig({
  requestTimeout: 60000
});
```

### 获取统计

```javascript
// 获取统计信息
const stats = tileQueue.getStats();

console.log('总请求:', stats.totalRequests);
console.log('成功请求:', stats.successRequests);
console.log('失败请求:', stats.failedRequests);
console.log('平均加载时间:', stats.averageLoadTime);
console.log('P50 加载时间:', stats.p50);
console.log('P95 加载时间:', stats.p95);
console.log('P99 加载时间:', stats.p99);
console.log('队列长度:', stats.queueLength);
console.log('加载中的数量:', stats.loadingCount);
```

### 清理队列

```javascript
// 清空队列
tileQueue.clear();

// 取消所有请求
tileQueue.cancelAll();

// 取消特定瓦片
tileQueue.cancelTile('tile-10-5-8');
```

## 使用说明

### 缩放控制

1. **缩放滑块**: 拖动滑块调整缩放级别（1-18）
2. **自动更新**: 改变缩放级别会自动重新加载瓦片

### 并发控制

1. **并发滑块**: 调整同时加载的瓦片数量（1-10）
2. **实时生效**: 调整后立即生效
3. **建议值**: 4-6 是合理的默认值

### 瓦片列表

显示所有瓦片的当前状态：

- **PENDING** (黄色): 等待加载
- **LOADING** (蓝色): 正在加载
- **LOADED** (绿色): 加载完成
- **FAILED** (红色): 加载失败

### 清空队列

点击"清空队列"按钮清空所有瓦片。

### 统计显示

实时显示瓦片统计：

- **总请求数**: 所有请求的总数
- **成功数**: 成功加载的瓦片数
- **失败数**: 加载失败的瓦片数
- **平均加载时间**: 所有瓦片的平均加载时间
- **队列长度**: 当前等待的瓦片数

## API 参考

### TileQueue 配置

```typescript
interface ITileQueueConfig {
  loadFn: TileLoadFunction;        // 瓦片加载函数
  maxConcurrent?: number;           // 最大并发数（默认 6）
  maxRetries?: number;              // 最大重试次数（默认 3）
  retryDelayBase?: number;          // 重试延迟基数（默认 1000ms）
  retryDelayMax?: number;          // 重试延迟最大值（默认 10000ms）
  requestTimeout?: number;          // 请求超时时间（默认 30000ms）
  maxCacheSize?: number;           // 最大缓存数量（默认 100）
  enablePriority?: boolean;         // 是否启用优先级队列（默认 true）
  enableLRU?: boolean;            // 是否启用 LRU 缓存（默认 true）
}
```

### TileQueue 方法

```typescript
// 添加瓦片到队列
add(tileCoord: ITileCoord): void

// 取消瓦片请求
cancelTile(tileId: string): void

// 取消所有请求
cancelAll(): void

// 清空队列
clear(): void

// 设置配置
setConfig(config: Partial<ITileQueueConfig>): void

// 获取配置
getConfig(): ITileQueueConfig

// 获取统计
getStats(): ITileStats

// 监听事件
on(event: TileQueueEvent, handler: TileQueueEventListener): void
```

### TileQueue 事件

```typescript
type TileQueueEvent =
  | 'tileRequested'    // 瓦片请求
  | 'tileLoaded'       // 瓦片加载
  | 'tileFailed'       // 瓦片失败
  | 'tileCancelled'    // 瓦片取消
  | 'tileRetried';      // 瓦片重试
```

## 最佳实践

### 1. 并发控制

```javascript
// ✅ 根据网络条件调整
const maxConcurrent = navigator.connection?.effectiveType === '4g' ? 8 : 4;

const tileQueue = new TileQueue({
  loadFn: loadTile,
  maxConcurrent: maxConcurrent
});

// ❌ 避免设置过高的并发
// const tileQueue = new TileQueue({ maxConcurrent: 50 });  // 不推荐
```

### 2. 缓存策略

```javascript
// ✅ 根据设备性能调整缓存大小
const maxCacheSize = navigator.deviceMemory > 4 ? 200 : 100;

const tileQueue = new TileQueue({
  loadFn: loadTile,
  maxCacheSize: maxCacheSize,
  enableLRU: true
});

// ✅ 对于移动设备使用更小的缓存
const mobileCacheSize = 50;
```

### 3. 重试策略

```javascript
// ✅ 使用指数退避
const tileQueue = new TileQueue({
  loadFn: loadTile,
  maxRetries: 3,
  retryDelayBase: 1000,   // 1秒
  retryDelayMax: 10000    // 最大 10 秒
});

// 重试间隔: 1s -> 2s -> 4s -> 8s...
```

### 4. 超时设置

```javascript
// ✅ 根据网络速度设置超时
const requestTimeout = navigator.connection?.effectiveType === '4g' ? 30000 : 60000;

const tileQueue = new TileQueue({
  loadFn: loadTile,
  requestTimeout: requestTimeout
});
```

### 5. 错误处理

```javascript
// ✅ 区分不同类型的错误
tileQueue.on('tileFailed', (tile) => {
  if (tile.lastError.name === 'AbortError') {
    console.log('请求超时:', tile.coord);
  } else if (tile.lastError.message.includes('404')) {
    console.log('瓦片不存在:', tile.coord);
  } else if (tile.lastError.message.includes('5xx')) {
    console.log('服务器错误:', tile.coord);
  }
});
```

## 常见问题

### Q: 如何优化瓦片加载性能？

**A**:
1. 使用适当的并发数（4-6）
2. 启用 LRU 缓存
3. 实现瓦片预加载
4. 使用 CDN 加速瓦片服务
5. 根据设备性能调整缓存大小

### Q: 如何处理离线情况？

**A**:
1. 监听网络状态变化
2. 使用 Service Worker 缓存瓦片
3. 提供离线瓦片
4. 显示离线提示

### Q: 如何减少内存使用？

**A**:
1. 限制缓存大小
2. 使用 LRU 策略清理旧瓦片
3. 及时释放不需要的瓦片
4. 使用 ImageBitmap 替代 Image 对象

### Q: 如何实现瓦片预加载？

**A**:
```javascript
function preloadTiles(zoom, bounds) {
  const tiles = getTilesForBounds(bounds, zoom);
  
  tiles.forEach(tile => {
    tileQueue.add(tile.coord);
  });
}

// 在用户移动到新区域前预加载
preloader.on('userMove', (newBounds) => {
  const tiles = getTilesForBounds(newBounds, currentZoom);
  tiles.forEach(tile => tileQueue.add(tile.coord));
});
```

## 扩展开发

### 自定义瓦片加载器

```javascript
class CustomTileLoader {
  constructor(options) {
    this.options = options;
  }

  async load(tile) {
    // 自定义加载逻辑
    const url = this.buildTileUrl(tile);
    const data = await this.fetchTile(url);
    return this.parseTileData(data);
  }

  buildTileUrl(tile) {
    return this.options.urlTemplate
      .replace('{z}', tile.z)
      .replace('{x}', tile.x)
      .replace('{y}', tile.y);
  }

  async fetchTile(url) {
    const response = await fetch(url);
    return response.arrayBuffer();
  }

  parseTileData(data) {
    // 解析瓦片数据
    return data;
  }
}

const loader = new CustomTileLoader({
  urlTemplate: 'https://custom-server.com/tiles/{z}/{x}/{y}.png'
});

const tileQueue = new TileQueue({
  loadFn: (tile) => loader.load(tile)
});
```

### 自定义缓存策略

```javascript
class CustomCacheStrategy {
  constructor(maxSize) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key) {
    const entry = this.cache.get(key);
    if (entry) {
      entry.accessed = Date.now();
      return entry.value;
    }
    return null;
  }

  set(key, value) {
    if (this.cache.size >= this.maxSize) {
      this.evict();
    }
    this.cache.set(key, {
      value,
      created: Date.now(),
      accessed: Date.now()
    });
  }

  evict() {
    // 自定义淘汰策略
    const entries = Array.from(this.cache.entries());
    const oldest = entries.sort((a, b) => a[1].accessed - b[1].accessed)[0];
    this.cache.delete(oldest[0]);
  }
}
```

## 相关资源

- [TileQueue API](../../API.md#瓦片管理)
- [TileRequestManager API](../../API.md#瓦片管理)
- [TileStats API](../../API.md#瓦片管理)
- [瓦片类型定义](../../src/tiles/types.ts)

## 浏览器兼容性

- Chrome 56+
- Firefox 51+
- Safari 11+
- Edge 79+

---

**版本**: 1.0.0  
**最后更新**: 2025-02-18
