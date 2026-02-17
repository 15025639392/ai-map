import type { IContextInfo } from '../renderer/types.js';
/**
 * WebGL2 上下文管理器
 * 负责初始化 WebGL2 上下文、检测扩展支持、处理上下文丢失与恢复
 */
export declare class Handler {
    private _gl;
    private _canvas;
    private _extensions;
    private _contextLost;
    private _restoreCallbacks;
    constructor();
    /**
     * 初始化 WebGL2 上下文
     */
    initialize(canvas: HTMLCanvasElement, options?: WebGLContextAttributes): IContextInfo;
    /**
     * 获取 WebGL2 上下文
     */
    get gl(): WebGL2RenderingContext;
    /**
     * 检查上下文是否有效
     */
    isContextValid(): boolean;
    /**
     * 获取上下文信息
     */
    getContextInfo(): IContextInfo;
    /**
     * 注册上下文恢复回调
     */
    onRestore(callback: () => void): void;
    /**
     * 检测 WebGL2 扩展
     */
    private _detectExtensions;
    /**
     * 设置上下文事件监听
     */
    private _setupContextEvents;
    /**
     * 销毁处理器
     */
    dispose(): void;
}
//# sourceMappingURL=Handler.d.ts.map