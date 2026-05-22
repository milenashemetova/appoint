import { useState } from 'react'
import {
  Plus, ChevronDown, ChevronRight,
  ClipboardList, Calendar, TrendingUp, Users, Building2, LayoutList, Star, Settings,
} from 'lucide-react'
import { useSchedule } from '../context/ScheduleContext'
import { COMPANIES, LOCATIONS } from '../data/locationsData'
import type { LocationTab } from '../types'

interface NavItem { tab: LocationTab; icon: React.ElementType; label: string }
const NAV_ITEMS: NavItem[] = [
  { tab: 'requests',    icon: ClipboardList, label: 'Заявки' },
  { tab: 'schedule',    icon: Calendar,      label: 'Расписание' },
  { tab: 'finances',    icon: TrendingUp,    label: 'Финансы' },
  { tab: 'specialists', icon: Users,         label: 'Специалисты' },
  { tab: 'spaces',      icon: Building2,     label: 'Пространства' },
  { tab: 'services',    icon: LayoutList,    label: 'Виды работ' },
  { tab: 'reviews',     icon: Star,          label: 'Отзывы' },
  { tab: 'settings',    icon: Settings,      label: 'Настройки' },
]

export default function LocationSidebar() {
  const { state, dispatch } = useSchedule()

  // By default expand the active location
  const [expandedLocations, setExpandedLocations] = useState<Set<string>>(
    new Set([state.currentLocationId])
  )

  const toggleLocation = (id: string) =>
    setExpandedLocations(prev => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })

  const navigate = (locationId: string, tab: LocationTab) => {
    dispatch({ type: 'SET_LOCATION', payload: locationId })
    dispatch({ type: 'SET_LOCATION_TAB', payload: tab })
    // Expand this location if not already
    setExpandedLocations(prev => new Set([...prev, locationId]))
  }

  const grouped = COMPANIES.map(c => ({
    ...c,
    locations: LOCATIONS.filter(l => l.companyId === c.id),
  }))

  return (
    <div className="w-60 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 flex-shrink-0">
        <span className="text-sm font-semibold text-gray-900">Reshape</span>
        <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500 transition-colors">
          <Plus size={15} />
        </button>
      </div>

      <div className="border-t border-gray-100" />

      {/* Location tree */}
      <div className="flex-1 overflow-y-auto py-2">
        {grouped.map(company => (
          <div key={company.id} className="mb-1">
            {/* Company label */}
            <div className="px-4 py-1.5">
              <span className="text-xs font-bold text-gray-700 tracking-wide">{company.name}</span>
            </div>

            {/* Locations */}
            {company.locations.map(loc => {
              const isExpanded = expandedLocations.has(loc.id)
              const isCurrentLoc = loc.id === state.currentLocationId

              return (
                <div key={loc.id}>
                  {/* Location row */}
                  <button
                    onClick={() => toggleLocation(loc.id)}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 transition-colors text-left ${isCurrentLoc ? 'bg-gray-50' : ''}`}
                  >
                    {isExpanded
                      ? <ChevronDown size={12} className="text-gray-400 flex-shrink-0" />
                      : <ChevronRight size={12} className="text-gray-400 flex-shrink-0" />
                    }
                    {/* Avatar */}
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[8px] font-bold flex-shrink-0"
                      style={{ backgroundColor: loc.color }}
                    >
                      {loc.initial}
                    </div>
                    <span className={`text-xs flex-1 truncate leading-tight ${isCurrentLoc ? 'font-semibold text-gray-800' : 'text-gray-600'}`}>
                      {loc.name}
                    </span>
                    {loc.isActive && <div className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />}
                  </button>

                  {/* Nav items (shown when expanded) */}
                  {isExpanded && (
                    <div className="pb-1">
                      {NAV_ITEMS.map(({ tab, icon: Icon, label }) => {
                        const isActive = isCurrentLoc && state.locationTab === tab && (state.appPage !== 'schedule' || tab === 'schedule')
                        return (
                          <button
                            key={tab}
                            onClick={() => navigate(loc.id, tab)}
                            className={`w-full flex items-center gap-2 pl-10 pr-3 py-1.5 text-left transition-colors ${
                              isActive
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                            }`}
                          >
                            <Icon size={13} className={isActive ? 'text-blue-600' : 'text-gray-400'} />
                            <span className={`text-xs ${isActive ? 'font-medium' : ''}`}>{label}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
