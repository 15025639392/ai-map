import { Layer } from '../renderer/Layer.js';
import type { IRenderer, ILayerOptions } from '../renderer/types.js';
/**
 * 栅格图层选项
 */
export interface IRasterLayerOptions extends ILayerOptions {
    /** 瓦片URL模板，支持 {x}, {y}, {z} 占位符 */
    tileUrl: string;
    /** 最小缩放级别 */
    minZoom?: number;
    /** 最大缩放级别 */
    maxZoom?: number;
    /** 当前缩放级别 */
    zoom?: number;
    /** 瓦片大小（像素） */
    tileSize?: number;
    /** 是否允许跨域加载 */
    crossOrigin?: string;
}
/**
 * 栅格图层类
 * 用于渲染地图瓦片（如高德卫星图）
 */
export declare class RasterLayer extends Layer {
    private _tileUrl;
    private _minZoom;
    private _maxZoom;
    private _currentZoom;
    private _tileSize;
    private _crossOrigin;
    private _tiles;
    private _program;
    private _gl;
    private _positionBuffer;
    private _texCoordBuffer;
    constructor(options: IRasterLayerOptions);
    /**
     * 设置缩放级别
     */
    setZoom(zoom: number): void;
    /**
     * 获取缩放级别
     */
    getZoom(): number;
    /**
     * 获取最小缩放级别
     */
    getMinZoom(): number;
    /**
     * 获取最大缩放级别
     */
    getMaxZoom(): number;
    /**
     * 设置瓦片URL
     */
    setTileUrl(tileUrl: string): void;
    /**
     * 获取瓦片URL
     */
    getTileUrl(): string;
    /**
     * 清空所有瓦片
     */
    private _clearTiles;
    /**
     * 加载可见瓦片
     */
    private _loadVisibleTiles;
    /**
     * 加载单个瓦片
     */
    private _loadTile;
    /**
     * 瓦片加载完成回调
     */
    private _onTileLoad;
    /**
     * 初始化着色器
     */
    private _initShaders;
    /**
     * 编译着色器
     */
    private _compileShader;
    /**
     * 初始化缓冲区
     */
    private _initBuffers;
    /**
     * 添加到渲染器时初始化
     */
    add(renderer: IRenderer): void;
    /**
     * 渲染图层
     */
    render(renderer: IRenderer): void;
    /**
     * 清理资源
     */
    protected disposeResources(): void;
    /**
     * 销毁图层
     */
    dispose(): void;
    /**
     * 获取统计信息
     */
    getStats(): {
        totalTiles: number;
        loadedTiles: number;
        loadingTiles: number;
        errorTiles: number;
        currentZoom: number;
        minZoom: number;
        maxZoom: number;
    };
}
//# sourceMappingURL=RasterLayer.d.ts.map