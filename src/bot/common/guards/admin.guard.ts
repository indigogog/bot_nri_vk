import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { VkExecutionContext, VkException } from 'nestjs-vk';
import { Context } from 'src/bot/interfaces/context.interface';

@Injectable()
export class AdminGuard implements CanActivate {
  private readonly ADMIN_IDS = process.env.ADMIN_IDS.split(',').map((id) => Number(id));

  canActivate(context: ExecutionContext): boolean {
    const ctx = VkExecutionContext.create(context);
    const { senderId } = ctx.getContext<Context>();

    const isAdmin = this.ADMIN_IDS.includes(senderId);
    if (!isAdmin) {
      throw new VkException('You are not admin 😡!');
    }

    return true;
  }
}
