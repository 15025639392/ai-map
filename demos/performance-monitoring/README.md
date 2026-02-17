# 性能监控示例

这个示例展示如何监控和优化 WebGL2 渲染引擎的性能，包括帧率、帧时间、节点数量等关键指标。

## 功能演示

- ✓ 实时 FPS 监控
- ✓ 帧时间监控（每帧耗时）
- ✓ 历史趋势图表
- ✓ 性能日志记录
- ✓ 动态负载调整
- ✓ 暂停/恢复渲染

## 使用方法

### 启动示例

```bash
# 确保已构建
npm run build

# 启动本地服务器
npx vite serve demos/performance-monitoring

# 在浏览器打开
# http://localhost:5173
```

### 操作说明

- **增加负载**: 增加 5 个渲染节点
- **减少负载**: 减少 5 个渲染节点
- **暂停/恢复**: 暂停或恢复渲染循环
- **清空历史**: 清除所有历史记录和日志

### 性能指标说明

#### FPS (Frames Per Second)
- **优秀**: 50-60 FPS
- **良好**: 30-50 FPS
- **需要优化**: < 30 FPS

#### 帧时间 (Frame Time)
- **优秀**: < 20ms
- **良好**: 20-33ms
- **需要优化**: > 33ms

## 核心概念

### 性能统计

渲染器提供详细的性能统计：

```typescript
interface IRenderStats {
    fps: number;        // 当前帧率
    frameTime: number;  // 帧时间（毫秒）
    nodeCount: number;   // 渲染节点数量
    resourceCount: number; // 资源数量
}
```

### 获取统计信息

```javascript
const stats = renderer.getStats();
if (stats) {
    console.log(`FPS: ${stats.fps}`);
    console.log(`帧时间: ${stats.frameTime}ms`);
    console.log(`节点数: ${stats.nodeCount}`);
    console.log(`资源数: ${stats.resourceCount}`);
}
```

### 监控循环

```javascript
// 每 100ms 更新一次统计显示
setInterval(() => {
    const stats = renderer.getStats();
    if (!stats) return;

    // 更新 UI
    document.getElementById('fps').textContent = stats.fps;
    document.getElementById('frameTime').textContent = stats.frameTime.toFixed(2);

    // 记录历史
    fpsHistory.push(stats.fps);
    frameTimeHistory.push(stats.frameTime);

    // 限制历史长度
    if (fpsHistory.length > 60) {
        fpsHistory.shift();
        frameTimeHistory.shift();
    }
}, 100);
```

## 代码示例

### 性能优化策略

#### 1. 动态调整渲染质量

```javascript
const stats = renderer.getStats();
if (stats) {
    // 根据性能动态调整
    if (stats.fps < 30) {
        // 降低渲染质量
        setRenderQuality('low');
    } else if (stats.fps > 50) {
        // 提高渲染质量
        setRenderQuality('high');
    }
}

function setRenderQuality(level) {
    switch (level) {
        case 'low':
            // 减少节点数量
            reduceNodeCount();
            // 降低纹理分辨率
            setTextureQuality('low');
            break;

        case 'high':
            // 增加节点数量
            increaseNodeCount();
            // 提高纹理分辨率
            setTextureQuality('high');
            break;
    }
}
```

#### 2. 性能阈值告警

```javascript
const FPS_THRESHOLD_WARNING = 30;
const FPS_THRESHOLD_CRITICAL = 20;

function checkPerformance(stats) {
    if (stats.fps < FPS_THRESHOLD_CRITICAL) {
        console.error('⚠️ 严重性能问题！FPS:', stats.fps);
        takeCriticalAction();
    } else if (stats.fps < FPS_THRESHOLD_WARNING) {
        console.warn('⚠️ 性能下降！FPS:', stats.fps);
        takeWarningAction();
    }
}

function takeCriticalAction() {
    // 1. 暂停非必要渲染
    pauseOptionalRendering();

    // 2. 降低细节
    setDetailLevel('lowest');

    // 3. 减少节点
    minimizeNodes();
}

function takeWarningAction() {
    // 1. 降低纹理质量
    setTextureQuality('medium');

    // 2. 减少粒子效果
    reduceParticleEffects();
}
```

#### 3. 性能历史分析

```javascript
class PerformanceAnalyzer {
    constructor() {
        this.history = [];
        this.maxHistoryLength = 300; // 保存 5 分钟历史（300 秒）
    }

    record(stats) {
        this.history.push({
            timestamp: Date.now(),
            fps: stats.fps,
            frameTime: stats.frameTime,
            nodeCount: stats.nodeCount,
            resourceCount: stats.resourceCount
        });

        if (this.history.length > this.maxHistoryLength) {
            this.history.shift();
        }
    }

    getAverageFPS(duration = 5000) {
        const now = Date.now();
        const recent = this.history.filter(
            h => now - h.timestamp <= duration
        );

        if (recent.length === 0) return 0;

        const sum = recent.reduce((acc, h) => acc + h.fps, 0);
        return sum / recent.length;
    }

    getAverageFrameTime(duration = 5000) {
        const now = Date.now();
        const recent = this.history.filter(
            h => now - h.timestamp <= duration
        );

        if (recent.length === 0) return 0;

        const sum = recent.reduce((acc, h) => acc + h.frameTime, 0);
        return sum / recent.length;
    }

    detectBottleneck() {
        const recent = this.history.slice(-60); // 最近 60 帧

        // 检查帧时间是否持续较高
        const avgFrameTime = this.getAverageFrameTime();

        if (avgFrameTime > 30) {
            return 'CPU 密集 - 考虑减少节点数量';
        } else if (avgFrameTime > 20) {
            return 'GPU 密集 - 考虑简化着色器';
        }

        return null;
    }
}

// 使用示例
const analyzer = new PerformanceAnalyzer();

setInterval(() => {
    const stats = renderer.getStats();
    if (stats) {
        analyzer.record(stats);

        const bottleneck = analyzer.detectBottleneck();
        if (bottleneck) {
            console.warn('检测到性能瓶颈:', bottleneck);
        }
    }
}, 100);
```

#### 4. 自适应帧率控制

```javascript
class AdaptiveFPSController {
    constructor(targetFPS = 60) {
        this.targetFPS = targetFPS;
        this.minFPS = 30;
        this.currentQuality = 1.0;
    }

    update(stats) {
        if (!stats) return;

        // 如果 FPS 低于阈值，降低质量
        if (stats.fps < this.minFPS && this.currentQuality > 0.3) {
            this.currentQuality *= 0.95;
            this.applyQuality(this.currentQuality);
            console.log(`降低质量到 ${this.currentQuality.toFixed(2)}`);
        }
        // 如果 FPS 良好，可以提高质量
        else if (stats.fps >= this.targetFPS - 5 && this.currentQuality < 1.0) {
            this.currentQuality *= 1.02;
            this.applyQuality(this.currentQuality);
            console.log(`提高质量到 ${this.currentQuality.toFixed(2)}`);
        }
    }

    applyQuality(quality) {
        // 应用质量设置
        setTextureQuality(quality);
        setParticleDensity(quality);
        setShadowQuality(quality);
    }
}

const fpsController = new AdaptiveFPSController(60);

setInterval(() => {
    const stats = renderer.getStats();
    if (stats) {
        fpsController.update(stats);
    }
}, 100);
```

## 性能优化技巧

### 1. 减少状态切换

```javascript
// ❌ 不推荐 - 频繁切换状态
nodes.forEach(node => {
    gl.useProgram(node.program);
    gl.bindTexture(gl.TEXTURE_2D, node.texture);
    // ... 渲染
});

// ✅ 推荐 - 批量相同状态的节点
const batches = groupByProgramAndTexture(nodes);
batches.forEach(batch => {
    gl.useProgram(batch.program);
    gl.bindTexture(gl.TEXTURE_2D, batch.texture);
    batch.nodes.forEach(node => {
        // ... 渲染
    });
});
```

### 2. 使用视锥体剔除

```javascript
function isVisible(node, camera) {
    // 简单的视锥体剔除
    return isNodeInFrustum(node, camera.frustum);
}

function render(camera) {
    nodes.filter(node => isVisible(node, camera)).forEach(node => {
        node.render(renderer);
    });
}
```

### 3. 实例化渲染

```javascript
// 对于大量相似对象，使用实例化
function createInstancedMesh(instanceCount) {
    // ... 创建实例化网格
}

function renderInstanced(mesh, instances) {
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertexBuffer);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer);

    // 一次性渲染所有实例
    gl.drawElementsInstanced(
        gl.TRIANGLES,
        mesh.indexCount,
        gl.UNSIGNED_SHORT,
        0,
        instances.length
    );
}
```

## 故障排查

### FPS 不稳定

可能原因：
1. 节点数量过多
2. 复杂的着色器
3. 纹理尺寸过大

解决方案：
- 减少节点数量
- 简化着色器
- 使用纹理压缩
- 降低纹理分辨率

### 内存持续增长

可能原因：
1. 资源泄漏
2. 未正确释放资源

解决方案：
```javascript
// 定期检测泄漏
setInterval(() => {
    const leaks = renderer.resourceManager.detectLeaks();
    if (leaks.length > 0) {
        console.error('资源泄漏:', leaks);
    }
}, 5000);
```

### 帧时间波动大

可能原因：
1. GPU 上下文切换
2. 主线程阻塞
3. 不平衡的负载

解决方案：
- 将耗时操作移到 Worker
- 使用时间分片处理大数据
- 平衡渲染负载
