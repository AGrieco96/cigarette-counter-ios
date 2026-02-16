import { DateTime } from 'luxon';

const APP_TZ = 'Europe/Rome';

export const inAppTz = (date = new Date()) => DateTime.fromJSDate(date).setZone(APP_TZ);
export const startOfToday = () => DateTime.now().setZone(APP_TZ).startOf('day').toISO()!;
export const endOfToday = () => DateTime.now().setZone(APP_TZ).endOf('day').toISO()!;
export const lastNDaysStart = (days: number) =>
  DateTime.now().setZone(APP_TZ).minus({ days: days - 1 }).startOf('day').toISO()!;

export const formatDay = (iso: string) =>
  DateTime.fromISO(iso).setZone(APP_TZ).toLocaleString(DateTime.DATE_HUGE);
