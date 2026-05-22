export const MONTHS_RU = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']
export const MONTHS_RU_GEN = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря']
export const DAYS_SHORT_RU = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс']
export const DAYS_FULL_RU = ['Понедельник','Вторник','Среда','Четверг','Пятница','Суббота','Воскресенье']

/** Monday-first day index: 0=Mon … 6=Sun */
export const mondayIndex = (d: Date) => (d.getDay() + 6) % 7

/** Start of Monday of the week containing `date` */
export function startOfWeek(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  const diff = (day + 6) % 7
  d.setDate(d.getDate() - diff)
  return d
}

/** Add `n` days to a date */
export function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

/** Add `n` weeks */
export const addWeeks = (date: Date, n: number) => addDays(date, n * 7)

/** True if two dates are the same calendar day */
export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

/** True if date is today */
export const isToday = (d: Date) => isSameDay(d, new Date())

/** Format as "HH:MM" */
export const fmtTime = (d: Date) =>
  `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`

/** Total minutes from midnight */
export const toMinutes = (d: Date) => d.getHours() * 60 + d.getMinutes()

/** All 7 days of the week containing `date` (Mon–Sun) */
export function weekDays(date: Date): Date[] {
  const mon = startOfWeek(date)
  return Array.from({ length: 7 }, (_, i) => addDays(mon, i))
}

/** Days grid for the mini-calendar month view (always 6 weeks = 42 cells) */
export function calendarGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1)
  const start = startOfWeek(first)
  return Array.from({ length: 42 }, (_, i) => addDays(start, i))
}
