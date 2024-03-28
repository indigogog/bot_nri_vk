import { AddStep, Context, Ctx, Scene, SceneEnter } from 'nestjs-vk';
import { ScenesNamesEnum } from '../scenes-names.enum';
import { UserRequestService } from '../../../main-entities/user-request/user-request.service';
import { IStepContext } from '@vk-io/scenes';
import { ButtonColor, Keyboard, MessageContext } from 'vk-io';
import { MessagePayloadDecorator } from '../../common/decorators/message-payload.decorator';
import { getDateWithDayOfWeek, getStartAndEndOfWeek } from '../../common';
import * as dayjs from 'dayjs';

interface MyRequestSceneMessagePayload {
  [index: string]: string | number;

  command: 'back' | 'older' | 'now';
  scip: string;
}

@Scene(ScenesNamesEnum.myRequests)
export class MyRequestsScene {
  constructor(private readonly requestService: UserRequestService) {
  }

  @SceneEnter()
  async onSceneEnter() {
    await new Promise((r) => setTimeout(r, 0));
    console.log('Enter to MyRequestsScene');
  }

  @AddStep(0)
  async showCurrentRequests(
    @Context() context: IStepContext<MyRequestSceneMessagePayload>,
    @Ctx() ctx: MessageContext,
    @MessagePayloadDecorator() payload: MyRequestSceneMessagePayload,
  ) {
    if (payload.command === 'back') {
      return ctx.scene.enter(ScenesNamesEnum.userRequest);
    }

    if (context.scene.step.firstTime || !context.text) {
      const requests = await this.requestService.getUserRequests(ctx.senderId);

      const message: string[] = [];

      for (const request of requests) {
        message.push(request.affiche.game.name);
        message.push(`Дата: ${getDateWithDayOfWeek(dayjs(request.affiche.dog))}`);
      }

      const keyboard = Keyboard.builder()
        .textButton({ label: 'Прошедшие', payload: { command: 'older' }, color: ButtonColor.PRIMARY })
        .row()
        .textButton({ label: 'Назад', payload: { command: 'back' }, color: ButtonColor.SECONDARY });

      await context.send('Актуальные заявки: ');
      return context.send(requests.length ? message.join('\n') : 'Нет заявок', { keyboard });
    }

    context.scene.state.scip = '-1';
    return context.scene.step.next();
  }

  @AddStep(1)
  async olderRequests(
    @Context() context: IStepContext<MyRequestSceneMessagePayload>,
    @Ctx() ctx: MessageContext,
    @MessagePayloadDecorator() payload: MyRequestSceneMessagePayload,
  ) {
    if (payload.command === 'back') {
      return ctx.scene.enter(ScenesNamesEnum.userRequest);
    }

    if (context.scene.step.firstTime || !context.text) {
      const { start, end } = getStartAndEndOfWeek(Number(context.scene.state.scip));
      const requests = await this.requestService.getOldUserRequests(
        ctx.senderId,
        start.format('YYYY-MM-DD HH:mm:ss'),
        end.format('YYYY-MM-DD HH:mm:ss'),
      );

      const message: string[] = [];

      for (const request of requests) {
        message.push(request.affiche.game.name);
        message.push(`Дата: ${getDateWithDayOfWeek(dayjs(request.affiche.dog))}`);
      }

      const keyboard = Keyboard.builder()
        .textButton({ label: 'Ещё раньше', payload: { command: 'older' }, color: ButtonColor.PRIMARY })
        .textButton({ label: 'Актуальные', payload: { command: 'now' }, color: ButtonColor.PRIMARY })
        .row()
        .textButton({ label: 'Назад', payload: { command: 'back' }, color: ButtonColor.SECONDARY });

      await context.send(`Прошедшие заявки (${start.format('DD.MM.YYYY')} - ${end.format('DD.MM.YYYY')}): `);
      return context.send(message.length ? message.join('\n') : 'Нет заявок', { keyboard });
    }

    switch (payload.command) {
      case 'older':
        context.scene.state.scip = (Number(context.scene.state.scip) - 1).toString();
        return context.scene.step.go(1);
      case 'now':
        context.scene.state.scip = '0';
        return context.scene.step.go(0);
      default:
        return;
    }
  }
}
