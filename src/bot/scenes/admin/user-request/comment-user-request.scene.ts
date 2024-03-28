import { AddStep, Context, Ctx, Scene, SceneEnter } from 'nestjs-vk';
import { ScenesNamesEnum } from '../../scenes-names.enum';
import { UserRequestService } from '../../../../main-entities/user-request/user-request.service';
import { IStepContext } from '@vk-io/scenes';
import { ButtonColor, Keyboard, MessageContext } from 'vk-io';
import { MessagePayloadDecorator } from '../../../common/decorators/message-payload.decorator';
import { getDateWithDayOfWeek } from '../../../common';
import * as dayjs from 'dayjs';
import { checkForNull } from '../../../common/helpers/other-helpers';

interface CommentUserRequestSceneMessagePayload {
  [index: string]: string | number;

  command: 'back' | 'again';
  selectedRequestId: string;
}

@Scene(ScenesNamesEnum.commentUserRequest)
export class CommentUserRequestScene {
  constructor(private readonly requestService: UserRequestService) {
  }

  @SceneEnter()
  async onSceneEnter() {
    await new Promise((r) => setTimeout(r, 0));
    console.log('Enter to CommentUserRequestScene');
  }

  @AddStep(0)
  async chooseReport(
    @Context() context: IStepContext<CommentUserRequestSceneMessagePayload>,
    @Ctx() ctx: MessageContext,
    @MessagePayloadDecorator() payload: CommentUserRequestSceneMessagePayload,
  ) {
    if (payload.command === 'back') {
      return ctx.scene.enter(ScenesNamesEnum.getUserRequests);
    }

    if (context.scene.step.firstTime || !context.text) {
      const requests = await this.requestService.getActualRequests();

      const message: string[] = [];
      const keyboard = Keyboard.builder();

      for (let i = 0; i < requests.length; i++) {
        message.push(`№${i + 1}`);
        message.push(`Игра: ${requests[i].affiche.game.name}`);
        message.push(`Дата: ${getDateWithDayOfWeek(dayjs(requests[i].affiche.dog))}`);
        message.push(`Данные об игроке:`);
        message.push(`Имя: ${requests[i].user.firstname}`);
        message.push(`Фамилия: ${requests[i].user.lastname}`);
        message.push(`Способ связи: ${checkForNull(requests[i].user.communication)}`);
        message.push(`Пол: ${checkForNull(requests[i].user.sex)}`);
        message.push(`Возраст: ${checkForNull(requests[i].user.age)}`);
        if (requests[i].dateDeleted) {
          message.push(`Статус: ЗАПИСЬ ОТМЕНЕНА`);
        }
        message.push('______________\n');

        if (i % 2 === 0) {
          keyboard.row();
        }

        keyboard.textButton({
          label: `№${i + 1}`,
          payload: { selectedRequestId: requests[i].id.toString() },
          color: ButtonColor.PRIMARY,
        });
      }

      context.send(requests.length ? message.join('\n') : 'Нет заявок');
      keyboard.textButton({ label: 'Назад', payload: { command: 'back' }, color: ButtonColor.SECONDARY });

      return context.send('Выберите заявку, которую хотите прокомментировать', { keyboard });
    }

    if (!payload) {
      return;
    }

    context.scene.state.command = payload.command;
    context.scene.state.selectedRequestId = payload.selectedRequestId;
    return context.scene.step.next();
  }

  @AddStep(1)
  async getComment(
    @Context() context: IStepContext<CommentUserRequestSceneMessagePayload>,
    @MessagePayloadDecorator() payload: CommentUserRequestSceneMessagePayload,
  ) {
    if (payload?.command === 'back') {
      return context.scene.step.go(0);
    }

    if (context.scene.step.firstTime || !context.text) {
      const keyboard = Keyboard.builder().textButton({
        label: 'Назад',
        payload: { command: 'back' },
        color: ButtonColor.SECONDARY,
      });

      return context.send('Напишите комментарий', { keyboard });
    }

    await this.requestService.addAdminComment(Number(context.scene.state.selectedRequestId), context.text);
    context.send('Комментарий успешно добавлен');
    return context.scene.step.next();
  }

  @AddStep(2)
  async whatNext(
    @Context() context: IStepContext<CommentUserRequestSceneMessagePayload>,
    @Ctx() ctx: MessageContext,
    @MessagePayloadDecorator() payload: CommentUserRequestSceneMessagePayload,
  ) {
    if (payload?.command === 'back') {
      return ctx.scene.enter(ScenesNamesEnum.getUserRequests);
    }

    if (context.scene.step.firstTime) {
      const keyboard = Keyboard.builder()
        .textButton({
          label: 'Ещё',
          payload: { command: 'again' },
          color: ButtonColor.SECONDARY,
        })
        .row()
        .textButton({
          label: 'Назад',
          payload: { command: 'back' },
          color: ButtonColor.SECONDARY,
        });

      return context.send('Что дальше?', { keyboard });
    }

    if (payload.command === 'again') {
      return context.scene.step.go(0);
    }

    return;
  }
}
