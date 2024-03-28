import { AddStep, Context, Ctx, Scene, SceneEnter } from 'nestjs-vk';
import { ScenesNamesEnum } from '../scenes-names.enum';
import { ButtonColor, Keyboard, MessageContext } from 'vk-io';
import { IStepContext } from '@vk-io/scenes';
import { MessagePayloadDecorator } from '../../common/decorators/message-payload.decorator';
import { GameService } from '../../../main-entities/game/game.service';
import { IsAdminDecorator } from '../../common/decorators/is-admin.decorator';

interface adminSceneMessagePayload {
  [index: string]: string | number;

  command: 'showGames' | 'updateGame' | 'back' | 'createGame' | 'deleteGame';
}

@Scene(ScenesNamesEnum.gameScene)
export class GameScene {
  constructor(
    private readonly gameService: GameService,
  ) {
  }

  @SceneEnter()
  async onSceneEnter() {
    await new Promise((r) => setTimeout(r, 0));
    console.log('Enter to gameScene');
  }

  @AddStep(0)
  async step0(
    @Context() context: IStepContext<adminSceneMessagePayload>,
    @MessagePayloadDecorator() payload: adminSceneMessagePayload,
    @IsAdminDecorator() isAdmin: boolean,
  ) {
    if (context.scene.step.firstTime || !context.text) {
      const keyboard = Keyboard.builder();
      if (isAdmin) {
        keyboard
          .row()
          .textButton({ label: 'Редактировать', payload: { command: 'updateGame' }, color: ButtonColor.PRIMARY })
          .textButton({ label: 'Создать', payload: { command: 'createGame' }, color: ButtonColor.PRIMARY })
          .textButton({ label: 'Удалить', payload: { command: 'deleteGame' }, color: ButtonColor.NEGATIVE });
      }

      keyboard
        .row()
        .textButton({ label: 'Показать все', payload: { command: 'showGames' }, color: ButtonColor.POSITIVE })
        .row()
        .textButton({ label: 'Назад', payload: { command: 'back' }, color: ButtonColor.SECONDARY });

      return context.send('Панель игр', { keyboard });
    }

    context.scene.state.command = payload.command;
    return context.scene.step.next();
  }

  @AddStep(1)
  async step1(
    @Context() context: IStepContext<adminSceneMessagePayload>,
    @Ctx() ctx: MessageContext,
    @IsAdminDecorator() isAdmin: boolean,
  ) {
    if (context.scene.step.firstTime || !context.text) {
      switch (context.scene.state.command) {
        case 'showGames':
          const games = await this.gameService.getAllGames();
          for (const game of games) {
            const message = [];
            message.push(`Название: ${game.name}`);
            message.push('Описание: ');
            message.push(game.description);
            context.send(message.join('\n'));
          }

          return context.scene.step.go(0);

        case 'updateGame':
          if (!isAdmin) {
            return;
          }
          return ctx.scene.enter(ScenesNamesEnum.updateGameScene);

        case 'createGame':
          if (!isAdmin) {
            return;
          }
          return ctx.scene.enter(ScenesNamesEnum.createGameScene);

        case 'back':
          return ctx.scene.enter(ScenesNamesEnum.firstScene);

        case 'deleteGame':
          if (!isAdmin) {
            return;
          }
          return ctx.scene.enter(ScenesNamesEnum.deleteGameScene);

        default:
          context.send('Неизвестная команда');
          return context.scene.step.go(0);
      }
    }
  }
}
