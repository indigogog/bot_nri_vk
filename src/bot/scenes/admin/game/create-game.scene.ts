import { AddStep, Context, Ctx, Scene, SceneEnter } from 'nestjs-vk';
import { GameService } from '../../../../main-entities/game/game.service';
import { IStepContext } from '@vk-io/scenes';
import { MessagePayloadDecorator } from '../../../common/decorators/message-payload.decorator';
import { Keyboard, MessageContext } from 'vk-io';
import { ScenesNamesEnum } from '../../scenes-names.enum';

interface adminSceneMessagePayload {
  [index: string]: string | number;

  command: 'back';

  newGameName: string;
  newGameDescription: string;
}

@Scene(ScenesNamesEnum.createGameScene)
export class CreateGameScene {
  constructor(private readonly gameService: GameService) {}

  @SceneEnter()
  async onSceneEnter() {
    await new Promise((r) => setTimeout(r, 0));
    console.log('Enter to create game admin scene');
  }

  @AddStep(0)
  async startCreatingGame(
    @Context() context: IStepContext<adminSceneMessagePayload>,
    @MessagePayloadDecorator() payload: adminSceneMessagePayload,
    @Ctx() ctx: MessageContext,
  ) {
    if (payload?.command === 'back') {
      return ctx.scene.enter(ScenesNamesEnum.gameScene);
    }

    if (context.scene.step.firstTime || !context.text) {
      const keyboard = Keyboard.builder().textButton({
        label: 'Отмена',
        payload: { command: 'back' },
      });

      return context.send('Напишите название игры', { keyboard });
    }

    context.scene.state.newGameName = context.text;
    return context.scene.step.next();
  }

  @AddStep(1)
  async endCreatingGame(
    @Context() context: IStepContext<adminSceneMessagePayload>,
    @MessagePayloadDecorator() payload: adminSceneMessagePayload,
    @Ctx() ctx: MessageContext,
  ) {
    if (payload?.command === 'back') {
      context.scene.state.newGameName = undefined;
      return context.scene.step.go(0);
    }

    if (context.scene.step.firstTime || !context.text) {
      return context.send('Напишите описание игры');
    }

    context.scene.state.newGameDescription = context.text;

    try {
      const newGame = await this.gameService.createGame({
        name: context.scene.state.newGameName,
        description: context.scene.state.newGameDescription,
      });

      const message = [`Название: ${newGame.name}`, `Описание: ${newGame.description}`];

      context.send(message.join('\n'));
      context.send('Новая игра успешно добавлена');

      context.scene.state.newGameDescription = undefined;
      context.scene.state.newGameName = undefined;

      return ctx.scene.enter(ScenesNamesEnum.gameScene);
    } catch (e) {
      console.log(e);
      context.send(e.message);
      return context.scene.step.go(0);
    }
  }
}
