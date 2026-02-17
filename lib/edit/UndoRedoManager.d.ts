import type { Command } from './commands/Command.js';
import type { IEditConfig } from './types.js';
/**
 * 撤销/重做管理器
 */
export declare class UndoRedoManager {
    private undoStack;
    private redoStack;
    private config;
    private isExecuting;
    constructor(config?: IEditConfig);
    /**
     * 执行命令
     */
    executeCommand(command: Command): Promise<void>;
    /**
     * 撤销
     */
    undo(): Promise<void>;
    /**
     * 重做
     */
    redo(): Promise<void>;
    /**
     * 是否可以撤销
     */
    canUndo(): boolean;
    /**
     * 是否可以重做
     */
    canRedo(): boolean;
    /**
     * 获取撤销历史大小
     */
    getUndoCount(): number;
    /**
     * 获取重做历史大小
     */
    getRedoCount(): number;
    /**
     * 清空历史
     */
    clear(): void;
    /**
     * 获取当前状态快照
     */
    getSnapshot(): {
        undoStack: Array<{
            description: string;
            executed: boolean;
        }>;
        redoStack: Array<{
            description: string;
            executed: boolean;
        }>;
    };
    /**
     * 回放验证 - 执行所有撤销和重做，验证状态一致性
     */
    replayValidation(): Promise<boolean>;
    /**
     * 批量回放验证 - 执行n次完整的撤销重做循环
     */
    batchReplayValidation(count: number): Promise<{
        success: boolean;
        iterations: number;
        failures: number;
    }>;
}
//# sourceMappingURL=UndoRedoManager.d.ts.map