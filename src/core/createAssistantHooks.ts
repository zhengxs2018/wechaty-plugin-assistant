// from vuepress plugin Api
import type { AssistantHooks } from '../interfaces';
import { createAssistantHookQueue } from './createAssistantHookQueue';

export const createAssistantHooks = (): AssistantHooks => ({
  onMessage: createAssistantHookQueue('onMessage'),
  onRoomMessage: createAssistantHookQueue('onRoomMessage'),
  onRoomMentionSelfMessage: createAssistantHookQueue(
    'onRoomMentionSelfMessage',
  ),
  onIndividualMessage: createAssistantHookQueue('onIndividualMessage'),

  onContextCreated: createAssistantHookQueue('onContextCreated'),
  onContextDestroyed: createAssistantHookQueue('onContextDestroyed'),

  onPrepareTextMessage: createAssistantHookQueue('onPrepareTextMessage'),
  onPrepareFileMessage: createAssistantHookQueue('onPrepareFileMessage'),
});
