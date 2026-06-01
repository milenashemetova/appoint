import type { Specialist, Space, Slot } from '../types'

const d = (month: number, day: number, hour: number, min = 0) =>
  new Date(2026, month - 1, day, hour, min)

// Mon=1, Tue=2, Wed=3, Thu=4, Fri=5, Sat=6, Sun=0  (matches Date.getDay())
const weekdays = (sh: number, eh: number) => ({
  1: { start: sh * 60, end: eh * 60 },
  2: { start: sh * 60, end: eh * 60 },
  3: { start: sh * 60, end: eh * 60 },
  4: { start: sh * 60, end: eh * 60 },
  5: { start: sh * 60, end: eh * 60 },
})

export const SPECIALISTS: Specialist[] = [
  { id: 'anna', name: 'Анна Трегубова', initials: 'АТ', avatarColor: '#6366f1', workingHours: weekdays(9, 20) },
  { id: 'ksenia', name: 'Ксения Петрова', initials: 'КП', avatarColor: '#8b5cf6', workingHours: weekdays(10, 18) },
  {
    id: 'alexandra', name: 'Александра Титова', initials: 'АТ', avatarColor: '#ec4899',
    workingHours: { 2: { start: 600, end: 1200 }, 3: { start: 600, end: 1200 }, 4: { start: 600, end: 1200 }, 5: { start: 600, end: 1200 }, 6: { start: 600, end: 1080 } },
  },
  { id: 'dmitry', name: 'Дмитрий Смирнов', initials: 'ДС', avatarColor: '#0ea5e9', workingHours: { 1: { start: 480, end: 960 }, 2: { start: 480, end: 960 }, 3: { start: 480, end: 960 }, 4: { start: 480, end: 960 } } },
  { id: 'ekaterina', name: 'Екатерина Волкова', initials: 'ЕВ', avatarColor: '#f59e0b', workingHours: { 1: { start: 600, end: 1140 }, 3: { start: 600, end: 1140 }, 5: { start: 600, end: 1140 } } },
  { id: 'sergey', name: 'Сергей Иванов', initials: 'СИ', avatarColor: '#10b981', workingHours: { 2: { start: 540, end: 1080 }, 4: { start: 540, end: 1080 }, 6: { start: 540, end: 960 } } },
  { id: 'maria', name: 'Мария Петрова', initials: 'МП', avatarColor: '#ef4444', workingHours: weekdays(10, 20) },
]

export const SPACES: Space[] = [
  { id: 'zal-a', name: 'Зал А.', workingHours: { 1: { start: 480, end: 1320 }, 2: { start: 480, end: 1320 }, 3: { start: 480, end: 1320 }, 4: { start: 480, end: 1320 }, 5: { start: 480, end: 1320 }, 6: { start: 600, end: 1200 } } },
  { id: 'zal-b', name: 'Зал Б.', workingHours: weekdays(9, 21) },
]

export const SLOTS: Slot[] = [
  // ── Monday May 18 ──────────────────────────────────────────────────────────
  { id: 'm1', title: 'Индивидуальная тренировка', type: 'free', status: 'confirmed', specialistId: 'anna', start: d(5,18,11), end: d(5,18,12,15), clientName: 'Ольга Смирнова', clientPhone: '+7 999 123-45-67', serviceType: 'Индивидуальная тренировка' },
  { id: 'm2', title: 'Индивидуальная тренировка', type: 'free', status: 'confirmed', spaceId: 'zal-a', start: d(5,18,11), end: d(5,18,12), clientName: 'Анастасия Попова', clientPhone: '+7 999 456-78-90' },
  { id: 'm3', title: 'Барре', type: 'fixed', status: 'has-bookings', spaceId: 'zal-a', start: d(5,18,12), end: d(5,18,14), capacity: 5, booked: 4 },
  { id: 'm4', title: 'Растяжка', type: 'fixed', status: 'no-bookings', spaceId: 'zal-a', start: d(5,18,14), end: d(5,18,15), capacity: 5, booked: 0 },
  { id: 'm5', title: 'Индивидуальная тренировка', type: 'free', status: 'confirmed', specialistId: 'anna', start: d(5,18,13), end: d(5,18,14,30), clientName: 'Татьяна Козлова', clientPhone: '+7 999 234-56-78' },
  { id: 'm6', title: 'Растяжка', type: 'free', status: 'new', specialistId: 'anna', start: d(5,18,19), end: d(5,18,20,15), clientName: 'Наталья Иванова', clientPhone: '+7 999 345-67-89' },

  // ── Tuesday May 19 ─────────────────────────────────────────────────────────
  { id: 't1', title: 'Йога', type: 'fixed', status: 'has-bookings', specialistId: 'ksenia', start: d(5,19,10), end: d(5,19,11,30), capacity: 8, booked: 5 },
  { id: 't2', title: 'Пилатес', type: 'fixed', status: 'no-bookings', specialistId: 'ksenia', start: d(5,19,12), end: d(5,19,13,30), capacity: 6, booked: 0 },

  // ── Wednesday May 20 ───────────────────────────────────────────────────────
  { id: 'w1', title: 'Барре', type: 'fixed', status: 'full', specialistId: 'anna', start: d(5,20,11), end: d(5,20,12,30), capacity: 5, booked: 5 },
  { id: 'w2', title: 'Индивидуальная тренировка', type: 'free', status: 'waiting', specialistId: 'anna', start: d(5,20,14), end: d(5,20,15,30), clientName: 'Марина Сидорова', clientPhone: '+7 999 567-89-01' },

  // ── Thursday May 21 ────────────────────────────────────────────────────────
  { id: 'th1', title: 'Растяжка', type: 'fixed', status: 'stopped', specialistId: 'ksenia', start: d(5,21,10), end: d(5,21,11), capacity: 6, booked: 2 },
  { id: 'th2', title: 'Барре', type: 'fixed', status: 'has-bookings', specialistId: 'ksenia', start: d(5,21,13), end: d(5,21,14,30), capacity: 5, booked: 3 },

  // ── Friday May 22 (TODAY) — Anna ───────────────────────────────────────────
  { id: 'f1', title: 'Индивидуальная тренировка', type: 'free', status: 'confirmed', specialistId: 'anna', start: d(5,22,11), end: d(5,22,12,15), clientName: 'Ольга Смирнова', clientPhone: '+7 999 123-45-67' },
  { id: 'f2', title: 'Пилатес', type: 'free', status: 'confirmed', specialistId: 'anna', start: d(5,22,11), end: d(5,22,12,15), clientName: 'Светлана Новикова', clientPhone: '+7 999 678-90-12' },
  { id: 'f3', title: 'Растяжка', type: 'free', status: 'confirmed', specialistId: 'anna', start: d(5,22,11,15), end: d(5,22,12,15), clientName: 'Ирина Морозова', clientPhone: '+7 999 789-01-23' },
  { id: 'f4', title: 'Йога', type: 'free', status: 'confirmed', specialistId: 'anna', start: d(5,22,11,30), end: d(5,22,12,15), clientName: 'Юлия Козлова', clientPhone: '+7 999 890-12-34' },
  { id: 'f5', title: 'Индивидуальная тренировка', type: 'free', status: 'confirmed', specialistId: 'anna', start: d(5,22,13), end: d(5,22,15,15), clientName: 'Мария Петрова', clientPhone: '+7 999 901-23-45' },
  { id: 'f6', title: 'Растяжка', type: 'free', status: 'new', specialistId: 'anna', start: d(5,22,18,30), end: d(5,22,20,15), clientName: 'Анастасия Белова', clientPhone: '+7 999 012-34-56' },

  // ── Friday May 22 — Ксения ─────────────────────────────────────────────────
  { id: 'f7', title: 'Индивидуальная тренировка', type: 'free', status: 'confirmed', specialistId: 'ksenia', start: d(5,22,10), end: d(5,22,12), clientName: 'Виктория Романова', clientPhone: '+7 999 111-22-33' },
  { id: 'f8', title: 'Барре', type: 'fixed', status: 'has-bookings', specialistId: 'ksenia', start: d(5,22,12), end: d(5,22,14), capacity: 5, booked: 4 },
  { id: 'f9', title: 'Растяжка', type: 'fixed', status: 'no-bookings', specialistId: 'ksenia', start: d(5,22,12), end: d(5,22,14), capacity: 5, booked: 0 },

  // ── Saturday May 23 ────────────────────────────────────────────────────────
  { id: 's1', title: 'Пилатес', type: 'fixed', status: 'has-bookings', specialistId: 'anna', start: d(5,23,10), end: d(5,23,11), capacity: 8, booked: 3 },

  // ── Current week: June 2026 ────────────────────────────────────────────────
  // Monday June 1
  { id: 'jun1a', title: 'Йога', type: 'free', status: 'confirmed', specialistId: 'anna', start: d(6,1,10), end: d(6,1,11,30), clientName: 'Ольга Смирнова', clientPhone: '+7 999 123-45-67', serviceType: 'Йога' },
  { id: 'jun1b', title: 'Пилатес', type: 'fixed', status: 'has-bookings', specialistId: 'anna', start: d(6,1,14), end: d(6,1,15,30), capacity: 6, booked: 4 },

  // Tuesday June 2
  { id: 'jun2a', title: 'Индивидуальная тренировка', type: 'free', status: 'confirmed', specialistId: 'anna', start: d(6,2,10), end: d(6,2,11), clientName: 'Екатерина Волкова', clientPhone: '+7 999 234-56-78', serviceType: 'Индивидуальная тренировка' },
  { id: 'jun2b', title: 'Барре', type: 'fixed', status: 'has-bookings', specialistId: 'anna', start: d(6,2,12), end: d(6,2,13,30), capacity: 5, booked: 3 },
  { id: 'jun2c', title: 'Массаж спины', type: 'free', status: 'new', specialistId: 'anna', start: d(6,2,16), end: d(6,2,17,30), clientName: 'Марина Сидорова', clientPhone: '+7 999 345-67-89', serviceType: 'Массаж спины' },

  // Wednesday June 3
  { id: 'jun3a', title: 'Растяжка', type: 'free', status: 'confirmed', specialistId: 'anna', start: d(6,3,9), end: d(6,3,10), clientName: 'Анастасия Белова', clientPhone: '+7 999 456-78-90', serviceType: 'Растяжка' },
  { id: 'jun3b', title: 'Йога', type: 'free', status: 'waiting', specialistId: 'anna', start: d(6,3,14), end: d(6,3,15,30), clientName: 'Татьяна Козлова', clientPhone: '+7 999 567-89-01', serviceType: 'Йога' },

  // Thursday June 4
  { id: 'jun4a', title: 'Индивидуальная тренировка', type: 'free', status: 'confirmed', specialistId: 'anna', start: d(6,4,9), end: d(6,4,10,30), clientName: 'Наталья Иванова', clientPhone: '+7 999 678-90-12', serviceType: 'Индивидуальная тренировка' },
  { id: 'jun4b', title: 'Барре', type: 'fixed', status: 'full', specialistId: 'anna', start: d(6,4,11), end: d(6,4,12,30), capacity: 5, booked: 5 },
  { id: 'jun4c', title: 'Пилатес', type: 'free', status: 'confirmed', specialistId: 'anna', start: d(6,4,17), end: d(6,4,18,30), clientName: 'Юлия Козлова', clientPhone: '+7 999 789-01-23', serviceType: 'Пилатес' },

  // Friday June 5
  { id: 'jun5a', title: 'Массаж лица', type: 'free', status: 'confirmed', specialistId: 'anna', start: d(6,5,10), end: d(6,5,11), clientName: 'Ирина Морозова', clientPhone: '+7 999 890-12-34', serviceType: 'Массаж лица' },
  { id: 'jun5b', title: 'Растяжка', type: 'free', status: 'new', specialistId: 'anna', start: d(6,5,13,30), end: d(6,5,15), clientName: 'Светлана Новикова', clientPhone: '+7 999 901-23-45', serviceType: 'Растяжка' },
  { id: 'jun5c', title: 'Индивидуальная тренировка', type: 'free', status: 'confirmed', specialistId: 'anna', start: d(6,5,17), end: d(6,5,18,30), clientName: 'Виктория Романова', clientPhone: '+7 999 012-34-56', serviceType: 'Индивидуальная тренировка' },

  // Saturday June 6
  { id: 'jun6a', title: 'Йога', type: 'fixed', status: 'has-bookings', specialistId: 'anna', start: d(6,6,10), end: d(6,6,11,30), capacity: 8, booked: 5 },
]
