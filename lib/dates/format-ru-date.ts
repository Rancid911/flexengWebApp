const RU_LOCALE = "ru-RU";
const MOSCOW_TIME_ZONE = "Europe/Moscow";

const ruLongDateFormatter = new Intl.DateTimeFormat(RU_LOCALE, {
  day: "2-digit",
  month: "long",
  year: "numeric",
  timeZone: MOSCOW_TIME_ZONE
});

const ruDayMonthFormatter = new Intl.DateTimeFormat(RU_LOCALE, {
  day: "2-digit",
  month: "long",
  timeZone: MOSCOW_TIME_ZONE
});

const ruLongDateTimeFormatter = new Intl.DateTimeFormat(RU_LOCALE, {
  day: "2-digit",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: MOSCOW_TIME_ZONE
});

const ruTimeFormatter = new Intl.DateTimeFormat(RU_LOCALE, {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: MOSCOW_TIME_ZONE
});

const ruShortDateFormatter = new Intl.DateTimeFormat(RU_LOCALE, {
  dateStyle: "short",
  timeZone: MOSCOW_TIME_ZONE
});

const ruShortDateTimeFormatter = new Intl.DateTimeFormat(RU_LOCALE, {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: MOSCOW_TIME_ZONE
});

const ruDayMonthWeekdayFormatter = new Intl.DateTimeFormat(RU_LOCALE, {
  day: "numeric",
  month: "long",
  weekday: "long",
  timeZone: MOSCOW_TIME_ZONE
});

const moscowDayKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: MOSCOW_TIME_ZONE
});

function parseDate(value: string | Date | null | undefined) {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date;
}

export function formatRuLongDate(value: string | Date | null | undefined) {
  const date = parseDate(value);
  if (!date) return "";
  return ruLongDateFormatter.format(date);
}

export function formatRuDayMonth(value: string | Date | null | undefined) {
  const date = parseDate(value);
  if (!date) return "";
  return ruDayMonthFormatter.format(date);
}

export function formatRuLongDateTime(value: string | Date | null | undefined) {
  const date = parseDate(value);
  if (!date) return "";
  return ruLongDateTimeFormatter.format(date);
}

export function formatRuTime(value: string | Date | null | undefined) {
  const date = parseDate(value);
  if (!date) return "";
  return ruTimeFormatter.format(date);
}

export function formatRuShortDate(value: string | Date | null | undefined) {
  const date = parseDate(value);
  if (!date) return "";
  return ruShortDateFormatter.format(date);
}

export function formatRuShortDateTime(value: string | Date | null | undefined) {
  const date = parseDate(value);
  if (!date) return "";
  return ruShortDateTimeFormatter.format(date);
}

export function formatRuDayMonthWeekday(value: string | Date | null | undefined) {
  const date = parseDate(value);
  if (!date) return "";
  return ruDayMonthWeekdayFormatter.format(date);
}

export function getMoscowDayKey(value: string | Date | null | undefined) {
  const date = parseDate(value);
  if (!date) return "";
  return moscowDayKeyFormatter.format(date);
}
