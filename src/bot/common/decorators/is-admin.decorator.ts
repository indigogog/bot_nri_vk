import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { VkExecutionContext } from 'nestjs-vk';
import { Context } from '../../interfaces/context.interface';

export const IsAdminDecorator = createParamDecorator((_, context: ExecutionContext) => {
  const ADMIN_IDS = process.env.ADMIN_IDS.split(',').map((id) => Number(id));
  const ctx = VkExecutionContext.create(context);
  const { senderId } = ctx.getContext<Context>();

  return ADMIN_IDS.includes(senderId);
});
