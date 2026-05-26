import type { LocationTab } from '../types'

const LABELS: Record<LocationTab, string> = {
  schedule:    'Расписание',
  requests:    'Заявки',
  events:      'Услуги и события',
  services:    'Виды работ',
  specialists: 'Специалисты',
  spaces:      'Пространства',
  content:     'Контент',
  info:        'Основная информация',
}

export default function PlaceholderPage({ tab }: { tab: LocationTab }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-2 bg-white rounded-xl border border-slate-200">
      <div className="text-4xl">🚧</div>
      <div className="text-sm font-medium">{LABELS[tab]}</div>
      <div className="text-xs">Раздел в разработке</div>
    </div>
  )
}
