# API 使用示例

本文档提供了 OpenGlobus Engine API 的详细使用示例。

## 目录

- [基础渲染](#基础渲染)
- [图层管理](#图层管理)
- [矢量图层](#矢量图层)
- [栅格图层](#栅格图层)
- [控件系统](#控件系统)
- [编辑功能](#编辑功能)
- [瓦片管理](#瓦片管理)
- [事件系统](#事件系统)
- [性能监控](#性能监控)

---

## 基础渲染

### 创建渲染器

```javascript
import { Renderer } from './lib/index.js';

// 创建基础渲染器
const renderer = new Renderer({
  targetFPS: 60,
  enableProfiling: true
});

// 附加到画布
const canvas = document.getElementById('canvas');
renderer.attachTo(canvas);

// 启动渲染
renderer.start();

// 获取统计信息
setInterval(() => {
  const stats = renderer.getStats();
  console.log(`FPS: ${stats.fps}, Frame Time: ${stats.frameTime}ms`);
}, 1000);
```

### 调整画布大小

```javascript
function handleResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  canvas.width = width;
  canvas.height = height;

  renderer.resize(width, height);
}

window.addEventListener('resize', handleResize);
```

### 销毁渲染器

```javascript
// 停止渲染
renderer.stop();

// 释放所有资源
renderer.dispose();
```

---

## 图层管理

### 创建自定义图层

```javascript
import { Layer } from './lib/index.js';

class MyCustomLayer extends Layer {
  constructor(options) {
    super({
      ...options,
      name: options.name || 'Custom Layer'
    });

    // 初始化自定义数据
    this.data = options.data || [];
  }

  render(renderer) {
    const gl = renderer.gl;

    // 自定义渲染逻辑
    gl.clearColor(0.5, 0.5, 0.5, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // 绘制自定义内容
    this.data.forEach(item => {
      this.renderItem(gl, item);
    });
  }

  renderItem(gl, item) {
    // 实现具体的渲染逻辑
  }
}

// 创建图层
const customLayer = new MyCustomLayer({
  name: 'My Layer',
  priority: 10,
  visible: true,
  data: [/* 你的数据 */]
});

// 添加到渲染器
customLayer.add(renderer);
```

### 使用生命周期钩子

```javascript
const layer = new Layer({
  name: 'Hook Layer',
  hooks: {
    onAdd: () => {
      console.log('图层已添加');
      // 初始化资源
      this.initResources();
    },
    onRemove: () => {
      console.log('图层已移除');
      // 清理资源
      this.cleanup();
    },
    onShow: () => {
      console.log('图层已显示');
      // 恢复动画
      this.startAnimation();
    },
    onHide: () => {
      console.log('图层已隐藏');
      // 暂停动画
      this.stopAnimation();
    }
  }
});
```

### 图层优先级

```javascript
// 创建多个图层
const baseLayer = new Layer({ name: 'Base', priority: 10 });
const overlayLayer = new Layer({ name: 'Overlay', priority: 20 });

// 添加到渲染器（会按优先级排序）
baseLayer.add(renderer);
overlayLayer.add(renderer);

// 修改优先级（会重新排序）
overlayLayer.setPriority(5);  // 现在会在 baseLayer 之后渲染
```

### 切换图层可见性

```javascript
const layer = new Layer({ name: 'Toggle Layer' });
layer.add(renderer);

// 显示图层
layer.show();

// 隐藏图层
layer.hide();

// 切换可见性
layer.toggle();

// 检查状态
if (layer.isVisible()) {
  console.log('图层可见');
}
```

---

## 矢量图层

### 加载 GeoJSON 数据

```javascript
import { VectorLayer } from './lib/index.js';

// 从文件加载
fetch('data.geojson')
  .then(res => res.json())
  .then(geojson => {
    const vectorLayer = new VectorLayer({
      name: 'GeoJSON Layer',
      dataSourceType: 'geojson',
      geojsonData: geojson,
      style: {
        fillColor: '#4CAF50',
        fillOpacity: 0.6,
        strokeColor: '#2E7D32',
        strokeWidth: 2,
        pointRadius: 8,
        pointColor: '#FF5722'
      }
    });

    vectorLayer.add(renderer);
  });
```

### 动态加载要素

```javascript
const vectorLayer = new VectorLayer({
  name: 'Dynamic Layer',
  dataSourceType: 'geojson'
});

vectorLayer.add(renderer);

// 动态添加要素
function addFeature(coordinates, properties) {
  const geojson = {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: coordinates
    },
    properties: properties
  };

  vectorLayer.loadGeoJSON(geojson);
}

// 添加一个点
addFeature([116.397428, 39.90923], { name: '北京' });
```

### 样式控制

```javascript
const vectorLayer = new VectorLayer({
  name: 'Styled Layer',
  dataSourceType: 'geojson'
});

// 设置样式
vectorLayer.setStyle({
  fillColor: '#FF5722',
  fillOpacity: 0.7,
  strokeColor: '#BF360C',
  strokeWidth: 3,
  pointRadius: 10,
  pointColor: '#FF9800'
});

// 根据缩放级别调整样式
renderer.pipeline.on('zoom', (zoom) => {
  const radius = Math.max(5, Math.min(20, zoom));
  vectorLayer.setStyle({
    pointRadius: radius,
    strokeWidth: Math.max(1, zoom / 3)
  });
});
```

### 要素拾取

```javascript
const vectorLayer = new VectorLayer({
  name: 'Interactive Layer',
  dataSourceType: 'geojson',
  geojsonData: geojson
});

vectorLayer.add(renderer);

// 点击事件处理
canvas.addEventListener('click', (event) => {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  // 拾取要素
  const results = vectorLayer.pick([x, y]);

  if (results.length > 0) {
    const closest = results[0];
    console.log('选中要素:', closest.feature);
    console.log('距离:', closest.distance);

    // 显示要素信息
    showFeatureInfo(closest.feature);
  }
});
```

### 加载 MVT 瓦片

```javascript
const vectorLayer = new VectorLayer({
  name: 'MVT Layer',
  dataSourceType: 'mvt',
  mvtLayerName: 'buildings'
});

vectorLayer.add(renderer);

// 加载 MVT 瓦片
async function loadMVTTile(x, y, z) {
  const url = `https://tiles.example.com/${z}/${x}/${y}.pbf`;

  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();

  const mvtData = {
    layers: [{
      name: 'buildings',
      features: parseMVT(arrayBuffer) // 使用 MVT 解析器
    }]
  };

  vectorLayer.loadMVT(mvtData, 'buildings');
}

// 根据视口加载瓦片
loadMVTTilesForViewport();
```

### 获取渲染统计

```javascript
const stats = vectorLayer.getStats();

console.log(`渲染的要素: ${stats.featuresRendered}`);
console.log(`渲染的点: ${stats.pointsRendered}`);
console.log(`渲染的线: ${stats.linesRendered}`);
console.log(`渲染的面: ${stats.polygonsRendered}`);
```

---

## 栅格图层

### 使用高德卫星瓦片

```javascript
import { RasterLayer } from './lib/index.js';

const rasterLayer = new RasterLayer({
  name: '高德卫星图',
  tileUrl: 'https://webst01.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}',
  minZoom: 1,
  maxZoom: 18,
  zoom: 10,
  tileSize: 256,
  crossOrigin: 'anonymous'
});

rasterLayer.add(renderer);
```

### 使用 OpenStreetMap 瓦片

```javascript
const osmLayer = new RasterLayer({
  name: 'OpenStreetMap',
  tileUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  minZoom: 0,
  maxZoom: 19,
  zoom: 10
});

osmLayer.add(renderer);
```

### 动态缩放

```javascript
const rasterLayer = new RasterLayer({
  name: 'Dynamic Zoom Layer',
  tileUrl: 'https://example.com/tiles/{z}/{x}/{y}.png',
  zoom: 10
});

rasterLayer.add(renderer);

// 放大
function zoomIn() {
  const currentZoom = rasterLayer.getZoom();
  if (currentZoom < rasterLayer.getMaxZoom()) {
    rasterLayer.setZoom(currentZoom + 1);
  }
}

// 缩小
function zoomOut() {
  const currentZoom = rasterLayer.getZoom();
  if (currentZoom > rasterLayer.getMinZoom()) {
    rasterLayer.setZoom(currentZoom - 1);
  }
}

// 设置特定缩放级别
function setZoom(level) {
  rasterLayer.setZoom(level);
}
```

### 多个瓦片源切换

```javascript
const tileSources = {
  satellite: 'https://webst01.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}',
  street: 'https://webrd01.is.autonavi.com/appmaptile?style=7&x={x}&y={y}&z={z}',
  vector: 'https://webrd01.is.autonavi.com/appmaptile?style=8&x={x}&y={y}&z={z}'
};

let currentSource = 'satellite';

const rasterLayer = new RasterLayer({
  name: 'Multi-source Layer',
  tileUrl: tileSources[currentSource],
  zoom: 10
});

rasterLayer.add(renderer);

// 切换瓦片源
function switchTileSource(source) {
  currentSource = source;
  rasterLayer.setTileUrl(tileSources[source]);
}

// 使用
switchTileSource('street');  // 切换到街道地图
```

### 获取瓦片统计

```javascript
const stats = rasterLayer.getStats();

console.log(`总瓦片数: ${stats.totalTiles}`);
console.log(`已加载: ${stats.loadedTiles}`);
console.log(`加载中: ${stats.loadingTiles}`);
console.log(`错误: ${stats.errorTiles}`);
console.log(`当前缩放: ${stats.currentZoom}`);
```

---

## 控件系统

### 使用导航控件

```javascript
import { NavigationControl, EventBus } from './lib/index.js';

const eventBus = new EventBus();
const navControl = new NavigationControl(eventBus, {
  duration: 300,
  easing: t => t * (2 - t)
});

// 缩放操作
navControl.zoomIn();
navControl.zoomOut();

// 平移操作
navControl.pan('up');
navControl.pan('down');
navControl.pan('left');
navControl.pan('right');

// 飞行到指定位置
navControl.flyTo({
  center: [116.397428, 39.90923],
  zoom: 12,
  rotation: 0,
  tilt: 0
});

// 监听导航变化
eventBus.on('navigation_change', (state) => {
  console.log('导航状态改变:', state);
});
```

### 使用图层管理器

```javascript
import { LayerManager } from './lib/index.js';

const layerManager = new LayerManager();

// 添加图层
layerManager.addLayer(vectorLayer);
layerManager.addLayer(rasterLayer);

// 获取所有图层
const allLayers = layerManager.getAllLayers();
console.log('所有图层:', allLayers);

// 获取特定图层
const layer = layerManager.getLayer('layer-1');

// 移除图层
layerManager.removeLayer('layer-1');

// 调整图层顺序
layerManager.moveLayer('layer-1', 0);  // 移动到顶部
layerManager.moveLayer('layer-1', -1); // 移动到底部

// 切换图层可见性
layerManager.toggleLayer('layer-1');
```

### 使用查询控件

```javascript
import { QueryControl, QueryType } from './lib/index.js';

const queryControl = new QueryControl(eventBus, {
  mode: QueryType.CLICK
});

// 点击查询
canvas.addEventListener('click', (event) => {
  const results = queryControl.query([event.clientX, event.clientY]);

  results.features.forEach(feature => {
    console.log('查询结果:', feature.properties);
  });
});

// 框选查询
function boxQuery(bounds) {
  const results = queryControl.query(bounds, QueryType.BOX);
  console.log('框选结果:', results.features);
}
```

### 使用性能监控

```javascript
import { PerformanceMonitor } from './lib/index.js';

const perfMonitor = new PerformanceMonitor();

// 每帧更新
function update() {
  perfMonitor.update();
  requestAnimationFrame(update);
}

// 获取性能统计
setInterval(() => {
  const stats = perfMonitor.getStats();
  console.log(`FPS: ${stats.fps}`);
  console.log(`帧时间: ${stats.frameTime}ms`);
  console.log(`内存使用: ${stats.memoryUsage}MB`);
}, 1000);

update();
```

---

## 编辑功能

### 使用编辑控制器

```javascript
import { EditController, EditToolType } from './lib/index.js';

const editController = new EditController({
  enabledTools: [
    EditToolType.DRAW_POINT,
    EditToolType.DRAW_LINE,
    EditToolType.DRAW_POLYGON
  ]
});

// 设置绘制工具
editController.setTool(EditToolType.DRAW_POINT);

// 添加绘制点
editController.addDrawPoint([116.397428, 39.90923]);

// 完成绘制
editController.finishDrawing();

// 撤销操作
editController.undo();

// 重做操作
editController.redo();

// 清除所有编辑
editController.clear();
```

### 使用撤销重做管理器

```javascript
import { UndoRedoManager } from './lib/index.js';

const undoRedoManager = new UndoRedoManager({
  maxHistory: 50
});

// 执行命令
const command = {
  execute: async () => {
    // 执行操作
    console.log('执行命令');
  },
  undo: async () => {
    // 撤销操作
    console.log('撤销命令');
  },
  getDescription: () => '添加要素'
};

await undoRedoManager.executeCommand(command);

// 撤销
await undoRedoManager.undo();

// 重做
await undoRedoManager.redo();

// 获取历史
const history = undoRedoManager.getHistory();
console.log('历史记录:', history);

// 清空历史
undoRedoManager.clear();
```

### 编辑事件监听

```javascript
const eventBus = new EventBus();

eventBus.on('edit:tool_change', (tool) => {
  console.log('工具改变:', tool);
});

eventBus.on('edit:state_change', (state) => {
  console.log('状态改变:', state);
});

eventBus.on('edit:feature_add', (feature) => {
  console.log('添加要素:', feature);
});

eventBus.on('edit:feature_modify', (feature) => {
  console.log('修改要素:', feature);
});

eventBus.on('edit:feature_delete', (feature) => {
  console.log('删除要素:', feature);
});
```

---

## 瓦片管理

### 使用瓦片队列

```javascript
import { TileQueue, TileState } from './lib/index.js';

const tileQueue = new TileQueue({
  loadFn: async (tile) => {
    const response = await fetch(tile.url);
    return response.arrayBuffer();
  },
  maxConcurrent: 6,
  maxRetries: 3,
  enablePriority: true,
  enableLRU: true,
  maxCacheSize: 100
});

// 添加瓦片到队列
tileQueue.add({ x: 0, y: 0, z: 10 });

// 监听瓦片事件
tileQueue.on('tileLoaded', (tile) => {
  console.log('瓦片加载完成:', tile.coord);
});

tileQueue.on('tileFailed', (tile) => {
  console.error('瓦片加载失败:', tile.coord, tile.lastError);
});

// 获取统计
const stats = tileQueue.getStats();
console.log('统计:', stats);
```

### 使用瓦片请求管理器

```javascript
import { TileRequestManager } from './lib/index.js';

const requestManager = new TileRequestManager({
  maxConcurrent: 6,
  maxRetries: 3,
  retryDelayBase: 1000,
  retryDelayMax: 10000,
  requestTimeout: 30000
});

// 请求瓦片
async function requestTile(x, y, z) {
  try {
    const data = await requestManager.requestTile(x, y, z);
    console.log('瓦片加载成功:', { x, y, z });
    return data;
  } catch (error) {
    console.error('瓦片加载失败:', error);
    throw error;
  }
}

// 取消请求
requestManager.cancelRequest('tile-10-5-8');

// 取消所有请求
requestManager.cancelAll();
```

---

## 事件系统

### 使用事件总线

```javascript
import { EventBus } from './lib/index.js';

const eventBus = new EventBus();

// 订阅事件
const handler = (event) => {
  console.log('事件触发:', event.type, event.data);
};

eventBus.on('custom:event', handler);

// 触发事件
eventBus.emit('custom:event', { message: 'Hello World' });

// 取消订阅
eventBus.off('custom:event', handler);

// 监听所有事件
eventBus.on('*', (event) => {
  console.log('所有事件:', event);
});
```

### 自定义事件

```javascript
// 定义事件类型
const EventTypes = {
  LAYER_ADDED: 'layer:added',
  LAYER_REMOVED: 'layer:removed',
  FEATURE_SELECTED: 'feature:selected',
  ZOOM_CHANGED: 'zoom:changed'
};

// 订阅事件
eventBus.on(EventTypes.FEATURE_SELECTED, (data) => {
  console.log('要素被选中:', data);
});

// 触发自定义事件
eventBus.emit(EventTypes.FEATURE_SELECTED, {
  id: 'feature-1',
  geometry: { /* ... */ }
});
```

---

## 性能监控

### 基础性能监控

```javascript
import { PerformanceMonitor } from './lib/index.js';

const perfMonitor = new PerformanceMonitor();

// 创建性能面板
const fpsElement = document.getElementById('fps');
const frameTimeElement = document.getElementById('frame-time');
const memoryElement = document.getElementById('memory');

// 每帧更新
function update() {
  perfMonitor.update();

  const stats = perfMonitor.getStats();

  if (fpsElement) fpsElement.textContent = stats.fps.toFixed(1);
  if (frameTimeElement) frameTimeElement.textContent = stats.frameTime.toFixed(2);
  if (memoryElement) memoryElement.textContent = stats.memoryUsage.toFixed(1);

  requestAnimationFrame(update);
}

update();
```

### 性能预警

```javascript
// 设置性能阈值
const PERFORMANCE_THRESHOLDS = {
  MIN_FPS: 30,
  MAX_FRAME_TIME: 33,
  MAX_MEMORY: 512
};

// 监控性能
setInterval(() => {
  const stats = perfMonitor.getStats();

  if (stats.fps < PERFORMANCE_THRESHOLDS.MIN_FPS) {
    console.warn('FPS 过低:', stats.fps);
  }

  if (stats.frameTime > PERFORMANCE_THRESHOLDS.MAX_FRAME_TIME) {
    console.warn('帧时间过长:', stats.frameTime);
  }

  if (stats.memoryUsage > PERFORMANCE_THRESHOLDS.MAX_MEMORY) {
    console.warn('内存使用过高:', stats.memoryUsage);
  }
}, 1000);
```

---

## 完整示例

### 综合应用示例

```javascript
import {
  Renderer,
  VectorLayer,
  RasterLayer,
  LayerManager,
  NavigationControl,
  PerformanceMonitor,
  EventBus
} from './lib/index.js';

// 初始化渲染器
const renderer = new Renderer({
  targetFPS: 60,
  enableProfiling: true
});

const canvas = document.getElementById('canvas');
renderer.attachTo(canvas);
renderer.start();

// 创建事件总线
const eventBus = new EventBus();

// 创建图层管理器
const layerManager = new LayerManager();

// 添加栅格图层
const rasterLayer = new RasterLayer({
  name: '卫星图',
  tileUrl: 'https://webst01.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}',
  zoom: 10
});
rasterLayer.add(renderer);
layerManager.addLayer(rasterLayer);

// 添加矢量图层
const vectorLayer = new VectorLayer({
  name: '矢量数据',
  dataSourceType: 'geojson',
  style: {
    fillColor: '#4CAF50',
    strokeColor: '#2E7D32',
    strokeWidth: 2
  }
});
vectorLayer.add(renderer);
layerManager.addLayer(vectorLayer);

// 创建导航控件
const navControl = new NavigationControl(eventBus);

// 创建性能监控
const perfMonitor = new PerformanceMonitor();

// 监听事件
eventBus.on('navigation_change', (state) => {
  console.log('导航变化:', state);
  rasterLayer.setZoom(state.zoom);
});

eventBus.on('layer:added', (layer) => {
  console.log('图层添加:', layer.name);
});

// 更新性能显示
setInterval(() => {
  const stats = perfMonitor.getStats();
  updatePerformanceDisplay(stats);
}, 100);

// 清理资源
window.addEventListener('beforeunload', () => {
  renderer.stop();
  renderer.dispose();
});
```

---

## 最佳实践

### 1. 资源管理

```javascript
// ✅ 使用图层管理器
layerManager.addLayer(layer);

// ❌ 不要直接操作渲染管线
// renderer.pipeline.addNode(layer);
```

### 2. 事件处理

```javascript
// ✅ 使用事件总线
eventBus.on('event', handler);

// ❌ 避免直接 DOM 操作
// document.addEventListener('click', ...);
```

### 3. 性能优化

```javascript
// ✅ 批量添加图层
layers.forEach(layer => layerManager.addLayer(layer));

// ✅ 使用请求AnimationFrame
function animate() {
  update();
  requestAnimationFrame(animate);
}
```

### 4. 错误处理

```javascript
// ✅ 捕获错误
try {
  layer.add(renderer);
} catch (error) {
  console.error('添加图层失败:', error);
  // 错误恢复逻辑
}
```

---

**相关文档**:
- [API 参考](API.md)
- [Demo 示例](demos/README.md)
- [故障排除](TROUBLESHOOTING.md)
