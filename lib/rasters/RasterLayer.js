import { Layer } from '../renderer/Layer.js';
/**
 * 栅格图层类
 * 用于渲染地图瓦片（如高德卫星图）
 */
export class RasterLayer extends Layer {
    _tileUrl;
    _minZoom;
    _maxZoom;
    _currentZoom;
    _tileSize;
    _crossOrigin;
    _tiles = new Map();
    _program = null;
    _gl = null;
    _positionBuffer = null;
    _texCoordBuffer = null;
    constructor(options) {
        super({
            ...options,
            name: options.name || 'RasterLayer',
        });
        if (!options.tileUrl) {
            throw new Error('RasterLayer: tileUrl is required');
        }
        this._tileUrl = options.tileUrl;
        this._minZoom = options.minZoom ?? 1;
        this._maxZoom = options.maxZoom ?? 18;
        this._currentZoom = options.zoom ?? 10;
        this._tileSize = options.tileSize ?? 256;
        this._crossOrigin = options.crossOrigin ?? 'anonymous';
    }
    /**
     * 设置缩放级别
     */
    setZoom(zoom) {
        if (zoom < this._minZoom || zoom > this._maxZoom) {
            console.warn(`Zoom level ${zoom} is out of range [${this._minZoom}, ${this._maxZoom}]`);
            return;
        }
        this._currentZoom = Math.floor(zoom);
        this._loadVisibleTiles();
    }
    /**
     * 获取缩放级别
     */
    getZoom() {
        return this._currentZoom;
    }
    /**
     * 获取最小缩放级别
     */
    getMinZoom() {
        return this._minZoom;
    }
    /**
     * 获取最大缩放级别
     */
    getMaxZoom() {
        return this._maxZoom;
    }
    /**
     * 设置瓦片URL
     */
    setTileUrl(tileUrl) {
        this._tileUrl = tileUrl;
        this._clearTiles();
        this._loadVisibleTiles();
    }
    /**
     * 获取瓦片URL
     */
    getTileUrl() {
        return this._tileUrl;
    }
    /**
     * 清空所有瓦片
     */
    _clearTiles() {
        const gl = this._gl;
        if (gl) {
            this._tiles.forEach((tile) => {
                if (tile.texture) {
                    gl.deleteTexture(tile.texture);
                }
            });
        }
        this._tiles.clear();
    }
    /**
     * 加载可见瓦片
     */
    _loadVisibleTiles() {
        const z = this._currentZoom;
        const tileCount = Math.pow(2, z);
        // 为演示目的，加载中心区域的瓦片
        // 实际应用中应该根据视口计算需要加载的瓦片范围
        const centerTileCount = Math.min(4, tileCount);
        const centerStart = Math.floor((tileCount - centerTileCount) / 2);
        for (let x = centerStart; x < centerStart + centerTileCount; x++) {
            for (let y = centerStart; y < centerStart + centerTileCount; y++) {
                const tileKey = `${z}-${x}-${y}`;
                if (!this._tiles.has(tileKey)) {
                    this._loadTile(x, y, z);
                }
            }
        }
    }
    /**
     * 加载单个瓦片
     */
    _loadTile(x, y, z) {
        const tileKey = `${z}-${x}-${y}`;
        const tile = {
            x,
            y,
            z,
            texture: null,
            loading: true,
            loaded: false,
            error: false,
        };
        this._tiles.set(tileKey, tile);
        // 构建瓦片URL
        const url = this._tileUrl
            .replace('{x}', x.toString())
            .replace('{y}', y.toString())
            .replace('{z}', z.toString());
        // 创建图片元素
        const img = new Image();
        img.crossOrigin = this._crossOrigin;
        img.onload = () => {
            this._onTileLoad(tileKey, img);
        };
        img.onerror = () => {
            console.error(`Failed to load tile: ${url}`);
            tile.loading = false;
            tile.loaded = false;
            tile.error = true;
        };
        img.src = url;
    }
    /**
     * 瓦片加载完成回调
     */
    _onTileLoad(tileKey, img) {
        const gl = this._gl;
        if (!gl)
            return;
        const tile = this._tiles.get(tileKey);
        if (!tile)
            return;
        // 创建纹理
        const texture = gl.createTexture();
        if (!texture) {
            console.error(`Failed to create texture for tile: ${tileKey}`);
            tile.loading = false;
            tile.loaded = false;
            tile.error = true;
            return;
        }
        // 绑定纹理
        gl.bindTexture(gl.TEXTURE_2D, texture);
        // 设置纹理参数
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        // 上传纹理数据
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        // 更新瓦片状态
        tile.texture = texture;
        tile.loading = false;
        tile.loaded = true;
        tile.error = false;
        console.log(`Tile loaded: ${tileKey}`);
    }
    /**
     * 初始化着色器
     */
    _initShaders() {
        const gl = this._gl;
        if (!gl)
            return;
        // 顶点着色器
        const vsSource = `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;

      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
      }
    `;
        // 片段着色器
        const fsSource = `
      precision mediump float;
      varying vec2 v_texCoord;
      uniform sampler2D u_texture;

      void main() {
        gl_FragColor = texture2D(u_texture, v_texCoord);
      }
    `;
        // 编译着色器
        const vs = this._compileShader(gl, gl.VERTEX_SHADER, vsSource);
        const fs = this._compileShader(gl, gl.FRAGMENT_SHADER, fsSource);
        if (!vs || !fs) {
            console.error('Failed to compile shaders');
            return;
        }
        // 创建程序
        const program = gl.createProgram();
        if (!program) {
            console.error('Failed to create program');
            return;
        }
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);
        // 检查链接状态
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Failed to link program:', gl.getProgramInfoLog(program));
            gl.deleteProgram(program);
            return;
        }
        this._program = program;
        // 初始化缓冲区
        this._initBuffers();
    }
    /**
     * 编译着色器
     */
    _compileShader(gl, type, source) {
        const shader = gl.createShader(type);
        if (!shader) {
            return null;
        }
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Shader compile error:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }
    /**
     * 初始化缓冲区
     */
    _initBuffers() {
        const gl = this._gl;
        if (!gl || !this._program)
            return;
        // 创建位置缓冲区
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        const positions = new Float32Array([
            // 四个顶点的位置（屏幕空间）
            -1.0, -1.0,
            1.0, -1.0,
            -1.0, 1.0,
            1.0, 1.0,
        ]);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
        const positionLoc = gl.getAttribLocation(this._program, 'a_position');
        gl.enableVertexAttribArray(positionLoc);
        gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
        this._positionBuffer = positionBuffer;
        // 创建纹理坐标缓冲区
        const texCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
        const texCoords = new Float32Array([
            0.0, 1.0,
            1.0, 1.0,
            0.0, 0.0,
            1.0, 0.0,
        ]);
        gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
        const texCoordLoc = gl.getAttribLocation(this._program, 'a_texCoord');
        gl.enableVertexAttribArray(texCoordLoc);
        gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 0, 0);
        this._texCoordBuffer = texCoordBuffer;
    }
    /**
     * 添加到渲染器时初始化
     */
    add(renderer) {
        super.add(renderer);
        this._gl = renderer.gl;
        this._initShaders();
        this._loadVisibleTiles();
    }
    /**
     * 渲染图层
     */
    render(renderer) {
        if (!this.visible || this.isDisposed()) {
            return;
        }
        const gl = this._gl;
        if (!gl || !this._program)
            return;
        // 使用程序
        gl.useProgram(this._program);
        // 渲染已加载的瓦片
        const loadedTiles = Array.from(this._tiles.values()).filter(t => t.loaded && t.texture);
        if (loadedTiles.length > 0) {
            // 为了演示，我们渲染第一个可用的瓦片
            // 实际应用中需要根据视口计算每个瓦片的位置和变换矩阵
            const tile = loadedTiles[0];
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, tile.texture);
            gl.uniform1i(gl.getUniformLocation(this._program, 'u_texture'), 0);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }
    }
    /**
     * 清理资源
     */
    disposeResources() {
        const gl = this._gl;
        if (gl) {
            // 删除程序
            if (this._program) {
                gl.deleteProgram(this._program);
                this._program = null;
            }
            // 删除缓冲区
            if (this._positionBuffer) {
                gl.deleteBuffer(this._positionBuffer);
                this._positionBuffer = null;
            }
            if (this._texCoordBuffer) {
                gl.deleteBuffer(this._texCoordBuffer);
                this._texCoordBuffer = null;
            }
            // 删除所有纹理
            this._tiles.forEach((tile) => {
                if (tile.texture) {
                    gl.deleteTexture(tile.texture);
                }
            });
        }
        this._clearTiles();
    }
    /**
     * 销毁图层
     */
    dispose() {
        if (this.isDisposed()) {
            return;
        }
        this.disposeResources();
        this._gl = null;
        super.dispose();
    }
    /**
     * 获取统计信息
     */
    getStats() {
        const tiles = Array.from(this._tiles.values());
        return {
            totalTiles: tiles.length,
            loadedTiles: tiles.filter(t => t.loaded).length,
            loadingTiles: tiles.filter(t => t.loading).length,
            errorTiles: tiles.filter(t => t.error).length,
            currentZoom: this._currentZoom,
            minZoom: this._minZoom,
            maxZoom: this._maxZoom,
        };
    }
}
//# sourceMappingURL=RasterLayer.js.map