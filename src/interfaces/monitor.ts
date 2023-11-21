import { type LockInfo, type TaskInfo } from './lock';

export type AssistantMonitor = {
  /**
   * 是否已经启动
   *
   * 这是机器人的登录状态，不是机器人的运行状态
   */
  started: boolean;

  /**
   * 启动时间
   */
  startupTime: Date;

  /**
   * 是否正在运行
   *
   * 只有当机器人处于运行状态时，才会处理消息
   * 这可以允许临时停止机器人回复消息
   */
  running: boolean;

  /**
   * 任务统计
   */
  stats: {
    /**
     * 成功任务数
     */
    success: number;
    /**
     * 失败任务数
     */
    failure: number;
    /**
     * 总任务数
     */
    total: number;
    /**
     * 跳过任务数
     */
    skipped: number;
    /**
     * 消息数
     */
    message: number;
    /**
     * 指令数
     */
    command: number;
  };

  /**
   * 当前任务数
   */
  readonly size: number;

  /**
   * 获取或创建一个锁
   *
   * @param id -
   * @param info -
   */
  defineLock(info: TaskInfo): LockInfo;

  /**
   * 释放锁
   *
   * @param id -
   */
  releaseLock(id: string): void;

  /**
   * 是否存在锁
   *
   * @param id -
   */
  isLocked(id: string): boolean;
};
