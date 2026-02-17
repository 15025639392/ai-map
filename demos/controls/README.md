# 控件系统 - 控件示例

这个 demo 展示了如何使用控件系统，包括 EventBus、LayerManager、NavigationControl 和 PerformanceMonitor。

## 功能特性

- **事件总线**: 统一的事件管理系统
- **图层管理**: 批量管理多个图层
- **导航控件**: 支持缩放和平移操作
- **性能监控**: 实时性能统计和监控
- **事件日志**: 显示所有系统事件
- **图层列表**: 动态添加、删除和切换图层
- **交互控制**: 支持键盘和鼠标操作

## 技术实现

### EventBus

事件总线是组件间通信的核心机制。

#### 基础使用

```javascript
import { EventBus } from './lib/index.js';

const eventBus = new EventBus();

// 订阅事件
eventBus.on('custom:event', (data) => {
  console.log('事件触发:', data);
});

// 触发事件
eventBus.emit('custom:event', { message: 'Hello World' });

// 取消订阅
eventBus.off('custom:event', handler);

// 订阅所有事件
eventBus.on('*', (event) => {
  console.log('所有事件:', event);
});
```

#### 内置事件类型

Demo 中监听了以下事件：

1. `navigation_change` - 导航状态改变
2. `layer_change` - 图层变更
3. `layer_visibility_change` - 图层可见性改变
4. `layer_order_change` - 图层顺序改变
5. `query_result` - 查询结果
6. `render_frame` - 渲染帧完成

### LayerManager

图层管理器用于批量管理多个图层。

#### 基础使用

```javascript
import { LayerManager, Layer } from './lib/index.js';

const layerManager = new LayerManager();

// 添加图层
const layer1 = new Layer({ name: 'Layer 1', priority: 10 });
const layer2 = new Layer({ name: 'Layer 2', priority: 5 });

layerManager.addLayer(layer1);
layerManager.addLayer(layer2);

// 获取所有图层
const allLayers = layerManager.getAllLayers();

// 获取特定图层
const layer = layerManager.getLayer('layer-1');

// 移除图层
layerManager.removeLayer('layer-1');

// 移动图层（改变顺序）
layerManager.moveLayer('layer-1', 0);  // 移动到顶部
layerManager.moveLayer('layer-1', -1); // 移动到底部
```

#### 高级功能

```javascript
// 批量添加
layers.forEach(layer => layerManager.addLayer(layer));

// 按名称查找图层
const layer = layerManager.findLayer('Layer 1');

// 切换图层可见性
layerManager.toggleLayer('layer-1');

// 获取活动图层
const activeLayers = layerManager.getActiveLayers();

// 获取隐藏图层
const hiddenLayers = layerManager.getHiddenLayers();
```

### NavigationControl

导航控件提供地图导航功能。

#### 基础使用

```javascript
import { NavigationControl, EventBus } from './lib/index.js';

const eventBus = new EventBus();
const navControl = new NavigationControl(eventBus, {
  duration: 300,  // 动画时长 300ms
  easing: t => t * (2 - t)  // 缓动函数
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
  center: [116.397428, 39.90923],  // 目标中心点
  zoom: 12,                                    // 目标缩放级别
  rotation: 0,                                  // 目标旋转角度
  tilt: 0                                       // 目标倾斜角度
});
```

#### 监听导航事件

```javascript
eventBus.on('navigation_change', (state) => {
  console.log('导航状态:', {
    center: state.center,
    zoom: state.zoom,
    rotation: state.rotation,
    tilt: state.tilt
  });
});
```

### PerformanceMonitor

性能监控器用于实时监控渲染性能。

#### 基础使用

```javascript
import { PerformanceMonitor } from './lib/index.js';

const perfMonitor = new PerformanceMonitor();

// 每帧更新
function update() {
  perfMonitor.update();
  requestAnimationFrame(update);
}

// 获取性能统计
const stats = perfMonitor.getStats();
console.log('FPS:', stats.fps);
console.log('帧时间:', stats.frameTime);
console.log('内存使用:', stats.memoryUsage);

// 启动更新
update();
```

#### 性能监控模式

```javascript
// 定期更新（节省性能）
setInterval(() => {
  perfMonitor.update();
  const stats = perfMonitor.getStats();
  console.log('FPS:', stats.fps);
}, 1000);

// 每帧更新（更精确）
function animate() {
  perfMonitor.update();
  const stats = perfMonitor.getStats();
  // 使用统计信息
  requestAnimationFrame(animate);
}
```

## 使用说明

### 导航控制

#### 缩放

1. **放大**: 点击 "+" 按钮
2. **缩小**: 点击 "-" 按钮
3. **重置**: 点击"重置"按钮恢复初始状态
4. **飞行**: 点击"飞行"按钮动画到指定位置

#### 平移

使用方向按钮进行平移：
- ↑ 向上
- ↓ 向下
- ← 向左
- → 向右

### 图层管理

#### 添加图层

点击"添加图层"按钮创建新图层。

#### 移除图层

点击"移除图层"按钮移除最后一个图层。

#### 切换可见性

点击图层的"显示/隐藏"按钮切换图层可见性。

#### 删除图层

点击图层的"删除"按钮永久删除该图层。

### 事件日志

侧边栏显示所有系统事件：

- **时间戳**: 事件触发时间
- **事件类型**: 事件类型（SYSTEM, LAYER, NAVIGATION）
- **事件数据**: 事件相关信息

点击"清除日志"按钮清空事件日志。

### 性能监控

实时显示性能指标：

- **FPS**: 当前帧率
- **帧时间**: 每帧渲染时间（毫秒）
- **内存**: 内存使用量（MB）

## API 参考

### EventBus 方法

```typescript
// 订阅事件
on(event: string, handler: EventListener): void

// 取消订阅
off(event: string, handler: EventListener): void

// 触发事件
emit(event: string, data?: any): void

// 清除所有订阅
clear(): void
```

### LayerManager 方法

```typescript
// 添加图层
addLayer(layer: Layer): void

// 移除图层
removeLayer(layerId: string): void

// 获取图层
getLayer(layerId: string): Layer | undefined

// 获取所有图层
getAllLayers(): Layer[]

// 移动图层
moveLayer(layerId: string, position: number): void

// 切换图层可见性
toggleLayer(layerId: string): void
```

### NavigationControl 方法

```typescript
// 放大
zoomIn(): void

// 缩小
zoomOut(): void

// 平移
pan(direction: 'up' | 'down' | 'left' | 'right'): void

// 飞行到指定位置
flyTo(target: IFlyToTarget): void
```

### PerformanceMonitor 方法

```typescript
// 更新性能统计
update(): void

// 获取性能统计
getStats(): IPerformanceStats

// 重置统计
reset(): void
```

## 最佳实践

### 1. 事件管理

```javascript
// ✅ 使用事件总线
eventBus.on('layer:added', (layer) => {
  console.log('图层已添加:', layer.name);
});

// ❌ 避免直接回调
function addLayer(layer) {
  // 添加图层后手动调用回调
  onLayerAdded(layer);  // 不推荐
}
```

### 2. 图层管理

```javascript
// ✅ 使用图层管理器
layerManager.addLayer(layer);

// ❌ 避免直接操作渲染管线
// renderer.pipeline.addNode(layer);  // 不推荐
```

### 3. 性能监控

```javascript
// ✅ 定期更新节省性能
setInterval(() => {
  perfMonitor.update();
}, 1000);

// ❌ 避免每帧都更新（除非需要）
// function animate() {
//   perfMonitor.update();  // 可能浪费性能
//   requestAnimationFrame(animate);
// }
```

### 4. 事件命名

```javascript
// ✅ 使用命名空间的事件名称
eventBus.emit('layer:added', data);
eventBus.emit('layer:removed', data);
eventBus.emit('navigation:change', data);

// ❌ 避免过于简单的事件名称
eventBus.emit('added', data);
eventBus.emit('removed', data);
eventBus.emit('change', data);
```

## 常见问题

### Q: 如何监听多个事件？

**A**: 订阅多次或使用通配符。

```javascript
// 方法 1: 多次订阅
eventBus.on('layer:added', handler1);
eventBus.on('layer:removed', handler2);

// 方法 2: 使用通配符
eventBus.on('layer:*', (event) => {
  if (event.type.includes('added')) {
    // 处理添加事件
  }
});
```

### Q: 如何避免内存泄漏？

**A**:
1. 取消不需要的事件订阅
2. 在组件销毁时清理
3. 避免在循环中创建订阅

```javascript
// ✅ 正确：保存订阅引用并清理
class MyComponent {
  constructor(eventBus) {
    this.subscriptions = [
      eventBus.on('event1', this.handler1),
      eventBus.on('event2', this.handler2)
    ];
  }

  dispose() {
    this.subscriptions.forEach(([event, handler]) => {
      eventBus.off(event, handler);
    });
  }
}
```

### Q: 如何优化性能监控开销？

**A**:
1. 使用适当的更新频率（如每秒一次）
2. 避免在性能监控中执行复杂操作
3. 只在需要时启用

```javascript
// ✅ 适当更新频率
setInterval(() => perfMonitor.update(), 1000);

// ✅ 条件性启用
if (enableProfiling) {
  perfMonitor.update();
}
```

## 扩展开发

### 自定义事件

```javascript
// 定义自定义事件类型
const CustomEvents = {
  CUSTOM_EVENT: 'custom:event',
  DATA_LOADED: 'data:loaded'
};

// 使用
eventBus.on(CustomEvents.DATA_LOADED, (data) => {
  console.log('数据已加载:', data);
});

eventBus.emit(CustomEvents.CUSTOM_EVENT, { message: 'Hello' });
```

### 自定义导航

```javascript
class CustomNavigationControl extends NavigationControl {
  flyToPath(points) {
    // 沿路径飞行
    points.forEach((point, index) => {
      setTimeout(() => {
        super.flyTo(point);
      }, index * this.options.duration);
    });
  }
}

const customNav = new CustomNavigationControl(eventBus);
customNav.flyToPath([
  { center: [116.397428, 39.90923], zoom: 12 },
  { center: [121.473701, 31.230416], zoom: 14 }
]);
```

## 相关资源

- [EventBus API](../../API.md#eventbus)
- [LayerManager API](../../API.md#layermanager)
- [NavigationControl API](../../API.md#navigationcontrol)
- [PerformanceMonitor API](../../API.md#performancemonitor)
- [控件类型定义](../../src/controls/types.ts)

## 浏览器兼容性

- Chrome 56+
- Firefox 51+
- Safari 11+
- Edge 79+

---

**版本**: 1.0.0  
**最后更新**: 2025-02-18
