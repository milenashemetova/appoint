import { useState } from 'react'
import {
  Plus, ChevronDown, ChevronRight, Settings,
  ClipboardList, Calendar, LayoutList, Users, Tag,
  Building2, FileText, Info,
} from 'lucide-react'
import { useSchedule } from '../context/ScheduleContext'
import { COMPANIES, LOCATIONS } from '../data/locationsData'
import type { LocationTab } from '../types'

interface NavItem { tab: LocationTab; icon: React.ElementType; label: string }
const NAV_ITEMS: NavItem[] = [
  { tab: 'requests',    icon: ClipboardList, label: 'Заявки' },
  { tab: 'schedule',    icon: Calendar,      label: 'Расписание' },
  { tab: 'services',    icon: LayoutList,    label: 'Вид работ' },
  { tab: 'specialists', icon: Users,         label: 'Специалисты' },
  { tab: 'events',      icon: Tag,           label: 'Услуги и события' },
  { tab: 'spaces',      icon: Building2,     label: 'Пространства' },
  { tab: 'content',     icon: FileText,      label: 'Контент' },
  { tab: 'info',        icon: Info,          label: 'Основная информация' },
]

export default function LocationSidebar() {
  const { state, dispatch } = useSchedule()
  const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set(COMPANIES.map(c => c.id)))

  const toggleCompany = (id: string) =>
    setExpandedCompanies(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })

  const grouped = COMPANIES.map(c => ({
    ...c,
    locations: LOCATIONS.filter(l => l.companyId === c.id),
  }))

  return (
    <div className="w-60 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 flex-shrink-0">
        <span className="text-sm font-semibold text-gray-900">Мои локации</span>
        <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500 transition-colors">
          <Plus size={15} />
        </button>
      </div>

      <div className="border-t border-gray-100" />

      {/* Location tree */}
      <div className="flex-shrink-0 py-2">
        {grouped.map(company => {
          const expanded = expandedCompanies.has(company.id)
          return (
            <div key={company.id}>
              {/* Company row */}
              <button
                onClick={() => toggleCompany(company.id)}
                className="w-full flex items-center gap-1.5 px-3 py-1.5 hover:bg-gray-50 transition-colors text-left"
              >
                {expanded
                  ? <ChevronDown size={13} className="text-gray-400 flex-shrink-0" />
                  : <ChevronRight size={13} className="text-gray-400 flex-shrink-0" />
                }
                <span className="text-xs font-medium text-gray-500 truncate">{company.name}</span>
              </button>

              {/* Locations */}
              {expanded && company.locations.map(loc => {
                const isActive = loc.id === state.currentLocationId
                return (
                  <button
                    key={loc.id}
                    onClick={() => dispatch({ type: 'SET_LOCATION', payload: loc.id })}
                    className={`w-full flex items-center gap-2 pl-6 pr-2 py-1.5 transition-colors group text-left ${isActive ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
                  >
                    {/* Mini avatar */}
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
                      style={{ backgroundColor: loc.color }}
                    >
                      {loc.initial}
                    </div>
                    <span className={`text-xs flex-1 truncate ${isActive ? 'font-semibold text-gray-800' : 'text-gray-600 group-hover:text-gray-800'}`}>
                      {loc.name}
                    </span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded hover:bg-gray-200 text-gray-400 transition-all"
                        onClick={e => e.stopPropagation()}
                      >
                        <Settings size={11} />
                      </button>
                      {loc.isActive && <div className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />}
                    </div>
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>

      <div className="border-t border-gray-100" />

      {/* Nav for active location */}
      <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ tab, icon: Icon, label }) => {
          const active = state.locationTab === tab
          return (
            <button
              key={tab}
              onClick={() => dispatch({ type: 'SET_LOCATION_TAB', payload: tab })}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors text-left ${active ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}
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
