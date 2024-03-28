import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { VkExecutionContext } from 'nestjs-vk';
import { Context } from '../../interfaces/context.interface';

export const MessagePayloadDecorator = createParamDecorator((_, context: ExecutionContext) => {
  const ctx = VkExecutionContext.create(context);
  const { messagePayload } = ctx.getContext<Context>();

  return messagePayload;
});