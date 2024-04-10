import { AddStep, Context, Ctx, Scene, SceneEnter } from 'nestjs-vk';
import { ScenesNamesEnum } from '../scenes-names.enum';
import { UserRequestService } from '../../../main-entities/user-request/user-request.service';
import { IStepContext } from '@vk-io/scenes';
import { MessagePayloadDecorator } from '../../common/decorators/message-payload.decorator';
import { ButtonColor, Keyboard, MessageContext } from 'vk-io';
import { getDateWithDayOfWeek } from '../../common';
import * as dayjs from 'dayjs';
import { UserService } from '../../../main-entities/user/user.service';

export interface DeleteUserRequestMessagePayload {
  [index: string]: string;

  command: 'back' | 'again' | 'confirm';
  selectedRequestId: string;
}

@Scene(ScenesNamesEnum.deleteRequest)
export class DeleteUserRequestScene {
  constructor(private readonly requestService: UserRequestService, private readonly userService: UserService) {}

  @SceneEnter()
  async onSceneEnter() {
    await new Promise((r) => setTimeout(r, 0));
    console.log('Enter to DeleteUserRequestScene');
  }

  @AddStep(0)
  async chooseRequest(
    @Context() context: IStepContext<DeleteUserRequestMessagePayload>,
    @MessagePayloadDecorator() payload: DeleteUserRequestMessagePayload,
    @Ctx() ctx: MessageContext,
  ) {
    if (payload.command === 'back') {
      return ctx.scene.enter(ScenesNamesEnum.userRequest);
    }

    if (context.scene.step.firstTime || !context.text) {
      const requests = await this.requestService.getUserRequests(ctx.senderId);

      const message: string[] = [];
      const keyboard = Keyboard.builder();

      for (let i = 0; i < requests.length; i++) {
        message.push(`№${i + 1}`);
        message.push(requests[i].affiche.game.name);
        message.push(`Дата: ${getDateWithDayOfWeek(dayjs(requests[i].affiche.dog))}`);

        if (i % 2 === 0) {
          keyboard.row();
        }

        keyboard.textButton({
          label: `№${i + 1}`,
          payload: { selectedRequestId: requests[i].id },
          color: ButtonColor.NEGATIVE,
        });
      }

      keyboard.textButton({ label: 'Назад', payload: { command: 'back' }, color: ButtonColor.POSITIVE });

      await context.send('Выберите заявку, которую хотите отменить: ');
      return context.send(message.join('\n'), { keyboard });
    }

    context.scene.state.selectedRequestId = payload.selectedRequestId;
    return context.scene.step.next();
  }

  @AddStep(1)
  async confirm(
    @Context() context: IStepContext<DeleteUserRequestMessagePayload>,
    @MessagePayloadDecorator() payload: DeleteUserRequestMessagePayload,
    @Ctx() ctx: MessageContext,
  ) {
    if (payload.command === 'back') {
      return ctx.scene.enter(ScenesNamesEnum.userRequest);
    }

    if (context.scene.step.firstTime || !context.text) {
      const selectedRequest = await this.requestService.getUserRequestById(
        Number(context.scene.state.selectedRequestId),
      );

      const keyboard = Keyboard.builder()
        .textButton({ label: 'Подтверждаю', payload: { command: 'confirm' }, color: ButtonColor.POSITIVE })
        .row()
        .textButton({ label: 'Отмена', payload: { command: 'back' } });
      return context.send(
        `Вы выбрали игру: ${selectedRequest.affiche.game.name}\n
         Дата:  ${getDateWithDayOfWeek(dayjs(selectedRequest.affiche.dog))}\n
         Нажмите "Подтверждаю" для того, чтобы отменить запись
        `,
        { keyboard },
      );
    }

    return context.scene.step.next();
  }

  @AddStep(2)
  async deleteAndChooseNext(
    @Context() context: IStepContext<DeleteUserRequestMessagePayload>,
    @MessagePayloadDecorator() payload: DeleteUserRequestMessagePayload,
    @Ctx() ctx: MessageContext,
  ) {
    if (payload.command === 'back') {
      return ctx.scene.enter(ScenesNamesEnum.userRequest);
    }

    if (context.scene.step.firstTime || !context.text) {
      const { affiche } = await this.requestService.getUserRequestById(Number(context.scene.state.selectedRequestId));

      if (payload.command === 'confirm') {
        await this.requestService.deleteUserRequest(Number(context.scene.state.selectedRequestId));
      }

      const ADMIN_IDS = process.env.ADMIN_IDS.split(',').map((id) => Number(id));
      const user = await this.userService.getUser(ctx.senderId);

      for (const adminId of ADMIN_IDS) {
        await ctx.send(
          `
        ОТМЕНА ЗАЯВКИ: \n
        Игрок: ${user.lastname + ' ' + user.firstname}, https://vk.com/id${ctx.senderId}\n
        Игра: ${affiche.game.name}\n
        Дата: ${getDateWithDayOfWeek(dayjs(affiche.dog))}\n
      `,
          { user_id: adminId, peer_id: adminId },
        );
      }

      const keyboard = Keyboard.builder()
        .textButton({ label: 'Ещё', payload: { command: 'again' }, color: ButtonColor.POSITIVE })
        .row()
        .textButton({ label: 'Назад', payload: { command: 'back' } });

      return context.send('Запись отменена.😔 Что дальше?', { keyboard });
    }

    context.scene.state.selectedRequestId = undefined;
    return context.scene.step.go(0);
  }
}
