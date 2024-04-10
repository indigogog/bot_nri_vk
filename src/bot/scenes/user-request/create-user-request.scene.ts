import { AddStep, Context, Ctx, Scene, SceneEnter } from 'nestjs-vk';
import { ScenesNamesEnum } from '../scenes-names.enum';
import { ButtonColor, Keyboard, MessageContext } from 'vk-io';
import { UserRequestService } from '../../../main-entities/user-request/user-request.service';
import { IStepContext } from '@vk-io/scenes';
import { MessagePayloadDecorator } from '../../common/decorators/message-payload.decorator';
import { AfficheService } from '../../../main-entities/affiche/affiche.service';
import { getDateWithDayOfWeek } from '../../common';
import * as dayjs from 'dayjs';
import { UserService } from '../../../main-entities/user/user.service';
import { checkForNull } from '../../common/helpers/other-helpers';

interface UserRequestSceneMessagePayload {
  [index: string]: string | number;

  command: 'back' | 'confirm' | 'again' | 'data_not_ok' | 'data_is_ok' | 'no_comment';
  selectedAfficheId: string;
  userComment: string;
}

@Scene(ScenesNamesEnum.createUserRequest)
export class CreateUserRequestScene {
  constructor(
    private readonly requestService: UserRequestService,
    private readonly afficheService: AfficheService,
    private readonly userService: UserService,
  ) {
  }

  @SceneEnter()
  async onSceneEnter() {
    await new Promise((r) => setTimeout(r, 0));
    console.log('Enter to CreateUserRequestScene');
  }

  @AddStep(0)
  async chooseGame(
    @Context() context: IStepContext<UserRequestSceneMessagePayload>,
    @Ctx() ctx: MessageContext,
    @MessagePayloadDecorator() payload: UserRequestSceneMessagePayload,
  ) {
    if (payload.command === 'back') {
      return ctx.scene.enter(ScenesNamesEnum.userRequest);
    }

    const affiches = await this.afficheService.getNewAffiches();

    if (context.scene.step.firstTime || !context.text) {
      const message: string[] = [];

      const keyboard = Keyboard.builder();
      for (let i = 0; i < affiches.length; i++) {
        message.push(`№${i + 1}`);
        message.push(affiches[i].name);
        message.push('Кол-во свободных мест:');
        message.push(affiches[i].freePlaces.toString());
        message.push(`Дата: ${getDateWithDayOfWeek(dayjs(affiches[i].dog))}`);
        message.push('---------\n');

        if (i % 2 === 0) {
          keyboard.row();
        }

        keyboard.textButton({
          label: `№${i + 1}`,
          payload: { selectedAfficheId: affiches[i].id },
          color: ButtonColor.PRIMARY,
        });
      }

      keyboard.row().textButton({ label: 'Отмена', payload: { command: 'back' } });

      await context.send(message.join('\n'));
      return context.send('Выберите игру', { keyboard });
    }

    const selectedAffiche = affiches.find((a) => a.id === Number(payload.selectedAfficheId));

    if (selectedAffiche.freePlaces === 0) {
      return context.send('К сожелению на выбраной игре нет свободных мест');
    }

    context.scene.state.selectedAfficheId = payload.selectedAfficheId;
    return context.scene.step.next();
  }

  @AddStep(1)
  async checkUserData(
    @Context() context: IStepContext<UserRequestSceneMessagePayload>,
    @Ctx() ctx: MessageContext,
    @MessagePayloadDecorator() payload: UserRequestSceneMessagePayload,
  ) {
    if (payload?.command === 'back') {
      return ctx.scene.enter(ScenesNamesEnum.userRequest);
    }

    if (context.scene.step.firstTime || !context.text) {
      const user = await this.userService.getUser(ctx.senderId);

      const message: string[] = [];

      message.push('Проверьте актуальна ли информация о вас');
      message.push(`\n Убедительно просим заполнить все данные перед подтверждением заявки\n`);
      message.push(`Имя: ${user.firstname}`);
      message.push(`Фамилия: ${user.lastname}`);
      message.push(`Способ связи: ${checkForNull(user.communication)}`);
      message.push(`Пол: ${checkForNull(user.sex)}`);
      message.push(`Возраст: ${checkForNull(user.age)}`);
      message.push(`\n Всё верно?`);

      const keyboard = Keyboard.builder()
        .textButton({ label: 'Да', payload: { command: 'data_is_ok' }, color: ButtonColor.PRIMARY })
        .textButton({ label: 'Нет', payload: { command: 'data_not_ok' }, color: ButtonColor.PRIMARY })
        .row()
        .textButton({ label: 'Отмена', payload: { command: 'back' } });

      return context.send(message.join('\n'), { keyboard });
    }

    switch (payload.command) {
      case 'data_is_ok':
        return context.scene.step.next();
      case 'data_not_ok':
        return ctx.scene.enter(ScenesNamesEnum.updateUserData);
    }
  }

  @AddStep(2)
  async getUserComment(
    @Context() context: IStepContext<UserRequestSceneMessagePayload>,
    @Ctx() ctx: MessageContext,
    @MessagePayloadDecorator() payload: UserRequestSceneMessagePayload,
  ) {
    if (payload?.command === 'back') {
      return ctx.scene.enter(ScenesNamesEnum.userRequest);
    }

    if (context.scene.step.firstTime || !context.text) {
      const keyboard = Keyboard.builder()
        .textButton({ label: 'Без комментариев', payload: { command: 'no_comment' }, color: ButtonColor.POSITIVE })
        .row()
        .textButton({ label: 'Отмена', payload: { command: 'back' } });
      return context.send('Напишите если у вас есть какие-нибудь комментарии или пожелания?', { keyboard });
    }

    if (payload?.command === 'no_comment') {
      return context.scene.step.next();
    }

    if (!payload?.command && context.text) {
      context.scene.state.userComment = context.text;
      return context.scene.step.next();
    }

    return;
  }

  @AddStep(3)
  async confirmRequest(
    @Context() context: IStepContext<UserRequestSceneMessagePayload>,
    @Ctx() ctx: MessageContext,
    @MessagePayloadDecorator() payload: UserRequestSceneMessagePayload,
  ) {
    if (payload?.command === 'back') {
      return ctx.scene.enter(ScenesNamesEnum.userRequest);
    }

    const check = await this.requestService.getUserRequests(ctx.senderId);

    if (check.find((req) => req.idAffiche === Number(context.scene.state.selectedAfficheId))) {
      await context.send('Вы уже записаны на эту игру, дважды записаться нельзя');
      context.scene.state.selectedAfficheId = undefined;
      return context.scene.step.go(0);
    }

    if (context.scene.step.firstTime || !context.text) {
      const selectedAffiche = await this.afficheService.getAfficheById(Number(context.scene.state.selectedAfficheId));

      const keyboard = Keyboard.builder()
        .textButton({ label: 'Подтверждаю', payload: { command: 'confirm' }, color: ButtonColor.POSITIVE })
        .row()
        .textButton({ label: 'Отмена', payload: { command: 'back' } });
      return context.send(
        `Вы выбрали игру: ${selectedAffiche.game.name}\n
         Дата: ${getDateWithDayOfWeek(dayjs(selectedAffiche.dog))}\n
         Комментарий: ${context.scene.state.userComment ?? ''}\n 
         Нажмите "Подтверждаю" для того, чтобы записаться
        `,
        { keyboard },
      );
    }

    if (!payload.command) {
      return;
    }

    await this.requestService.createUserRequest({
      userVkId: ctx.senderId,
      userComment: context.scene.state.userComment,
      afficheId: Number(context.scene.state.selectedAfficheId),
    });

    context.scene.state.userComment = undefined;

    context.send('Вы записаны');

    const ADMIN_IDS = process.env.ADMIN_IDS.split(',').map((id) => Number(id));
    const selectedAffiche = await this.afficheService.getAfficheById(Number(context.scene.state.selectedAfficheId));
    const user = await this.userService.getUser(ctx.senderId);

    for (const adminId of ADMIN_IDS) {
      await ctx.send(
        `
        Новая заявка: \n
        Игрок: ${user.lastname + ' ' + user.firstname}, https://vk.com/id${ctx.senderId}\n
        Игра: ${selectedAffiche.game.name}\n
        Дата: ${getDateWithDayOfWeek(dayjs(selectedAffiche.dog))}\n
        Комментарий: ${context.scene.state.userComment ?? ''}\n 
      `,
        { user_id: adminId, peer_id: adminId },
      );
    }

    return context.scene.step.next();
  }

  @AddStep(4)
  async chooseNext(
    @Context() context: IStepContext<UserRequestSceneMessagePayload>,
    @Ctx() ctx: MessageContext,
    @MessagePayloadDecorator() payload: UserRequestSceneMessagePayload,
  ) {
    if (payload.command === 'back') {
      return ctx.scene.enter(ScenesNamesEnum.userRequest);
    }

    if (context.scene.step.firstTime || !context.text) {
      const keyboard = Keyboard.builder()
        .textButton({ label: 'Записаться', payload: { command: 'again' }, color: ButtonColor.POSITIVE })
        .row()
        .textButton({ label: 'Назад', payload: { command: 'back' } });

      return context.send('Что дальше?', { keyboard });
    }

    switch (payload.command) {
      case 'again':
        return context.scene.step.go(0);
      default:
        return;
    }
  }
}
