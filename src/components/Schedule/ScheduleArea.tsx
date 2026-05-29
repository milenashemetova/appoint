import { ChevronLeft, ChevronRight, ChevronDown, Check } from 'lucide-react'
import { useState } from 'react'
import { useSchedule } from '../../context/ScheduleContext'
import { MONTHS_RU, MONTHS_RU_GEN, addDays, addWeeks, weekDays } from '../../utils/dateUtils'
import { mondayKey, toDateKey } from '../../utils/availabilityUtils'
import WeekView from './WeekView'
import DayView from './DayView'
import SlotModal from '../Modals/SlotModal'
import SlotPopover from '../Modals/SlotPopover'
import CreateSlotDrawer from '../Modals/CreateSlotDrawer'
import AvailabilityUntilModal from '../Modals/AvailabilityUntilModal'

// ── Multi-select dropdown ────────────────────────────────────────────────────

interface MultiSelectItem { id: string; name: string; color?: string; initials?: string }

function MultiSelectDropdown({
  label,
  items,
  selectedIds,
  onToggle,
  onSelectAll,
}: {
  label: string
  items: MultiSelectItem[]
  selectedIds: string[]
  onToggle: (id: string) => void
  onSelectAll: () => void
}) {
  const [open, setOpen] = useState(false)
  const allSelected = selectedIds.length === items.length

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors min-w-[140px] justify-between"
      >
        <span className="truncate">
          {allSelected ? label : selectedIds.length === 0 ? 'Не выбрано' : `Выбрано: ${selectedIds.length}`}
        </span>
        <ChevronDown size={13} className={`text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-20 bg-white rounded-xl shadow-lg border border-gray-100 py-1 min-w-[200px]">
            {/* Select all */}
            <button
              onClick={onSelectAll}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <span className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${allSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                {allSelected && <Check size={10} className="text-white" />}
              </span>
              <span className="font-medium">{label}</span>
            </button>

            <div className="h-px bg-gray-100 my-1" />

            {items.map(item => {
              const checked = selectedIds.includes(item.id)
              return (
                <button
                  key={item.id}
                  onClick={() => onToggle(item.id)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <span className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${checked ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                    {checked && <Check size={10} className="text-white" />}
                  </span>
                  {item.color && item.initials && (
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center text-white flex-shrink-0"
                      style={{ backgroundColor: item.color, fontSize: '8px', fontWeight: 700 }}
                    >
                      {item.initials[0]}
                    </span>
                  )}
                  <span className="truncate">{item.name}</span>
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

// ── Format date helper ───────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return `${d} ${MONTHS_RU_GEN[m - 1]} ${y}`
}

// ── Main component ───────────────────────────────────────────────────────────

export default function ScheduleArea() {
  const { state, dispatch, specialists, spaces } = useSchedule()
  const [viewDropOpen, setViewDropOpen] = useState(false)
  const [createDropOpen, setCreateDropOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  // Availability edit mode local state
  const [availRepeat, setAvailRepeat] = useState(false)
  const [availUntil, setAvailUntil] = useState<string | undefined>(undefined)
  const [untilModalOpen, setUntilModalOpen] = useState(false)
  const [savedToast, setSavedToast] = useState<string | null>(null)

  const closeAll = () => {
    setEditOpen(false)
    dispatch({ type: 'SELECT_SLOT', payload: null })
    dispatch({ type: 'SET_CREATE_MODAL', payload: null })
  }

  const propagateDraftToWeek = (newDate: Date) => {
    if (!state.availabilityEditMode || state.viewMode !== 'week') return
    // Build weekday → blocks from current draft
    const pattern: Partial<Record<number, typeof state.draftAvailability[string]>> = {}
    for (const day of weekDays(state.selectedDate)) {
      const key = toDateKey(day)
      if (state.draftAvailability[key]?.length) pattern[day.getDay()] = state.draftAvailability[key]
    }
    // Pre-populate new week days that have no draft entry yet
    for (const day of weekDays(newDate)) {
      const key = toDateKey(day)
      const dow = day.getDay()
      if (!state.draftAvailability[key] && pattern[dow]) {
        dispatch({ type: 'SET_DRAFT_DAY', payload: { dateKey: key, blocks: pattern[dow]! } })
      }
    }
  }

  const goBack = () => {
    const newDate = state.viewMode === 'week' ? addWeeks(state.selectedDate, -1) : addDays(state.selectedDate, -1)
    propagateDraftToWeek(newDate)
    dispatch({ type: 'SET_DATE', payload: newDate })
  }
  const goNext = () => {
    const newDate = state.viewMode === 'week' ? addWeeks(state.selectedDate, 1) : addDays(state.selectedDate, 1)
    propagateDraftToWeek(newDate)
    dispatch({ type: 'SET_DATE', payload: newDate })
  }

  const saveAvailability = () => {
    const weekMondayKey = mondayKey(state.selectedDate)
    dispatch({
      type: 'SAVE_AVAILABILITY',
      payload: { repeatsWeekly: availRepeat, until: availUntil, weekMondayKey },
    })
    const msg = availUntil
      ? `Доступность настроена до ${formatDate(availUntil)}`
      : availRepeat
        ? 'Доступность настроена (повторяется еженедельно)'
        : 'Доступность сохранена'
    setSavedToast(msg)
    setTimeout(() => setSavedToast(null), 4000)
    setAvailRepeat(false)
    setAvailUntil(undefined)
  }

  const { selectedDate, viewMode } = state
  const title = `${MONTHS_RU[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`
  const viewLabels: Record<string, string> = { week: 'Неделя', day: 'День' }

  const allSpecSelected = state.selectedSpecialistIds.length === specialists.length
  const allSpaceSelected = state.selectedSpaceIds.length === spaces.length

  const navArrows = (
    <div className="flex items-center gap-1">
      <button onClick={goBack} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-500 transition-colors">
        <ChevronLeft size={16} />
      </button>
      <button onClick={goNext} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-500 transition-colors">
        <ChevronRight size={16} />
      </button>
    </div>
  )

  return (
    <div className={`flex-1 flex flex-col min-w-0 bg-white rounded-xl overflow-hidden transition-all ${
      state.availabilityEditMode
        ? 'border-2 border-blue-500'
        : 'border border-slate-200'
    }`}>

      {/* Control bar — switches between normal and edit mode */}
      {state.availabilityEditMode ? (
        <div className="flex items-center justify-between px-5 py-2 flex-shrink-0 gap-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-semibold text-gray-900">Настройте доступность локации</h1>
            {navArrows}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => dispatch({ type: 'EXIT_AVAILABILITY_EDIT' })}
              className="px-4 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Отменить
            </button>
            <button
              onClick={saveAvailability}
              className="px-4 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium transition-colors"
            >
              Сохранить
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between px-5 py-2 flex-shrink-0 gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            {/* Title */}
            <h1 className="text-xl font-semibold text-gray-900">{title}</h1>

            {/* View dropdown */}
            <div className="relative">
              <button
                onClick={() => setViewDropOpen(v => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {viewLabels[viewMode]}
                <ChevronDown size={14} className="text-gray-400" />
              </button>
              {viewDropOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setViewDropOpen(false)} />
                  <div className="absolute left-0 top-full mt-1 z-20 bg-white rounded-xl shadow-lg border border-gray-100 py-1 w-36">
                    {(['week', 'day'] as const).map(mode => (
                      <button
                        key={mode}
                        onClick={() => { dispatch({ type: 'SET_VIEW', payload: mode }); setViewDropOpen(false) }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${viewMode === mode ? 'text-blue-600 font-medium' : 'text-gray-700'}`}
                      >
                        {viewLabels[mode]}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Navigation */}
            {navArrows}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Specialist multi-select */}
            <MultiSelectDropdown
              label="Все специалисты"
              items={specialists.map(s => ({ id: s.id, name: s.name, color: s.avatarColor, initials: s.initials }))}
              selectedIds={state.selectedSpecialistIds}
              onToggle={id => dispatch({ type: 'TOGGLE_SPECIALIST', payload: id })}
              onSelectAll={() => {
                if (allSpecSelected) {
                  specialists.forEach(s => {
                    if (state.selectedSpecialistIds.includes(s.id))
                      dispatch({ type: 'TOGGLE_SPECIALIST', payload: s.id })
                  })
                } else {
                  specialists.forEach(s => {
                    if (!state.selectedSpecialistIds.includes(s.id))
                      dispatch({ type: 'TOGGLE_SPECIALIST', payload: s.id })
                  })
                }
              }}
            />

            {/* Space multi-select */}
            <MultiSelectDropdown
              label="Все пространства"
              items={spaces.map(s => ({ id: s.id, name: s.name }))}
              selectedIds={state.selectedSpaceIds}
              onToggle={id => dispatch({ type: 'TOGGLE_SPACE', payload: id })}
              onSelectAll={() => {
                if (allSpaceSelected) {
                  spaces.forEach(s => {
                    if (state.selectedSpaceIds.includes(s.id))
                      dispatch({ type: 'TOGGLE_SPACE', payload: s.id })
                  })
                } else {
                  spaces.forEach(s => {
                    if (!state.selectedSpaceIds.includes(s.id))
                      dispatch({ type: 'TOGGLE_SPACE', payload: s.id })
                  })
                }
              }}
            />

            {/* Day toggle (only in day view) */}
            {viewMode === 'day' && (
              <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                {(['specialists', 'spaces'] as const).map(toggle => (
                  <button
                    key={toggle}
                    onClick={() => dispatch({ type: 'SET_DAY_TOGGLE', payload: toggle })}
                    className={`px-3 py-1.5 text-sm font-medium transition-colors ${state.dayToggle === toggle ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    {toggle === 'specialists' ? 'Специалисты' : 'Пространства'}
                  </button>
                ))}
              </div>
            )}

            {/* Create button */}
            <div className="relative">
              <div className="flex rounded-lg overflow-hidden border border-blue-500">
                <button
                  className="px-4 py-1.5 bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors"
                  onClick={() => {
                    const now = state.selectedDate
                    const start = new Date(now); start.setHours(9, 0, 0, 0)
                    const end = new Date(now); end.setHours(10, 0, 0, 0)
                    dispatch({ type: 'SET_CREATE_MODAL', payload: { startTime: start, endTime: end, columnKey: '', slotType: 'fixed' } })
                  }}
                >
                  Создать
                </button>
                <button
                  onClick={() => setCreateDropOpen(v => !v)}
                  className="px-2 py-1.5 bg-blue-500 text-white hover:bg-blue-600 transition-colors border-l border-blue-400"
                >
                  <ChevronDown size={14} />
                </button>
              </div>
              {createDropOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setCreateDropOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 z-20 bg-white rounded-xl shadow-lg border border-gray-100 py-1 w-40">
                    {(['free', 'fixed'] as const).map(slotType => (
                      <button
                        key={slotType}
                        onClick={() => {
                          setCreateDropOpen(false)
                          const now = state.selectedDate
                          const start = new Date(now); start.setHours(9, 0, 0, 0)
                          const end = new Date(now); end.setHours(10, 0, 0, 0)
                          dispatch({ type: 'SET_CREATE_MODAL', payload: { startTime: start, endTime: end, columnKey: '', slotType } })
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        {slotType === 'free' ? 'Услуга' : 'Событие'}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main grid area */}
      <div className="flex-1 overflow-hidden border-t border-gray-100">
        {viewMode === 'week' ? <WeekView /> : <DayView />}
      </div>

      {/* Availability footer — normal mode */}
      {!state.availabilityEditMode && (
        <div className="border-t border-gray-100 px-5 py-2.5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-blue-500 inline-block" />
              <span>Событие</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-green-500 inline-block" />
              <span>Услуга</span>
            </span>
          </div>
          <button
            onClick={() => dispatch({ type: 'ENTER_AVAILABILITY_EDIT' })}
            className="text-sm text-blue-500 hover:text-blue-600 font-medium transition-colors"
          >
            {state.availability.isConfigured ? 'Изменить доступность' : '+ Настроить доступность'}
          </button>
        </div>
      )}

      {/* Availability footer — edit mode */}
      {state.availabilityEditMode && (
        <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-between flex-shrink-0 bg-slate-50">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={availRepeat}
              onChange={e => setAvailRepeat(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-500 cursor-pointer"
            />
            <span className="text-sm text-gray-600">Использовать настройку до конца выбранного периода</span>
          </label>
          <button
            onClick={() => setUntilModalOpen(true)}
            className="text-sm text-blue-500 hover:text-blue-600 font-medium transition-colors"
          >
            {availUntil ? `Использовать до ${formatDate(availUntil)}` : 'Использовать до...'}
          </button>
        </div>
      )}

      {/* Popover: shown when a slot is selected (no edit modal open) */}
      {state.selectedSlot && state.selectedSlotRect && !editOpen && (
        <SlotPopover
          slot={state.selectedSlot}
          rect={state.selectedSlotRect}
          onClose={closeAll}
          onEdit={() => setEditOpen(true)}
        />
      )}

      {/* Edit modal for existing slots */}
      <SlotModal
        isOpen={editOpen}
        onClose={closeAll}
      />

      {/* Create drawer (right-side panel) */}
      {state.createModalState && !editOpen && (
        <CreateSlotDrawer onClose={closeAll} />
      )}

      {/* AvailabilityUntilModal */}
      {untilModalOpen && (
        <AvailabilityUntilModal
          current={availUntil}
          onClose={() => setUntilModalOpen(false)}
          onSelect={date => { setAvailUntil(date); setUntilModalOpen(false) }}
        />
      )}

      {/* Success toast */}
      {savedToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2.5 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-2xl text-sm pointer-events-none">
          <span className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
              <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
          {savedToast}
        </div>
      )}
    </div>
  )
}
