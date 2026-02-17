# OpenGlobus Engine

基于 WebGL2 的轻量级地图渲染引擎，专注于高性能、易用性和可扩展性。

## 特性

- ✨ **WebGL2 渲染** - 充分利用 WebGL2 的强大性能
- 🚀 **高性能** - 优化的渲染管线和资源管理
- 🗺️ **多图层支持** - 矢量图层、栅格图层混合渲染
- 🎨 **灵活的样式** - 支持自定义矢量样式
- 🎯 **要素拾取** - 高效的要素选择和查询
- 🔧 **可扩展** - 模块化设计，易于扩展
- 📊 **性能监控** - 实时性能统计和分析
- 📝 **完整文档** - 详细的 API 文档和示例

## 快速开始

### 安装

```bash
npm install openglobus-engine
```

### 基础使用

```javascript
import { Renderer, VectorLayer, RasterLayer } from 'openglobus-engine';

// 创建渲染器
const renderer = new Renderer({ targetFPS: 60 });
renderer.attachTo(document.getElementById('canvas'));
renderer.start();

// 添加栅格图层
new RasterLayer({
  tileUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  zoom: 10
}).add(renderer);

// 添加矢量图层
new VectorLayer({
  geojsonData: { type: 'FeatureCollection', features: [] }
}).add(renderer);
```

## 文档

### 核心 API 文档

- 📖 [API 参考](API.md) - 完整的 API 文档
- 📘 [API 示例](API-EXAMPLES.md) - 详细的使用示例
- ⚡ [快速参考](QUICK-REFERENCE.md) - 快速查询指南

### Demo 示例

- 🚀 [完整应用示例](demos/full-application/) - 展示完整的应用架构
- 🗺️ [栅格图层](demos/raster-layer/) - 高德卫星瓦片示例
- 🔵 [矢量图层](demos/vectors/) - GeoJSON 和 MVT 数据渲染
- 🎮 [着色器编程](demos/shader-programming/) - 自定义着色器
- 🖼️ [纹理映射](demos/texture-mapping/) - 纹理使用技巧
- 📹 [相机控制](demos/camera-controls/) - 3D 相机操作
- 💡 [光照效果](demos/lighting/) - 光照模型实现
- 📊 [性能监控](demos/performance-monitoring/) - 性能分析工具

查看 [Demo 目录](demos/README.md) 获取所有示例。

### 开发指南

- 🛠️ [故障排除](TROUBLESHOOTING.md) - 常见问题解决
- 📝 [修复总结](FIX-SUMMARY.md) - 近期修复记录
- 🧪 [测试用例](tests/) - 完整的测试覆盖

## 核心模块

### 渲染引擎

- **Renderer** - 核心渲染器，管理渲染循环和状态
- **RenderPipeline** - 渲染管线，管理渲染节点
- **ResourceManager** - 资源管理器，自动管理 WebGL 资源
- **Handler** - WebGL2 上下文处理器

### 图层系统

- **Layer** - 图层基类，提供生命周期管理
- **VectorLayer** - 矢量数据图层，支持 GeoJSON 和 MVT
- **RasterLayer** - 栅格瓦片图层，支持多种瓦片源

### 控件系统

- **EventBus** - 事件总线，组件间通信
- **LayerManager** - 图层管理器，批量管理多个图层
- **NavigationControl** - 导航控件，提供地图导航功能
- **QueryControl** - 查询控件，支持要素查询
- **PerformanceMonitor** - 性能监控器，实时性能统计

### 编辑功能

- **EditController** - 编辑控制器，支持矢量数据编辑
- **UndoRedoManager** - 撤销重做管理器

### 瓦片管理

- **TileQueue** - 瓦片队列，智能瓦片加载
- **TileRequestManager** - 瓦片请求管理器
- **TileStats** - 瓦片统计工具

## 浏览器支持

| 浏览器 | 最低版本 | WebGL2 |
|---------|---------|--------|
| Chrome | 56+ | ✅ |
| Firefox | 51+ | ✅ |
| Safari | 11+ | ✅ |
| Edge | 79+ | ✅ |

## 开发

### 构建

```bash
npm install
npm run build
```

### 测试

```bash
npm test
```

### 运行 Demo

```bash
# 运行特定 demo
npx vite serve demos/raster-layer

# 运行所有 demo 测试
npm run test:demos
```

## 示例

### 基础渲染

```javascript
import { Renderer } from 'openglobus-engine';

const renderer = new Renderer({
  targetFPS: 60,
  enableProfiling: true
});

renderer.attachTo(document.getElementById('canvas'));
renderer.start();
```

### 使用栅格图层

```javascript
import { RasterLayer } from 'openglobus-engine';

const layer = new RasterLayer({
  name: '高德卫星图',
  tileUrl: 'https://webst01.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}',
  minZoom: 1,
  maxZoom: 18,
  zoom: 10
});

layer.add(renderer);
```

### 使用矢量图层

```javascript
import { VectorLayer } from 'openglobus-engine';

const layer = new VectorLayer({
  name: '矢量数据',
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
    fillColor: '#4CAF50',
    strokeColor: '#2E7D32',
    strokeWidth: 2,
    pointRadius: 10
  }
});

layer.add(renderer);
```

### 使用控件

```javascript
import { LayerManager, NavigationControl, EventBus } from 'openglobus-engine';

const eventBus = new EventBus();
const layerManager = new LayerManager();
const navControl = new NavigationControl(eventBus);

// 添加图层
layerManager.addLayer(rasterLayer);
layerManager.addLayer(vectorLayer);

// 导航操作
navControl.zoomIn();
navControl.pan('up');
```

## 性能优化

### 1. 图层管理

```javascript
// ✅ 使用图层管理器批量管理
const layerManager = new LayerManager();
layers.forEach(layer => layerManager.addLayer(layer));

// ❌ 避免频繁添加/移除
// 每次添加都会触发重排
```

### 2. 资源管理

```javascript
// ✅ 使用引用计数
resourceManager.addRef('texture-1');
// ... 使用资源
resourceManager.releaseRef('texture-1');

// ❌ 避免手动管理
// 可能导致内存泄漏
```

### 3. 渲染优化

```javascript
// ✅ 限制渲染节点数量
if (features.length > 1000) {
  console.warn('要素数量过多，考虑使用数据聚合');
}

// ✅ 使用 LOD
const lod = getLOD(zoom);
layer.setLOD(lod);
```

## 贡献

欢迎贡献！请查看 [贡献指南](CONTRIBUTING.md)。

## 许可证

[MIT License](LICENSE)

## 相关链接

- [API 文档](API.md)
- [API 示例](API-EXAMPLES.md)
- [快速参考](QUICK-REFERENCE.md)
- [Demo 示例](demos/README.md)
- [故障排除](TROUBLESHOOTING.md)

## 更新日志

### v1.0.0 (2025-02-18)

- ✨ 初始版本发布
- 🎨 支持 WebGL2 渲染
- 🗺️ 支持矢量和栅格图层
- 🎯 支持要素拾取
- 📊 支持性能监控
- 🛠️ 支持编辑功能
- 📦 完整的 API 文档和示例

---

**OpenGlobus Engine** - 基于 WebGL2 的轻量级地图渲染引擎
