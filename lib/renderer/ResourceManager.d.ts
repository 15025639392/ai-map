import type { IResourceRef } from './types.js';
/**
 * WebGL 资源管理器
 * 负责管理 WebGL 资源的生命周期，使用引用计数自动清理未使用的资源
 */
export declare class ResourceManager {
    private _resources;
    private _disposed;
    /**
     * 注册资源
     */
    registerResource(id: string, type: IResourceRef['type'], resource: IResourceRef['resource'], disposeFn: () => void): void;
    /**
     * 增加资源引用计数
     */
    addRef(id: string): void;
    /**
     * 减少资源引用计数，如果计数为 0 则释放资源
     */
    releaseRef(id: string): void;
    /**
     * 直接释放资源
     */
    disposeResource(id: string): void;
    /**
     * 获取资源引用
     */
    getResource(id: string): IResourceRef | undefined;
    /**
     * 检查资源是否存在
     */
    hasResource(id: string): boolean;
    /**
     * 获取所有资源信息
     */
    getResourceInfo(): Array<{
        id: string;
        type: IResourceRef['type'];
        refCount: number;
    }>;
    /**
     * 获取资源数量
     */
    getResourceCount(): number;
    /**
     * 释放所有资源
     */
    disposeAll(): void;
    /**
     * 清理泄漏检测（查找引用计数大于 0 但未使用的资源）
     */
    detectLeaks(): Array<string>;
    /**
     * 安全释放资源
     */
    private _safeDisposeResource;
    /**
     * 销毁资源管理器
     */
    dispose(): void;
}
//# sourceMappingURL=ResourceManager.d.ts.map