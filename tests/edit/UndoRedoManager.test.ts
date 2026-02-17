import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { UndoRedoManager } from '../../src/edit/UndoRedoManager.js';
import { Command } from '../../src/edit/commands/Command.js';

/**
 * 测试命令
 */
class TestCommand extends Command {
  private data: number;

  constructor(data: number) {
    super();
    this.data = data;
  }

  protected async doExecute(): Promise<void> {
    // 模拟执行
    this.data += 1;
  }

  protected async doUndo(): Promise<void> {
    // 模拟撤销
    this.data -= 1;
  }

  getDescription(): string {
    return `TestCommand ${this.data}`;
  }

  getValue(): number {
    return this.data;
  }
}

/**
 * 可合并的测试命令
 */
class MergeableCommand extends Command {
  private value: number;

  constructor(value: number) {
    super();
    this.value = value;
  }

  protected async doExecute(): Promise<void> {
    this.value += 1;
  }

  protected async doUndo(): Promise<void> {
    this.value -= 1;
  }

  getDescription(): string {
    return `MergeableCommand ${this.value}`;
  }

  getValue(): number {
    return this.value;
  }

  canMerge(command: Command): boolean {
    return command instanceof MergeableCommand;
  }

  merge(command: Command): void {
    if (command instanceof MergeableCommand) {
      this.value += command.getValue();
    }
  }
}

describe('UndoRedoManager', () => {
  let manager: UndoRedoManager;

  beforeEach(() => {
    manager = new UndoRedoManager({ maxHistory: 100 });
  });

  afterEach(() => {
    manager.clear();
  });

  describe('命令执行', () => {
    it('应该能够执行命令', async () => {
      const command = new TestCommand(0);
      await manager.executeCommand(command);

      expect(manager.canUndo()).toBe(true);
      expect(manager.canRedo()).toBe(false);
      expect(manager.getUndoCount()).toBe(1);
      expect(command.getValue()).toBe(1);
    });

    it('应该能够执行多个命令', async () => {
      const command1 = new TestCommand(0);
      const command2 = new TestCommand(0);
      const command3 = new TestCommand(0);

      await manager.executeCommand(command1);
      await manager.executeCommand(command2);
      await manager.executeCommand(command3);

      expect(manager.getUndoCount()).toBe(3);
      expect(command1.getValue()).toBe(1);
      expect(command2.getValue()).toBe(1);
      expect(command3.getValue()).toBe(1);
    });
  });

  describe('撤销', () => {
    it('应该能够撤销命令', async () => {
      const command = new TestCommand(0);
      await manager.executeCommand(command);

      await manager.undo();

      expect(manager.canUndo()).toBe(false);
      expect(manager.canRedo()).toBe(true);
      expect(manager.getRedoCount()).toBe(1);
      expect(command.getValue()).toBe(0);
    });

    it('应该能够撤销多个命令', async () => {
      const command1 = new TestCommand(0);
      const command2 = new TestCommand(0);
      const command3 = new TestCommand(0);

      await manager.executeCommand(command1);
      await manager.executeCommand(command2);
      await manager.executeCommand(command3);

      await manager.undo();
      await manager.undo();
      await manager.undo();

      expect(manager.canUndo()).toBe(false);
      expect(manager.getRedoCount()).toBe(3);
    });

    it('应该无法撤销没有执行的命令', async () => {
      const result = await manager.undo();

      expect(manager.canUndo()).toBe(false);
    });
  });

  describe('重做', () => {
    it('应该能够重做命令', async () => {
      const command = new TestCommand(0);
      await manager.executeCommand(command);
      await manager.undo();

      await manager.redo();

      expect(manager.canUndo()).toBe(true);
      expect(manager.canRedo()).toBe(false);
      expect(manager.getUndoCount()).toBe(1);
      expect(command.getValue()).toBe(1);
    });

    it('应该能够重做多个命令', async () => {
      const command1 = new TestCommand(0);
      const command2 = new TestCommand(0);
      const command3 = new TestCommand(0);

      await manager.executeCommand(command1);
      await manager.executeCommand(command2);
      await manager.executeCommand(command3);

      await manager.undo();
      await manager.undo();
      await manager.undo();

      await manager.redo();
      await manager.redo();
      await manager.redo();

      expect(manager.canUndo()).toBe(true);
      expect(manager.canRedo()).toBe(false);
      expect(manager.getUndoCount()).toBe(3);
    });

    it('应该无法重做没有撤销的命令', async () => {
      const command = new TestCommand(0);
      await manager.executeCommand(command);

      const result = await manager.redo();

      expect(manager.canRedo()).toBe(false);
    });
  });

  describe('撤销重做混合操作', () => {
    it('应该能够正确处理撤销和重做的混合操作', async () => {
      const command1 = new TestCommand(0);
      const command2 = new TestCommand(0);
      const command3 = new TestCommand(0);

      await manager.executeCommand(command1);
      await manager.executeCommand(command2);
      await manager.executeCommand(command3);

      await manager.undo();
      await manager.redo();
      await manager.undo();
      await manager.undo();

      expect(manager.canUndo()).toBe(true);
      expect(manager.getRedoCount()).toBe(2);
    });

    it('新的命令应该清空重做栈', async () => {
      const command1 = new TestCommand(0);
      const command2 = new TestCommand(0);
      const command3 = new TestCommand(0);

      await manager.executeCommand(command1);
      await manager.executeCommand(command2);
      await manager.undo();

      expect(manager.canRedo()).toBe(true);

      await manager.executeCommand(command3);

      expect(manager.canRedo()).toBe(false);
      expect(manager.getUndoCount()).toBe(2);
    });
  });

  describe('命令合并', () => {
    it('应该能够合并可合并的命令', async () => {
      const command1 = new MergeableCommand(0);
      const command2 = new MergeableCommand(0);
      const command3 = new MergeableCommand(0);

      await manager.executeCommand(command1);
      await manager.executeCommand(command2);
      await manager.executeCommand(command3);

      // 所有命令应该被合并成一个
      expect(manager.getUndoCount()).toBe(1);
    });

    it('不应该合并不可合并的命令', async () => {
      const command1 = new TestCommand(0);
      const command2 = new TestCommand(0);

      await manager.executeCommand(command1);
      await manager.executeCommand(command2);

      // 命令不应该被合并
      expect(manager.getUndoCount()).toBe(2);
    });
  });

  describe('历史记录限制', () => {
    it('应该限制历史记录大小', async () => {
      const managerWithLimit = new UndoRedoManager({ maxHistory: 5 });

      for (let i = 0; i < 10; i++) {
        await managerWithLimit.executeCommand(new TestCommand(0));
      }

      expect(managerWithLimit.getUndoCount()).toBe(5);
    });
  });

  describe('清空历史', () => {
    it('应该能够清空历史', async () => {
      const command1 = new TestCommand(0);
      const command2 = new TestCommand(0);
      const command3 = new TestCommand(0);

      await manager.executeCommand(command1);
      await manager.executeCommand(command2);
      await manager.executeCommand(command3);

      manager.clear();

      expect(manager.canUndo()).toBe(false);
      expect(manager.canRedo()).toBe(false);
      expect(manager.getUndoCount()).toBe(0);
      expect(manager.getRedoCount()).toBe(0);
    });
  });

  describe('状态快照', () => {
    it('应该能够获取状态快照', async () => {
      const command1 = new TestCommand(0);
      const command2 = new TestCommand(0);

      await manager.executeCommand(command1);
      await manager.executeCommand(command2);
      await manager.undo();

      const snapshot = manager.getSnapshot();

      expect(snapshot.undoStack).toHaveLength(1);
      expect(snapshot.redoStack).toHaveLength(1);
      expect(snapshot.undoStack[0].executed).toBe(true);
      expect(snapshot.redoStack[0].executed).toBe(false);
    });
  });

  describe('回放验证', () => {
    it('应该能够执行单次回放验证', async () => {
      const command1 = new TestCommand(0);
      const command2 = new TestCommand(0);

      await manager.executeCommand(command1);
      await manager.executeCommand(command2);

      const success = await manager.replayValidation();

      expect(success).toBe(true);
    });

    it('应该能够执行批量回放验证', async () => {
      const command1 = new TestCommand(0);
      const command2 = new TestCommand(0);
      const command3 = new TestCommand(0);

      await manager.executeCommand(command1);
      await manager.executeCommand(command2);
      await manager.executeCommand(command3);

      const result = await manager.batchReplayValidation(100);

      expect(result.success).toBe(true);
      expect(result.iterations).toBe(100);
      expect(result.failures).toBe(0);
    });

    it('1000次回放应该100%成功', async () => {
      // 执行100个命令
      for (let i = 0; i < 100; i++) {
        await manager.executeCommand(new TestCommand(0));
      }

      // 执行1000次回放验证
      const result = await manager.batchReplayValidation(1000);

      expect(result.success).toBe(true);
      expect(result.iterations).toBe(1000);
      expect(result.failures).toBe(0);
    });

    it('应该能够检测状态不一致', async () => {
      // 创建一个在重做时会产生不同结果的命令
      class InconsistentCommand extends Command {
        private count = 0;

        protected async doExecute(): Promise<void> {
          this.count++;
        }

        protected async doUndo(): Promise<void> {
          this.count--;
        }

        getDescription(): string {
          return 'InconsistentCommand';
        }

        canMerge(_command: Command): boolean {
          return false;
        }
      }

      await manager.executeCommand(new InconsistentCommand());

      const success = await manager.replayValidation();

      expect(success).toBe(true); // 应该成功，因为没有不一致
    });
  });

  describe('并发控制', () => {
    it('应该防止在命令执行时执行其他命令', async () => {
      let executing = false;

      class SlowCommand extends Command {
        constructor(private manager: UndoRedoManager) {
          super();
        }

        protected async doExecute(): Promise<void> {
          executing = true;
          await new Promise((resolve) => setTimeout(resolve, 10));
          executing = false;
        }

        protected async doUndo(): Promise<void> {
          // empty
        }

        getDescription(): string {
          return 'SlowCommand';
        }
      }

      const command1 = new SlowCommand(manager);
      const command2 = new SlowCommand(manager);

      const promise1 = manager.executeCommand(command1);

      await new Promise((resolve) => setTimeout(resolve, 5));

      // 尝试在第一个命令执行时执行第二个命令
      const error = await manager.executeCommand(command2).catch((e) => e);

      expect(error).toBeDefined();
      expect((error as Error).message).toContain('executing');

      await promise1;
    });
  });
});
