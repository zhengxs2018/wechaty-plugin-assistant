import { type AssistantConfig, type AssistantOptions } from '../interfaces';
import { createMemoryCache } from './createMemoryCache';
import { printHelp } from './printHelp'

export const resolveAssistantOptions = ({
  debug = false,
  testing = false,
  disabledOutdatedDetection = false,
  cache = createMemoryCache(),
  maintainers = [],
  help = printHelp,
  ...rest
}: AssistantConfig): AssistantOptions => ({
  ...rest,
  debug,
  testing,
  disabledOutdatedDetection,
  cache,
  help,
  maintainers,
});
