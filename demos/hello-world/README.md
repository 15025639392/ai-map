# Hello World 示例

这是一个最基础的示例，展示如何初始化 WebGL2 渲染引擎并启动渲染循环。

## 功能演示

- WebGL2 上下文初始化
- 渲染主循环启动
- 简单渲染节点
- 实时帧率显示

## 使用方法

### 在浏览器中运行

1. 确保已构建项目：
```bash
npm run build
```

2. 使用 HTTP 服务器（如 Vite）启动：
```bash
npx vite serve demos/hello-world
```

3. 在浏览器中打开 `http://localhost:5173`

### 直接打开 HTML 文件

由于 ES Module 需要 HTTP 服务器，直接打开可能无法工作。建议使用本地服务器。

## 代码说明

```javascript
import { Renderer } from '../../lib/index.js';

// 1. 创建渲染器
const renderer = new Renderer({
    targetFPS: 60,           // 目标帧率 60fps
    enableProfiling: true      // 启用性能监控
});

// 2. 获取画布
const canvas = document.getElementById('canvas');

// 3. 附加到画布
renderer.attachTo(canvas);

// 4. 创建渲染节点
const node = {
    id: 'my-node',      // 唯一标识
    priority: 10,        // 渲染优先级（越大越先渲染）
    visible: true,       // 是否可见
    render: (renderer) => {
        // 渲染逻辑
        const gl = renderer.gl;
        gl.clearColor(0.2, 0.4, 0.8, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
    }
};

// 5. 添加节点到渲染器
renderer.addNode(node);

// 6. 启动渲染循环
renderer.start();
```

## 关键 API

### Renderer

- `constructor(config?)` - 创建渲染器实例
- `attachTo(canvas, options?)` - 附加到 HTML 画布
- `addNode(node)` - 添加渲染节点
- `removeNode(id)` - 移除渲染节点
- `start()` - 启动渲染循环
- `stop()` - 停止渲染循环
- `pause()` / `resume()` - 暂停/恢复渲染
- `getStats()` - 获取渲染统计信息

### IRenderNode

```typescript
interface IRenderNode {
    readonly id: string;        // 唯一标识
    readonly priority: number;    // 渲染优先级
    visible: boolean;           // 是否可见
    render(renderer: IRenderer): void;  // 渲染函数
}
```

## 注意事项

1. 浏览器必须支持 WebGL2
2. 需要 HTTP 服务器运行（ES Module 限制）
3. 记得在页面关闭时调用 `renderer.dispose()` 清理资源
