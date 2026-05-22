import {
  ClipboardList, Calendar, LayoutList, Users, Tag,
  Building2, FileText, Info, Settings, Plus, ChevronDown,
} from 'lucide-react'
import { useSchedule } from '../context/ScheduleContext'
import type { LocationTab } from '../types'

interface NavItem {
  tab: LocationTab
  icon: React.ElementType
  label: string
}

const NAV_ITEMS: NavItem[] = [
  { tab: 'requests',     icon: ClipboardList, label: 'Заявки' },
  { tab: 'schedule',     icon: Calendar,      label: 'Расписание' },
  { tab: 'services',     icon: LayoutList,    label: 'Вид работ' },
  { tab: 'specialists',  icon: Users,         label: 'Специалисты' },
  { tab: 'events',       icon: Tag,           label: 'Услуги и события' },
  { tab: 'spaces',       icon: Building2,     label: 'Пространства' },
  { tab: 'content',      icon: FileText,      label: 'Контент' },
  { tab: 'info',         icon: Info,          label: 'Основная информация' },
]

export default function LocationSidebar() {
  const { state, dispatch } = useSchedule()

  return (
    <div className="w-60 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
      {/* My Locations header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <span className="text-sm font-semibold text-gray-900">Мои локации</span>
        <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500">
          <Plus size={15} />
        </button>
      </div>

      <div className="border-t border-gray-100" />

      {/* Company + location */}
      <div className="px-3 py-3">
        <div className="flex items-center gap-1.5 mb-2 cursor-pointer group">
          <ChevronDown size={13} className="text-gray-400 flex-shrink-0" />
          <span className="text-xs font-medium text-gray-500 group-hover:text-gray-700 truncate">ООО Сервисный дизайн</span>
        </div>

        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-gray-50 cursor-pointer group">
          {/* Avatar */}
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-[9px] font-bold">R</span>
          </div>

          <span className="text-xs font-semibold text-gray-800 flex-1 truncate">Локация «Reshape»</span>

          <div className="flex items-center gap-1 flex-shrink-0">
            <button className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded hover:bg-gray-200 text-gray-400 transition-opacity">
              <Settings size={11} />
            </button>
            <div className="w-2 h-2 rounded-full bg-green-400" title="Активна" />
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100" />

      {/* Navigation */}
      <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ tab, icon: Icon, label }) => {
          const active = state.locationTab === tab
          return (
            <button
              key={tab}
              onClick={() => dispatch({ type: 'SET_LOCATION_TAB', payload: tab })}
              className={`
                w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors text-left
                ${active
                  ? 'bg-gray-100 text-gray-900 font-medium'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}
              `}
            >
              <Icon size={15} className={active ? 'text-gray-700' : 'text-gray-400'} />
              {label}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
