import { AddStep, Context, Ctx, Scene, SceneEnter } from 'nestjs-vk';
import { ScenesNamesEnum } from '../scenes-names.enum';
import { UserService } from '../../../main-entities/user/user.service';
import { IStepContext } from '@vk-io/scenes';
import { ButtonColor, Keyboard, MessageContext } from 'vk-io';
import { MessagePayloadDecorator } from '../../common/decorators/message-payload.decorator';
import { checkForNull } from '../../common/helpers/other-helpers';

export interface UpdateUserDataSceneMessagePayload {
  [index: string]: string | number;

  command: 'back' | 'confirm';
  filedForChanging: 'firstname' | 'lastname' | 'age' | 'communication' | 'sex';
  newData: string;
  dontNeedExit: string;
}

@Scene(ScenesNamesEnum.updateUserData)
export class UpdateUserDataScene {
  constructor(private readonly userService: UserService) {}

  @SceneEnter()
  async onSceneEnter() {
    await new Promise((r) => setTimeout(r, 0));
    console.log('Enter to UpdateUserDataScene');
  }

  @AddStep(0)
  async chooseField(
    @Context() context: IStepContext<UpdateUserDataSceneMessagePayload>,
    @Ctx() ctx: MessageContext,
    @MessagePayloadDecorator() payload: UpdateUserDataSceneMessagePayload,
  ) {
    if (payload.command === 'back' && !context.scene.state.dontNeedExit) {
      return ctx.scene.enter(ScenesNamesEnum.userRequest);
    }

    context.scene.state.dontNeedExit = undefined;

    if (context.scene.step.firstTime || !context.text) {
      const user = await this.userService.getUser(ctx.senderId);

      const message: string[] = [];

      message.push('Наши данные:');
      message.push(`Имя: ${user.firstname}`);
      message.push(`Фамилия: ${user.lastname}`);
      message.push(`Способ связи: ${checkForNull(user.communication)}`);
      message.push(`Пол: ${checkForNull(user.sex)}`);
      message.push(`Возраст: ${checkForNull(user.age)}`);
      message.push(`\n Что вы хотите поменять?`);

      const keyboard = Keyboard.builder()
        .textButton({ label: 'Имя', payload: { filedForChanging: 'firstname' }, color: ButtonColor.PRIMARY })
        .textButton({ label: 'Фамилия', payload: { filedForChanging: 'lastname' }, color: ButtonColor.PRIMARY })
        .textButton({ label: 'Пол', payload: { filedForChanging: 'sex' }, color: ButtonColor.PRIMARY })
        .row()
        .textButton({
          label: 'Способ связи',
          payload: { filedForChanging: 'communication' },
          color: ButtonColor.PRIMARY,
        })
        .textButton({ label: 'Возраст', payload: { filedForChanging: 'age' }, color: ButtonColor.PRIMARY })
        .row()
        .textButton({ label: 'Отмена', payload: { command: 'back' } });

      return context.send(message.join('\n'), { keyboard });
    }

    if (!payload.filedForChanging) {
      return;
    }

    context.scene.state.filedForChanging = payload.filedForChanging;
    return context.scene.step.next();
  }

  @AddStep(1)
  async proxy(
    @Context() context: IStepContext<UpdateUserDataSceneMessagePayload>,
    @MessagePayloadDecorator() payload: UpdateUserDataSceneMessagePayload,
  ) {
    if (payload?.command === 'back') {
      context.scene.state.dontNeedExit = 'true';
      return context.scene.step.go(0);
    }

    if (context.scene.step.firstTime || !context.text) {
      const keyboard = Keyboard.builder().textButton({ label: 'Отмена', payload: { command: 'back' } });
      switch (context.scene.state.filedForChanging) {
        case 'firstname':
          return context.send('Введите новые данные об имени', { keyboard });
        case 'lastname':
          return context.send('Введите новые данные о фамилии', { keyboard });
        case 'age':
          return context.send('Введите новые данные о возрасте', { keyboard });
        case 'communication':
          return context.send(
            'Введите новые данные о способах связи с вами (например номер телефона, ник в телеграме. Где вам лучше писать whatsapp, viber, vk)',
            { keyboard },
          );
        case 'sex':
          return context.send('Введите новые данные о поле', { keyboard });
        default:
          return;
      }
    }

    context.scene.state.newData = context.text;
    return context.scene.step.next();
  }

  @AddStep(2)
  async confirm(
    @Context() context: IStepContext<UpdateUserDataSceneMessagePayload>,
    @Ctx() ctx: MessageContext,
    @MessagePayloadDecorator() payload: UpdateUserDataSceneMessagePayload,
  ) {
    if (payload?.command === 'back') {
      context.scene.state.dontNeedExit = 'true';
      return context.scene.step.go(0);
    }

    if (context.scene.step.firstTime || !context.text) {
      const keyboard = Keyboard.builder()
        .textButton({
          label: 'Подтверждаю',
          payload: { command: 'confirm' },
          color: ButtonColor.POSITIVE,
        })
        .row()
        .textButton({ label: 'Отмена', payload: { command: 'back' } });

      let fieldName: string;
      switch (context.scene.state.filedForChanging) {
        case 'firstname':
          fieldName = 'Именя';
          break;
        case 'lastname':
          fieldName = 'Фамилия';
          break;
        case 'age':
          fieldName = 'Возраст';
          break;
        case 'communication':
          fieldName = 'Способ связи';
          break;
        case 'sex':
          fieldName = 'Пол';
          break;
      }

      if (context.scene.state.filedForChanging === 'age') {
        const age = Number(context.scene.state.newData);
        if (Number.isNaN(age) || age > 100) {
          context.send('Вы ввели невозможный возраст, введите ваш возраст');
          return context.scene.step.go(1);
        }
      }

      return context.send(`Подтвердите новые данные:\n ${fieldName}: ${context.scene.state.newData}`, { keyboard });
    }

    await this.userService.updateUserData(
      ctx.senderId,
      context.scene.state.filedForChanging,
      context.scene.state.newData,
    );

    context.send(`Данные успешно обновлены! Спасибо!\n\nХотите ещё что-нибудь поменять?`);
    return context.scene.step.go(0);
  }
}
