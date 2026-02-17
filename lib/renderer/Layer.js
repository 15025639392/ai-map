import { LayerState } from './types.js';
/**
 * Layer 基类
 * 负责图层生命周期管理（add/remove/show/hide）
 */
export class Layer {
    static _idCounter = 0;
    id;
    priority;
    visible;
    name;
    _state = LayerState.INITIALIZED;
    _hooks;
    _renderer = null;
    _disposed = false;
    constructor(options = {}) {
        this.id = options.id || `layer-${Layer._idCounter++}`;
        this.priority = options.priority ?? 0;
        this.visible = options.visible ?? true;
        this.name = options.name || this.id;
        this._hooks = options.hooks || {};
    }
    /**
     * 获取图层状态
     */
    get state() {
        return this._state;
    }
    /**
     * 获取关联的渲染器
     */
    get renderer() {
        return this._renderer;
    }
    /**
     * 添加到渲染器
     */
    add(renderer) {
        if (this._disposed) {
            throw new Error(`Layer ${this.id} is disposed`);
        }
        if (this._state === LayerState.ADDED || this._state === LayerState.SHOWN) {
            console.warn(`Layer ${this.id} is already added`);
            return;
        }
        this._renderer = renderer;
        // 注册渲染节点
        renderer.pipeline.addNode(this);
        // 触发 onAdd 钩子
        this._triggerHook('onAdd');
        this._state = LayerState.ADDED;
        // 如果可见，设置为 SHOWN 状态
        if (this.visible) {
            this._state = LayerState.SHOWN;
        }
    }
    /**
     * 从渲染器移除
     */
    remove() {
        if (this._disposed) {
            throw new Error(`Layer ${this.id} is disposed`);
        }
        if (this._state === LayerState.INITIALIZED || this._state === LayerState.REMOVED) {
            console.warn(`Layer ${this.id} is not added`);
            return;
        }
        // 触发 onRemove 钩子
        this._triggerHook('onRemove');
        // 从渲染管线移除
        if (this._renderer) {
            this._renderer.pipeline.removeNode(this.id);
            this._renderer = null;
        }
        this._state = LayerState.REMOVED;
    }
    /**
     * 显示图层
     */
    show() {
        if (this._disposed) {
            throw new Error(`Layer ${this.id} is disposed`);
        }
        if (this._state === LayerState.INITIALIZED || this._state === LayerState.REMOVED) {
            console.warn(`Layer ${this.id} is not added. Add it to renderer first.`);
            return;
        }
        if (this.visible) {
            return;
        }
        this.visible = true;
        // 触发 onShow 钩子
        this._triggerHook('onShow');
        this._state = LayerState.SHOWN;
    }
    /**
     * 隐藏图层
     */
    hide() {
        if (this._disposed) {
            throw new Error(`Layer ${this.id} is disposed`);
        }
        if (this._state === LayerState.INITIALIZED || this._state === LayerState.REMOVED) {
            console.warn(`Layer ${this.id} is not added. Add it to renderer first.`);
            return;
        }
        if (!this.visible) {
            return;
        }
        this.visible = false;
        // 触发 onHide 钩子
        this._triggerHook('onHide');
        this._state = LayerState.HIDDEN;
    }
    /**
     * 切换可见性
     */
    toggle() {
        if (this.visible) {
            this.hide();
        }
        else {
            this.show();
        }
    }
    /**
     * 更新优先级
     */
    setPriority(priority) {
        if (this._disposed) {
            throw new Error(`Layer ${this.id} is disposed`);
        }
        if (this.priority !== priority) {
            this.priority = priority;
            // 如果已添加到渲染器，更新渲染管线
            if (this._renderer) {
                this._renderer.pipeline.updateNode(this.id, () => {
                    // 优先级更新会触发重新排序
                });
            }
        }
    }
    /**
     * 检查是否已添加到渲染器
     */
    isAdded() {
        return (this._state === LayerState.ADDED ||
            this._state === LayerState.SHOWN ||
            this._state === LayerState.HIDDEN);
    }
    /**
     * 检查是否可见
     */
    isVisible() {
        return this.visible;
    }
    /**
     * 检查是否已销毁
     */
    isDisposed() {
        return this._disposed;
    }
    /**
     * 注册 WebGL 资源
     */
    registerResource(resourceId, type, resource, disposeFn) {
        if (!this._renderer) {
            throw new Error(`Layer ${this.id} is not added to a renderer`);
        }
        this._renderer.resourceManager.registerResource(resourceId, type, resource, disposeFn);
    }
    /**
     * 增加 WebGL 资源引用
     */
    addResourceRef(resourceId) {
        if (!this._renderer) {
            throw new Error(`Layer ${this.id} is not added to a renderer`);
        }
        this._renderer.resourceManager.addRef(resourceId);
    }
    /**
     * 减少 WebGL 资源引用
     */
    releaseResourceRef(resourceId) {
        if (!this._renderer) {
            throw new Error(`Layer ${this.id} is not added to a renderer`);
        }
        this._renderer.resourceManager.releaseRef(resourceId);
    }
    /**
     * 直接释放 WebGL 资源
     */
    disposeResource(resourceId) {
        if (!this._renderer) {
            throw new Error(`Layer ${this.id} is not added to a renderer`);
        }
        this._renderer.resourceManager.disposeResource(resourceId);
    }
    /**
     * 清理资源（由子类实现）
     */
    disposeResources() {
        // 子类可以重写此方法来清理自定义资源
    }
    /**
     * 销毁图层
     */
    dispose() {
        if (this._disposed) {
            return;
        }
        // 保存渲染器引用，用于清理资源
        const renderer = this._renderer;
        // 如果已添加到渲染器，移除
        if (this.isAdded()) {
            this.remove();
        }
        // 清理资源（在 remove 之后，但使用保存的引用）
        this._renderer = renderer;
        this.disposeResources();
        this._renderer = null;
        this._disposed = true;
        this._state = LayerState.DISPOSED;
    }
    /**
     * 触发生命周期钩子
     */
    async _triggerHook(hookName) {
        const hook = this._hooks[hookName];
        if (hook) {
            try {
                await hook();
            }
            catch (error) {
                console.error(`[Layer ${this.id}] Hook ${hookName} failed:`, error);
            }
        }
    }
}
//# sourceMappingURL=Layer.js.map