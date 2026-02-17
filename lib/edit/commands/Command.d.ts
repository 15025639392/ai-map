/**
 * 命令接口
 */
export interface ICommand {
    /** 执行命令 */
    execute(): Promise<void>;
    /** 撤销命令 */
    undo(): Promise<void>;
    /** 获取命令描述 */
    getDescription(): string;
    /** 是否可以合并 */
    canMerge?(command: ICommand): boolean;
    /** 合并命令 */
    merge?(command: ICommand): void;
}
/**
 * 抽象命令基类
 */
export declare abstract class Command implements ICommand {
    protected executed: boolean;
    /**
     * 执行命令
     */
    execute(): Promise<void>;
    /**
     * 撤销命令
     */
    undo(): Promise<void>;
    /**
     * 执行命令的具体实现
     */
    protected abstract doExecute(): Promise<void>;
    /**
     * 撤销命令的具体实现
     */
    protected abstract doUndo(): Promise<void>;
    /**
     * 获取命令描述
     */
    abstract getDescription(): string;
    /**
     * 是否已执行
     */
    isExecuted(): boolean;
    /**
     * 是否可以合并（默认不支持）
     */
    canMerge(_command: ICommand): boolean;
    /**
     * 合并命令（默认不支持）
     */
    merge(_command: ICommand): void;
}
//# sourceMappingURL=Command.d.ts.map