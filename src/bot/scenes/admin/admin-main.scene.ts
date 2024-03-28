import { ScenesNamesEnum } from '../scenes-names.enum';
import { AddStep, Context, Ctx, Scene, SceneEnter } from 'nestjs-vk';
import { ButtonColor, Keyboard, MessageContext } from 'vk-io';
import { IStepContext } from '@vk-io/scenes';
import { MessagePayloadDecorator } from '../../common/decorators/message-payload.decorator';

interface adminSceneMessagePayload {
  [index: string]: string;

  command: 'getUserRequest' | 'back';
}

@Scene(ScenesNamesEnum.adminMainScene)
export class AdminMainScene {
  constructor() {}

  @SceneEnter()
  async onSceneEnter() {
    await new Promise((r) => setTimeout(r, 0));
    console.log('Enter to main admin scene');
  }

  @AddStep(0)
  async step0(
    @Context() context: IStepContext<adminSceneMessagePayload>,
    @MessagePayloadDecorator() payload: adminSceneMessagePayload,
  ) {
    if (context.scene.step.firstTime || !context.text) {
      const keyboard = Keyboard.builder()
        .row()
        .textButton({ label: 'Записи', payload: { command: 'getUserRequest' }, color: ButtonColor.POSITIVE })
        .row()
        .textButton({ label: 'Назад', payload: { command: 'back' } });

      return context.send('Админ панель', { keyboard });
    }

    context.scene.state.command = payload.command;
    return context.scene.step.next();
  }

  @AddStep(1)
  async step1(@Context() context: IStepContext<adminSceneMessagePayload>) {
    switch (context.scene.state.command) {
      case 'back':
        return context.scene.step.go(2);
      case 'getUserRequest':
      default:
        context.send('Ещё в работе');
        return context.scene.step.go(0);
    }
  }

  @AddStep(2)
  exitScene(@Ctx() ctx: MessageContext) {
    return ctx.scene.enter(ScenesNamesEnum.firstScene);
  }
}
