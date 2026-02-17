# 矢量图层 - GeoJSON 示例

这个 demo 展示了如何使用 `VectorLayer` 类加载和渲染 GeoJSON 数据。

## 功能特性

- **GeoJSON 数据加载**: 支持点、线、面等几何类型
- **样式控制**: 动态切换不同的渲染样式
- **要素列表**: 显示所有要素及其类型
- **实时统计**: 显示渲染的要素数量
- **交互功能**: 点击要素查看详情
- **响应式布局**: 自适应不同屏幕尺寸

## 技术实现

### VectorLayer 类

`VectorLayer` 是专门用于渲染矢量数据的图层类。

#### 支持的数据格式

1. **GeoJSON**
   - FeatureCollection
   - Feature
   - Point
   - LineString
   - Polygon
   - MultiPoint
   - MultiLineString
   - MultiPolygon

2. **MVT** (Mapbox Vector Tiles)
   - 瓦片化的矢量数据
   - 支持大规模数据集

### 样式配置

#### 矢量样式接口

```typescript
interface IVectorStyle {
  /** 填充颜色（面） */
  fillColor?: string;
  
  /** 填充不透明度（0-1） */
  fillOpacity?: number;
  
  /** 边框颜色 */
  strokeColor?: string;
  
  /** 边框宽度 */
  strokeWidth?: number;
  
  /** 边框不透明度（0-1） */
  strokeOpacity?: number;
  
  /** 点半径 */
  pointRadius?: number;
  
  /** 点颜色 */
  pointColor?: string;
  
  /** 点不透明度（0-1） */
  pointOpacity?: number;
}
```

#### 样式示例

```javascript
// 默认样式
const defaultStyle = {
  fillColor: '#4CAF50',
  fillOpacity: 0.6,
  strokeColor: '#2E7D32',
  strokeWidth: 2,
  pointRadius: 10,
  pointColor: '#FF5722'
};

// 红色样式
const redStyle = {
  fillColor: '#FFCDD2',
  fillOpacity: 0.6,
  strokeColor: '#EF5350',
  strokeWidth: 3,
  pointRadius: 12,
  pointColor: '#D32F2F'
};

// 绿色样式
const greenStyle = {
  fillColor: '#C8E6C9',
  fillOpacity: 0.6,
  strokeColor: '#43A047',
  strokeWidth: 3,
  pointRadius: 12,
  pointColor: '#1B5E20'
};
```

### GeoJSON 数据示例

#### 点要素

```json
{
  "type": "Feature",
  "geometry": {
    "type": "Point",
    "coordinates": [116.397428, 39.90923]
  },
  "properties": {
    "name": "北京",
    "type": "city"
  }
}
```

#### 线要素

```json
{
  "type": "Feature",
  "geometry": {
    "type": "LineString",
    "coordinates": [
      [116.397428, 39.90923],
      [121.473701, 31.230416]
    ]
  },
  "properties": {
    "name": "北京-上海高铁",
    "type": "railway"
  }
}
```

#### 面要素

```json
{
  "type": "Feature",
  "geometry": {
    "type": "Polygon",
    "coordinates": [[
      [116.3, 39.85],
      [116.5, 39.85],
      [116.5, 39.95],
      [116.3, 39.95]
    ]]
  },
  "properties": {
    "name": "北京区域",
    "type": "area"
  }
}
```

#### FeatureCollection

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": { /* ... */ },
      "properties": { /* ... */ }
    },
    {
      "type": "Feature",
      "geometry": { /* ... */ },
      "properties": { /* ... */ }
    }
  ]
}
```

## 使用方法

### 基础使用

```javascript
import { VectorLayer } from './lib/index.js';

// 创建矢量图层
const vectorLayer = new VectorLayer({
  name: 'Vector Layer',
  dataSourceType: 'geojson',
  geojsonData: geojson,
  style: {
    fillColor: '#4CAF50',
    fillOpacity: 0.6,
    strokeColor: '#2E7D32',
    strokeWidth: 2,
    pointRadius: 10,
    pointColor: '#FF5722'
  }
});

// 添加到渲染器
vectorLayer.add(renderer);
```

### 加载 GeoJSON 数据

```javascript
// 从文件加载
fetch('data.geojson')
  .then(res => res.json())
  .then(geojson => {
    vectorLayer.loadGeoJSON(geojson);
  });

// 从 URL 加载
fetch('https://example.com/data.geojson')
  .then(res => res.json())
  .then(geojson => {
    vectorLayer.loadGeoJSON(geojson);
  });

// 直接加载
const geojson = {
  type: 'FeatureCollection',
  features: [ /* ... */ ]
};
vectorLayer.loadGeoJSON(geojson);
```

### 修改样式

```javascript
// 设置新样式
vectorLayer.setStyle({
  fillColor: '#FF5722',
  fillOpacity: 0.7,
  strokeColor: '#BF360C',
  strokeWidth: 3
});

// 获取当前样式
const currentStyle = vectorLayer.getStyle();
```

### 获取要素

```javascript
// 获取所有要素
const features = vectorLayer.getFeatures();

// 根据 ID 获取要素
const feature = vectorLayer.getFeatureById('feature-1');

// 获取渲染统计
const stats = vectorLayer.getRenderStats();
console.log('渲染的要素:', stats.featuresRendered);
console.log('渲染的点:', stats.pointsRendered);
console.log('渲染的线:', stats.linesRendered);
console.log('渲染的面:', stats.polygonsRendered);
```

### 要素拾取

```javascript
// 拾取要素
const results = vectorLayer.pick([x, y], projection);

results.forEach(result => {
  console.log('选中要素:', result.feature);
  console.log('距离:', result.distance);
  console.log('屏幕位置:', result.screenPosition);
});
```

## API 参考

### VectorLayer 方法

#### 构造函数

```typescript
constructor(options?: IVectorLayerOptions)
```

#### loadGeoJSON(geojson: GeoJSONData): void

加载 GeoJSON 数据到图层。

```javascript
vectorLayer.loadGeoJSON(geojson);
```

#### loadMVT(mvtData: MVTData, layerName?: string): void

加载 MVT 数据到图层。

```javascript
vectorLayer.loadMVT(mvtData, 'buildings');
```

#### setStyle(style: IVectorStyle): void

设置渲染样式。

```javascript
vectorLayer.setStyle(style);
```

#### getStyle(): IVectorStyle

获取当前样式。

```javascript
const style = vectorLayer.getStyle();
```

#### setZoom(zoom: number): void

设置缩放级别。

```javascript
vectorLayer.setZoom(12);
```

#### getZoom(): number

获取当前缩放级别。

```javascript
const zoom = vectorLayer.getZoom();
```

#### getFeatures(): IFeature[]

获取所有要素。

```javascript
const features = vectorLayer.getFeatures();
```

#### getFeatureById(id: string | number): IFeature | undefined

根据 ID 获取要素。

```javascript
const feature = vectorLayer.getFeatureById('feature-1');
```

#### pick(screenPosition: Coordinate, projection?: Function): IPickResult[]

拾取要素。

```javascript
const results = vectorLayer.pick([x, y]);
```

#### getRenderStats(): IRenderStats

获取渲染统计。

```javascript
const stats = vectorLayer.getRenderStats();
```

## 使用说明

### 样式控制

Demo 提供了 4 种预定义样式：

1. **默认样式** - 绿色系，适合一般用途
2. **红色样式** - 暖色调，适合警告标记
3. **绿色样式** - 自然色调，适合环境数据
4. **蓝色样式** - 冷色调，适合技术数据

点击工具栏的样式按钮即可切换。

### 要素列表

侧边栏显示所有要素：

- **要素名称** - 显示要素的 name 属性
- **要素类型** - 显示几何类型（点、线、面）

点击要素可以选中并高亮显示。

### 加载数据

点击"加载数据"按钮可以加载新的示例数据。

### 全屏模式

点击"全屏"按钮进入或退出全屏模式。

## 最佳实践

### 1. 数据加载

```javascript
// ✅ 使用异步加载
fetch('data.geojson')
  .then(res => res.json())
  .then(geojson => {
    vectorLayer.loadGeoJSON(geojson);
  });

// ❌ 避免阻塞主线程
const geojson = JSON.parse(largeDataString); // 可能导致卡顿
```

### 2. 样式管理

```javascript
// ✅ 重用样式对象
const styles = {
  default: { /* ... */ },
  highlight: { /* ... */ }
};

// ❌ 避免重复创建样式
vectorLayer.setStyle({ /* ... */ });
vectorLayer.setStyle({ /* ... */ });
```

### 3. 性能优化

```javascript
// ✅ 使用数据聚合
const aggregatedData = aggregateFeatures(rawData);

// ✅ 限制要素数量
if (features.length > 1000) {
  console.warn('要素数量过多，考虑使用数据聚合');
}

// ✅ 使用 LOD
const lodFeatures = applyLOD(features, zoom);
vectorLayer.loadGeoJSON(lodFeatures);
```

## 常见问题

### Q: 如何加载大型 GeoJSON 文件？

**A**: 
1. 使用异步加载避免阻塞主线程
2. 考虑使用数据聚合或 LOD 技术
3. 使用 Web Worker 进行数据预处理

### Q: 如何实现要素交互？

**A**:
1. 使用 `pick()` 方法进行要素拾取
2. 根据拾取结果更新 UI
3. 实现高亮或选中状态

### Q: 如何优化大量要素的渲染？

**A**:
1. 使用数据聚合减少要素数量
2. 实现基于缩放级别的 LOD
3. 使用空间索引加速查询
4. 考虑使用 MVT 瓦片数据

### Q: 如何动态更新要素？

**A**:
1. 重新加载整个 GeoJSON 数据
2. 或使用图层管理器的 update 方法
3. 或实现增量更新机制

## 扩展开发

### 自定义样式

```javascript
function createCustomStyle(color) {
  return {
    fillColor: color,
    fillOpacity: 0.6,
    strokeColor: darkenColor(color, 20),
    strokeWidth: 2
  };
}

vectorLayer.setStyle(createCustomStyle('#667eea'));
```

### 自定义渲染

```javascript
class CustomVectorLayer extends VectorLayer {
  render(renderer) {
    // 自定义渲染逻辑
    super.render(renderer);
    
    // 添加自定义效果
    this.renderCustomEffects(renderer);
  }
  
  renderCustomEffects(renderer) {
    // 实现自定义效果
  }
}
```

## 相关资源

- [VectorLayer API](../../API.md#矢量图层)
- [GeoJSON 规范](https://geojson.org/)
- [类型定义](../../lib/vectortypes.d.ts)

## 浏览器兼容性

- Chrome 56+
- Firefox 51+
- Safari 11+
- Edge 79+

---

**版本**: 1.0.0  
**最后更新**: 2025-02-18
