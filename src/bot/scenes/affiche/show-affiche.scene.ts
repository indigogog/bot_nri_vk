import { AddStep, Context, Ctx, Scene, SceneEnter } from 'nestjs-vk';
import { ScenesNamesEnum } from '../scenes-names.enum';
import { AfficheService } from '../../../main-entities/affiche/affiche.service';
import { IStepContext } from '@vk-io/scenes';
import { MessagePayloadDecorator } from '../../common/decorators/message-payload.decorator';
import { ButtonColor, Keyboard, MessageContext } from 'vk-io';
import * as dayjs from 'dayjs';
import { getDateWithDayOfWeek, getStartAndEndOfWeek } from '../../common';

interface adminSceneMessagePayload {
  [index: string]: string;

  scip: string;

  command: 'showCurrentAffiche' | 'showOldAffiche' | 'back';
}

@Scene(ScenesNamesEnum.showAfficheScene)
export class ShowAfficheScene {
  constructor(private readonly afficheService: AfficheService) {
  }

  @SceneEnter()
  async onSceneEnter() {
    await new Promise((r) => setTimeout(r, 0));
    console.log('Enter to show affiche scene');
  }

  @AddStep(0)
  async showNewAffiche(
    @Context() context: IStepContext<adminSceneMessagePayload>,
    @MessagePayloadDecorator() payload: adminSceneMessagePayload,
    @Ctx() ctx: MessageContext,
  ) {
    if (payload.command === 'back') {
      return ctx.scene.enter(ScenesNamesEnum.afficheScene);
    }

    if (context.scene.step.firstTime || !context.text) {
      const keyboard = Keyboard.builder()
        .textButton({ label: 'Прошедшие', payload: { command: 'showOldAffiche' }, color: ButtonColor.PRIMARY })
        .row()
        .textButton({ label: 'Назад', payload: { command: 'back' }, color: ButtonColor.SECONDARY });

      context.send('Актуальные афиши: ', { keyboard });

      const affiches = await this.afficheService.getNewAffiches();

      for (const affiche of affiches) {
        const message: string[] = [];
        message.push(affiche.name);
        message.push(`Дата: ${getDateWithDayOfWeek(dayjs(affiche.dog))}`);
        message.push('Кол-во свободных мест:');
        message.push(affiche.freePlaces.toString());
        message.push('---------\n');
        context.send(message.join('\n'));
      }

      return;
    }

    context.scene.state.command = payload.command;
    context.scene.state.scip = '-1';
    return context.scene.step.next();
  }

  @AddStep(1)
  async showOldAffiche(
    @Context() context: IStepContext<adminSceneMessagePayload>,
    @MessagePayloadDecorator() payload: adminSceneMessagePayload,
    @Ctx() ctx: MessageContext,
  ) {
    if (payload.command === 'back') {
      return ctx.scene.enter(ScenesNamesEnum.afficheScene);
    }

    if (context.scene.step.firstTime || !context.text) {
      const { start, end } = getStartAndEndOfWeek(Number(context.scene.state.scip));
      const affiches = await this.afficheService.getOldAffiches(
        start.format('YYYY-MM-DD HH:mm:ss'),
        end.format('YYYY-MM-DD HH:mm:ss'),
      );

      const keyboard = Keyboard.builder()
        .textButton({ label: 'Актуальные', payload: { command: 'showCurrentAffiche' }, color: ButtonColor.PRIMARY })
        .row()
        .textButton({ label: 'Ещё раньше', payload: { command: 'showOldAffiche' }, color: ButtonColor.PRIMARY })
        .row()
        .textButton({ label: 'Назад', payload: { command: 'back' }, color: ButtonColor.SECONDARY });

      context.send(`Афиши за неделю (${start.format('DD.MM.YYYY')} - ${end.format('DD.MM.YYYY')}): `, { keyboard });

      if (!affiches.length) {
        return context.send(`Афиш нет`);
      }

      for (const affiche of affiches) {
        const message: string[] = [];
        message.push(affiche.game.name);
        message.push(`Дата: ${getDateWithDayOfWeek(dayjs(affiche.dog))}`);
        context.send(message.join('\n'));
      }

      return;
    }

    if (payload.command === 'showCurrentAffiche') {
      return context.scene.step.go(0);
    }

    context.scene.state.scip = (Number(context.scene.state.scip) - 1).toString();
    return context.scene.step.go(1);
  }
}
