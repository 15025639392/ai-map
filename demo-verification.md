# Demo 修复说明

## 问题描述

在运行 `demos/raster-layer/index.html` 时遇到错误：
```
Error: RenderNode layer-0 already exists
    at RenderPipeline.addNode (RenderPipeline.ts:37:13)
    at RasterLayer.add (Layer.ts:59:23)
```

## 根本原因

代码中重复添加了同一个渲染节点到渲染管线：

```javascript
// ❌ 错误的做法
AppState.renderer.pipeline.addNode(AppState.rasterLayer);  // 第一次添加
AppState.rasterLayer.add(AppState.renderer);              // 第二次添加（内部也会调用 addNode）
```

`Layer.add()` 方法内部已经调用了 `renderer.pipeline.addNode()`，所以不需要手动调用。

## 解决方案

**删除手动调用 `pipeline.addNode()`**：

```javascript
// ✅ 正确的做法
AppState.rasterLayer.add(AppState.renderer);
```

`Layer.add()` 方法会自动处理：
1. 保存渲染器引用
2. 调用 `renderer.pipeline.addNode()`
3. 触发生命周期钩子
4. 更新图层状态

## 修复位置

**文件**: `demos/raster-layer/index.html`
**行号**: 387-388

**修复前**:
```javascript
AppState.renderer.pipeline.addNode(AppState.rasterLayer);
AppState.rasterLayer.add(AppState.renderer);
```

**修复后**:
```javascript
AppState.rasterLayer.add(AppState.renderer);
```

## 验证

运行以下命令验证修复：

```bash
cd /Users/ldy/Desktop/test/map
npx vite serve demos/raster-layer
```

然后在浏览器中打开 `http://localhost:5173`，应该可以正常加载栅格图层 demo。

## 正确的使用模式

### 使用 Layer 的正确方法

```javascript
// 1. 创建渲染器
const renderer = new Renderer({ targetFPS: 60 });

// 2. 创建图层
const layer = new RasterLayer({
    name: 'My Layer',
    tileUrl: 'https://example.com/tiles/{z}/{x}/{y}.png'
});

// 3. 添加图层到渲染器（正确）
layer.add(renderer);

// ❌ 不要这样做
// renderer.pipeline.addNode(layer);  // 已经在 layer.add() 中调用
// layer.add(renderer);             // 会再次添加，导致错误
```

### Layer 生命周期

```
创建 Layer
    ↓
layer.add(renderer)  ← 调用这个方法
    ↓
├── 设置 _renderer 引用
├── 调用 renderer.pipeline.addNode(this)
├── 触发 onAdd 钩子
└── 更新状态为 ADDED
```

## 其他注意事项

### VectorLayer 也是同样的使用方式

```javascript
const vectorLayer = new VectorLayer({
    name: 'Vector Layer',
    dataSourceType: 'geojson',
    geojsonData: myGeoJSON
});

// ✅ 正确
vectorLayer.add(renderer);

// ❌ 错误
// renderer.pipeline.addNode(vectorLayer);
// vectorLayer.add(renderer);
```

### 移除图层

```javascript
// ✅ 正确
layer.remove();

// ❌ 不要这样做
// renderer.pipeline.removeNode(layer.id);
```

### 切换可见性

```javascript
// 显示
layer.show();

// 隐藏
layer.hide();

// 切换
layer.toggle();
```

## 测试验证

### Node.js 测试

```bash
node test-import.mjs
```

应该看到：
```
✅ All tests passed!
```

### 浏览器测试

```bash
npx vite serve demos/raster-layer
```

应该看到：
- 成功加载高德卫星瓦片
- 缩放控制正常工作
- 实时统计信息显示
- 控制台没有错误

## 相关文件

- `src/renderer/Layer.ts` - Layer 基类实现
- `src/renderer/RenderPipeline.ts` - 渲染管线实现
- `demos/raster-layer/index.html` - 栅格图层 demo
- `tests/rasters/RasterLayer.test.ts` - RasterLayer 单元测试

## 总结

**关键点**：
- ✅ 使用 `layer.add(renderer)` 添加图层
- ❌ 不要手动调用 `renderer.pipeline.addNode(layer)`
- ✅ 使用 `layer.remove()` 移除图层
- ❌ 不要手动调用 `renderer.pipeline.removeNode(layer.id)`

这样可以避免重复添加节点导致的错误。
