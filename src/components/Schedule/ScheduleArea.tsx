import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { useSchedule } from '../../context/ScheduleContext'
import { MONTHS_RU, addDays, addWeeks } from '../../utils/dateUtils'
import WeekView from './WeekView'
import DayView from './DayView'
import SlotModal from '../Modals/SlotModal'
import SlotPopover from '../Modals/SlotPopover'

export default function ScheduleArea() {
  const { state, dispatch } = useSchedule()
  const [viewDropOpen, setViewDropOpen] = useState(false)
  const [createDropOpen, setCreateDropOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  const closeAll = () => {
    setEditOpen(false)
    dispatch({ type: 'SELECT_SLOT', payload: null })
    dispatch({ type: 'SET_CREATE_MODAL', payload: null })
  }

  const goBack = () => {
    if (state.viewMode === 'week') dispatch({ type: 'SET_DATE', payload: addWeeks(state.selectedDate, -1) })
    else dispatch({ type: 'SET_DATE', payload: addDays(state.selectedDate, -1) })
  }
  const goNext = () => {
    if (state.viewMode === 'week') dispatch({ type: 'SET_DATE', payload: addWeeks(state.selectedDate, 1) })
    else dispatch({ type: 'SET_DATE', payload: addDays(state.selectedDate, 1) })
  }

  const { selectedDate, viewMode } = state
  const title = `${MONTHS_RU[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`

  const viewLabels: Record<string, string> = { week: 'Неделя', day: 'День' }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-white">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 px-5 pt-4 pb-1">
        <button
          onClick={() => dispatch({ type: 'SET_APP_PAGE', payload: 'location' })}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ChevronLeft size={15} />
          Локация «Reshape»
        </button>
      </div>

      {/* Control bar */}
      <div className="flex items-center justify-between px-5 py-2 flex-shrink-0">
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
          <div className="flex items-center gap-1">
            <button onClick={goBack} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-500 transition-colors">
              <ChevronLeft size={16} />
            </button>
            <button onClick={goNext} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-500 transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
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
                  dispatch({ type: 'SET_CREATE_MODAL', payload: { startTime: start, endTime: end, columnKey: '' } })
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
                  <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">Услуга</button>
                  <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">Событие</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main grid area */}
      <div className="flex-1 overflow-hidden border-t border-gray-100">
        {viewMode === 'week' ? <WeekView /> : <DayView />}
      </div>

      {/* Popover: shown when a slot is selected (no edit modal open) */}
      {state.selectedSlot && state.selectedSlotRect && !editOpen && (
        <SlotPopover
          slot={state.selectedSlot}
          rect={state.selectedSlotRect}
          onClose={closeAll}
          onEdit={() => setEditOpen(true)}
        />
      )}

      {/* Full edit / create modal */}
      <SlotModal
        isOpen={editOpen || !!state.createModalState}
        onClose={closeAll}
      />
    </div>
  )
}
