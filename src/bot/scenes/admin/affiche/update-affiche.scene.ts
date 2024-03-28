import { AddStep, Context, Ctx, Scene, SceneEnter } from 'nestjs-vk';
import { ScenesNamesEnum } from '../../scenes-names.enum';
import { AfficheService } from '../../../../main-entities/affiche/affiche.service';
import { IStepContext } from '@vk-io/scenes';
import { MessagePayloadDecorator } from '../../../common/decorators/message-payload.decorator';
import { ButtonColor, Keyboard, MessageContext } from 'vk-io';
import * as dayjs from 'dayjs';
import { getDateWithDayOfWeek, getStartAndEndOfWeekByDay, getWeekDays } from '../../../common';

interface adminSceneMessagePayload {
  [index: string]: string;

  selectedDay: string;
  selectedTime: string;
  selectedAfficheId: string;
  command: 'again' | 'back';
}

@Scene(ScenesNamesEnum.updateAfficheScene)
export class UpdateAfficheScene {
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
          payload: { selectedAfficheId: affiche.id },
        });
      }

      return context.send('Выберите афишу: ', { keyboard });
    }

    context.scene.state.selectedAfficheId = payload.selectedAfficheId;
    return context.scene.step.next();
  }

  @AddStep(1)
  async selectDay(
    @Context() context: IStepContext<adminSceneMessagePayload>,
    @MessagePayloadDecorator() payload: adminSceneMessagePayload,
  ) {
    if (payload.command === 'back') {
      context.scene.state.selectedDay = undefined;
      return context.scene.step.go(0);
    }

    if (context.scene.step.firstTime || !context.text) {
      const affiche = await this.afficheService.getAfficheById(Number(context.scene.state.selectedAfficheId));
      const { start } = getStartAndEndOfWeekByDay(dayjs(affiche.dog));
      const days = getWeekDays(start.toISOString());

      const keyboard = Keyboard.builder()
        .textButton({
          label: 'Понедельник',
          payload: { selectedDay: days.monday.format('MM.DD.YYYY') },
          color: ButtonColor.PRIMARY,
        })
        .textButton({
          label: 'Вторник',
          payload: { selectedDay: days.tuesday.format('MM.DD.YYYY') },
          color: ButtonColor.PRIMARY,
        })
        .row()
        .textButton({
          label: 'Среда',
          payload: { selectedDay: days.wednesday.format('MM.DD.YYYY') },
          color: ButtonColor.PRIMARY,
        })
        .textButton({
          label: 'Четверг',
          payload: { selectedDay: days.thursday.format('MM.DD.YYYY') },
          color: ButtonColor.PRIMARY,
        })
        .row()
        .textButton({
          label: 'Пятница',
          payload: { selectedDay: days.friday.format('MM.DD.YYYY') },
          color: ButtonColor.PRIMARY,
        })
        .textButton({
          label: 'Суббота',
          payload: { selectedDay: days.saturday.format('MM.DD.YYYY') },
          color: ButtonColor.PRIMARY,
        })
        .row()
        .textButton({
          label: 'Воскресенье',
          payload: { selectedDay: days.sunday.format('MM.DD.YYYY') },
          color: ButtonColor.PRIMARY,
        })
        .textButton({ label: 'Назад', payload: { command: 'back' }, color: ButtonColor.SECONDARY });

      const message: string[] = [];

      message.push('Выберите день');
      message.push(`${getDateWithDayOfWeek(days.monday, false)}`);
      message.push(`${getDateWithDayOfWeek(days.tuesday, false)}`);
      message.push(`${getDateWithDayOfWeek(days.wednesday, false)}`);
      message.push(`${getDateWithDayOfWeek(days.thursday, false)}`);
      message.push(`${getDateWithDayOfWeek(days.friday, false)}`);
      message.push(`${getDateWithDayOfWeek(days.saturday, false)}`);
      message.push(`${getDateWithDayOfWeek(days.sunday, false)}`);
      return context.send(message.join('\n'), { keyboard });
    }

    context.scene.state.selectedDay = payload.selectedDay;

    return context.scene.step.next();
  }

  @AddStep(2)
  async chooseTime(
    @Context() context: IStepContext<adminSceneMessagePayload>,
    @MessagePayloadDecorator() payload: adminSceneMessagePayload,
  ) {
    if (payload?.command === 'back') {
      context.scene.state.selectedDay = undefined;
      return context.scene.step.go(1);
    }

    if (context.scene.step.firstTime || !context.text) {
      const keyboard = Keyboard.builder().textButton({
        label: 'Назад',
        payload: { command: 'back' },
        color: ButtonColor.SECONDARY,
      });

      return context.send('Напишите время в формате часы минуты (например 20 00)', { keyboard });
    }

    context.scene.state.selectedTime = context.text;

    const hours = Number(context.scene.state.selectedTime.split(' ')[0]);
    if (Number.isNaN(hours)) {
      context.send('Вы неправильно ввели часы');
      return context.scene.step.go(2);
    }

    const minutes = Number(context.scene.state.selectedTime.split(' ')[1]);

    if (Number.isNaN(minutes)) {
      context.send('Вы неправильно ввели минуты');
      return context.scene.step.go(2);
    }

    const dog = dayjs(context.scene.state.selectedDay, 'MM.DD.YYYY', 'ru', true)
      .add(hours, 'hour')
      .add(minutes, 'minute');

    await this.afficheService.updateAffiche({
      dog: dog.toISOString(),
      id: Number(context.scene.state.selectedAfficheId),
    });

    const updatedAffiche = await this.afficheService.getAfficheById(Number(context.scene.state.selectedAfficheId));

    context.send(
      `Обновленна афиша: \n ${updatedAffiche.game?.name}\n Дата: ${getDateWithDayOfWeek(dayjs(updatedAffiche.dog))}`,
    );
    context.scene.state.selectedDay = undefined;
    context.scene.state.selectedTime = undefined;
    return context.scene.step.next();
  }

  @AddStep(4)
  async chooseNext(
    @Context() context: IStepContext<adminSceneMessagePayload>,
    @MessagePayloadDecorator() payload: adminSceneMessagePayload,
    @Ctx() ctx: MessageContext,
  ) {
    if (context.scene.step.firstTime || !context.text) {
      const keyboard = Keyboard.builder()
        .textButton({ label: 'Редактировать ещё', payload: { command: 'again' }, color: ButtonColor.POSITIVE })
        .row()
        .textButton({ label: 'Закончить', payload: { command: 'back' } });
      return context.send('Что дальше?', { keyboard });
    }

    switch (payload.command) {
      case 'again':
        return context.scene.step.go(0);
      case 'back':
        return ctx.scene.enter(ScenesNamesEnum.afficheScene);
      default:
        context.send('Неизвестная команда');
        return context.scene.step.go(4);
    }
  }
}
