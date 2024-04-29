import { UseFilters } from '@nestjs/common';
import { Ctx, HearFallback, Hears, InjectVkApi, Update } from 'nestjs-vk';
import { ButtonColor, Keyboard, MessageContext, VK } from 'vk-io';
import { VkExceptionFilter } from '../common';
import { ScenesNamesEnum } from '../scenes/scenes-names.enum';
import { UserService } from '../../main-entities/user/user.service';
import * as dayjs from 'dayjs';

@Update()
@UseFilters(VkExceptionFilter)
export class EchoUpdate {
  public groupId: number;

  constructor(
    @InjectVkApi()
    private readonly bot: VK,
    private readonly userService: UserService,
  ) {}

  async checkSubAndUser(ctx: MessageContext) {
    const [group] = await this.bot.api.groups.getById({});
    const groupId = group.id;
    const isSib = await this.bot.api.groups.isMember({
      group_id: String(groupId),
      user_id: ctx.senderId,
    });

    if (isSib) {
      const checkThisUser = await this.userService.getUser(ctx.senderId);

      if (!checkThisUser) {
        const user = await this.bot.api.users.get({
          user_ids: [ctx.senderId],
          fields: ['bdate', 'sex'],
        });

        await this.userService.createUser({
          vkId: ctx.senderId,
          firstname: user[0].first_name,
          lastname: user[0].last_name,
          dob: user[0].bdate,
          sex: user[0].sex ? (user[0].sex === 2 ? 'М' : 'Ж') : null,
        });
      }

      return true;
    }

    return false;
  }

  async onModuleInit() {
    try {
      const [group] = await this.bot.api.groups.getById({});
      this.groupId = group.id;
    } catch (err) {
      console.error(err);
    }
  }

  // @Hears(['Start', 'start'])
  // async onStartCommand(@Ctx() ctx: Context, @Next() next: NextMiddleware) {
  //   if (ctx.session.isAuth) {
  //     return await next(); // next middleware is onHearFallback
  //   }
  //
  //   ctx.session.isAuth = true;
  //   return 'Send any message';
  // }

  // @Hears(/scene( ?(?<state>[0-9]+))?$/i)
  // async hearsScene(@Ctx() ctx: MessageContext) {
  //   ctx.scene.enter(ScenesNamesEnum.firstScene);
  // }

  @Hears(['Начать', 'start', 'начать'])
  async onStartCommand(@Ctx() ctx: MessageContext) {
    if (ctx.isChat || ctx.peerType === 'chat') {
      return;
    }
    const check = await this.checkSubAndUser(ctx);
    if (check) {
      ctx.scene.enter(ScenesNamesEnum.firstScene);
    } else {
      const keyboard = Keyboard.builder();
      keyboard.textButton({ label: 'Я подписался', payload: { command: 'checkAgain' }, color: ButtonColor.POSITIVE });
      ctx.send('Упс, видимо вы не подписаны на группу. Пожалуйста подпишитесь, чтобы я смог с вами общаться', {
        keyboard,
      });
      return;
    }
  }

  @Hears(['Позвать', 'позвать'])
  async onCallAdmin(@Ctx() ctx: MessageContext) {
    if (ctx.isChat || ctx.peerType === 'chat') {
      return;
    }

    const ADMIN_IDS = process.env.ADMIN_IDS.split(',').map((id) => Number(id));

    for (const adminId of ADMIN_IDS) {
      await ctx.send(
        `
            Вас зовёт пользователь: \n
            Пользователь: https://vk.com/id${ctx.senderId}\n
            Дата: ${dayjs().format('DD-MM-YYYY mm:ss')}\n
          `,
        { user_id: adminId, peer_id: adminId },
      );
    }

    return ctx.send('Администратор в ближайшее время с вами свяжется');
  }

  @Hears(['Я подписался'])
  async onSubs(@Ctx() ctx: MessageContext) {
    if (ctx.isChat || ctx.peerType === 'chat') {
      return;
    }
    const check = await this.checkSubAndUser(ctx);
    if (check) {
      return ctx.scene.enter(ScenesNamesEnum.firstScene);
    } else {
      const keyboard = Keyboard.builder();
      keyboard.textButton({ label: 'Я подписался', payload: { command: 'checkAgain' }, color: ButtonColor.POSITIVE });
      ctx.send('Упс, видимо вы не подписаны на группу. Пожалуйста подпишитесь, чтобы я смог с вами общаться', {
        keyboard,
      });
      return;
    }
  }

  @HearFallback()
  onHearFallback(@Ctx() ctx: MessageContext) {
    if (ctx.isChat || ctx.peerType === 'chat') {
      return;
    }
    const ADMIN_IDS = process.env.ADMIN_IDS.split(',').map((id) => Number(id));
    if (!ctx.senderId || ctx.senderType === 'group' || ADMIN_IDS.includes(ctx.senderId)) {
      return;
    }

    if (!ctx.session.isAuth) {
      ctx.send('Упс, похоже я не могу тебя понять, у меня выпала единичка на кубе при проверке интеллекта');
      ctx.send('Если хотите воспользоваться ботом, напишите "Начать"');
      ctx.send('Если хотите позвать администратора, напишите "Позвать"');
      return;
    }

    return 'What?..';
  }
}
