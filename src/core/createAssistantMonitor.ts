import {
  type AssistantMonitor,
  type LockInfo,
  type TaskInfo,
} from '../interfaces';

export function createAssistantMonitor(): AssistantMonitor {
  /**
   * 当前正在运行的任务
   */
  const tasks: Map<string, LockInfo> = new Map();

  const monitor: AssistantMonitor = {
    started: false,
    startupTime: new Date(),
    running: false,
    stats: {
      success: 0,
      failure: 0,
      total: 0,
      skipped: 0,
      message: 0,
      command: 0,
    },
    get size() {
      return tasks.size;
    },
    defineLock(info: TaskInfo): LockInfo {
      if (tasks.has(info.id)) {
        return tasks.get(info.id)!;
      }

      const controller = new AbortController();

      const lock: LockInfo = {
        ...info,
        controller,
        createdAt: Date.now(),
        abort(reason?: any) {
          controller.abort(reason);
          tasks.delete(info.id);
        },
        dispose() {
          tasks.delete(info.id);
        },
      };

      tasks.set(info.id, lock);

      return lock;
    },
    releaseLock(id: string) {
      tasks.delete(id);
    },
    isLocked(id: string) {
      return tasks.has(id);
    },
  };

  return monitor;
}
