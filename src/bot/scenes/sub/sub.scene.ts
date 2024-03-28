import { AddStep, Context, Ctx, InjectVkApi, Scene, SceneEnter } from 'nestjs-vk';
import { ScenesNamesEnum } from '../scenes-names.enum';
import { UserService } from '../../../main-entities/user/user.service';
import { IStepContext } from '@vk-io/scenes';
import { MessagePayloadDecorator } from '../../common/decorators/message-payload.decorator';
import { ButtonColor, Keyboard, MessageContext, VK } from 'vk-io';

interface SubSceneMessagePayload {
  [index: string]: string | number;

  command: 'checkAgain';
}

@Scene(ScenesNamesEnum.sub)
export class SubScene {
  constructor(
    @InjectVkApi()
    private readonly bot: VK,
    private readonly userService: UserService,
  ) {}

  @SceneEnter()
  async onSceneEnter() {
    await new Promise((r) => setTimeout(r, 0));
    console.log('Enter to sub');
  }

  @AddStep(0)
  async first(
    @Ctx() ctx: MessageContext,
    @Context() context: IStepContext<SubSceneMessagePayload>,
    @MessagePayloadDecorator() payload: SubSceneMessagePayload,
  ) {
    const check = await this.checkSubAndUser(ctx);

    if (check) {
      return ctx.scene.enter(ScenesNamesEnum.firstScene);
    }
    if (context.scene.step.firstTime || !context.text) {
      const keyboard = Keyboard.builder();
      keyboard.textButton({ label: 'Я подписался', payload: { command: 'checkAgain' }, color: ButtonColor.POSITIVE });

      let message = 'Упс, видимо вы не подписаны на группу. Пожалуйста подпишитесь, чтобы я смог с вами общаться';
      if (context.scene.state.command) {
        message = 'К сожелению я не смог найти вас среди подписчиков, вы точно подписались?';
      }

      return context.send(message, { keyboard });
    }
    context.scene.state.command = payload?.command;

    return context.scene.step.next();
  }

  @AddStep(1)
  async check(
    @Ctx() ctx: MessageContext,
    @MessagePayloadDecorator() payload: SubSceneMessagePayload,
    @Context() context: IStepContext<SubSceneMessagePayload>,
  ) {
    let switcher = context.scene.state.command;

    if (payload) {
      switcher = payload.command;
    }

    switch (switcher) {
      case 'checkAgain':
        const check = await this.checkSubAndUser(ctx);

        if (check) {
          await ctx.send('Спасибо, теперь я не ограничен в общении с вами');
          return ctx.scene.enter(ScenesNamesEnum.firstScene);
        } else {
          return context.scene.step.go(0);
        }
      default:
        return context.scene.step.go(0);
    }
  }

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
}
