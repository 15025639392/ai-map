# 着色器编程示例

## 简介

本示例深入展示 WebGL2 的着色器编程技术，包括如何编写和使用自定义着色器、Uniform 和 Attribute 变量、着色器动画等。

## 功能特性

- **多种着色器效果**：
  - 基础着色器：简单的颜色渲染
  - 渐变着色器：带时间变化的颜色效果
  - 图案着色器：复杂的圆形图案和动画

- **动态切换**：可以在运行时切换不同的着色器效果

- **动画控制**：支持动画的启用和禁用

## 学习要点

### 1. 着色器创建

```javascript
// 顶点着色器
const vertexShaderSource = `
    attribute vec4 a_position;
    attribute vec4 a_color;
    
    void main() {
        gl_Position = a_position;
    }
`;

// 创建着色器
const vertexShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vertexShader, vertexShaderSource);
gl.compileShader(vertexShader);
```

### 2. 程序链接

```javascript
// 创建程序
const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);
```

### 3. Attribute 变量

```javascript
// 获取 Attribute 位置
const positionLoc = gl.getAttribLocation(program, 'a_position');

// 设置顶点数据
gl.enableVertexAttribArray(positionLoc);
gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 32, 0);
```

### 4. Uniform 变量

```javascript
// 获取 Uniform 位置
const timeLoc = gl.getUniformLocation(program, 'u_time');

// 设置 Uniform 值
gl.uniform1f(timeLoc, currentTime);
```

### 5. 着色器动画

在着色器中使用时间变量创建动画效果：

```glsl
uniform float u_time;

void main() {
    // 使用时间创建动画
    float value = sin(u_time * 2.0);
}
```

## 运行示例

```bash
npx vite serve demos/shader-programming
```

然后在浏览器中打开 `http://localhost:5173`。

## 操作指南

- **基础着色器**：点击按钮切换到基础着色器，查看简单的颜色渲染
- **渐变着色器**：切换到渐变着色器，观察颜色随时间变化的效果
- **图案着色器**：切换到图案着色器，查看复杂的圆形图案动画
- **切换动画**：点击切换动画按钮来暂停或恢复动画

## 扩展练习

1. **自定义颜色**：修改着色器代码，使用不同的颜色方案

2. **更多图案**：在图案着色器中添加更多的图案效果

3. **添加纹理**：结合纹理映射示例，在着色器中使用纹理

4. **性能测试**：创建更复杂的着色器，测试渲染性能

5. **后处理**：使用帧缓冲实现后处理效果

## 相关资源

- [WebGL2 着色器语言规范](https://www.khronos.org/opengl/wiki/OpenGL_Shading_Language)
- [The Book of Shaders](https://thebookofshaders.com/)
- [Shadertoy](https://www.shadertoy.com/) - 着色器艺术分享网站
