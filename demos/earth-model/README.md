# 地球模型 - 瓦片渲染示例

## 概述

本示例展示了一个简化版地球模型，支持瓦片渲染和细节层次（LOD）管理。这是基于 WebGL2 的实现，具有以下特性：

### 核心功能

- 🌍 **球体几何生成**: 使用经纬度网格生成地球表面
- 🗺️ **瓦片加载**: 支持标准瓦片地图服务（如 OpenStreetMap）
- 📊 **LOD 管理**: 根据缩放级别自动切换不同细节层次
- 💡 **光照效果**: 实现基于法线的漫反射光照
- 🌫️ **大气散射**: 简化的大气层效果
- ⚡ **性能优化**: 高效的渲染管线和资源管理

### 技术实现

#### 1. 地球几何体 (EarthGeometry)

使用球面坐标生成球体网格：

```typescript
const geometry = new EarthGeometry({
  radius: 6371000, // 地球半径（米）
  widthSegments: 128,
  heightSegments: 64,
  generateUVs: true,
  generateNormals: true
});
```

**特性**:
- 经纬度网格细分
- 自动生成纹理坐标
- 自动生成法线（用于光照）
- 支持自定义细分等级

#### 2. 瓦片图层 (EarthTileLayer)

管理瓦片的加载和渲染：

```typescript
const tileLayer = new EarthTileLayer({
  tiles: {
    minZoom: 0,
    maxZoom: 18,
    tileSize: 256,
    tileUrlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    maxCacheSize: 100,
    enableLOD: true,
    lodThreshold: 2.0
  },
  render: {
    wireframe: false,
    cullFace: true,
    enableAtmosphere: true,
    enableLighting: true,
    lightDirection: [1.0, 0.5, 0.5],
    lightIntensity: 1.2
  }
});
```

**特性**:
- 自动瓦片加载
- LRU 缓存策略
- LOD 层级管理
- 可配置的渲染选项

#### 3. 地球渲染器 (EarthRenderer)

管理整个地球渲染的生命周期：

```typescript
const earthRenderer = new EarthRenderer(renderer);
await earthRenderer.initialize(earthOptions);
```

**API**:
- `setZoom(zoom)` - 设置缩放级别
- `getZoom()` - 获取当前缩放级别
- `zoomIn()` / `zoomOut()` - 放大/缩小
- `setWireframe(enabled)` - 设置线框模式
- `setLighting(enabled)` - 启用/禁用光照
- `setAtmosphere(enabled)` - 启用/禁用大气散射
- `getStats()` - 获取性能统计
- `reloadTiles()` - 重新加载瓦片
- `clearTileCache()` - 清除瓦片缓存

### LOD（细节层次）策略

#### LOD 层级划分

地球模型使用多级 LOD 来优化性能：

| LOD 层级 | 缩放级别 | 三角形数量 | 可视距离 |
|---------|---------|-----------|---------|
| 0 | 0-2 | 低 | 远 |
| 1 | 3-5 | 中 | 中 |
| 2 | 6-9 | 高 | 近 |
| 3 | 10-13 | 很高 | 很近 |
| 4 | 14-18 | 极高 | 极近 |

#### LOD 切换逻辑

```typescript
// 根据缩放级别选择 LOD 层级
const lodLevel = this._currentZoom - this._tileConfig.minZoom;
const targetLOD = Math.max(0, Math.min(lodLevel, this._lodLevels.length - 1));
```

**优势**:
- 减少远处物体的渲染负担
- 提高整体渲染性能
- 保持近处物体的细节

### 渲染管线

#### 顶点着色器

```glsl
attribute vec3 a_position;
attribute vec2 a_texCoord;
attribute vec3 a_normal;

uniform mat4 u_modelViewMatrix;
uniform mat4 u_projectionMatrix;
uniform mat3 u_normalMatrix;

varying vec2 v_texCoord;
varying vec3 v_normal;
varying vec3 v_position;

void main() {
  v_texCoord = a_texCoord;
  v_normal = normalize(u_normalMatrix * a_normal);
  v_position = (u_modelViewMatrix * vec4(a_position, 1.0)).xyz;
  gl_Position = u_projectionMatrix * u_modelViewMatrix * vec4(a_position, 1.0);
}
```

#### 片段着色器

```glsl
precision mediump float;

varying vec2 v_texCoord;
varying vec3 v_normal;
varying vec3 v_position;

uniform sampler2D u_texture;
uniform bool u_enableLighting;
uniform bool u_enableAtmosphere;
uniform vec3 u_lightDirection;
uniform float u_lightIntensity;
uniform vec4 u_atmosphereColor;

void main() {
  vec4 texColor = texture2D(u_texture, v_texCoord);

  // 光照计算
  if (u_enableLighting) {
    vec3 normal = normalize(v_normal);
    vec3 lightDir = normalize(u_lightDirection);
    float diffuse = max(dot(normal, lightDir), 0.0);
    float ambient = 0.2;
    vec3 lighting = (ambient + diffuse * u_lightIntensity) * texColor.rgb;
    texColor = vec4(lighting, texColor.a);
  }

  // 大气散射
  if (u_enableAtmosphere) {
    vec3 viewDir = normalize(-v_position);
    float viewAngle = max(dot(normalize(v_normal), viewDir), 0.0);
    vec3 atmosphere = u_atmosphereColor.rgb * pow(viewAngle, 2.0);
    texColor.rgb += atmosphere * u_atmosphereColor.a;
  }

  gl_FragColor = texColor;
}
```

### 性能优化

#### 1. 瓦片缓存

使用 LRU（最近最少使用）缓存策略：

```typescript
private _tileCache: Map<string, TileTexture> = new Map();
```

**特点**:
- 限制最大缓存数量
- 自动清理未使用的瓦片
- 记录最后使用时间

#### 2. LOD 管理

根据缩放级别动态调整几何细节：

```typescript
const lodLevel = this._currentZoom - this._tileConfig.minZoom;
```

**优势**:
- 减少三角形数量
- 提高帧率
- 降低内存使用

#### 3. 背面剔除

启用背面剔除以提高渲染效率：

```typescript
if (this._renderConfig.cullFace) {
  gl.enable(gl.CULL_FACE);
}
```

### 使用方法

#### 运行示例

```bash
# 构建项目
npm run build

# 启动 demo（主版本）
npx vite serve demos/earth-model

# 启动调试版本（用于问题排查）
npx vite serve demos/earth-model -- --base /earth-model
```

然后在浏览器中打开 `http://localhost:5173`。

#### 调试版本

如果主版本没有显示，请尝试使用调试版本：

```bash
# 直接打开调试页面
# 在浏览器中访问: http://localhost:5173/debug.html
```

调试版本会显示详细的初始化日志，帮助您诊断问题。

#### 交互控制

- **缩放**:
  - 点击"放大"/"缩小"按钮
  - 使用滑块拖动
  - 按键盘 `+` / `-` 键

- **显示选项**:
  - 线框模式: 切换网格显示
  - 启用光照: 开关光照效果
  - 大气散射: 开关大气层效果

- **瓦片管理**:
  - 重新加载: 重新加载当前瓦片
  - 清除缓存: 清除所有已缓存的瓦片

### 性能统计

示例提供实时的性能监控：

- **顶点数**: 当前渲染的顶点数量
- **三角形数**: 当前渲染的三角形数量
- **已加载瓦片**: 缓存中的瓦片数量
- **当前缩放**: 当前的缩放级别
- **LOD 层级**: 当前的 LOD 层级
- **FPS**: 实时帧率

### 自定义配置

#### 修改瓦片源

```typescript
tiles: {
  tileUrlTemplate: 'https://your-tile-server/{z}/{x}/{y}.png'
}
```

**常用瓦片源**:

- OpenStreetMap: `https://tile.openstreetmap.org/{z}/{x}/{y}.png`
- 高德地图: `https://webrd01.is.autonavi.com/appmaptile?style=7&x={x}&y={y}&z={z}`
- Mapbox: `https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}.png?access_token=YOUR_TOKEN`

#### 调整几何精度

```typescript
geometry: {
  widthSegments: 256,  // 增加经度分段
  heightSegments: 128  // 增加纬度分段
}
```

**注意**: 更高的精度会消耗更多资源。

#### 自定义光照

```typescript
render: {
  enableLighting: true,
  lightDirection: [1.0, 0.5, 0.5],  // 光照方向
  lightIntensity: 1.5  // 光照强度
}
```

#### 调整大气效果

```typescript
render: {
  enableAtmosphere: true,
  atmosphereColor: [0.2, 0.4, 0.8, 0.3]  // RGBA 颜色
}
```

### 代码结构

```
src/earth/
├── types.ts           # 类型定义
├── EarthGeometry.ts   # 几何体生成
├── EarthTileLayer.ts  # 瓦片图层
├── EarthRenderer.ts   # 地球渲染器
└── index.ts           # 导出
```

### API 参考

#### EarthGeometry

```typescript
new EarthGeometry(config: IEarthGeometryConfig)

方法:
- getVertexCount(): number
- getTriangleCount(): number
- getVertexIndexAt(lon: number, lat: number): number
- getVertexPosition(index: number): Vertex3D
- getBoundingRadius(): number

静态方法:
- cartesianToSpherical(x, y, z): SphericalCoord
- sphericalToCartesian(phi, theta, radius): Vertex3D
- createLODGeometry(base, lodLevel): EarthGeometry
```

#### EarthTileLayer

```typescript
new EarthTileLayer(options: IEarthLayerOptions)

方法:
- setZoom(zoom: number): void
- getZoom(): number
- getStats(): IEarthStats
- dispose(): void
```

#### EarthRenderer

```typescript
new EarthRenderer(renderer: IRenderer)

方法:
- initialize(options: IEarthLayerOptions): Promise<void>
- setZoom(zoom: number): void
- getZoom(): number
- zoomIn(): void
- zoomOut(): void
- setVisible(visible: boolean): void
- isVisible(): boolean
- setWireframe(enabled: boolean): void
- setLighting(enabled: boolean): void
- setAtmosphere(enabled: boolean): void
- getStats(): IEarthStats
- reloadTiles(): void
- clearTileCache(): void
- on(event: string, callback: Function): void
- off(event: string, callback?: Function): void
- dispose(): void
```

### 扩展开发

#### 添加自定义瓦片加载器

```typescript
private async _loadCustomTile(x: number, y: number, z: number): Promise<ImageData> {
  // 自定义加载逻辑
  const response = await fetch(`/custom/tiles/${z}/${x}/${y}.png`);
  const blob = await response.blob();
  return await createImageBitmap(blob);
}
```

#### 实现自定义光照模型

```glsl
// 在片段着色器中添加自定义光照
vec3 customLighting(vec3 normal, vec3 lightDir) {
  // 你的光照计算
  return result;
}
```

#### 添加交互功能

```typescript
// 鼠标拖拽旋转
canvas.addEventListener('mousedown', (e) => {
  isDragging = true;
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
});

canvas.addEventListener('mousemove', (e) => {
  if (isDragging) {
    const deltaX = e.clientX - lastMouseX;
    const deltaY = e.clientY - lastMouseY;
    // 更新旋转角度
    rotationY += deltaX * 0.01;
    rotationX += deltaY * 0.01;
  }
});
```

### 常见问题

#### Q: 瓦片加载失败怎么办？

**A**: 检查瓦片 URL 是否正确，确保服务器支持 CORS。尝试使用不同的瓦片源。

#### Q: 性能不佳如何优化？

**A**:
- 降低几何精度（减少分段数）
- 启用 LOD
- 减少瓦片缓存大小
- 关闭大气散射效果

#### Q: 如何实现地球旋转？

**A**: 在渲染循环中更新模型视图矩阵：

```typescript
const rotationMatrix = createRotationMatrix(rotationX, rotationY, rotationZ);
const modelViewMatrix = multiplyMatrices(rotationMatrix, translationMatrix);
```

#### Q: 如何添加地球自转？

**A**: 在 `render()` 方法中添加：

```typescript
rotationY += 0.001;  // 每帧旋转
```

### 参考资料

- [WebGL2 规范](https://www.khronos.org/registry/webgl/specs/latest/2.0/)
- [瓦片地图坐标系统](https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames)
- [球体坐标系统](https://en.wikipedia.org/wiki/Spherical_coordinate_system)
- [LOD 技术](https://en.wikipedia.org/wiki/Level_of_detail)

### 下一步

1. **添加交互功能**: 实现鼠标拖拽旋转、滚轮缩放
2. **优化性能**: 实现视锥体剔除、遮挡剔除
3. **增强视觉效果**: 添加云层、阴影、昼夜交替
4. **支持更多数据**: 添加矢量数据、地形高度数据
5. **实现地球控件**: 添加导航控件、指北针

---

**作者**: OpenGlobus Engine Team  
**版本**: 1.0.0  
**最后更新**: 2025-02-18
