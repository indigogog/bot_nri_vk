import { IStepContext } from '@vk-io/scenes';
import { AddStep, Context, Ctx, InjectVkApi, Scene, SceneEnter } from 'nestjs-vk';
import { ButtonColor, Keyboard, MessageContext, VK } from 'vk-io';
import { ScenesNamesEnum } from './scenes-names.enum';
import { IsAdminDecorator } from '../common/decorators/is-admin.decorator';
import { MessagePayloadDecorator } from '../common/decorators/message-payload.decorator';
import { UserService } from '../../main-entities/user/user.service';

interface BestSceneContextState {
  [index: string]: string;

  command: 'toAdmin' | 'toAffiche' | 'toGames' | 'toUserRequest';
  age: string;
}

@Scene(ScenesNamesEnum.firstScene)
export class FirstScene {
  constructor(
    @InjectVkApi()
    private readonly bot: VK,
    private readonly userService: UserService,
  ) {
  }

  @SceneEnter()
  async onSceneEnter() {
    await new Promise((r) => setTimeout(r, 0));

    console.log('Enter to first scene');
  }

  @AddStep(0)
  async step1(
    @Context() context: IStepContext<BestSceneContextState>,
    @IsAdminDecorator() isAdmin: boolean,
    @MessagePayloadDecorator() payload: BestSceneContextState,
    @Ctx() ctx: MessageContext,
  ) {
    if (context.scene.step.firstTime || !context.text) {
      const [group] = await this.bot.api.groups.getById({});
      const groupId = group.id;
      const isSib = await this.bot.api.groups.isMember({
        group_id: String(groupId),
        user_id: ctx.senderId,
      });
      if (!isSib) {
        return ctx.scene.enter(ScenesNamesEnum.sub);
      }
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
      const keyboard = Keyboard.builder();

      if (isAdmin) {
        keyboard.textButton({ label: 'Панель админа', payload: { command: 'toAdmin' }, color: ButtonColor.NEGATIVE });
      }

      keyboard.row().textButton({ label: 'Афиша', payload: { command: 'toAffiche' }, color: ButtonColor.PRIMARY });
      keyboard.row().textButton({ label: 'Игры', payload: { command: 'toGames' }, color: ButtonColor.PRIMARY });
      keyboard.row().textButton({
        label: 'Заявки на игру',
        payload: { command: 'toUserRequest' },
        color: ButtonColor.POSITIVE,
      });

      return context.send('Приветствую странник', { keyboard });
    }

    context.scene.state.command = payload?.command;

    return context.scene.step.next();
  }

  @AddStep(1)
  async choose(
    @Context() context: IStepContext<BestSceneContextState>,
    @IsAdminDecorator() isAdmin: boolean,
    @Ctx() ctx: MessageContext,
    @MessagePayloadDecorator() payload: BestSceneContextState,
  ) {
    let switcher = context.scene.state.command;

    if (payload) {
      switcher = payload.command;
    }

    switch (switcher) {
      case 'toAffiche': {
        return ctx.scene.enter(ScenesNamesEnum.afficheScene);
      }

      case 'toAdmin': {
        if (!isAdmin) {
          return context.scene.step.go(1);
        }
        return ctx.scene.enter(ScenesNamesEnum.getUserRequests);
      }

      case 'toGames': {
        return ctx.scene.enter(ScenesNamesEnum.gameScene);
      }
      case 'toUserRequest': {
        return ctx.scene.enter(ScenesNamesEnum.userRequest);
      }

      default: {
        const keyboard = Keyboard.builder();

        if (isAdmin) {
          keyboard.textButton({
            label: 'Панель админа',
            payload: { command: 'toAdmin' },
            color: ButtonColor.NEGATIVE,
          });
        }

        keyboard.row().textButton({ label: 'Афиша', payload: { command: 'toAffiche' }, color: ButtonColor.PRIMARY });
        keyboard.row().textButton({ label: 'Игры', payload: { command: 'toGames' }, color: ButtonColor.PRIMARY });
        keyboard.row().textButton({
          label: 'Заявки на игру',
          payload: { command: 'toUserRequest' },
          color: ButtonColor.POSITIVE,
        });

        if (context.text === 'Назад') {
          return context.send('Приветствую странник', { keyboard });
        }

        const admins = process.env.ADMIN_IDS.split(',').map((id) => Number(id));
        if (admins.includes(ctx.senderId)) {
          return;
        }

        return ctx.send(
          'Упс, видимо на это я не смогу вам ответить, дождитесь ответа админа, либо выберите что-нибудь из списка команд',
          { keyboard },
        );
      }
    }
  }
}
