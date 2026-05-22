export interface ServiceItem {
  id: string
  name: string
  freeBooking: boolean
  subcategory: string
  price: number
  specialistIds: string[]
}

export interface ServiceGroup {
  id: string
  name: string
  services: ServiceItem[]
}

const allSpecialists = ['anna', 'ksenia', 'alexandra', 'dmitry', 'ekaterina']

export const SERVICE_GROUPS: ServiceGroup[] = [
  {
    id: 'yoga',
    name: 'Тренировки по йоге',
    services: [
      { id: 'y1', name: 'Йога Айенгара. Женский класс', freeBooking: true, subcategory: 'Йога и медитация', price: 1300, specialistIds: allSpecialists },
      { id: 'y2', name: 'Хатха-йога. Утренний класс', freeBooking: true, subcategory: 'Йога и медитация', price: 1300, specialistIds: allSpecialists },
      { id: 'y3', name: 'Виньяса-йога. Вечерний класс', freeBooking: true, subcategory: 'Горячая йога', price: 1300, specialistIds: allSpecialists },
      { id: 'y4', name: 'Аштанга-йога. Групповая сессия', freeBooking: true, subcategory: 'Интенсивная йога', price: 1300, specialistIds: allSpecialists },
      { id: 'y5', name: 'Хатха-йога. Утренний класс', freeBooking: true, subcategory: 'Статическая йога', price: 1300, specialistIds: allSpecialists },
      { id: 'y6', name: 'Кундалини-йога. Вечерний класс', freeBooking: true, subcategory: 'Энергетическая йога', price: 1500, specialistIds: allSpecialists },
    ],
  },
  {
    id: 'individual',
    name: 'Индивидуальные тренировки',
    services: [
      { id: 'i1', name: 'Индивидуальная тренировка', freeBooking: false, subcategory: 'Персональный тренинг', price: 2500, specialistIds: ['anna', 'ksenia', 'alexandra'] },
      { id: 'i2', name: 'Функциональный тренинг', freeBooking: true, subcategory: 'Персональный тренинг', price: 2000, specialistIds: ['anna', 'dmitry'] },
      { id: 'i3', name: 'Стретчинг. Индивидуально', freeBooking: true, subcategory: 'Растяжка', price: 1800, specialistIds: ['ksenia', 'alexandra', 'ekaterina'] },
    ],
  },
  {
    id: 'pilates',
    name: 'Пилатес',
    services: [
      { id: 'p1', name: 'Пилатес. Базовый уровень', freeBooking: true, subcategory: 'Групповой пилатес', price: 1200, specialistIds: ['anna', 'maria'] },
      { id: 'p2', name: 'Реформер-пилатес', freeBooking: false, subcategory: 'Реформер', price: 2200, specialistIds: ['anna', 'ksenia', 'maria'] },
    ],
  },
]
