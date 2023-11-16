import { createHash } from 'node:crypto';

export function md5(text: string): string {
  return createHash('md5').update(text).digest('hex');
}

export const castToError = (err: any): Error => {
  if (err instanceof Error) return err;
  return new Error(err);
};

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
