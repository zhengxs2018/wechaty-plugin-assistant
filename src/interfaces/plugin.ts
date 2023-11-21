import { Hooks, type HooksName } from './hooks';

type ConfigHooks = {
  [K in HooksName]: Hooks[K]['exposed'];
};

export interface PluginObject extends Partial<ConfigHooks> {
  name: string;
}
