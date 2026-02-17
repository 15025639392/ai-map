# 故障排除指南

## 问题：RasterLayer 导入错误

如果您遇到以下错误：
```
The requested module '/@fs/.../lib/index.js' does not provide an export named 'RasterLayer'
```

### 解决方案

#### 1. 重新构建项目

```bash
npm run build
```

#### 2. 清除 Vite 缓存

```bash
rm -rf node_modules/.vite
```

#### 3. 重启 Vite 服务器

停止当前的 Vite 服务器（Ctrl+C），然后重新启动：

```bash
npx vite serve demos/raster-layer
```

#### 4. 使用正确的启动方法

确保在项目根目录下运行：

```bash
cd /Users/ldy/Desktop/test/map
npx vite serve demos/raster-layer
```

#### 5. 验证文件结构

确保以下文件存在：

```
/Users/ldy/Desktop/test/map/
├── lib/
│   ├── index.js (包含 RasterLayer 导出)
│   ├── index.d.ts
│   └── rasters/
│       └── RasterLayer.js
└── src/
    ├── index.ts (包含 RasterLayer 导出)
    └── rasters/
        └── RasterLayer.ts
```

#### 6. 检查导出

运行测试脚本验证导出是否正确：

```bash
node test-import.mjs
```

预期输出：
```
Testing RasterLayer import...
✓ Renderer: function
✓ Layer: function
✓ RasterLayer: function
✓ VectorLayer: function

✓ RasterLayer instance created successfully!
  Name: Test Layer
  Tile URL: https://example.com/tiles/{z}/{x}/{y}.png
  Zoom: 10
  Min Zoom: 1
  Max Zoom: 18

✓ VectorLayer instance created successfully!
  Name: Test Vector Layer

✅ All tests passed!
```

#### 7. 浏览器测试

打开以下文件在浏览器中测试：

1. `test-simple.html` - 简单的导入测试
2. `test-rasterlayer-import.html` - 完整的导入测试
3. `demos/raster-layer/debug.html` - 调试页面

#### 8. 检查浏览器控制台

打开浏览器开发者工具（F12），查看控制台输出：

- 如果看到 `✓ Import Successful!`，则导入成功
- 如果看到错误信息，请查看错误详情

### 常见错误

#### 错误 1：模块未找到

```
Failed to resolve module specifier "lib/index.js"
```

**原因**：路径错误

**解决方案**：确保使用相对路径：
```javascript
// ✅ 正确
import { RasterLayer } from '../../lib/index.js';

// ❌ 错误
import { RasterLayer } from '/lib/index.js';
import { RasterLayer } from 'lib/index.js';
```

#### 错误 2：导出未找到

```
does not provide an export named 'RasterLayer'
```

**原因**：lib/index.js 未正确导出

**解决方案**：
```bash
# 重新构建
npm run build

# 验证导出
cat lib/index.js | grep RasterLayer
```

预期输出：
```
export { RasterLayer } from './rasters/RasterLayer.js';
```

#### 错误 3：CORS 错误

```
Access to script blocked by CORS policy
```

**原因**：通过文件协议打开 HTML

**解决方案**：使用 HTTP 服务器
```bash
npx vite serve demos/raster-layer
```

### 验证步骤

1. 运行构建命令：
```bash
npm run build
```

2. 验证 lib/index.js 包含 RasterLayer 导出：
```bash
grep "export.*RasterLayer" lib/index.js
```

3. 运行 Node.js 测试：
```bash
node test-import.mjs
```

4. 启动 Vite 服务器：
```bash
npx vite serve demos/raster-layer
```

5. 在浏览器中打开：
```
http://localhost:5173
```

### 如果问题仍然存在

1. 清除所有缓存：
```bash
rm -rf node_modules/.vite
rm -rf dist
npm run build
```

2. 重新安装依赖：
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

3. 检查浏览器版本：
- Chrome 56+
- Firefox 51+
- Safari 11+
- Edge 79+

4. 查看完整错误信息：
- 打开浏览器控制台（F12）
- 查看 Console 标签页
- 查看错误堆栈信息

### 联系支持

如果以上方法都无法解决问题，请提供以下信息：

1. 浏览器类型和版本
2. Node.js 版本：`node --version`
3. npm 版本：`npm --version`
4. 完整的错误信息
5. 浏览器控制台的堆栈跟踪

### 相关文件

- `src/index.ts` - 源代码入口
- `lib/index.js` - 编译后的入口
- `src/rasters/RasterLayer.ts` - RasterLayer 源代码
- `lib/rasters/RasterLayer.js` - 编译后的 RasterLayer
- `test-import.mjs` - Node.js 导入测试
- `test-simple.html` - 浏览器导入测试
