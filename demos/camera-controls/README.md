# 相机控制示例

## 简介

本示例展示如何在 WebGL2 中实现完整的 3D 相机控制系统，包括旋转、缩放、平移等操作。

## 功能特性

- **完整的相机控制**：
  - 旋转：鼠标左键拖拽
  - 缩放：鼠标滚轮
  - 平移：鼠标右键拖拽
  - 移动：WASD 键盘控制

- **预设视图**：
  - 顶视图
  - 前视图
  - 侧视图

- **自动旋转**：可选的自动相机旋转

- **实时相机信息**：显示相机位置、旋转角度和缩放级别

## 学习要点

### 1. 投影矩阵

```javascript
function perspective(fov, aspect, near, far) {
    const f = 1.0 / Math.tan(fov / 2);
    return new Float32Array([
        f / aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (far + near) / (near - far), -1,
        0, 0, (2 * far * near) / (near - far), 0
    ]);
}
```

### 2. 视图矩阵

```javascript
function translate(x, y, z) {
    return new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        x, y, z, 1
    ]);
}

function rotateY(angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return new Float32Array([
        c, 0, s, 0,
        0, 1, 0, 0,
        -s, 0, c, 0,
        0, 0, 0, 1
    ]);
}
```

### 3. 矩阵乘法

```javascript
function multiply(a, b) {
    const result = new Float32Array(16);
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            result[i * 4 + j] = 
                a[i * 4 + 0] * b[0 * 4 + j] +
                a[i * 4 + 1] * b[1 * 4 + j] +
                a[i * 4 + 2] * b[2 * 4 + j] +
                a[i * 4 + 3] * b[3 * 4 + j];
        }
    }
    return result;
}
```

### 4. 相机组合

```javascript
// 组合变换矩阵
let modelView = translate(0, 0, -camera.z * camera.zoom);
modelView = multiply(modelView, rotateY(camera.rotationY));
modelView = multiply(modelView, translate(camera.x, camera.y, 0));
modelView = multiply(modelView, scale(camera.zoom));
```

### 5. 事件处理

```javascript
canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) {
        isDragging = true;
    } else if (e.button === 2) {
        isPanning = true;
    }
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
});

canvas.addEventListener('mousemove', (e) => {
    if (isDragging) {
        const deltaX = e.clientX - lastMouseX;
        camera.rotationY += deltaX * 0.01;
        lastMouseX = e.clientX;
    }
});
```

## 运行示例

```bash
npx vite serve demos/camera-controls
```

然后在浏览器中打开 `http://localhost:5173`。

## 操作指南

### 鼠标控制

- **左键拖拽**：旋转相机
- **右键拖拽**：平移相机
- **滚轮**：缩放视图

### 键盘控制

- **W/S**：前进/后退
- **A/D**：左移/右移
- **+/-**：放大/缩小

### 按钮功能

- **重置相机**：将相机恢复到初始状态
- **顶视图**：切换到顶视图
- **前视图**：切换到前视图
- **侧视图**：切换到侧视图
- **切换自动旋转**：启用或禁用自动旋转

## 扩展练习

1. **弧球相机**：实现更自然的弧球旋转

2. **轨道相机**：围绕目标点旋转的相机

3. **第一人称相机**：类似游戏的 FPS 视角

4. **平滑过渡**：实现相机位置的平滑插值

5. **相机抖动**：模拟真实的手持相机效果

## 技术细节

### 视锥体

视锥体由近裁剪面、远裁剪面和四个侧面组成，定义了相机的可见区域。

### 投影类型

- **透视投影**：近大远小，真实感强
- **正交投影**：无透视变形，适合工程图

### 相机空间

相机空间定义了相机的坐标系：
- X 轴：向右
- Y 轴：向上
- Z 轴：向后

## 相关资源

- [3D 数学基础](https://www.3dgep.com/understanding-the-view-matrix/)
- [Learn OpenGL - 摄像机](https://learnopengl-cn.readthedocs.io/zh/latest/01%20Getting%20started/09%20Coordinate%20Systems/)
- [WebGL Fundamentals - 3D 相机](https://webglfundamentals.org/webgl/lessons/webgl-3d-camera.html)
