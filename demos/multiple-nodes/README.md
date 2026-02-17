# 多节点渲染示例

这个示例展示如何管理多个渲染节点，包括添加、删除、切换可见性和调整优先级。

## 功能演示

- ✓ 多个渲染节点同时工作
- ✓ 动态添加/删除节点
- ✓ 切换节点可见性
- ✓ 调整渲染优先级
- ✓ 实时统计信息显示

## 使用方法

### 启动示例

```bash
# 确保已构建
npm run build

# 启动本地服务器
npx vite serve demos/multiple-nodes

# 在浏览器打开
# http://localhost:5173
```

### 操作说明

- **添加随机节点**: 创建一个新节点，颜色随机
- **移除随机节点**: 随机移除一个现有节点
- **切换可见性**: 随机切换一个节点的可见状态
- **调整优先级**: 重新随机分配所有节点的优先级
- **清空节点**: 移除所有节点

## 核心概念

### 渲染优先级

节点按照 `priority` 从高到低的顺序渲染：

```javascript
const node = {
    id: 'my-node',
    priority: 10,  // 值越大，越先渲染
    visible: true,
    render: (renderer) => { /* 渲染逻辑 */ }
};

// 优先级高的节点会先渲染（可能被低优先级的节点覆盖）
```

### 节点可见性

可以通过设置 `visible` 属性控制节点是否渲染：

```javascript
node.visible = false;  // 节点不会在当前帧渲染
node.visible = true;   // 节点会正常渲染
```

### 动态管理节点

```javascript
// 添加节点
renderer.addNode(newNode);

// 移除节点
renderer.removeNode('node-id');

// 更新节点（通过引用）
myNode.visible = false;
myNode.priority = 20;
```

## 代码示例

### 创建多个节点

```javascript
const colors = [
    [1.0, 0.3, 0.3],  // 红色
    [0.3, 1.0, 0.3],  // 绿色
    [0.3, 0.3, 1.0],  // 蓝色
];

colors.forEach((color, index) => {
    const node = {
        id: `node-${index}`,
        priority: 10 - index,
        visible: true,
        render: (renderer) => {
            const gl = renderer.gl;
            gl.clearColor(color[0], color[1], color[2], 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT);
        }
    };

    renderer.addNode(node);
});
```

### 监听统计信息

```javascript
setInterval(() => {
    const stats = renderer.getStats();
    console.log(`
        FPS: ${stats.fps}
        节点数: ${stats.nodeCount}
        资源数: ${stats.resourceCount}
        帧时间: ${stats.frameTime}ms
    `);
}, 100);
```

## 性能考虑

1. **节点数量限制**: 节点过多会影响性能，建议控制在合理范围
2. **优先级排序**: 引擎会自动按优先级排序，高优先级节点先渲染
3. **可见性优化**: 不可见的节点不会参与渲染，可用于性能优化
4. **统计更新频率**: 避免过于频繁的统计查询，建议 100-500ms 更新一次

## 扩展建议

### 实现分层渲染

```javascript
const layers = ['background', 'middle', 'foreground'];

layers.forEach((layer, layerIndex) => {
    const layerNode = {
        id: `layer-${layer}`,
        priority: 100 - layerIndex * 10,  // 背景先渲染
        visible: true,
        render: (renderer) => {
            // 渲染该层级的所有内容
            renderLayer(layer);
        }
    };

    renderer.addNode(layerNode);
});
```

### 实现对象池

对于频繁创建/销毁的对象，可以使用对象池优化：

```javascript
class NodePool {
    constructor() {
        this.available = [];
        this.active = [];
    }

    acquire(id, color) {
        let node = this.available.pop();
        if (!node) {
            node = this.createNode(id, color);
        } else {
            node.id = id;
            node.color = color;
        }
        this.active.push(node);
        return node;
    }

    release(node) {
        const index = this.active.indexOf(node);
        if (index !== -1) {
            this.active.splice(index, 1);
            this.available.push(node);
        }
    }
}
```
