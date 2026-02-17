# 纹理映射示例

## 简介

本示例展示如何使用 WebGL2 的纹理映射功能，包括纹理创建、加载、包装模式、滤镜等技术。

## 功能特性

- **多种纹理类型**：
  - 棋盘纹理：程序化生成的棋盘图案
  - 渐变纹理：颜色渐变效果
  - 噪点纹理：随机生成的噪点

- **纹理参数控制**：
  - 包装模式切换（REPEAT/CLAMP_TO_EDGE）
  - 滤镜切换（LINEAR/NEAREST）
  - 交互式纹理位置调整

- **实时预览**：通过鼠标移动改变纹理位置

## 学习要点

### 1. 纹理创建

```javascript
// 创建纹理对象
const texture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, texture);

// 上传纹理数据
gl.texImage2D(
    gl.TEXTURE_2D,
    0,              // 级别
    gl.RGBA,         // 内部格式
    width, height,   // 尺寸
    0,              // 边框
    gl.RGBA,         // 源格式
    gl.UNSIGNED_BYTE,// 数据类型
    data            // 像素数据
);
```

### 2. 纹理参数设置

```javascript
// 包装模式
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

// 滤镜
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

// 生成 Mipmap
gl.generateMipmap(gl.TEXTURE_2D);
```

### 3. 程序化纹理生成

```javascript
function createCheckerTexture() {
    const size = 256;
    const data = new Uint8Array(size * size * 4);
    
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const i = (y * size + x) * 4;
            const checker = ((x >> 4) + (y >> 4)) & 1;
            // 设置像素数据
            data[i] = checker ? 255 : 0;
            data[i + 1] = checker ? 255 : 0;
            data[i + 2] = checker ? 255 : 0;
            data[i + 3] = 255;
        }
    }
    
    return data;
}
```

### 4. 纹理坐标

```javascript
// 顶点数据中包含纹理坐标
const vertices = new Float32Array([
    // 位置             // 纹理坐标 (U, V)
    -1.0, -1.0,        0.0, 0.0,
     1.0, -1.0,        1.0, 0.0,
    -1.0,  1.0,        0.0, 1.0,
     1.0,  1.0,        1.0, 1.0,
]);
```

### 5. 纹理采样

```glsl
varying vec2 v_texCoord;
uniform sampler2D u_texture;

void main() {
    // 采样纹理
    vec4 color = texture2D(u_texture, v_texCoord);
    gl_FragColor = color;
}
```

## 运行示例

```bash
npx vite serve demos/texture-mapping
```

然后在浏览器中打开 `http://localhost:5173`。

## 操作指南

- **棋盘纹理**：点击生成棋盘纹理
- **渐变纹理**：点击生成颜色渐变纹理
- **噪点纹理**：点击生成随机噪点纹理
- **切换包装模式**：在 REPEAT 和 CLAMP_TO_EDGE 之间切换
- **切换滤镜**：在 LINEAR 和 NEAREST 滤镜之间切换
- **重置视图**：将纹理位置重置为中心
- **鼠标移动**：移动鼠标来改变纹理的显示位置

## 扩展练习

1. **加载外部图像**：从文件加载图像作为纹理

2. **Mipmap 控制**：手动生成和控制 Mipmap 级别

3. **纹理动画**：创建纹理坐标动画效果

4. **多纹理混合**：在着色器中混合多个纹理

5. **纹理压缩**：使用压缩纹理格式降低内存占用

## 技术细节

### 纹理包装模式

- **REPEAT**：纹理重复铺满表面
- **CLAMP_TO_EDGE**：纹理边缘像素拉伸
- **MIRRORED_REPEAT**：镜像重复

### 纹理滤镜

- **NEAREST**: 最近邻采样（像素化效果）
- **LINEAR**: 线性插值（平滑效果）
- **NEAREST_MIPMAP_NEAREST**: 最近邻 Mipmap
- **LINEAR_MIPMAP_LINEAR**: 线性 Mipmap 插值

### 纹理单元

WebGL2 支持多个纹理单元，可以同时绑定多个纹理：

```javascript
gl.activeTexture(gl.TEXTURE0);
gl.bindTexture(gl.TEXTURE_2D, texture1);
gl.uniform1i(textureLoc1, 0);

gl.activeTexture(gl.TEXTURE1);
gl.bindTexture(gl.TEXTURE_2D, texture2);
gl.uniform1i(textureLoc2, 1);
```

## 相关资源

- [WebGL 纹理文档](https://webglfundamentals.org/webgl/lessons/webgl-2-textures.html)
- [纹理坐标系统](https://learnopengl-cn.readthedocs.io/zh/latest/01%20Getting%20started/06%20Textures/)
- [Mipmap 详解](https://www.khronos.org/opengl/wiki/Common_Mistakes#Texture_Mipmap)
