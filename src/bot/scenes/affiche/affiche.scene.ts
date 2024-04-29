import { AddStep, Context, Ctx, Scene, SceneEnter } from 'nestjs-vk';
import { ScenesNamesEnum } from '../scenes-names.enum';
import { IStepContext } from '@vk-io/scenes';
import { MessagePayloadDecorator } from '../../common/decorators/message-payload.decorator';
import { ButtonColor, Keyboard, MessageContext } from 'vk-io';
import { IsAdminDecorator } from '../../common/decorators/is-admin.decorator';

interface AdminSceneMessagePayload {
  [index: string]: string | number;

  command: 'showCurrentAffiche' | 'createAffiche' | 'back' | 'updateAffiche' | 'deleteAffiche' | 'toUserRequest';
}

@Scene(ScenesNamesEnum.afficheScene)
export class AfficheScene {
  constructor() {
  }

  @SceneEnter()
  async onSceneEnter() {
    await new Promise((r) => setTimeout(r, 0));
    console.log('Enter to afficheScene');
  }

  @AddStep(0)
  async step0(
    @Context() context: IStepContext<AdminSceneMessagePayload>,
    @MessagePayloadDecorator() payload: AdminSceneMessagePayload,
    @IsAdminDecorator() isAmdin: boolean,
  ) {
    if (context.scene.step.firstTime || !context.text) {
      const keyboard = Keyboard.builder();
      if (isAmdin) {
        keyboard
          .row()
          .textButton({ label: 'Создать', payload: { command: 'createAffiche' }, color: ButtonColor.PRIMARY })
          .textButton({ label: 'Редактировать', payload: { command: 'updateAffiche' }, color: ButtonColor.PRIMARY })
          .textButton({ label: 'Удалить', payload: { command: 'deleteAffiche' }, color: ButtonColor.NEGATIVE });
      }
      keyboard
        .row()
        .textButton({ label: 'Посмотреть', payload: { command: 'showCurrentAffiche' }, color: ButtonColor.POSITIVE })
        .row()
        .textButton({ label: 'Записаться на игру', payload: { command: 'toUserRequest' }, color: ButtonColor.POSITIVE })
        .row()
        .textButton({ label: 'Назад', payload: { command: 'back' }, color: ButtonColor.SECONDARY });

      return context.send('Панель афиши', { keyboard });
    }

    context.scene.state.command = payload.command;
    return context.scene.step.next();
  }

  @AddStep(1)
  async step1(
    @Context() context: IStepContext<AdminSceneMessagePayload>,
    @Ctx() ctx: MessageContext,
    @IsAdminDecorator() isAdmin: boolean,
  ) {
    if (context.scene.step.firstTime || !context.text) {
      switch (context.scene.state.command) {
        case 'createAffiche':
          if (isAdmin) {
            return ctx.scene.enter(ScenesNamesEnum.createAfficheScene);
          } else {
            return;
          }

        case 'updateAffiche':
          if (isAdmin) {
            return ctx.scene.enter(ScenesNamesEnum.updateAfficheScene);
          } else {
            return;
          }

        case 'deleteAffiche':
          if (isAdmin) {
            return ctx.scene.enter(ScenesNamesEnum.deleteAfficheScene);
          } else {
            return;
          }

        case 'showCurrentAffiche':
          return ctx.scene.enter(ScenesNamesEnum.showAfficheScene);

        case 'back':
          return ctx.scene.enter(ScenesNamesEnum.firstScene);

        case 'toUserRequest':
          return ctx.scene.enter(ScenesNamesEnum.userRequest);

        default:
          context.send('Неизвестная команда');
          return context.scene.step.go(0);
      }
    }
  }
}
