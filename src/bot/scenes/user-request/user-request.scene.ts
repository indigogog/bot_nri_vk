import { AddStep, Context, Ctx, Scene, SceneEnter } from 'nestjs-vk';
import { ScenesNamesEnum } from '../scenes-names.enum';
import { IStepContext } from '@vk-io/scenes';
import { MessagePayloadDecorator } from '../../common/decorators/message-payload.decorator';
import { ButtonColor, Keyboard, MessageContext } from 'vk-io';

interface UserRequestMessagePayload {
  [index: string]: string | number;

  command: 'newRequest' | 'deleteRequest' | 'back' | 'myRequests';
}

@Scene(ScenesNamesEnum.userRequest)
export class UserRequestScene {
  constructor() {}

  @SceneEnter()
  async onSceneEnter() {
    await new Promise((r) => setTimeout(r, 0));
    console.log('Enter to user request scene');
  }

  @AddStep(0)
  async choose(
    @Context() context: IStepContext<UserRequestMessagePayload>,
    @MessagePayloadDecorator() payload: UserRequestMessagePayload,
  ) {
    if (context.scene.step.firstTime || !context.text) {
      const keyboard = Keyboard.builder();
      keyboard
        .row()
        .textButton({ label: 'Записаться', payload: { command: 'newRequest' }, color: ButtonColor.POSITIVE })
        .row()
        .textButton({ label: 'Отменить запись', payload: { command: 'deleteRequest' }, color: ButtonColor.NEGATIVE })
        .textButton({ label: 'Мои записи', payload: { command: 'myRequests' }, color: ButtonColor.SECONDARY })
        .row()
        .textButton({ label: 'Назад', payload: { command: 'back' }, color: ButtonColor.SECONDARY });

      return context.send('Панель заявок', { keyboard });
    }

    context.scene.state.command = payload.command;
    return context.scene.step.next();
  }

  @AddStep(1)
  async proxy(@Context() context: IStepContext<UserRequestMessagePayload>, @Ctx() ctx: MessageContext) {
    if (context.scene.step.firstTime || !context.text) {
      switch (context.scene.state.command) {
        case 'newRequest':
          return context.scene.enter(ScenesNamesEnum.createUserRequest);
        case 'myRequests':
          return context.scene.enter(ScenesNamesEnum.myRequests);
        case 'deleteRequest':
          return context.scene.enter(ScenesNamesEnum.deleteRequest);
        case 'back':
          return ctx.scene.enter(ScenesNamesEnum.firstScene);

        default:
          context.send('Неизвестная команда');
          return context.scene.step.go(0);
      }
    }
  }
}
