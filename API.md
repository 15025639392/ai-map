# OpenGlobus Engine API 参考文档

## 目录

- [核心渲染器](#核心渲染器)
- [图层系统](#图层系统)
- [渲染管线](#渲染管线)
- [资源管理](#资源管理)
- [控件系统](#控件系统)
- [矢量渲染](#矢量渲染)
- [栅格图层](#栅格图层)
- [类型定义](#类型定义)
- [WebGL2 处理器](#webgl2-处理器)
- [编辑功能](#编辑功能)

---

## 核心渲染器

### Renderer

WebGL2 渲染引擎的核心类，负责管理渲染循环、资源和状态。

#### 构造函数

```typescript
constructor(config?: IRendererConfig)
```

**参数**：
- `config` - 渲染器配置选项

```typescript
interface IRendererConfig {
  targetFPS?: number;        // 目标帧率（默认 60fps）
  enableFBO?: boolean;      // 是否启用帧缓冲对象
  enableProfiling?: boolean; // 是否启用性能监控
}
```

#### 属性

| 属性 | 类型 | 描述 |
|------|------|------|
| `gl` | `WebGL2RenderingContext` | WebGL2 上下文 |
| `resourceManager` | `ResourceManager` | 资源管理器 |
| `pipeline` | `RenderPipeline` | 渲染管线 |
| `canvas` | `HTMLCanvasElement \| null` | 关联的画布 |

#### 方法

##### attachTo(canvas: HTMLCanvasElement): void

将渲染器附加到画布元素。

```javascript
const renderer = new Renderer();
renderer.attachTo(document.getElementById('canvas'));
```

##### resize(width: number, height: number): void

调整渲染器尺寸。

```javascript
renderer.resize(window.innerWidth, window.innerHeight);
```

##### start(): void

启动渲染循环。

```javascript
renderer.start();
```

##### stop(): void

停止渲染循环。

```javascript
renderer.stop();
```

##### dispose(): void

销毁渲染器，释放所有资源。

```javascript
renderer.dispose();
```

##### getStats(): IRenderStats

获取渲染统计信息。

```javascript
const stats = renderer.getStats();
console.log(`FPS: ${stats.fps}`);
console.log(`帧时间: ${stats.frameTime}ms`);
```

---

## 图层系统

### Layer

所有图层的基类，提供图层生命周期管理。

#### 构造函数

```typescript
constructor(options?: ILayerOptions)
```

**参数**：
```typescript
interface ILayerOptions {
  id?: string;               // 图层 ID（可选，自动生成）
  priority?: number;         // 渲染优先级（值越大越先渲染）
  visible?: boolean;         // 初始可见性
  name?: string;            // 图层名称
  hooks?: ILifecycleHooks;   // 生命周期钩子
}
```

#### 属性

| 属性 | 类型 | 只读 | 描述 |
|------|------|------|------|
| `id` | `string` | ✓ | 图层唯一标识 |
| `priority` | `number` | ✗ | 渲染优先级 |
| `visible` | `boolean` | ✗ | 是否可见 |
| `name` | `string` | ✓ | 图层名称 |
| `state` | `LayerState` | ✓ | 图层状态 |
| `renderer` | `IRenderer \| null` | ✓ | 关联的渲染器 |

#### 方法

##### add(renderer: IRenderer): void

将图层添加到渲染器。

```javascript
layer.add(renderer);
```

##### remove(): void

从渲染器移除图层。

```javascript
layer.remove();
```

##### show(): void

显示图层。

```javascript
layer.show();
```

##### hide(): void

隐藏图层。

```javascript
layer.hide();
```

##### toggle(): void

切换图层可见性。

```javascript
layer.toggle();
```

##### setPriority(priority: number): void

设置渲染优先级。

```javascript
layer.setPriority(100);
```

##### isAdded(): boolean

检查图层是否已添加到渲染器。

```javascript
if (layer.isAdded()) {
  console.log('图层已添加');
}
```

##### isVisible(): boolean

检查图层是否可见。

```javascript
if (layer.isVisible()) {
  console.log('图层可见');
}
```

##### dispose(): void

销毁图层，释放所有资源。

```javascript
layer.dispose();
```

---

## 渲染管线

### RenderPipeline

管理渲染节点的添加、移除和渲染顺序。

#### 属性

| 属性 | 类型 | 描述 |
|------|------|------|
| `phase` | `RenderPhase` | 当前渲染阶段 |

#### 方法

##### addNode(node: IRenderNode): void

添加渲染节点到管线。

```javascript
pipeline.addNode(layer);
```

##### removeNode(nodeId: string): void

从管线移除渲染节点。

```javascript
pipeline.removeNode('layer-1');
```

##### updateNode(nodeId: string, updateFn: () => void): void

更新渲染节点。

```javascript
pipeline.updateNode('layer-1', () => {
  // 更新逻辑
});
```

---

## 资源管理

### ResourceManager

WebGL2 资源的生命周期管理器。

#### 方法

##### registerResource(id: string, type: ResourceType, resource: WebGLResource, disposeFn: () => void): void

注册 WebGL 资源。

```javascript
resourceManager.registerResource(
  'texture-1',
  'texture',
  texture,
  () => gl.deleteTexture(texture)
);
```

##### addRef(id: string): void

增加资源引用计数。

```javascript
resourceManager.addRef('texture-1');
```

##### releaseRef(id: string): void

减少资源引用计数。

```javascript
resourceManager.releaseRef('texture-1');
```

##### disposeResource(id: string): void

直接释放资源。

```javascript
resourceManager.disposeResource('texture-1');
```

---

## 控件系统

### EventBus

事件总线，用于组件间通信。

#### 方法

##### on(event: string, handler: Function): void

订阅事件。

```javascript
eventBus.on('layer:added', (layer) => {
  console.log('图层已添加:', layer.name);
});
```

##### off(event: string, handler: Function): void

取消订阅事件。

```javascript
eventBus.off('layer:added', handler);
```

##### emit(event: string, data?: any): void

触发事件。

```javascript
eventBus.emit('layer:added', layer);
```

### PerformanceMonitor

性能监控器，跟踪渲染性能。

#### 方法

##### update(): void

更新性能统计。

```javascript
performanceMonitor.update();
```

##### getStats(): IPerformanceStats

获取性能统计。

```javascript
const stats = performanceMonitor.getStats();
console.log(`FPS: ${stats.fps}`);
```

### NavigationControl

导航控件，提供地图导航功能。

#### 方法

##### zoomIn(): void

放大。

```javascript
navigationControl.zoomIn();
```

##### zoomOut(): void

缩小。

```javascript
navigationControl.zoomOut();
```

##### pan(direction: 'up' | 'down' | 'left' | 'right'): void

平移地图。

```javascript
navigationControl.pan('up');
```

### LayerManager

图层管理器，管理多个图层的生命周期。

#### 方法

##### addLayer(layer: Layer): void

添加图层。

```javascript
layerManager.addLayer(myLayer);
```

##### removeLayer(layerId: string): void

移除图层。

```javascript
layerManager.removeLayer('layer-1');
```

##### getLayer(layerId: string): Layer | undefined

获取图层。

```javascript
const layer = layerManager.getLayer('layer-1');
```

##### getAllLayers(): Layer[]

获取所有图层。

```javascript
const layers = layerManager.getAllLayers();
```

---

## 矢量渲染

### VectorLayer

矢量数据图层，用于渲染 GeoJSON 和 MVT 数据。

#### 构造函数

```typescript
constructor(options?: IVectorLayerOptions)
```

**参数**：
```typescript
interface IVectorLayerOptions extends ILayerOptions {
  dataSourceType?: 'geojson' | 'mvt';
  geojsonData?: GeoJSONData;
  mvtData?: MVTData;
  mvtLayerName?: string;
  style?: IVectorStyle;
  pickingConfig?: {
    pointRadius?: number;
    lineRadius?: number;
    polygonRadius?: number;
  };
  zoom?: number;
}
```

#### 方法

##### loadGeoJSON(geojson: GeoJSONData): void

加载 GeoJSON 数据。

```javascript
vectorLayer.loadGeoJSON({
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [116.397428, 39.90923]
      },
      properties: { name: '北京' }
    }
  ]
});
```

##### loadMVT(mvtData: MVTData, layerName?: string): void

加载 MVT 数据。

```javascript
vectorLayer.loadMVT(mvtData, 'buildings');
```

##### setStyle(style: IVectorStyle): void

设置渲染样式。

```javascript
vectorLayer.setStyle({
  fillColor: '#ff0000',
  fillOpacity: 0.5,
  strokeColor: '#000000',
  strokeWidth: 2,
  pointRadius: 10,
  pointColor: '#00ff00'
});
```

##### setZoom(zoom: number): void

设置缩放级别。

```javascript
vectorLayer.setZoom(12);
```

##### pick(screenPosition: Coordinate, projection?: Function): IPickResult[]

拾取要素。

```javascript
const results = vectorLayer.pick([100, 200]);
results.forEach(result => {
  console.log('选中要素:', result.feature);
  console.log('距离:', result.distance);
});
```

##### getStats(): IRenderStats

获取渲染统计。

```javascript
const stats = vectorLayer.getStats();
console.log(`渲染的要素: ${stats.featuresRendered}`);
```

---

## 栅格图层

### RasterLayer

栅格瓦片图层，用于渲染地图瓦片。

#### 构造函数

```typescript
constructor(options: IRasterLayerOptions)
```

**参数**：
```typescript
interface IRasterLayerOptions extends ILayerOptions {
  tileUrl: string;           // 瓦片 URL 模板
  minZoom?: number;          // 最小缩放级别
  maxZoom?: number;          // 最大缩放级别
  zoom?: number;            // 当前缩放级别
  tileSize?: number;        // 瓦片大小（像素）
  crossOrigin?: string;      // 跨域模式
}
```

#### 方法

##### setZoom(zoom: number): void

设置缩放级别。

```javascript
rasterLayer.setZoom(10);
```

##### getZoom(): number

获取当前缩放级别。

```javascript
const zoom = rasterLayer.getZoom();
```

##### setTileUrl(tileUrl: string): void

设置瓦片 URL。

```javascript
rasterLayer.setTileUrl('https://tile.openstreetmap.org/{z}/{x}/{y}.png');
```

##### getStats(): ITileStats

获取瓦片统计。

```javascript
const stats = rasterLayer.getStats();
console.log(`总瓦片: ${stats.totalTiles}`);
console.log(`已加载: ${stats.loadedTiles}`);
```

---

## 类型定义

### 基础类型

#### Coordinate

坐标类型。

```typescript
type Coordinate = [number, number];
```

#### GeometryType

几何类型枚举。

```typescript
enum GeometryType {
  POINT = 'point',
  LINE = 'line',
  POLYGON = 'polygon',
  MULTI_POINT = 'multi_point',
  MULTI_LINE = 'multi_line',
  MULTI_POLYGON = 'multi_polygon',
}
```

#### LayerState

图层状态枚举。

```typescript
enum LayerState {
  INITIALIZED = 'initialized',
  ADDED = 'added',
  SHOWN = 'shown',
  HIDDEN = 'hidden',
  REMOVED = 'removed',
  DISPOSED = 'disposed',
}
```

#### RenderPhase

渲染阶段枚举。

```typescript
enum RenderPhase {
  OPAQUE = 'opaque',
  TRANSPARENT = 'transparent',
  OVERLAY = 'overlay',
}
```

### 数据类型

#### IGeometry

几何数据接口。

```typescript
interface IGeometry {
  type: GeometryType;
  coordinates: GeometryCoordinates;
}
```

#### IFeature

要素接口。

```typescript
interface IFeature {
  id?: string | number;
  geometry: IGeometry;
  properties?: IFeatureProperties;
}
```

#### IVectorStyle

矢量样式接口。

```typescript
interface IVectorStyle {
  fillColor?: string;
  fillOpacity?: number;
  strokeColor?: string;
  strokeWidth?: number;
  strokeOpacity?: number;
  pointRadius?: number;
  pointColor?: string;
  pointOpacity?: number;
}
```

### 统计类型

#### IRenderStats

渲染统计接口。

```typescript
interface IRenderStats {
  fps: number;           // 当前帧率
  frameTime: number;     // 帧时间（ms）
  nodeCount: number;     // 渲染节点数量
  resourceCount: number; // 资源数量
}
```

---

## WebGL2 处理器

### Handler

WebGL2 上下文处理器。

#### 方法

##### createCanvas(width: number, height: number): HTMLCanvasElement

创建画布。

```javascript
const canvas = handler.createCanvas(800, 600);
```

##### getContext(canvas: HTMLCanvasElement): WebGL2RenderingContext

获取 WebGL2 上下文。

```javascript
const gl = handler.getContext(canvas);
```

---

## 编辑功能

### EditController

编辑控制器，提供矢量数据的编辑功能。

#### 方法

##### addDrawPoint(coordinates: Coordinate): void

添加绘制点。

```javascript
editController.addDrawPoint([116.397428, 39.90923]);
```

##### clear(): void

清除所有编辑操作。

```javascript
editController.clear();
```

##### undo(): void

撤销上一步操作。

```javascript
editController.undo();
```

##### redo(): void

重做操作。

```javascript
editController.redo();
```

### UndoRedoManager

撤销重做管理器。

#### 方法

##### executeCommand(command: Command): Promise\<void\>

执行命令。

```javascript
await undoRedoManager.executeCommand({
  execute: () => { /* 执行操作 */ },
  undo: () => { /* 撤销操作 */ }
});
```

---

## 使用示例

### 基础渲染

```javascript
import { Renderer } from './lib/index.js';

// 创建渲染器
const renderer = new Renderer({
  targetFPS: 60,
  enableProfiling: true
});

// 附加到画布
renderer.attachTo(document.getElementById('canvas'));

// 启动渲染
renderer.start();
```

### 使用图层

```javascript
import { Layer } from './lib/index.js';

const layer = new Layer({
  name: 'My Layer',
  priority: 10,
  visible: true
});

// 添加到渲染器
layer.add(renderer);

// 控制可见性
layer.show();
layer.hide();
layer.toggle();
```

### 使用矢量图层

```javascript
import { VectorLayer } from './lib/index.js';

const vectorLayer = new VectorLayer({
  name: 'Vector Layer',
  dataSourceType: 'geojson',
  geojsonData: {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [116.397428, 39.90923]
        },
        properties: { name: '北京' }
      }
    ]
  },
  style: {
    pointRadius: 10,
    pointColor: '#ff0000'
  }
});

vectorLayer.add(renderer);
```

### 使用栅格图层

```javascript
import { RasterLayer } from './lib/index.js';

const rasterLayer = new RasterLayer({
  name: 'Satellite Layer',
  tileUrl: 'https://webst01.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}',
  minZoom: 1,
  maxZoom: 18,
  zoom: 10
});

rasterLayer.add(renderer);
```

### 使用控件

```javascript
import { NavigationControl, PerformanceMonitor, EventBus } from './lib/index.js';

// 创建导航控件
const navControl = new NavigationControl();
navControl.zoomIn();
navControl.pan('up');

// 性能监控
const perfMonitor = new PerformanceMonitor();
perfMonitor.update();
const stats = perfMonitor.getStats();

// 事件总线
const eventBus = new EventBus();
eventBus.on('layer:added', (layer) => {
  console.log('图层已添加:', layer.name);
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

### 2. 内存管理

```javascript
// ✅ 释放不需要的资源
layer.dispose();

// ✅ 使用引用计数
resourceManager.addRef('texture-1');
// ... 使用资源
resourceManager.releaseRef('texture-1');
```

### 3. 性能优化

```javascript
// ✅ 批量添加图层
layers.forEach(layer => layerManager.addLayer(layer));

// ✅ 限制渲染节点数量
if (layers.length > 100) {
  console.warn('图层数量过多，可能影响性能');
}
```

### 4. 错误处理

```javascript
// ✅ 检查 WebGL2 支持
if (!canvas.getContext('webgl2')) {
  alert('您的浏览器不支持 WebGL2');
  return;
}

// ✅ 捕获渲染错误
try {
  renderer.start();
} catch (error) {
  console.error('渲染启动失败:', error);
}
```

---

## 浏览器兼容性

| 浏览器 | 最低版本 | WebGL2 支持 |
|---------|---------|------------|
| Chrome | 56+ | ✅ |
| Firefox | 51+ | ✅ |
| Safari | 11+ | ✅ |
| Edge | 79+ | ✅ |

---

## 相关资源

- [Demo 示例](../demos/README.md)
- [测试用例](../tests/)
- [故障排除](../TROUBLESHOOTING.md)
- [修复总结](../FIX-SUMMARY.md)

---

**版本**: 1.0.0  
**最后更新**: 2025-02-18
