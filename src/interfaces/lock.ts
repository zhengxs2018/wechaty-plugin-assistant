export type TaskInfo = {
  id: string;

  [key: string]: any;
};

export interface LockInfo extends TaskInfo {
  createdAt: number;
  controller: AbortController;
  abort(reason?: any): void;
  dispose(): void;
}
