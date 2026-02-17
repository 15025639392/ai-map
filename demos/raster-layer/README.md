# 栅格图层 - 高德卫星瓦片

这个 demo 展示了如何使用 `RasterLayer` 类加载和渲染高德地图卫星瓦片。

## 功能特性

- **高德卫星瓦片加载**: 使用高德地图卫星瓦片服务加载遥感影像
- **动态缩放**: 支持从缩放级别 1 到 18 的动态缩放
- **瓦片缓存**: 自动管理瓦片加载、缓存和清理
- **WebGL2 渲染**: 使用 WebGL2 进行高性能的瓦片渲染
- **实时统计**: 显示瓦片加载状态和性能统计

## 技术实现

### RasterLayer 类

`RasterLayer` 是一个继承自 `Layer` 的栅格图层类，用于渲染地图瓦片。

#### 主要特性

- **瓦片管理**: 自动管理瓦片的加载、缓存和清理
- **纹理渲染**: 使用 WebGL2 纹理进行瓦片渲染
- **缩放控制**: 支持动态调整缩放级别
- **跨域支持**: 支持 CORS 跨域瓦片加载

#### 使用方法

```javascript
import { Renderer, RasterLayer } from './lib/index.js';

// 创建渲染器
const renderer = new Renderer({
    targetFPS: 60,
    enableProfiling: true
});

// 创建栅格图层
const rasterLayer = new RasterLayer({
    name: '高德卫星图',
    tileUrl: 'https://webst01.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}',
    minZoom: 1,
    maxZoom: 18,
    zoom: 10,
    tileSize: 256,
    crossOrigin: 'anonymous'
});

// 添加到渲染器
rasterLayer.add(renderer);

// 启动渲染
renderer.start();
```

### 瓦片 URL 模板

瓦片 URL 使用 `{x}`, `{y}`, `{z}` 占位符：

- `{x}`: 瓦片的列索引
- `{y}`: 瓦片的行索引
- `{z}`: 缩放级别

#### 高德地图瓦片服务

高德地图提供多种瓦片服务：

1. **卫星图** (style=6)
   ```
   https://webst01.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}
   ```

2. **街道地图** (style=7)
   ```
   https://webrd01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=7&x={x}&y={y}&z={z}
   ```

3. **矢量地图** (style=8)
   ```
   https://webrd01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}
   ```

## API 参考

### IRasterLayerOptions

栅格图层配置选项：

```typescript
interface IRasterLayerOptions extends ILayerOptions {
    /** 瓦片URL模板，支持 {x}, {y}, {z} 占位符 */
    tileUrl: string;
    /** 最小缩放级别 */
    minZoom?: number;
    /** 最大缩放级别 */
    maxZoom?: number;
    /** 当前缩放级别 */
    zoom?: number;
    /** 瓦片大小（像素） */
    tileSize?: number;
    /** 是否允许跨域加载 */
    crossOrigin?: string;
}
```

### RasterLayer 方法

#### setZoom(zoom: number)
设置缩放级别。

```javascript
rasterLayer.setZoom(12);
```

#### getZoom(): number
获取当前缩放级别。

```javascript
const zoom = rasterLayer.getZoom();
```

#### getMinZoom(): number
获取最小缩放级别。

#### getMaxZoom(): number
获取最大缩放级别。

#### setTileUrl(tileUrl: string)
设置瓦片 URL。

```javascript
rasterLayer.setTileUrl('https://example.com/tiles/{z}/{x}/{y}.png');
```

#### getStats()
获取瓦片统计信息。

```javascript
const stats = rasterLayer.getStats();
// {
//   totalTiles: 16,
//   loadedTiles: 12,
//   loadingTiles: 2,
//   errorTiles: 0,
//   currentZoom: 10,
//   minZoom: 1,
//   maxZoom: 18
// }
```

## 使用说明

1. **缩放控制**
   - 使用工具栏的"放大"和"缩小"按钮
   - 或使用侧边栏的滑块控制缩放级别
   - 点击"重置"按钮恢复默认缩放

2. **刷新瓦片**
   - 点击"刷新瓦片"按钮重新加载当前缩放级别的瓦片

3. **查看统计**
   - 侧边栏显示瓦片加载统计
   - 包括总瓦片数、已加载、加载中和错误的瓦片数

## 性能优化

### 瓦片缓存
- `RasterLayer` 会自动缓存已加载的瓦片
- 缩放时会重用已加载的瓦片

### 内存管理
- 超出缩放范围的瓦片会被自动清理
- 使用 `dispose()` 方法释放所有资源

## 注意事项

1. **跨域问题**
   - 确保瓦片服务器支持 CORS
   - 使用 `crossOrigin: 'anonymous'` 启用跨域加载

2. **性能考虑**
   - 过多同时加载的瓦片可能影响性能
   - 根据视口大小合理设置瓦片数量

3. **网络延迟**
   - 瓦片加载速度取决于网络状况
   - 考虑实现瓦片预加载以提升用户体验

## 扩展功能

### 添加其他瓦片源

可以轻松添加其他瓦片源：

```javascript
// OpenStreetMap
const osmLayer = new RasterLayer({
    name: 'OSM',
    tileUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    minZoom: 0,
    maxZoom: 19,
    zoom: 10
});

// Mapbox
const mapboxLayer = new RasterLayer({
    name: 'Mapbox',
    tileUrl: 'https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/{z}/{x}/{y}?access_token=YOUR_TOKEN',
    minZoom: 0,
    maxZoom: 22,
    zoom: 10
});
```

## 浏览器兼容性

- Chrome 56+
- Firefox 51+
- Safari 11+
- Edge 79+

需要支持 WebGL2 的现代浏览器。

## 相关文档

- [Layer 基类](../renderer/Layer.md)
- [VectorLayer](../vectors/VectorLayer.md)
- [WebGL2 渲染](../../src/webgl/)

## 许可证

高德地图瓦片服务使用请参考 [高德开放平台](https://lbs.amap.com/) 的使用条款。
