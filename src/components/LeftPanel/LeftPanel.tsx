import { Plus, ClipboardList, Tag, Settings } from 'lucide-react'
import MiniCalendar from './MiniCalendar'
import { useSchedule } from '../../context/ScheduleContext'

export default function LeftPanel() {
  const { state, dispatch, specialists, spaces } = useSchedule()

  const navLinks = [
    { icon: Plus, label: 'Расписание', active: true },
    { icon: ClipboardList, label: 'Заявки', active: false },
    { icon: Tag, label: 'Услуги и события', active: false },
  ]

  // In day view with "specialists" toggle show specialists filter
  // In day view with "spaces" toggle show spaces filter
  // In week view show both sections
  const showSpecialists = state.viewMode === 'week' || state.dayToggle === 'specialists'
  const showSpaces = state.viewMode === 'week' || state.dayToggle === 'spaces'

  return (
    <div className="w-60 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
      {/* Mini calendar */}
      <MiniCalendar />

      <div className="border-t border-gray-100 my-1" />

      {/* Navigation links */}
      <nav className="px-2 space-y-0.5">
        {navLinks.map(({ icon: Icon, label, active }) => (
          <button
            key={label}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${active ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </nav>

      <div className="border-t border-gray-100 my-2" />

      {/* Specialist filters */}
      {showSpecialists && (
        <div className="px-3 mb-3">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Специалисты</p>
          <div className="space-y-1.5">
            {specialists.map(sp => {
              const checked = state.selectedSpecialistIds.includes(sp.id)
              return (
                <label key={sp.id} className="flex items-center gap-2 cursor-pointer group">
                  <div
                    onClick={() => dispatch({ type: 'TOGGLE_SPECIALIST', payload: sp.id })}
                    className={`w-4 h-4 rounded flex-shrink-0 border flex items-center justify-center cursor-pointer transition-colors ${checked ? 'border-transparent' : 'border-gray-300 bg-white'}`}
                    style={checked ? { backgroundColor: sp.avatarColor } : {}}
                  >
                    {checked && (
                      <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                        <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <span className="text-xs text-gray-700 group-hover:text-gray-900">{sp.name}</span>
                </label>
              )
            })}
          </div>
        </div>
      )}

      {/* Space filters */}
      {showSpaces && (
        <div className="px-3 mb-3">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Пространства</p>
          <div className="space-y-1.5">
            {spaces.map(sp => {
              const checked = state.selectedSpaceIds.includes(sp.id)
              return (
                <label key={sp.id} className="flex items-center gap-2 cursor-pointer group">
                  <div
                    onClick={() => dispatch({ type: 'TOGGLE_SPACE', payload: sp.id })}
                    className={`w-4 h-4 rounded flex-shrink-0 border flex items-center justify-center cursor-pointer transition-colors ${checked ? 'bg-blue-500 border-blue-500' : 'border-gray-300 bg-white'}`}
                  >
                    {checked && (
                      <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                        <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <span className="text-xs text-gray-700 group-hover:text-gray-900">{sp.name}</span>
                </label>
              )
            })}
          </div>
        </div>
      )}

      {/* Bottom: schedule settings */}
      <div className="mt-auto border-t border-gray-100 p-3">
        <button className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700 transition-colors">
          <Settings size={13} />
          Настройки расписания
        </button>
      </div>
    </div>
  )
}
