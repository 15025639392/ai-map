# OpenGlobus Engine 快速参考

## 核心类

### Renderer
```javascript
new Renderer({ targetFPS: 60 })
  .attachTo(canvas)
  .start();

renderer.stop();
renderer.dispose();
renderer.getStats();
```

### Layer
```javascript
new Layer({ name: 'Layer', priority: 10 })
  .add(renderer);

layer.show();
layer.hide();
layer.toggle();
layer.dispose();
```

### VectorLayer
```javascript
new VectorLayer({
  name: 'Vector Layer',
  geojsonData: geojson,
  style: { fillColor: '#ff0000' }
}).add(renderer);

vectorLayer.loadGeoJSON(geojson);
vectorLayer.setStyle(style);
vectorLayer.pick([x, y]);
```

### RasterLayer
```javascript
new RasterLayer({
  name: 'Raster Layer',
  tileUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  zoom: 10
}).add(renderer);

rasterLayer.setZoom(12);
rasterLayer.getStats();
```

## 控件

### EventBus
```javascript
const bus = new EventBus();
bus.on('event', handler);
bus.emit('event', data);
bus.off('event', handler);
```

### LayerManager
```javascript
const manager = new LayerManager();
manager.addLayer(layer);
manager.removeLayer(id);
manager.getLayer(id);
```

### NavigationControl
```javascript
const nav = new NavigationControl(bus);
nav.zoomIn();
nav.zoomOut();
nav.pan('up');
```

### PerformanceMonitor
```javascript
const monitor = new PerformanceMonitor();
monitor.update();
const stats = monitor.getStats();
```

## 类型

### GeometryType
```javascript
enum GeometryType {
  POINT = 'point',
  LINE = 'line',
  POLYGON = 'polygon',
  MULTI_POINT = 'multi_point',
  MULTI_LINE = 'multi_line',
  MULTI_POLYGON = 'multi_polygon',
}
```

### LayerState
```javascript
enum LayerState {
  INITIALIZED = 'initialized',
  ADDED = 'added',
  SHOWN = 'shown',
  HIDDEN = 'hidden',
  REMOVED = 'removed',
  DISPOSED = 'disposed',
}
```

## 常用 URL 模板

### 高德地图
```javascript
// 卫星图
'https://webst01.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}'

// 街道地图
'https://webrd01.is.autonavi.com/appmaptile?style=7&x={x}&y={y}&z={z}'

// 矢量地图
'https://webrd01.is.autonavi.com/appmaptile?style=8&x={x}&y={y}&z={z}'
```

### OpenStreetMap
```javascript
'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
```

## 样式配置

### 矢量样式
```javascript
{
  fillColor: '#ff0000',
  fillOpacity: 0.5,
  strokeColor: '#000000',
  strokeWidth: 2,
  strokeOpacity: 1.0,
  pointRadius: 10,
  pointColor: '#00ff00',
  pointOpacity: 1.0
}
```

## 常用操作

### 添加图层
```javascript
const layer = new Layer({ name: 'Layer' });
layer.add(renderer);
```

### 移除图层
```javascript
layer.remove();
// 或
layer.dispose();
```

### 切换可见性
```javascript
layer.show();   // 显示
layer.hide();   // 隐藏
layer.toggle(); // 切换
```

### 查询要素
```javascript
const results = vectorLayer.pick([x, y]);
results.forEach(r => console.log(r.feature));
```

### 缩放控制
```javascript
rasterLayer.setZoom(12);
const zoom = rasterLayer.getZoom();
```

## 事件类型

### 控件事件
```javascript
'navigation_change'  // 导航改变
'query_result'      // 查询结果
'layer_change'      // 图层变更
```

### 编辑事件
```javascript
'tool_change'       // 工具改变
'state_change'      // 状态改变
'feature_add'       // 要素添加
'feature_modify'    // 要素修改
'feature_delete'    // 要素删除
```

### 瓦片事件
```javascript
'tileRequested'     // 瓦片请求
'tileLoaded'        // 瓦片加载
'tileFailed'        // 瓦片失败
'tileCancelled'     // 瓦片取消
'tileRetried'       // 瓦片重试
```

## 快速开始

```javascript
import { Renderer, VectorLayer, RasterLayer } from './lib/index.js';

// 1. 创建渲染器
const renderer = new Renderer({ targetFPS: 60 });
renderer.attachTo(canvas);
renderer.start();

// 2. 添加栅格图层
new RasterLayer({
  tileUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  zoom: 10
}).add(renderer);

// 3. 添加矢量图层
new VectorLayer({
  geojsonData: { type: 'FeatureCollection', features: [] }
}).add(renderer);

// 完成！
```

## 调试技巧

### 检查 WebGL2 支持
```javascript
if (!canvas.getContext('webgl2')) {
  alert('浏览器不支持 WebGL2');
}
```

### 获取统计信息
```javascript
console.log(renderer.getStats());
console.log(vectorLayer.getStats());
console.log(rasterLayer.getStats());
```

### 监控性能
```javascript
const monitor = new PerformanceMonitor();
setInterval(() => {
  console.log(monitor.getStats());
}, 1000);
```

## 常见问题

### Q: 图层不显示？
A: 检查 `visible` 属性和 `priority` 设置

### Q: 瓦片加载失败？
A: 检查 `crossOrigin` 设置和 URL 模板

### Q: 性能问题？
A: 减少图层数量，启用性能监控，检查内存泄漏

## 相关文档

- [API 参考](API.md) - 完整的 API 文档
- [API 示例](API-EXAMPLES.md) - 详细的使用示例
- [Demo](demos/README.md) - 实际运行示例
- [故障排除](TROUBLESHOOTING.md) - 问题排查指南

---

**版本**: 1.0.0  
**最后更新**: 2025-02-18
