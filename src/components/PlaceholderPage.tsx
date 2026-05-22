import type { LocationTab } from '../types'

const LABELS: Record<LocationTab, string> = {
  requests:    'Заявки',
  schedule:    'Расписание',
  finances:    'Финансы',
  specialists: 'Специалисты',
  spaces:      'Пространства',
  services:    'Виды работ',
  reviews:     'Отзывы',
  settings:    'Настройки',
}

export default function PlaceholderPage({ tab }: { tab: LocationTab }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-2">
      <div className="text-4xl">🚧</div>
      <div className="text-sm font-medium">{LABELS[tab]}</div>
      <div className="text-xs">Раздел в разработке</div>
    </div>
  )
}
