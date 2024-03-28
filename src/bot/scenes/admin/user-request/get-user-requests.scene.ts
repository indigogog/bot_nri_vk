import { AddStep, Context, Ctx, InjectVkApi, Scene, SceneEnter } from 'nestjs-vk';
import { ScenesNamesEnum } from '../../scenes-names.enum';
import { UserRequestService } from '../../../../main-entities/user-request/user-request.service';
import { IStepContext } from '@vk-io/scenes';
import { ButtonColor, Keyboard, MessageContext, VK } from 'vk-io';
import { MessagePayloadDecorator } from '../../../common/decorators/message-payload.decorator';
import { getDateWithDayOfWeek } from '../../../common';
import * as dayjs from 'dayjs';
import { AfficheService } from '../../../../main-entities/affiche/affiche.service';
import { checkForNull, makeFileReport } from '../../../common/helpers/other-helpers';
import * as fs from 'fs';

interface GetUserRequestsSceneMessagePayload {
  [index: string]: string | number;

  command: 'back' | 'show' | 'showAll' | 'file' | 'fileAll' | 'byAffiche' | 'comment';
  selectedAfficheId: string;
}

@Scene(ScenesNamesEnum.getUserRequests)
export class GetUserRequestsScene {
  constructor(
    @InjectVkApi()
    private readonly bot: VK,
    private readonly requestService: UserRequestService,
    private readonly afficheService: AfficheService,
  ) {
  }

  @SceneEnter()
  async onSceneEnter() {
    await new Promise((r) => setTimeout(r, 0));
    console.log('Enter to GetUserRequestsScene');
  }

  @AddStep(0)
  async chooseReport(
    @Context() context: IStepContext<GetUserRequestsSceneMessagePayload>,
    @Ctx() ctx: MessageContext,
    @MessagePayloadDecorator() payload: GetUserRequestsSceneMessagePayload,
  ) {
    if (payload.command === 'back') {
      return ctx.scene.enter(ScenesNamesEnum.firstScene);
    }

    if (context.scene.step.firstTime || !context.text) {
      const keyboard = Keyboard.builder()
        .textButton({ label: 'Текущие', payload: { command: 'show' }, color: ButtonColor.PRIMARY })
        .textButton({ label: 'Все', payload: { command: 'showAll' }, color: ButtonColor.PRIMARY })
        .row()
        .textButton({ label: 'Текущие.xls', payload: { command: 'file' }, color: ButtonColor.PRIMARY })
        .textButton({ label: 'Все.xls', payload: { command: 'fileAll' }, color: ButtonColor.PRIMARY })
        .row()
        .textButton({ label: 'По игре', payload: { command: 'byAffiche' }, color: ButtonColor.PRIMARY })
        .textButton({ label: 'Прокоментировать', payload: { command: 'comment' }, color: ButtonColor.PRIMARY })
        .row()
        .textButton({ label: 'Назад', payload: { command: 'back' }, color: ButtonColor.SECONDARY });

      return context.send('Подготовить отчёт?', { keyboard });
    }

    context.scene.state.command = payload.command;
    return context.scene.step.next();
  }

  @AddStep(1)
  async proxy(
    @Context() context: IStepContext<GetUserRequestsSceneMessagePayload>,
    @Ctx() ctx: MessageContext,
    @MessagePayloadDecorator() payload: GetUserRequestsSceneMessagePayload,
  ) {
    if (payload.command === 'back') {
      return ctx.scene.enter(ScenesNamesEnum.firstScene);
    }

    if (context.scene.step.firstTime || !context.text) {
      switch (context.scene.state.command) {
        case 'show':
          const actualRequest = await this.requestService.getActualRequests();

          const message: string[] = [];

          for (const request of actualRequest) {
            message.push(`Игра: ${request.affiche.game.name}`);
            message.push(`Дата: ${getDateWithDayOfWeek(dayjs(request.affiche.dog))}`);
            message.push(`Данные об игроке:`);
            message.push(`Имя: ${request.user.firstname}`);
            message.push(`Фамилия: ${request.user.lastname}`);
            message.push(`Способ связи: ${checkForNull(request.user.communication)}`);
            message.push(`Пол: ${checkForNull(request.user.sex)}`);
            message.push(`Возраст: ${checkForNull(request.user.age)}`);
            if (request.dateDeleted) {
              message.push(`Статус: ЗАПИСЬ ОТМЕНЕНА`);
            }
            message.push('______________\n');
          }

          context.send(actualRequest.length ? message.join('\n') : 'Нет заявок');
          return context.scene.step.go(0);

        case 'showAll':
          const requests = await this.requestService.getAllRequests();

          const allMessage: string[] = [];

          for (const request of requests) {
            allMessage.push(`Игра: ${request.affiche.game.name}`);
            allMessage.push(`Дата: ${getDateWithDayOfWeek(dayjs(request.affiche.dog))}`);
            allMessage.push(`Данные об игроке:`);
            allMessage.push(`Имя: ${request.user.firstname}`);
            allMessage.push(`Фамилия: ${request.user.lastname}`);
            allMessage.push(`Способ связи: ${checkForNull(request.user.communication)}`);
            allMessage.push(`Пол: ${checkForNull(request.user.sex)}`);
            allMessage.push(`Возраст: ${checkForNull(request.user.age)}`);
            if (request.dateDeleted) {
              allMessage.push(`Статус: ЗАПИСЬ ОТМЕНЕНА`);
            }
            allMessage.push('______________\n');
          }

          await context.send(requests.length ? allMessage.join('\n') : 'Нет заявок');
          return context.scene.step.go(0);

        case 'file':
          const actualRequestForFile = await this.requestService.getActualRequests();
          const data = await makeFileReport(actualRequestForFile);

          const attachment = await this.bot.upload.messageDocument({
            peer_id: ctx.peerId,
            source: {
              values: [
                {
                  filename: `Отчёт-${dayjs().format('DD-MM-YYYY:hh:mm:ss')}.xlsx`,
                  value: fs.createReadStream(data.path),
                  contentLength: data.size,
                },
              ],
            },
          });

          await ctx.send('Отчёт подготовлен', { attachment, peer_id: ctx.peerId });
          break;

        case 'fileAll':
          const allRequestForFile = await this.requestService.getActualRequests();
          const { path, size } = await makeFileReport(allRequestForFile);

          const allAttachment = await this.bot.upload.messageDocument({
            peer_id: ctx.peerId,
            source: {
              values: [
                {
                  filename: `Отчёт-${dayjs().format('DD-MM-YYYY:hh:mm:ss')}.xlsx`,
                  value: fs.createReadStream(path),
                  contentLength: size,
                },
              ],
            },
          });

          await ctx.send('Отчёт подготовлен', { attachment: allAttachment, peer_id: ctx.peerId });
          break;

        case 'byAffiche':
          return context.scene.step.go(2);
        case 'comment':
          return ctx.scene.enter(ScenesNamesEnum.commentUserRequest);
        default:
          await context.send('Ещё в работе');
          return context.scene.step.go(0);
      }
    }

    return context.scene.step.go(0);
  }

  @AddStep(2)
  async showRequestByAffiche(
    @Context() context: IStepContext<GetUserRequestsSceneMessagePayload>,
    @Ctx() ctx: MessageContext,
    @MessagePayloadDecorator() payload: GetUserRequestsSceneMessagePayload,
  ) {
    if (payload.command === 'back') {
      return ctx.scene.enter(ScenesNamesEnum.firstScene);
    }

    if (context.scene.step.firstTime || !context.text) {
      const affiches = await this.afficheService.getNewAffiches();
      const message: string[] = [];

      const keyboard = Keyboard.builder();
      for (let i = 0; i < affiches.length; i++) {
        message.push(`№${i + 1}`);
        message.push(affiches[i].name);
        message.push('Кол-во заявок:');
        message.push(affiches[i].busyPlaces.toString());
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

      await context.send(message.length ? message.join('\n') : 'Нет актуальных афиш');
      return context.send('Выберите игру', { keyboard });
    }

    if (!payload.selectedAfficheId) {
      return;
    }

    const requests = await this.requestService.getActualRequestsByAffiche(Number(payload.selectedAfficheId));
    const message: string[] = [];

    for (const request of requests) {
      message.push(`Игра: ${request.affiche.game.name}`);
      message.push(`Дата: ${getDateWithDayOfWeek(dayjs(request.affiche.dog))}`);
      message.push(`Данные об игроке:`);
      message.push(`Имя: ${request.user.firstname}`);
      message.push(`Фамилия: ${request.user.lastname}`);
      message.push(`Способ связи: ${checkForNull(request.user.communication)}`);
      message.push(`Пол: ${checkForNull(request.user.sex)}`);
      message.push(`Возраст: ${checkForNull(request.user.age)}`);
      if (request.dateDeleted) {
        message.push(`Статус: ЗАПИСЬ ОТМЕНЕНА`);
      }
      message.push('______________\n');
    }

    await context.send(requests.length ? message.join('\n') : 'Нет заявок');
    return context.scene.step.go(0);
  }
}
