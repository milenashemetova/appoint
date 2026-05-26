import { useState } from 'react'
import { Calendar, BookOpen, ShoppingCart, LayoutGrid, User, Box, Image, Briefcase, Settings, ChevronDown, Check } from 'lucide-react'
import MiniCalendar from './MiniCalendar'
import { useSchedule } from '../../context/ScheduleContext'
import { LOCATIONS, COMPANIES } from '../../data/locationsData'
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
  const [locationOpen, setLocationOpen] = useState(false)

  const location = LOCATIONS.find(l => l.id === state.currentLocationId) ?? LOCATIONS[0]

  return (
    <div className="w-[272px] flex-shrink-0 bg-white rounded-xl border border-slate-200 flex flex-col overflow-hidden">

      {/* Location header */}
      <div className="relative flex-shrink-0">
        <button
          onClick={() => setLocationOpen(v => !v)}
          className="w-full flex items-center gap-2 px-2.5 py-2.5 hover:bg-slate-50 transition-colors text-left"
        >
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
          <ChevronDown
            size={13}
            className={`text-slate-400 flex-shrink-0 transition-transform ${locationOpen ? 'rotate-180' : ''}`}
          />
          {/* Active status dot */}
          {location.isActive && (
            <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
          )}
        </button>

        {/* Settings button — sits beside the chevron, separate click */}
        <button
          onClick={e => { e.stopPropagation() }}
          className="absolute right-7 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-400 transition-colors"
        >
          <Settings size={13} />
        </button>

        {/* Location dropdown */}
        {locationOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setLocationOpen(false)} />
            <div className="absolute left-0 right-0 top-full z-20 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden mx-1 mt-1">
              {COMPANIES.map(company => {
                const locs = LOCATIONS.filter(l => l.companyId === company.id)
                return (
                  <div key={company.id}>
                    <div className="px-3 pt-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {company.name}
                    </div>
                    {locs.map(loc => (
                      <button
                        key={loc.id}
                        onClick={() => {
                          dispatch({ type: 'SET_LOCATION', payload: loc.id })
                          setLocationOpen(false)
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-slate-50 transition-colors ${loc.id === state.currentLocationId ? 'bg-slate-50' : ''}`}
                      >
                        <div
                          className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[8px] font-bold flex-shrink-0"
                          style={{ backgroundColor: loc.color }}
                        >
                          {loc.initial}
                        </div>
                        <span className="flex-1 text-sm text-slate-700 truncate">{loc.name}</span>
                        {loc.isActive && <div className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />}
                        {loc.id === state.currentLocationId && <Check size={13} className="text-blue-500 flex-shrink-0" />}
                      </button>
                    ))}
                  </div>
                )
              })}
              <div className="h-2" />
            </div>
          </>
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
