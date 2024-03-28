import { AddStep, Context, Ctx, Scene, SceneEnter } from 'nestjs-vk';
import { ScenesNamesEnum } from '../../scenes-names.enum';
import { IStepContext } from '@vk-io/scenes';
import { MessagePayloadDecorator } from '../../../common/decorators/message-payload.decorator';
import { ButtonColor, Keyboard, MessageContext } from 'vk-io';
import { getDateWithDayOfWeek } from '../../../common';
import * as dayjs from 'dayjs';
import { AfficheService } from '../../../../main-entities/affiche/affiche.service';

interface adminSceneMessagePayload {
  [index: string]: string;

  selectedAfficheId: string;
  command: 'again' | 'back' | 'confirm';
}

@Scene(ScenesNamesEnum.deleteAfficheScene)
export class DeleteAfficheScene {
  constructor(private readonly afficheService: AfficheService) {
  }

  @SceneEnter()
  async onSceneEnter() {
    await new Promise((r) => setTimeout(r, 0));
    console.log('Enter to show affiche scene');
  }

  @AddStep(0)
  async showAffiches(
    @Context() context: IStepContext<adminSceneMessagePayload>,
    @MessagePayloadDecorator() payload: adminSceneMessagePayload,
    @Ctx() ctx: MessageContext,
  ) {
    if (payload.command === 'back') {
      return ctx.scene.enter(ScenesNamesEnum.afficheScene);
    }

    if (context.scene.step.firstTime || !context.text) {
      const affiches = await this.afficheService.getNewAffiches();

      const keyboard = Keyboard.builder().textButton({
        label: 'Назад',
        payload: { command: 'back' },
        color: ButtonColor.SECONDARY,
      });

      let i = 0;
      for (const affiche of affiches) {
        i++;
        const message: string[] = [];
        message.push(`№${affiche.id}`);
        message.push(affiche.name);
        message.push('Кол-во заявок:');
        message.push(affiche.busyPlaces.toString());
        message.push(`Дата: ${getDateWithDayOfWeek(dayjs(affiche.dog))}`);
        message.push('---------\n');
        context.send(message.join('\n'));

        if (i % 3 === 0) {
          keyboard.row();
        }

        keyboard.textButton({
          label: `№ ${affiche.id}`,
          payload: { selectedAfficheId: affiche.id.toString() },
        });
      }

      return context.send('Выберите афишу: ', { keyboard });
    }

    context.scene.state.selectedAfficheId = payload.selectedAfficheId;
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
      const afficheForDeleting = await this.afficheService.getAfficheById(
        Number(context.scene.state.selectedAfficheId),
      );

      const keyboard = Keyboard.builder()
        .textButton({ label: 'Подтверждаю', payload: { command: 'confirm' }, color: ButtonColor.NEGATIVE })
        .textButton({ label: 'Отмена', payload: { command: 'back' } });

      context.send('Афиша, которую вы хотите удалить:', { keyboard });
      const message: string[] = [];
      message.push(`№${afficheForDeleting.id}`);
      message.push(afficheForDeleting.game.name);
      message.push(`Дата: ${getDateWithDayOfWeek(dayjs(afficheForDeleting.dog))}`);

      return context.send(message.join('\n'));
    }

    if (payload?.command === 'confirm') {
      try {
        await this.afficheService.deleteAffiche({ id: Number(context.scene.state.selectedAfficheId) });
        context.scene.state.deletingGameId = undefined;

        context.send(`Афиша успешно удалена`);

        return ctx.scene.enter(ScenesNamesEnum.afficheScene);
      } catch (e) {
        context.send('Что-то пошло не так при удалении, свяжитесь с разработчиком:');
        context.send(JSON.stringify(e));
      }
    } else {
      context.send('Отмена удаления');
      return ctx.scene.enter(ScenesNamesEnum.afficheScene);
    }
  }
}
