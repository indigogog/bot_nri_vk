import * as dayjs from 'dayjs';

export function getWeekDays(startWeek: string) {
  const start = dayjs(startWeek);
  return {
    monday: start,
    tuesday: start.add(1, 'day'),
    wednesday: start.add(2, 'day'),
    thursday: start.add(3, 'day'),
    friday: start.add(4, 'day'),
    saturday: start.add(5, 'day'),
    sunday: start.add(6, 'day'),
  };
}

export function getStartAndEndOfWeek(skipWeek: number, needRemoveDay = false) {
  const startDay = dayjs()
    .add(needRemoveDay ? -1 : 0, 'days')
    .add(skipWeek, 'week');
  return {
    start: startDay.day(0).add(1, 'day'),
    end: startDay.day(0).add(7, 'day'),
  };
}

export function getStartAndEndOfWeekByDay(dayOfWeek: dayjs.Dayjs) {
  return {
    start: dayOfWeek.day(0).add(1, 'day'),
    end: dayOfWeek.day(0).add(7, 'day'),
  };
}

export function getDateWithDayOfWeek(day: dayjs.Dayjs, withTime = true) {
  const dayOfWeek = day.day();
  const daysOfWeek = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];

  if (withTime) {
    return `${daysOfWeek[dayOfWeek]} - ` + day.format('DD.MM.YYYY HH:mm');
  } else {
    return `${daysOfWeek[dayOfWeek]} - ` + day.format('DD.MM.YYYY');
  }
}
