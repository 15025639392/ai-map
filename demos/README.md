# WebGL2 渲染引擎 - 使用示例

本目录包含 WebGL2 渲染引擎的完整使用示例，帮助您快速上手和理解引擎功能。

## 示例列表

### 1. Hello World (`hello-world/`)

最基础的示例，展示如何初始化 WebGL2 渲染引擎并启动渲染循环。

**学习内容：**
- WebGL2 上下文初始化
- 渲染主循环启动
- 简单渲染节点
- 实时帧率显示

**适合人群：** 初学者

**运行命令：**
```bash
npx vite serve demos/hello-world
```

---

### 2. 多节点渲染 (`multiple-nodes/`)

展示如何管理多个渲染节点，包括动态添加、删除、切换可见性和调整优先级。

**学习内容：**
- 多个渲染节点同时工作
- 动态添加/删除节点
- 切换节点可见性
- 调整渲染优先级
- 实时统计信息显示

**适合人群：** 了解基础的开发者

**运行命令：**
```bash
npx vite serve demos/multiple-nodes
```

---

### 3. 资源管理 (`resource-management/`)

展示如何使用资源管理器来管理 WebGL2 资源的生命周期，包括创建、引用计数管理和泄漏检测。

**学习内容：**
- 创建 WebGL2 资源（纹理、缓冲区、着色器程序）
- 引用计数管理
- 自动资源释放
- 资源泄漏检测
- 实时资源监控

**适合人群：** 中级开发者

**运行命令：**
```bash
npx vite serve demos/resource-management
```

---

### 4. 性能监控 (`performance-monitoring/`)

展示如何监控和优化 WebGL2 渲染引擎的性能，包括帧率、帧时间、节点数量等关键指标。

**学习内容：**
- 实时 FPS 监控
- 帧时间监控（每帧耗时）
- 历史趋势图表
- 性能日志记录
- 动态负载调整
- 性能优化策略

**适合人群：** 性能优化的开发者

**运行命令：**
```bash
npx vite serve demos/performance-monitoring
```

---

### 5. 着色器编程 (`shader-programming/`) ⭐ NEW

深入理解 WebGL2 着色器编程，展示如何编写和使用自定义着色器。

**学习内容：**
- GLSL 着色器语言基础
- 顶点着色器编程
- 片段着色器编程
- Uniform 变量使用
- Attribute 变量传递
- 着色器动画效果

**适合人群：** 进阶开发者

**运行命令：**
```bash
npx vite serve demos/shader-programming
```

---

### 6. 纹理映射 (`texture-mapping/`) ⭐ NEW

学习如何使用 WebGL2 的纹理映射功能，创建和管理纹理。

**学习内容：**
- 纹理创建和加载
- 纹理坐标映射
- 纹理包装模式（REPEAT/CLAMP_TO_EDGE）
- 纹理滤镜（LINEAR/NEAREST）
- 程序化纹理生成
- 纹理动画和交互

**适合人群：** 进阶开发者

**运行命令：**
```bash
npx vite serve demos/texture-mapping
```

---

### 7. 相机控制 (`camera-controls/`) ⭐ NEW

实现 3D 场景中的相机控制系统，包括旋转、缩放和平移。

**学习内容：**
- 3D 投影矩阵
- 模型视图矩阵
- 相机旋转（鼠标拖拽）
- 相机缩放（滚轮）
- 相机平移（右键拖拽）
- 键盘控制（WASD）
- 自动旋转

**适合人群：** 进阶开发者

**运行命令：**
```bash
npx vite serve demos/camera-controls
```

---

### 8. 光照效果 (`lighting/`) ⭐ NEW

实现 WebGL2 中的各种光照效果，包括方向光、点光源和聚光灯。

**学习内容：**
- Phong 光照模型
- 方向光（Directional Light）
- 点光源（Point Light）
- 聚光灯（Spot Light）
- 光照衰减计算
- 法线变换
- 光照动画

**适合人群：** 进阶开发者

**运行命令：**
```bash
npx vite serve demos/lighting
```

---

### 9. 栅格图层 (`raster-layer/`) ⭐ NEW

展示如何使用栅格图层加载和渲染高德地图卫星瓦片。

**学习内容：**
- 瓦片地图原理
- 瓦片 URL 模板
- 纹理加载和管理
- 动态缩放控制
- 瓦片缓存策略
- WebGL2 纹理渲染

**适合人群：** 地图应用开发者

**运行命令：**
```bash
npx vite serve demos/raster-layer
```

---

### 10. 完整应用 (`full-application/`)

这是一个完整的应用程序示例，展示了如何在实际项目中使用 WebGL2 渲染引擎。

**学习内容：**
- 完整的应用架构
- 场景对象管理
- 动态对象创建/删除
- 场景保存/加载
- 日志系统
- 性能监控
- 响应式布局

**适合人群：** 想要构建实际应用的开发者

**运行命令：**
```bash
npx vite serve demos/full-application
```

---

## 快速开始

### 前置要求

1. **Node.js**: >= 16.0.0
2. **现代浏览器**: Chrome、Firefox、Safari、Edge（支持 WebGL2）
3. **构建工具**: Vite（已包含在 devDependencies）

### 安装依赖

```bash
# 在项目根目录执行
npm install
```

### 构建项目

```bash
npm run build
```

### 运行示例

```bash
# 方法 1: 使用 Vite 直接启动（推荐）
npx vite serve demos/hello-world

# 方法 2: 使用全局安装的 Vite
npm install -g vite
vite serve demos/hello-world

# 方法 3: 使用其他 HTTP 服务器
npx serve demos/hello-world
# 或
python -m http.server -d demos/hello-world
```

然后在浏览器中打开 `http://localhost:5173`（或其他服务器地址）。

---

## 学习路径

### 初学者路径

1. **Hello World** - 了解基本概念
2. **多节点渲染** - 学习节点管理
3. **资源管理** - 理解资源生命周期
4. **性能监控** - 掌握性能优化
5. **完整应用** - 综合运用所学知识
6. **栅格图层** - 学习瓦片地图渲染

### 进阶路径

1. 从 **Hello World** 开始，理解基本架构
2. 学习 **着色器编程**，掌握 GLSL 语言
3. 深入 **纹理映射**，学习纹理管理和程序化纹理
4. 掌握 **相机控制**，理解 3D 变换和投影
5. 研究 **光照效果**，学习光照模型和着色器编程
6. 分析 **完整应用**，学习项目架构设计
7. 基于 **完整应用** 扩展自己的功能

### 专家路径（完整路径）

1. **Hello World** → **多节点渲染** → **资源管理** → **性能监控**
2. **着色器编程** → **纹理映射** → **光照效果** → **相机控制**
3. **完整应用**（综合运用所有知识）
4. 自定义扩展和优化

---

## 技术要点

### WebGL2 核心概念

- **WebGL2 上下文**: 使用 `canvas.getContext('webgl2')` 获取
- **着色器**: 顶点着色器（Vertex Shader）和片段着色器（Fragment Shader）
- **程序**: 链接着色器后的可执行程序
- **缓冲区**: 顶点缓冲区（VBO）和索引缓冲区（EBO）
- **纹理**: 用于存储图像数据
- **帧缓冲**: 用于离屏渲染

### 渲染管线

1. 顶点着色器处理顶点数据
2. 图元装配
3. 光栅化
4. 片段着色器处理像素
5. 逐片段操作（深度测试、模板测试、混合等）

### 性能优化技巧

1. **减少绘制调用**: 批量渲染、实例化渲染
2. **使用索引缓冲**: 减少顶点数据重复
3. **纹理压缩**: 降低内存占用
4. **视锥体剔除**: 不渲染视野外的对象
5. **LOD (Level of Detail)**: 根据距离使用不同精度模型

---

## 常见问题

### Q: 为什么不能直接打开 HTML 文件？

**A:** 由于使用 ES Modules 和动态导入，需要通过 HTTP 服务器运行。直接打开 HTML 文件会报错。

### Q: 浏览器不支持 WebGL2 怎么办？

**A:** 请使用最新版本的现代浏览器（Chrome 56+、Firefox 51+、Safari 11+、Edge 79+）。

### Q: 如何在示例中使用自己的着色器？

**A:** 请参考着色器编程示例中的 `createShader()` 函数，使用 `gl.createShader()` 和 `gl.createProgram()`。

### Q: 性能监控显示 FPS 很低怎么办？

**A:**
1. 减少渲染节点数量
2. 简化着色器代码
3. 降低纹理分辨率
4. 启用视锥体剔除
5. 使用批量渲染

### Q: 如何调试渲染问题？

**A:**
1. 使用浏览器开发者工具查看 WebGL 状态
2. 启用性能监控分析瓶颈
3. 检查资源是否正确注册和管理
4. 使用日志系统记录关键操作
5. 使用 WebGL Inspector 扩展

### Q: 着色器编译失败怎么办？

**A:**
1. 检查 GLSL 语法是否正确
2. 查看 `gl.getShaderInfoLog()` 获取错误信息
3. 确保使用 WebGL2 支持的 GLSL ES 3.0 版本
4. 检查 uniform 和 attribute 是否正确绑定

---

## 扩展开发

### 创建自己的示例

1. 在 `demos/` 目录下创建新文件夹
2. 复制 `hello-world/` 作为模板
3. 根据需求修改代码
4. 编写 README.md 说明文档
5. 更新本 README.md 添加示例链接

### 示例模板结构

```
your-example/
├── index.html          # HTML 页面
├── README.md          # 说明文档
├── app.ts             # 可选：TypeScript 应用代码
└── styles.css         # 可选：自定义样式
```

### 推荐的示例主题

- **基础**: 几何体渲染、颜色混合、深度测试
- **中级**: 模型加载、动画系统、碰撞检测
- **高级**: 后处理效果、粒子系统、地形渲染
- **优化**: 批量渲染、实例化、GPU 计算

---

## 贡献指南

如果您想为示例做贡献：

1. Fork 项目仓库
2. 创建新的示例分支
3. 实现示例功能
4. 编写完整的文档
5. 提交 Pull Request

示例要求：
- 代码清晰易懂
- 有详细的注释
- 提供完整的 README
- 包含使用说明
- 展示特定功能或技巧
- 处理 WebGL2 不支持的错误情况

---

## 技术支持

- **文档**: 查看各示例目录下的 README.md
- **问题反馈**: 在 GitHub Issues 中提交
- **讨论**: 在 GitHub Discussions 中交流
- **API 参考**: 查看 `lib/` 目录下的类型定义文件

---

## 许可证

本项目遵循 MIT 许可证。详情请查看项目根目录的 LICENSE 文件。

---

## 资源链接

- [WebGL2 规范](https://www.khronos.org/registry/webgl/specs/latest/2.0/)
- [WebGL Fundamentals](https://webglfundamentals.org/)
- [MDN WebGL 教程](https://developer.mozilla.org/zh-CN/docs/Web/API/WebGL_API)
- [The Book of Shaders](https://thebookofshaders.com/)
- [Learn OpenGL](https://learnopengl.com/)

---

**祝您学习愉快！🎉**

如有任何问题，欢迎随时提问。
