import { AfficheService } from '../../../../main-entities/affiche/affiche.service';
import { AddStep, Context, Ctx, Scene, SceneEnter } from 'nestjs-vk';
import { ScenesNamesEnum } from '../../scenes-names.enum';
import { IStepContext } from '@vk-io/scenes';
import { MessagePayloadDecorator } from '../../../common/decorators/message-payload.decorator';
import { ButtonColor, Keyboard, MessageContext } from 'vk-io';
import { getDateWithDayOfWeek, getStartAndEndOfWeek, getStartAndEndOfWeekByDay, getWeekDays } from '../../../common';
import { GameService } from '../../../../main-entities/game/game.service';
import * as dayjs from 'dayjs';
import 'dayjs/locale/ru.js';

dayjs.locale('ru');

interface ICreateAffiche {
  [index: string]: string | number;

  selectedWeekStart: string;
  selectedWeekEnd: string;
  selectedDay: string;
  selectedGameId: string;
  selectedTime: string;

  command: 'back' | 'nextWeek' | 'again';
}

@Scene(ScenesNamesEnum.createAfficheScene)
export class CreateAfficheScene {
  constructor(private readonly afficheService: AfficheService, private readonly gameService: GameService) {}

  @SceneEnter()
  async onSceneEnter() {
    await new Promise((r) => setTimeout(r, 0));
    console.log('Enter to createAfficheScene');
  }

  @AddStep(0)
  async selectWeek(
    @Context() context: IStepContext<ICreateAffiche>,
    @Ctx() ctx: MessageContext,
    @MessagePayloadDecorator() payload: ICreateAffiche,
  ) {
    if (payload.command === 'back') {
      return ctx.scene.enter(ScenesNamesEnum.afficheScene);
    }

    if (context.scene.step.firstTime || !context.text) {
      const isSunday = dayjs().diff(dayjs().day(0)) === 0;
      const currentWeek = getStartAndEndOfWeek(0, isSunday);
      const nextWeek = getStartAndEndOfWeek(1, isSunday);

      const keyboard = Keyboard.builder()
        .textButton({
          label: 'Текущая',
          payload: { selectedWeekStart: currentWeek.start, selectedWeekEnd: currentWeek.end },
          color: ButtonColor.PRIMARY,
        })
        .textButton({
          label: 'Следующая',
          payload: { selectedWeekStart: nextWeek.start, selectedWeekEnd: nextWeek.end },
          color: ButtonColor.PRIMARY,
        })
        .row()
        .textButton({ label: 'Назад', payload: { command: 'back' }, color: ButtonColor.SECONDARY });

      context.send('Выберите неделю, на которую хотите задать афишу', { keyboard });
      context.send(`Текущая: ${currentWeek.start.format('DD.MM.YYYY')} - ${currentWeek.end.format('DD.MM.YYYY')}`);
      return context.send(`Следующая: ${nextWeek.start.format('DD.MM.YYYY')} - ${nextWeek.end.format('DD.MM.YYYY')}`);
    }

    context.scene.state.selectedWeekStart = payload.selectedWeekStart;
    context.scene.state.selectedWeekEnd = payload.selectedWeekEnd;

    return context.scene.step.next();
  }

  @AddStep(1)
  async selectDay(
    @Context() context: IStepContext<ICreateAffiche>,
    @MessagePayloadDecorator() payload: ICreateAffiche,
  ) {
    if (payload.command === 'back') {
      context.scene.state.selectedWeekStart = undefined;
      context.scene.state.selectedWeekEnd = undefined;
      context.scene.state.selectedDay = undefined;
      return context.scene.step.go(0);
    }

    if (context.scene.step.firstTime || !context.text) {
      const days = getWeekDays(context.scene.state.selectedWeekStart);

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
    @Context() context: IStepContext<ICreateAffiche>,
    @MessagePayloadDecorator() payload: ICreateAffiche,
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

    const hours = Number(context.text.split(' ')[0]);
    if (Number.isNaN(hours)) {
      context.send('Вы неправильно ввели часы');
      return context.scene.step.go(2);
    }

    const minutes = Number(context.text.split(' ')[1]);

    if (Number.isNaN(minutes)) {
      context.send('Вы неправильно ввели минуты');
      return context.scene.step.go(2);
    }

    const dog = dayjs(context.scene.state.selectedDay, 'MM.DD.YYYY', 'ru', true)
      .add(hours, 'hour')
      .add(minutes, 'minute');
    const check = await this.afficheService.checkAfficheWithThisTime(dog.toISOString());

    if (check) {
      context.send(`
        Ошибка 🤧: в этот день и время уже назначена игра \n
        Дата: ${getDateWithDayOfWeek(dayjs(check.dog))}.
        Игра: ${check.game.name}.
      `);

      context.send('Выберите другое время или другой день');
      return context.scene.step.go(2);
    }

    context.scene.state.selectedTime = context.text;
    return context.scene.step.next();
  }

  @AddStep(3)
  async createAfficheStep(
    @Context() context: IStepContext<ICreateAffiche>,
    @MessagePayloadDecorator() payload: ICreateAffiche,
  ) {
    if (payload?.command === 'back') {
      context.scene.state.selectedDay = undefined;
      return context.scene.step.go(1);
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
          payload: { selectedGameId: gamesToUpdate[i].id.toString() },
          color: ButtonColor.PRIMARY,
        });
      }

      chooseGameKeyboard.row().textButton({ label: 'Отмена', payload: { command: 'back' } });

      return context.send('Выберите игру', { keyboard: chooseGameKeyboard });
    }

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

    const newAffiche = await this.afficheService.createAffiche({
      dog: dog.toISOString(),
      idGame: Number(payload.selectedGameId),
    });

    context.send(`Создана афиша: \n ${newAffiche.game?.name}\n Дата: ${getDateWithDayOfWeek(dayjs(newAffiche.dog))}`);
    context.scene.state.selectedDay = undefined;
    context.scene.state.selectedTime = undefined;
    return context.scene.step.next();
  }

  @AddStep(4)
  async chooseNext(
    @Context() context: IStepContext<ICreateAffiche>,
    @MessagePayloadDecorator() payload: ICreateAffiche,
    @Ctx() ctx: MessageContext,
  ) {
    if (context.scene.step.firstTime || !context.text) {
      const keyboard = Keyboard.builder()
        .textButton({ label: 'Создать ещё', payload: { command: 'again' }, color: ButtonColor.POSITIVE })
        .textButton({ label: 'След. неделя', payload: { command: 'nextWeek' }, color: ButtonColor.PRIMARY })
        .row()
        .textButton({ label: 'Закончить', payload: { command: 'back' } });
      return context.send('Что дальше?', { keyboard });
    }

    switch (payload.command) {
      case 'again':
        return context.scene.step.go(1);
      case 'nextWeek':
        const nextWeekStart = dayjs(context.scene.state.selectedWeekEnd).add(1, 'day');

        const { start, end } = getStartAndEndOfWeekByDay(nextWeekStart);

        context.scene.state.selectedWeekStart = start.toString();
        context.scene.state.selectedWeekEnd = end.toString();

        return context.scene.step.go(1);
      case 'back':
        return ctx.scene.enter(ScenesNamesEnum.afficheScene);
    }
  }
}
