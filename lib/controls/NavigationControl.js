import { ControlEventType, } from './types.js';
import { EventBus } from './EventBus.js';
import { PerformanceMonitor } from './PerformanceMonitor.js';
/**
 * 默认导航选项
 */
const DEFAULT_OPTIONS = {
    duration: 300,
    easing: (t) => t * (2 - t), // easeOutQuad
};
/**
 * 导航控件
 */
export class NavigationControl {
    state;
    eventBus;
    performanceMonitor;
    animationFrame = null;
    targetState = null;
    constructor(initialState = {
        center: [0, 0],
        zoom: 1,
        rotation: 0,
        tilt: 0,
    }) {
        this.state = { ...initialState };
        this.eventBus = new EventBus();
        this.performanceMonitor = new PerformanceMonitor();
    }
    /**
     * 获取当前导航状态
     */
    getState() {
        return { ...this.state };
    }
    /**
     * 设置中心点
     */
    setCenter(center, options) {
        this.updateState({ center }, options);
    }
    /**
     * 设置缩放级别
     */
    setZoom(zoom, options) {
        this.updateState({ zoom }, options);
    }
    /**
     * 缩放
     */
    zoom(delta, options) {
        const newZoom = this.state.zoom + delta;
        this.setZoom(newZoom, options);
    }
    /**
     * 设置旋转角度
     */
    setRotation(rotation, options) {
        this.updateState({ rotation }, options);
    }
    /**
     * 旋转
     */
    rotate(delta, options) {
        const newRotation = this.state.rotation + delta;
        this.setRotation(newRotation, options);
    }
    /**
     * 设置倾斜角度
     */
    setTilt(tilt, options) {
        this.updateState({ tilt }, options);
    }
    /**
     * 倾斜
     */
    tilt(delta, options) {
        const newTilt = this.state.tilt + delta;
        this.setTilt(newTilt, options);
    }
    /**
     * 飞行定位
     */
    flyTo(target, options) {
        const newTargetState = {
            center: target.center,
            zoom: target.zoom ?? this.state.zoom,
            rotation: target.rotation ?? this.state.rotation,
            tilt: target.tilt ?? this.state.tilt,
        };
        this.updateState(newTargetState, options);
    }
    /**
     * 平移
     */
    pan(deltaX, deltaY, options) {
        const newCenter = [
            this.state.center[0] + deltaX,
            this.state.center[1] + deltaY,
        ];
        this.setCenter(newCenter, options);
    }
    /**
     * 更新状态（支持动画）
     */
    updateState(partialState, options) {
        const opts = { ...DEFAULT_OPTIONS, ...options };
        // 如果没有动画时长，直接更新
        if (!opts.duration || opts.duration <= 0) {
            this.applyUpdate(partialState);
            return;
        }
        // 使用动画过渡
        this.animateToState(partialState, opts);
    }
    /**
     * 应用更新
     */
    applyUpdate(partialState) {
        const oldState = { ...this.state };
        this.state = { ...this.state, ...partialState };
        this.emitNavigationChangeEvent(oldState);
    }
    /**
     * 动画过渡到目标状态
     */
    animateToState(partialState, options) {
        // 取消之前的动画
        if (this.animationFrame !== null) {
            cancelAnimationFrame(this.animationFrame);
        }
        const startTime = performance.now();
        const startState = { ...this.state };
        const endState = { ...this.state, ...partialState };
        const animate = () => {
            const elapsed = performance.now() - startTime;
            const progress = Math.min(elapsed / (options.duration || 300), 1);
            const easedProgress = options.easing ? options.easing(progress) : progress;
            // 插值计算
            this.state = {
                center: this.interpolate(startState.center, endState.center, easedProgress),
                zoom: startState.zoom + (endState.zoom - startState.zoom) * easedProgress,
                rotation: startState.rotation + (endState.rotation - startState.rotation) * easedProgress,
                tilt: startState.tilt + (endState.tilt - startState.tilt) * easedProgress,
            };
            this.emitNavigationChangeEvent(startState);
            if (progress < 1) {
                this.animationFrame = requestAnimationFrame(animate);
            }
            else {
                this.animationFrame = null;
            }
        };
        this.animationFrame = requestAnimationFrame(animate);
    }
    /**
     * 插值计算坐标
     */
    interpolate(start, end, t) {
        return [
            start[0] + (end[0] - start[0]) * t,
            start[1] + (end[1] - start[1]) * t,
        ];
    }
    /**
     * 发送导航改变事件
     */
    emitNavigationChangeEvent(oldState) {
        this.eventBus.emit(ControlEventType.NAVIGATION_CHANGE, {
            oldState,
            newState: { ...this.state },
        });
    }
    /**
     * 订阅事件
     */
    on(eventType, listener) {
        return this.eventBus.on(eventType, listener);
    }
    /**
     * 取消订阅
     */
    off(eventType, listener) {
        this.eventBus.off(eventType, listener);
    }
    /**
     * 获取性能监控器
     */
    getPerformanceMonitor() {
        return this.performanceMonitor;
    }
    /**
     * 销毁控件
     */
    dispose() {
        if (this.animationFrame !== null) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        this.eventBus.clear();
        this.performanceMonitor.clear();
    }
}
//# sourceMappingURL=NavigationControl.js.map