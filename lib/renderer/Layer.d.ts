import type { IRenderNode, IRenderer, ILayerOptions } from './types.js';
import { LayerState } from './types.js';
/**
 * Layer 基类
 * 负责图层生命周期管理（add/remove/show/hide）
 */
export declare abstract class Layer implements IRenderNode {
    private static _idCounter;
    readonly id: string;
    priority: number;
    visible: boolean;
    readonly name: string;
    private _state;
    private _hooks;
    private _renderer;
    private _disposed;
    constructor(options?: ILayerOptions);
    /**
     * 获取图层状态
     */
    get state(): LayerState;
    /**
     * 获取关联的渲染器
     */
    get renderer(): IRenderer | null;
    /**
     * 添加到渲染器
     */
    add(renderer: IRenderer): void;
    /**
     * 从渲染器移除
     */
    remove(): void;
    /**
     * 显示图层
     */
    show(): void;
    /**
     * 隐藏图层
     */
    hide(): void;
    /**
     * 切换可见性
     */
    toggle(): void;
    /**
     * 更新优先级
     */
    setPriority(priority: number): void;
    /**
     * 检查是否已添加到渲染器
     */
    isAdded(): boolean;
    /**
     * 检查是否可见
     */
    isVisible(): boolean;
    /**
     * 注册 WebGL 资源
     */
    protected registerResource(resourceId: string, type: 'texture' | 'program' | 'buffer' | 'framebuffer', resource: WebGLTexture | WebGLProgram | WebGLBuffer | WebGLFramebuffer, disposeFn: () => void): void;
    /**
     * 增加 WebGL 资源引用
     */
    protected addResourceRef(resourceId: string): void;
    /**
     * 减少 WebGL 资源引用
     */
    protected releaseResourceRef(resourceId: string): void;
    /**
     * 直接释放 WebGL 资源
     */
    protected disposeResource(resourceId: string): void;
    /**
     * 渲染方法（由子类实现）
     */
    abstract render(renderer: IRenderer): void;
    /**
     * 清理资源（由子类实现）
     */
    protected disposeResources(): void;
    /**
     * 销毁图层
     */
    dispose(): void;
    /**
     * 触发生命周期钩子
     */
    private _triggerHook;
}
//# sourceMappingURL=Layer.d.ts.map