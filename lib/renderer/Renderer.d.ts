import { Handler } from '../webgl/Handler.js';
import { ResourceManager } from './ResourceManager.js';
import { RenderPipeline } from './RenderPipeline.js';
import type { IRenderNode, IRendererConfig, IRenderStats, IContextInfo } from './types.js';
/**
 * WebGL2 渲染主循环
 * 负责帧循环管理、渲染队列调度、性能监控
 */
export declare class Renderer {
    private _handler;
    private _resourceManager;
    private _pipeline;
    private _canvas;
    private _config;
    private _animationFrameId;
    private _isRunning;
    private _isPaused;
    private _lastTime;
    private _targetFrameTime;
    private _contextInfo;
    constructor(config?: IRendererConfig);
    /**
     * 附加到画布
     */
    attachTo(canvas: HTMLCanvasElement, options?: WebGLContextAttributes): void;
    /**
     * 获取 WebGL2 上下文
     */
    get gl(): WebGL2RenderingContext;
    /**
     * 获取上下文信息
     */
    get contextInfo(): IContextInfo;
    /**
     * 获取处理器
     */
    get handler(): Handler;
    /**
     * 获取资源管理器
     */
    get resourceManager(): ResourceManager;
    /**
     * 获取渲染管线
     */
    get pipeline(): RenderPipeline;
    /**
     * 开始渲染循环
     */
    start(): void;
    /**
     * 停止渲染循环
     */
    stop(): void;
    /**
     * 暂停渲染
     */
    pause(): void;
    /**
     * 恢复渲染
     */
    resume(): void;
    /**
     * 渲染一帧
     */
    renderFrame(): void;
    /**
     * 渲染主循环
     */
    private _renderLoop;
    /**
     * 添加渲染节点
     */
    addNode(node: IRenderNode): void;
    /**
     * 移除渲染节点
     */
    removeNode(id: string): void;
    /**
     * 获取渲染节点
     */
    getNode(id: string): IRenderNode | undefined;
    /**
     * 获取统计信息
     */
    getStats(): IRenderStats | null;
    /**
     * 调整画布尺寸
     */
    resize(width: number, height: number): void;
    /**
     * 检查是否正在运行
     */
    get isRunning(): boolean;
    /**
     * 检查是否暂停
     */
    get isPaused(): boolean;
    /**
     * 销毁渲染器
     */
    dispose(): void;
}
//# sourceMappingURL=Renderer.d.ts.map