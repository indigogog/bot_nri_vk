import { Between } from 'typeorm';
import * as dayjs from 'dayjs';

export const BetweenDates = (from: string, to: string) =>
  Between(dayjs(from).format('YYYY-MM-DD hh:mm:ss'), dayjs(to).format('YYYY-MM-DD hh:mm:ss'));
