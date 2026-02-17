/**
 * 抽象命令基类
 */
export class Command {
    executed = false;
    /**
     * 执行命令
     */
    async execute() {
        if (this.executed) {
            throw new Error('Command already executed');
        }
        await this.doExecute();
        this.executed = true;
    }
    /**
     * 撤销命令
     */
    async undo() {
        if (!this.executed) {
            throw new Error('Command not executed yet');
        }
        await this.doUndo();
        this.executed = false;
    }
    /**
     * 是否已执行
     */
    isExecuted() {
        return this.executed;
    }
    /**
     * 是否可以合并（默认不支持）
     */
    canMerge(_command) {
        return false;
    }
    /**
     * 合并命令（默认不支持）
     */
    merge(_command) {
        throw new Error('Command merge not supported');
    }
}
//# sourceMappingURL=Command.js.map