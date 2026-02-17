# 光照效果示例

## 简介

本示例展示如何在 WebGL2 中实现各种光照效果，包括方向光、点光源、聚光灯和光照衰减等。

## 功能特性

- **三种光照模型**：
  - 无光照（基础颜色渲染）
  - 方向光（Directional Light）
  - 点光源（Point Light）
  - 聚光灯（Spot Light）

- **光照参数控制**：
  - 光强度调整
  - 光颜色 RGB 控制
  - 光源位置和方向

- **动态效果**：
  - 点光源动画（光源移动）
  - 光照强度平滑过渡

- **实时预览**：
  - 实时更新光照效果
  - 球体几何体展示光照

## 学习要点

### 1. Phong 光照模型

Phong 光照模型是标准的光照技术，包括：

- **环境光**（Ambient）：基础照明
- **漫反射光**（Diffuse）：基于法线和光照方向
- **镜面反射光**（Specular）：基于视角和法线方向

```glsl
// 光照计算
vec3 ambient = u_ambientColor * u_ambientIntensity;
vec3 lightDir = normalize(u_lightDirection);
float diff = max(dot(normal, lightDir), 0.0);
vec3 diffuse = diff * u_lightColor * u_lightIntensity;
vec3 viewDir = normalize(u_viewPosition - v_position);
vec3 reflectDir = reflect(-lightDir, normal);
float spec = pow(max(dot(viewDir, reflectDir), 0.0), u_shininess);
vec3 specular = spec * u_lightColor * u_lightIntensity;
vec3 color = ambient + diffuse + specular;
```

### 2. 光照衰减

点光源和聚光灯需要考虑光照衰减：

```glsl
// 距离衰减
float distance = length(u_lightPosition - v_position);
float attenuation = 1.0 / (1.0 + 0.09 * distance + 0.032 * distance * distance);
```

### 3. 法线变换

```javascript
// 模型视图矩阵
let modelView = translate(0, 0, -4);

// 法线矩阵（用于正确变换法线）
const modelViewInv = invert4x4(modelView);
const normalMatrix = transpose4x4(modelViewInv);
```

### 4. 光源类型

#### 方向光
- 模拟太阳光等平行光源
- 光线方向恒定
- 无衰减

#### 点光源
- 光线向四面八方辐射
- 随距离衰减
- 光源位置影响阴影

#### 聚光灯
- 类似手电筒效果
- 有限照射范围（锥形）
- 内部和外部衰减

## 运行示例

```bash
npx vite serve demos/lighting
```

然后在浏览器中打开 `http://localhost:5173`。

## 操作指南

### 光照模式切换

- **无光照**：查看基础球体颜色
- **方向光**：体验类似太阳的平行光照
- **点光源**：观察光源距离衰减效果
- **聚光灯**：体验聚光灯的锥形照射

### 参数调节

- **光强度**：拖动滑块调整光照强度（0-2）
- **光颜色**：分别调整 RGB 通道
- **动画**：切换光源位置动画

## 扩展练习

1. **环境光**：添加环境光控制

2. **多光源**：场景中使用多个光源

3. **阴影贴图**：实现更高级的阴影效果

4. **延迟着色**：基于 G-Buffer 的延迟渲染

5. **法线贴图**：使用法线贴图增强细节

6. **反射探针**：实现环境反射

## 技术细节

### 光照方程

完整的光照方程包括：

```
Result = Ambient + Diffuse + Specular + Emissive
```

### 材质属性

可以添加的材质属性：

- **自发光**：物体自身发光
- **粗糙度**：控制镜面反射的强度
- **金属度**：控制反射属性
- **透明度**：支持透明物体

### 性能优化

1. **提前计算**：在 CPU 端计算光照参数

2. **光照烘焙**：将光照预计算到纹理

3. **分层渲染**：延迟渲染技术

4. **LOD**：根据距离使用不同复杂度

## 相关资源

- [WebGL 灯光教程](https://webglfundamentals.org/webgl/lessons/webgl-phong-lighting.html)
- [Learn OpenGL - 光照基础](https://learnopengl-cn.readthedocs.io/zh/latest/02-Using%20OpenGL/02-03-Basic%20Lighting/)
- [The Book of Shaders - 光照章节](https://thebookofshaders.com/03-Graphics-Basics/03-Phong-Model/)
- [Phong 反射模型详解](https://en.wikipedia.org/wiki/Phong_reflection_model)
