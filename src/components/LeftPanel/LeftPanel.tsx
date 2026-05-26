import { Calendar, BookOpen, ShoppingCart, LayoutGrid, User, Box, Image, Briefcase, Settings } from 'lucide-react'
import MiniCalendar from './MiniCalendar'
import { useSchedule } from '../../context/ScheduleContext'
import { LOCATIONS } from '../../data/locationsData'
import type { LocationTab } from '../../types'

interface NavItem { tab: LocationTab; icon: React.ElementType; label: string }

const NAV_ITEMS: NavItem[] = [
  { tab: 'schedule',    icon: Calendar,     label: 'Расписание' },
  { tab: 'requests',    icon: BookOpen,     label: 'Заявки' },
  { tab: 'events',      icon: ShoppingCart, label: 'Услуги и события' },
  { tab: 'services',    icon: LayoutGrid,   label: 'Виды работ' },
  { tab: 'specialists', icon: User,         label: 'Специалисты' },
  { tab: 'spaces',      icon: Box,          label: 'Пространства' },
  { tab: 'content',     icon: Image,        label: 'Контент' },
  { tab: 'info',        icon: Briefcase,    label: 'Основная информация' },
]

export default function LeftPanel() {
  const { state, dispatch } = useSchedule()

  const location = LOCATIONS.find(l => l.id === state.currentLocationId) ?? LOCATIONS[0]

  return (
    <div className="w-[272px] flex-shrink-0 bg-white rounded-xl border border-slate-200 flex flex-col overflow-hidden">

      {/* Location header */}
      <div className="flex items-center gap-2 px-2.5 py-2.5 flex-shrink-0">
        {/* Location avatar */}
        <div
          className="w-7 h-7 rounded-md flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
          style={{ backgroundColor: location.color }}
        >
          {location.initial}
        </div>
        {/* Location name */}
        <span className="flex-1 text-sm font-semibold text-slate-800 truncate leading-tight">
          Локация «{location.name}»
        </span>
        {/* Settings */}
        <button className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-400 transition-colors flex-shrink-0">
          <Settings size={13} />
        </button>
        {/* Active status dot */}
        {location.isActive && (
          <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
        )}
      </div>

      <div className="h-px bg-slate-100 flex-shrink-0" />

      {/* Mini calendar */}
      <div className="flex-shrink-0">
        <MiniCalendar />
      </div>

      <div className="h-px bg-slate-100 flex-shrink-0" />

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-2.5 px-2.5">
        <div className="flex flex-col gap-0.5">
          {NAV_ITEMS.map(({ tab, icon: Icon, label }) => {
            const active = state.locationTab === tab
            return (
              <button
                key={tab}
                onClick={() => dispatch({ type: 'SET_LOCATION_TAB', payload: tab })}
                className={`w-full flex items-center gap-2 px-2.5 py-[7px] rounded-md text-sm transition-colors text-left ${
                  active
                    ? 'bg-slate-100 text-slate-900 font-medium'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                <Icon size={14} className={active ? 'text-slate-700' : 'text-slate-400'} />
                <span>{label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
