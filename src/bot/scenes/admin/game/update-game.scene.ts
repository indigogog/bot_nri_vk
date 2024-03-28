import { AddStep, Context, Ctx, Scene, SceneEnter } from 'nestjs-vk';
import { ScenesNamesEnum } from '../../scenes-names.enum';
import { GameService } from '../../../../main-entities/game/game.service';
import { IStepContext } from '@vk-io/scenes';
import { ButtonColor, Keyboard, MessageContext } from 'vk-io';
import { MessagePayloadDecorator } from '../../../common/decorators/message-payload.decorator';

interface adminSceneMessagePayload {
  [index: string]: string | number;

  command: 'back';
  updatingGameId: number;
  updatingKey: 'name' | 'description';
}

@Scene(ScenesNamesEnum.updateGameScene)
export class UpdateGameScene {
  constructor(private readonly gameService: GameService) {}

  KEY_TO_RUSSIAN = {
    name: 'название',
    description: 'описание',
  };

  @SceneEnter()
  async onSceneEnter() {
    await new Promise((r) => setTimeout(r, 0));
    console.log('Enter to update game admin scene');
  }

  @AddStep(0)
  async chooseGame(
    @Context() context: IStepContext<adminSceneMessagePayload>,
    @MessagePayloadDecorator() payload: adminSceneMessagePayload,
    @Ctx() ctx: MessageContext,
  ) {
    if (!payload) {
      return context.send('Я вас не понимаю, выберите команду из предложенных');
    }

    if (payload.command === 'back') {
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
          payload: { updatingGameId: gamesToUpdate[i].id },
          color: ButtonColor.PRIMARY,
        });
      }

      chooseGameKeyboard.row().textButton({ label: 'Отмена', payload: { command: 'back' } });

      return context.send('Выберите игру для редактирования', { keyboard: chooseGameKeyboard });
    }

    context.scene.state.updatingGameId = payload.updatingGameId;
    return context.scene.step.next();
  }

  @AddStep(1)
  async selectKeyOfUpdatingGame(
    @Context() context: IStepContext<adminSceneMessagePayload>,
    @MessagePayloadDecorator() payload: adminSceneMessagePayload,
    @Ctx() ctx: MessageContext,
  ) {
    if (!payload) {
      return context.send('Я вас не понимаю, выберите команду из предложенных');
    }

    if (payload.command === 'back') {
      return ctx.scene.enter(ScenesNamesEnum.gameScene);
    }

    if (context.scene.step.firstTime || !context.text) {
      const keyboard = Keyboard.builder()
        .textButton({ label: 'Название', payload: { updatingKey: 'name' }, color: ButtonColor.PRIMARY })
        .textButton({ label: 'Описание', payload: { updatingKey: 'description' }, color: ButtonColor.PRIMARY })
        .row()
        .textButton({ label: 'Назад', payload: { command: 'back' }, color: ButtonColor.NEGATIVE });

      return context.send('Выберите что вы хотите отредактировать', { keyboard });
    }

    context.scene.state.updatingKey = payload.updatingKey;

    return context.scene.step.next();
  }

  @AddStep(2)
  async updateGame(
    @Context() context: IStepContext<adminSceneMessagePayload>,
    @MessagePayloadDecorator() payload: adminSceneMessagePayload,
    @Ctx() ctx: MessageContext,
  ) {
    if (context.scene.step.firstTime || !context.text) {
      if (payload?.command === 'back') {
        context.scene.state.updatingKey = undefined;
        return ctx.scene.enter(ScenesNamesEnum.gameScene);
      }

      const keyboard = Keyboard.builder().textButton({ label: 'Отмена', payload: { command: 'back' } });

      const updatingGame = await this.gameService.findGame(context.scene.state.updatingGameId);
      context.send(
        `Редактирование ${this.KEY_TO_RUSSIAN[context.scene.state.updatingKey].replace('е', 'я')} игры ${
          updatingGame.name
        }`,
        { keyboard },
      );

      return context.send('Напишите новое значение');
    }

    if (payload?.command === 'back') {
      return context.scene.step.go(0);
    }

    const dto = {
      id: context.scene.state.updatingGameId,
    } as any;

    dto[context.scene.state.updatingKey] = context.text;
    await this.gameService.updateGame(dto);

    context.scene.state.updatingKey = undefined;
    context.scene.state.updatingGameId = undefined;

    context.send('Редактирование прошло успешно');
    return ctx.scene.enter(ScenesNamesEnum.gameScene);
  }
}
