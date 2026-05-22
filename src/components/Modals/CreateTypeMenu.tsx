import { Tag, Calendar } from 'lucide-react'
import type { CreateMenuState } from '../../types'
import { useSchedule } from '../../context/ScheduleContext'
import { fmtTime } from '../../utils/dateUtils'

interface Props {
  state: CreateMenuState
  onClose: () => void
}

export default function CreateTypeMenu({ state: menuState, onClose }: Props) {
  const { dispatch, specialists, spaces } = useSchedule()

  const createSlot = (isEvent: boolean) => {
    const colKey = menuState.columnKey
    const specialist = specialists.find(s => s.id === colKey)
    const space = spaces.find(s => s.id === colKey)

    const id = `slot-${Date.now()}`
    dispatch({
      type: 'ADD_SLOT',
      payload: {
        id,
        title: isEvent ? 'Новое событие' : 'Новая услуга',
        type: 'fixed',
        status: 'no-bookings',
        specialistId: specialist?.id,
        spaceId: space?.id,
        start: menuState.startTime,
        end: menuState.endTime,
        capacity: 10,
        booked: 0,
      },
    })
    dispatch({ type: 'SET_CREATE_MODAL', payload: null })
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 bg-white rounded-xl shadow-xl border border-gray-100 py-2 w-44"
        style={{ left: menuState.x, top: menuState.y }}
      >
        <div className="px-3 pb-2 mb-1 border-b border-gray-100">
          <p className="text-[11px] text-gray-400">
            {fmtTime(menuState.startTime)} – {fmtTime(menuState.endTime)}
          </p>
        </div>
        <button
          onClick={() => createSlot(false)}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Tag size={14} className="text-gray-400" />
          Услуга
        </button>
        <button
          onClick={() => createSlot(true)}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Calendar size={14} className="text-gray-400" />
          Событие
        </button>
      </div>
    </>
  )
}
