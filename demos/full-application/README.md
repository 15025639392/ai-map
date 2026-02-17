# 完整应用示例

这是一个完整的应用程序示例，展示了如何在实际项目中使用 WebGL2 渲染引擎，包括场景管理、对象操作、日志系统、性能监控等功能。

## 功能特性

### 核心功能
- ✅ 完整的应用架构
- ✅ 场景对象管理
- ✅ 动态对象创建/删除
- ✅ 场景保存/加载
- ✅ 动画控制
- ✅ 全屏模式
- ✅ 响应式布局

### 监控功能
- ✅ 实时 FPS 监控
- ✅ 帧时间统计
- ✅ 对象数量统计
- ✅ 资源数量监控
- ✅ 运行时间统计
- ✅ 统计报告导出

### 日志系统
- ✅ 彩色日志输出
- ✅ 日志分类（info、success、warning、error）
- ✅ 时间戳记录
- ✅ 滚动显示
- ✅ 日志数量限制

## 使用方法

### 启动应用

```bash
# 确保已构建
npm run build

# 启动本地服务器
npx vite serve demos/full-application

# 在浏览器打开
# http://localhost:5173
```

### 操作指南

#### 工具栏
- **添加对象**: 创建一个新的渲染对象
- **移除对象**: 随机移除一个可见对象
- **清空场景**: 删除所有对象（需确认）
- **保存场景**: 将当前场景保存为 JSON 文件
- **加载场景**: 从 JSON 文件加载场景
- **切换动画**: 暂停/恢复动画

#### 侧边栏
- **性能统计**: 实时显示 FPS、帧时间、对象数等
- **场景列表**: 管理多个场景（创建、加载、删除）
- **日志**: 查看应用运行日志

#### 顶部栏
- **全屏**: 切换全屏模式
- **导出统计**: 导出当前性能统计报告

## 架构设计

### 应用状态管理

```javascript
const AppState = {
    renderer: null,           // 渲染器实例
    canvas: null,            // 画布元素
    objects: [],             // 场景对象列表
    sceneHistory: [],        // 场景历史记录
    startTime: Date.now(),   // 应用启动时间
    animationEnabled: true,  // 动画开关
    objectIdCounter: 0       // 对象 ID 计数器
};
```

### 日志系统

```javascript
const Logger = {
    log: (message, type = 'info') => {
        // 输出彩色日志到 UI
        // 自动滚动到底部
        // 限制日志数量
    }
};
```

### 对象创建

```javascript
function createObject(color, id) {
    return {
        id: 'unique-id',
        color: [r, g, b],
        priority: 10,
        visible: true,
        x: 0, y: 0, size: 0.1,      // 位置和大小
        vx: 0.002, vy: -0.002,      // 速度
        render: (renderer) => {      // 渲染函数
            // 渲染逻辑
        }
    };
}
```

## 扩展开发

### 添加新的对象类型

```javascript
// 创建自定义对象
class CustomObject {
    constructor(id) {
        this.id = id;
        this.priority = 10;
        this.visible = true;
        this.data = {}; // 自定义数据
    }

    render(renderer) {
        // 自定义渲染逻辑
        const gl = renderer.gl;
        // ...
    }
}

// 添加到场景
const customObj = new CustomObject('custom-1');
AppState.renderer.addNode(customObj);
AppState.objects.push(customObj);
```

### 添加事件监听

```javascript
// 对象点击事件
canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // 检测点击位置
    const clickedObject = findObjectAt(x, y);
    if (clickedObject) {
        Logger.log(`点击对象: ${clickedObject.id}`, 'info');
        // 处理点击事件
    }
});
```

### 添加键盘控制

```javascript
document.addEventListener('keydown', (event) => {
    switch (event.key) {
        case 'Space':
            window.toggleAnimation();
            break;
        case 'a':
        case 'A':
            window.addObject();
            break;
        case 'd':
        case 'D':
            window.removeObject();
            break;
        case 's':
        case 'S':
            window.saveScene();
            break;
        case 'l':
        case 'L':
            window.loadScene();
            break;
    }
});
```

## 性能优化建议

### 1. 对象池管理

```javascript
class ObjectPool {
    constructor(createFn, resetFn, initialSize = 10) {
        this.createFn = createFn;
        this.resetFn = resetFn;
        this.pool = [];

        // 预创建对象
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(createFn());
        }
    }

    acquire() {
        if (this.pool.length > 0) {
            const obj = this.pool.pop();
            this.resetFn(obj);
            return obj;
        }
        return this.createFn();
    }

    release(obj) {
        this.pool.push(obj);
    }
}
```

### 2. 批量渲染

```javascript
// 将相同类型的对象批量渲染
function renderBatched(objects, renderer) {
    const gl = renderer.gl;

    // 按类型分组
    const batches = groupByType(objects);

    batches.forEach(batch => {
        // 批量渲染同类型对象
        batch.forEach(obj => obj.render(renderer));
    });
}
```

### 3. 延迟加载

```javascript
class LazyLoader {
    constructor(renderer) {
        this.renderer = renderer;
        this.loadedResources = new Map();
    }

    async load(id, loader) {
        if (this.loadedResources.has(id)) {
            return this.loadedResources.get(id);
        }

        const resource = await loader();
        this.loadedResources.set(id, resource);
        return resource;
    }
}
```

## 部署建议

### 1. 生产环境配置

```javascript
// 禁用调试信息
const renderer = new Renderer({
    targetFPS: 60,
    enableProfiling: false  // 生产环境关闭性能监控
});
```

### 2. 错误处理

```javascript
// 全局错误处理
window.addEventListener('error', (event) => {
    Logger.log(`全局错误: ${event.message}`, 'error');
    // 上报错误到服务器
    reportError(event);
});

// Promise 错误处理
window.addEventListener('unhandledrejection', (event) => {
    Logger.log(`未处理的 Promise: ${event.reason}`, 'error');
});
```

### 3. 性能监控

```javascript
// 集成性能监控 API
const performanceObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    entries.forEach(entry => {
        Logger.log(`性能: ${entry.name} - ${entry.duration.toFixed(2)}ms`, 'info');
    });
});

performanceObserver.observe({ entryTypes: ['measure', 'paint'] });
```

## 故障排查

### 应用无法启动

检查清单：
1. 浏览器是否支持 WebGL2
2. Canvas 元素是否存在
3. 是否有 JavaScript 错误（查看控制台）
4. 是否正确构建了项目

### 性能问题

优化建议：
1. 减少对象数量
2. 简化渲染逻辑
3. 使用对象池
4. 启用批量渲染
5. 优化资源加载

### 内存泄漏

检测方法：
```javascript
// 定期检查资源泄漏
setInterval(() => {
    const leaks = renderer.resourceManager.detectLeaks();
    if (leaks.length > 0) {
        Logger.log(`检测到资源泄漏: ${leaks.length}`, 'warning');
    }
}, 5000);
```

## 最佳实践

1. **资源管理**: 始终使用 ResourceManager 管理资源
2. **错误处理**: 使用 try-catch 包裹可能出错的操作
3. **日志记录**: 记录关键操作和错误信息
4. **性能监控**: 定期检查性能指标
5. **代码组织**: 将功能模块化，提高可维护性
6. **用户反馈**: 提供清晰的状态反馈和错误提示
7. **响应式设计**: 适配不同屏幕尺寸
8. **渐进增强**: 为不支持的功能提供降级方案
