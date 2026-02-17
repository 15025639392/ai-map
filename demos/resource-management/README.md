# 资源管理示例

这个示例展示如何使用资源管理器来管理 WebGL2 资源的生命周期，包括创建、引用计数管理和泄漏检测。

## 功能演示

- ✓ 创建 WebGL2 资源（纹理、缓冲区、着色器程序）
- ✓ 引用计数管理
- ✓ 自动资源释放
- ✓ 资源泄漏检测
- ✓ 实时资源监控

## 使用方法

### 启动示例

```bash
# 确保已构建
npm run build

# 启动本地服务器
npx vite serve demos/resource-management

# 在浏览器打开
# http://localhost:5173
```

### 操作说明

- **创建纹理**: 创建一个新的 WebGL 纹理资源
- **创建缓冲区**: 创建一个新的 WebGL 缓冲区资源
- **创建着色器程序**: 创建一个新的 WebGL 着色器程序
- **增加引用**: 随机增加一个资源的引用计数
- **释放引用**: 随机释放一个资源的引用
- **检测泄漏**: 检测是否有资源泄漏（引用计数 > 0）
- **清理所有资源**: 清除所有已注册的资源

## 核心概念

### 资源注册

使用 `ResourceManager.registerResource()` 注册资源：

```javascript
const gl = renderer.gl;
const texture = gl.createTexture();

renderer.resourceManager.registerResource(
    'my-texture',           // 资源 ID
    'texture',             // 资源类型
    texture,               // WebGL 资源对象
    () => gl.deleteTexture(texture)  // 释放函数
);
```

### 引用计数

资源使用引用计数来管理生命周期：

```javascript
// 增加引用（资源不会被释放）
renderer.resourceManager.addRef('my-texture');

// 释放引用（当计数为 0 时自动释放）
renderer.resourceManager.releaseRef('my-texture');

// 直接释放资源（忽略引用计数）
renderer.resourceManager.disposeResource('my-texture');
```

### 资源类型

支持的资源类型：

- `texture`: WebGL 纹理
- `buffer`: WebGL 缓冲区
- `program`: WebGL 着色器程序
- `framebuffer`: WebGL 帧缓冲

## 最佳实践

### 1. 始终注册资源

```javascript
// ❌ 不推荐 - 资源未注册
const texture = gl.createTexture();
// ... 使用纹理
gl.deleteTexture(texture);  // 容易忘记清理

// ✅ 推荐 - 使用资源管理器
const texture = gl.createTexture();
renderer.resourceManager.registerResource(
    'texture-1',
    'texture',
    texture,
    () => gl.deleteTexture(texture)
);
```

### 2. 使用有意义的资源 ID

```javascript
// ❌ 不推荐 - ID 不清晰
renderer.resourceManager.registerResource('r1', 'texture', texture, disposeFn);

// ✅ 推荐 - 描述性 ID
renderer.resourceManager.registerResource(
    'player-texture-diffuse',
    'texture',
    texture,
    disposeFn
);
```

### 3. 定期检测泄漏

```javascript
// 在开发阶段定期检测泄漏
setInterval(() => {
    const leaks = renderer.resourceManager.detectLeaks();
    if (leaks.length > 0) {
        console.warn('检测到资源泄漏:', leaks);
    }
}, 5000);
```

### 4. 页面关闭时清理

```javascript
window.addEventListener('beforeunload', () => {
    // 清理所有资源
    renderer.resourceManager.disposeAll();
    renderer.dispose();
});
```

## 代码示例

### 创建纹理资源

```javascript
function createTexture(imageSource) {
    const gl = renderer.gl;
    const texture = gl.createTexture();
    const id = `texture-${Date.now()}`;

    // 设置纹理参数
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    // 加载图像数据
    const image = new Image();
    image.src = imageSource;
    image.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    };

    // 注册到资源管理器
    renderer.resourceManager.registerResource(
        id,
        'texture',
        texture,
        () => gl.deleteTexture(texture)
    );

    return id;
}
```

### 创建着色器程序

```javascript
function createShaderProgram(vertexSource, fragmentSource) {
    const gl = renderer.gl;

    // 编译顶点着色器
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexSource);
    gl.compileShader(vertexShader);

    // 编译片段着色器
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentSource);
    gl.compileShader(fragmentShader);

    // 链接程序
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    // 清理着色器
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    // 注册到资源管理器
    const id = `program-${Date.now()}`;
    renderer.resourceManager.registerResource(
        id,
        'program',
        program,
        () => gl.deleteProgram(program)
    );

    return id;
}
```

### 批量管理资源

```javascript
class ResourceGroup {
    constructor(resourceManager, name) {
        this.manager = resourceManager;
        this.name = name;
        this.resources = new Map();
    }

    add(id, type, resource, disposeFn) {
        const fullId = `${this.name}-${id}`;
        this.manager.registerResource(fullId, type, resource, disposeFn);
        this.resources.set(id, fullId);
    }

    get(id) {
        const fullId = this.resources.get(id);
        return fullId ? this.manager.getResource(fullId) : undefined;
    }

    remove(id) {
        const fullId = this.resources.get(id);
        if (fullId) {
            this.manager.disposeResource(fullId);
            this.resources.delete(id);
        }
    }

    clear() {
        this.resources.forEach(fullId => {
            this.manager.disposeResource(fullId);
        });
        this.resources.clear();
    }
}

// 使用示例
const playerResources = new ResourceGroup(renderer.resourceManager, 'player');

playerResources.add('diffuse', 'texture', diffuseTexture, () => gl.deleteTexture(diffuseTexture));
playerResources.add('normal', 'texture', normalTexture, () => gl.deleteTexture(normalTexture));
playerResources.add('mesh', 'buffer', meshBuffer, () => gl.deleteBuffer(meshBuffer));

// 清理玩家所有资源
playerResources.clear();
```

## 性能提示

1. **避免频繁创建/销毁资源**: 使用对象池复用资源
2. **批量加载资源**: 在初始化阶段一次性加载所有资源
3. **按需卸载**: 场景切换时卸载不需要的资源
4. **引用计数优化**: 确保引用计数正确，避免资源泄漏

## 故障排查

### 资源未被释放

检查引用计数是否正确：

```javascript
const info = renderer.resourceManager.getResourceInfo();
info.forEach(r => {
    if (r.refCount > 1) {
        console.warn(`${r.id} 有 ${r.refCount} 个引用，可能未正确释放`);
    }
});
```

### 资源泄漏检测

```javascript
// 场景切换前记录资源
const resourcesBefore = new Set(
    renderer.resourceManager.getResourceInfo().map(r => r.id)
);

// 切换场景
loadNewScene();

// 检测未清理的资源
const resourcesAfter = new Set(
    renderer.resourceManager.getResourceInfo().map(r => r.id)
);

const leaked = [...resourcesAfter].filter(id => resourcesBefore.has(id));
if (leaked.length > 0) {
    console.error('场景切换后存在泄漏:', leaked);
}
```
