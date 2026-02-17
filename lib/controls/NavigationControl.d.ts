import { INavigationState, INavigationOptions, IFlyToTarget, ControlEventType } from './types.js';
import { PerformanceMonitor } from './PerformanceMonitor.js';
import type { Coordinate } from '../vectortypes.js';
/**
 * 导航控件
 */
export declare class NavigationControl {
    private state;
    private eventBus;
    private performanceMonitor;
    private animationFrame;
    private targetState;
    constructor(initialState?: INavigationState);
    /**
     * 获取当前导航状态
     */
    getState(): INavigationState;
    /**
     * 设置中心点
     */
    setCenter(center: Coordinate, options?: INavigationOptions): void;
    /**
     * 设置缩放级别
     */
    setZoom(zoom: number, options?: INavigationOptions): void;
    /**
     * 缩放
     */
    zoom(delta: number, options?: INavigationOptions): void;
    /**
     * 设置旋转角度
     */
    setRotation(rotation: number, options?: INavigationOptions): void;
    /**
     * 旋转
     */
    rotate(delta: number, options?: INavigationOptions): void;
    /**
     * 设置倾斜角度
     */
    setTilt(tilt: number, options?: INavigationOptions): void;
    /**
     * 倾斜
     */
    tilt(delta: number, options?: INavigationOptions): void;
    /**
     * 飞行定位
     */
    flyTo(target: IFlyToTarget, options?: INavigationOptions): void;
    /**
     * 平移
     */
    pan(deltaX: number, deltaY: number, options?: INavigationOptions): void;
    /**
     * 更新状态（支持动画）
     */
    private updateState;
    /**
     * 应用更新
     */
    private applyUpdate;
    /**
     * 动画过渡到目标状态
     */
    private animateToState;
    /**
     * 插值计算坐标
     */
    private interpolate;
    /**
     * 发送导航改变事件
     */
    private emitNavigationChangeEvent;
    /**
     * 订阅事件
     */
    on(eventType: ControlEventType, listener: any): () => void;
    /**
     * 取消订阅
     */
    off(eventType: ControlEventType, listener: any): void;
    /**
     * 获取性能监控器
     */
    getPerformanceMonitor(): PerformanceMonitor;
    /**
     * 销毁控件
     */
    dispose(): void;
}
//# sourceMappingURL=NavigationControl.d.ts.map