import { type AssistantConfig, type AssistantOptions } from '../interfaces';
import { createMemoryCache } from './createMemoryCache';

export const resolveAssistantOptions = ({
  debug = false,
  testing = false,
  cache = createMemoryCache(),
  maintainers = [],
  ...rest
}: AssistantConfig): AssistantOptions => ({
  ...rest,
  debug,
  testing,
  cache,
  maintainers,
});
