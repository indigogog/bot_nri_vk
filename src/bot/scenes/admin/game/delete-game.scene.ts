import { AddStep, Context, Ctx, Scene, SceneEnter } from 'nestjs-vk';
import { ScenesNamesEnum } from '../../scenes-names.enum';
import { GameService } from '../../../../main-entities/game/game.service';
import { IStepContext } from '@vk-io/scenes';
import { MessagePayloadDecorator } from '../../../common/decorators/message-payload.decorator';
import { ButtonColor, Keyboard, MessageContext } from 'vk-io';

interface adminSceneMessagePayload {
  [index: string]: string | number;

  deletingGameId: number;
  command: 'back' | 'confirm';
}

@Scene(ScenesNamesEnum.deleteGameScene)
export class deleteGameScene {
  constructor(private readonly gameService: GameService) {
  }

  @SceneEnter()
  async onSceneEnter() {
    await new Promise((r) => setTimeout(r, 0));
    console.log('Enter to delete game admin scene');
  }

  @AddStep(0)
  async selectDeletingGame(
    @Context() context: IStepContext<adminSceneMessagePayload>,
    @MessagePayloadDecorator() payload: adminSceneMessagePayload,
    @Ctx() ctx: MessageContext,
  ) {
    if (!payload) {
      return context.send('Я вас не понимаю, выберите команду из предложенных');
    }

    if (payload?.command === 'back') {
      return ctx.scene.enter(ScenesNamesEnum.gameScene);
    }

    if (context.scene.step.firstTime || !context.text) {
      const gamesToUpdate = await this.gameService.getAllGames();
      const chooseGameKeyboard = Keyboard.builder();

      for (let i = 0; i < gamesToUpdate.length; i++) {
        const message: string[] = [];
        message.push(`№ ${gamesToUpdate[i].id}`);
        message.push(`Название: ${gamesToUpdate[i].name}`);
        context.send(message.join('\n'));

        if (i % 2 === 0) {
          chooseGameKeyboard.row();
        }

        chooseGameKeyboard.textButton({
          label: `№${gamesToUpdate[i].id} ${gamesToUpdate[i].name}`,
          payload: { deletingGameId: gamesToUpdate[i].id },
          color: ButtonColor.PRIMARY,
        });
      }

      chooseGameKeyboard.row().textButton({ label: 'Отмена', payload: { command: 'back' } });

      return context.send('Выберите какую игру вы хотите удалить', { keyboard: chooseGameKeyboard });
    }

    context.scene.state.deletingGameId = payload.deletingGameId;
    return context.scene.step.next();
  }

  @AddStep(1)
  async confirmDeleting(
    @Context() context: IStepContext<adminSceneMessagePayload>,
    @MessagePayloadDecorator() payload: adminSceneMessagePayload,
    @Ctx() ctx: MessageContext,
  ) {
    if (!payload) {
      return context.send('Я вас не понимаю, выберите команду из предложенных');
    }

    if (payload?.command === 'back') {
      return context.scene.step.go(0);
    }

    if (context.scene.step.firstTime || !context.text) {
      const gameForDeleting = await this.gameService.findGame(payload.deletingGameId);

      const keyboard = Keyboard.builder()
        .textButton({ label: 'Подтверждаю', payload: { command: 'confirm' }, color: ButtonColor.NEGATIVE })
        .textButton({ label: 'Отмена', payload: { command: 'back' } });

      context.send('Игра, которую вы хотите удалить:', { keyboard });
      const message: string[] = [];
      message.push(`Название: ${gameForDeleting.name}`);
      message.push(`Описание:`);
      message.push(`${gameForDeleting.description}`);

      return context.send(message.join('\n'));
    }

    if (payload?.command === 'confirm') {
      try {
        await this.gameService.deleteGame(context.scene.state.deletingGameId);
        context.scene.state.deletingGameId = undefined;

        context.send(`Игра успешно удалена`);

        return ctx.scene.enter(ScenesNamesEnum.gameScene);
      } catch (e) {
        context.send('Что-то пошло не так при удалении, свяжитесь с разработчиком:');
        context.send(JSON.stringify(e));
      }
    } else {
      context.send('Отмена удаления')
      return ctx.scene.enter(ScenesNamesEnum.gameScene);
    }
  }
}
