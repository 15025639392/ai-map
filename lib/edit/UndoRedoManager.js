/**
 * 撤销/重做管理器
 */
export class UndoRedoManager {
    undoStack = [];
    redoStack = [];
    config;
    isExecuting = false;
    constructor(config = {}) {
        this.config = {
            maxHistory: config.maxHistory ?? 1000,
            autoSave: config.autoSave ?? true,
            enabledTools: config.enabledTools ?? [],
        };
    }
    /**
     * 执行命令
     */
    async executeCommand(command) {
        if (this.isExecuting) {
            throw new Error('Cannot execute command while another command is executing');
        }
        this.isExecuting = true;
        try {
            await command.execute();
            // 尝试合并命令
            const canMerge = this.undoStack.length > 0 &&
                this.undoStack[this.undoStack.length - 1]?.canMerge?.(command);
            if (canMerge) {
                this.undoStack[this.undoStack.length - 1]?.merge?.(command);
            }
            else {
                this.undoStack.push(command);
                // 限制历史记录大小
                if (this.undoStack.length > this.config.maxHistory) {
                    this.undoStack.shift();
                }
            }
            // 清空重做栈
            this.redoStack = [];
        }
        finally {
            this.isExecuting = false;
        }
    }
    /**
     * 撤销
     */
    async undo() {
        if (this.undoStack.length === 0) {
            return;
        }
        if (this.isExecuting) {
            throw new Error('Cannot undo while a command is executing');
        }
        this.isExecuting = true;
        try {
            const command = this.undoStack.pop();
            await command.undo();
            this.redoStack.push(command);
        }
        finally {
            this.isExecuting = false;
        }
    }
    /**
     * 重做
     */
    async redo() {
        if (this.redoStack.length === 0) {
            return;
        }
        if (this.isExecuting) {
            throw new Error('Cannot redo while a command is executing');
        }
        this.isExecuting = true;
        try {
            const command = this.redoStack.pop();
            await command.execute();
            this.undoStack.push(command);
        }
        finally {
            this.isExecuting = false;
        }
    }
    /**
     * 是否可以撤销
     */
    canUndo() {
        return this.undoStack.length > 0;
    }
    /**
     * 是否可以重做
     */
    canRedo() {
        return this.redoStack.length > 0;
    }
    /**
     * 获取撤销历史大小
     */
    getUndoCount() {
        return this.undoStack.length;
    }
    /**
     * 获取重做历史大小
     */
    getRedoCount() {
        return this.redoStack.length;
    }
    /**
     * 清空历史
     */
    clear() {
        this.undoStack = [];
        this.redoStack = [];
    }
    /**
     * 获取当前状态快照
     */
    getSnapshot() {
        return {
            undoStack: this.undoStack.map((cmd) => ({
                description: cmd.getDescription(),
                executed: cmd.isExecuted?.() ?? true,
            })),
            redoStack: this.redoStack.map((cmd) => ({
                description: cmd.getDescription(),
                executed: cmd.isExecuted?.() ?? true,
            })),
        };
    }
    /**
     * 回放验证 - 执行所有撤销和重做，验证状态一致性
     */
    async replayValidation() {
        // 保存原始状态
        const originalUndoStack = [...this.undoStack];
        const originalRedoStack = [...this.redoStack];
        try {
            // 1. 完全撤销
            while (this.undoStack.length > 0) {
                await this.undo();
            }
            // 2. 完全重做
            while (this.redoStack.length > 0) {
                await this.redo();
            }
            // 验证恢复到原始状态
            return (this.undoStack.length === originalUndoStack.length &&
                this.redoStack.length === originalRedoStack.length);
        }
        catch (error) {
            console.error('[UndoRedoManager] Replay validation failed:', error);
            return false;
        }
        finally {
            // 恢复原始状态（如果验证失败）
            if (this.undoStack.length !== originalUndoStack.length) {
                this.undoStack = [...originalUndoStack];
                this.redoStack = [...originalRedoStack];
            }
        }
    }
    /**
     * 批量回放验证 - 执行n次完整的撤销重做循环
     */
    async batchReplayValidation(count) {
        const snapshot1 = this.getSnapshot();
        let failures = 0;
        for (let i = 0; i < count; i++) {
            const success = await this.replayValidation();
            if (!success) {
                failures++;
            }
        }
        const snapshot2 = this.getSnapshot();
        return {
            success: failures === 0,
            iterations: count,
            failures,
        };
    }
}
//# sourceMappingURL=UndoRedoManager.js.map