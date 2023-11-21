import { type AssistantConfig, type AssistantOptions } from '../interfaces';
import { createMemoryCache } from './createMemoryCache';

export const resolveAssistantOptions = ({
  llm,
  debug = false,
  testing = false,
  cache = createMemoryCache(),
  maintainers = [],
  notifications = null,
  compressors = null,
  skipUnsupportedMessage = false,
}: AssistantConfig): AssistantOptions => ({
  llm,
  debug,
  testing,
  cache,
  maintainers,
  notifications,
  compressors,
  skipUnsupportedMessage,
});
