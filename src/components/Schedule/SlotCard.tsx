import { User } from 'lucide-react'
import type { Slot } from '../../types'
import { useSchedule } from '../../context/ScheduleContext'
import { getSlotStyle, slotTop, slotHeight } from '../../utils/slotUtils'
import { fmtTime } from '../../utils/dateUtils'

const CASCADE_OFFSET = 10 // px offset per overlap level

interface Props {
  slot: Slot
  col: number
  numCols: number
  extraCount?: number
  compact?: boolean
}

export default function SlotCard({ slot, col, numCols, extraCount, compact = false }: Props) {
  const { dispatch } = useSchedule()
  const style = getSlotStyle(slot)
  const top = slotTop(slot)
  const height = slotHeight(slot)
  const isPast = slot.end < new Date()

  const isOverlapping = numCols > 1
  const leftPx = isOverlapping ? col * CASCADE_OFFSET : 2

  const isFree = slot.type === 'free'
  const isNew = slot.status === 'new'
  const isFixed = slot.type === 'fixed'
  const isFull = slot.status === 'full'
  const isStopped = slot.status === 'stopped'

  const displayTitle = extraCount ? `${slot.title} и ещё ${extraCount}` : slot.title

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    dispatch({ type: 'SELECT_SLOT', payload: slot })
    dispatch({ type: 'SET_SLOT_RECT', payload: { x: rect.x, y: rect.y, width: rect.width, height: rect.height } })
  }

  return (
    <div
      onClick={handleClick}
      style={{
        position: 'absolute',
        top: `${top}px`,
        height: `${Math.max(height - 2, 18)}px`,
        left: `${leftPx}px`,
        right: '2px',
        zIndex: col + 1,
        opacity: isPast ? 0.4 : 1,
      }}
      className={`
        rounded overflow-hidden cursor-pointer select-none
        border-l-4 ${style.border}
        ${style.bg}
        ${isStopped ? 'border border-dashed border-gray-300' : ''}
        hover:brightness-95 transition-all
        flex flex-col justify-between p-1
        text-xs leading-tight
        shadow-sm
      `}
    >
      <div className="overflow-hidden">
        <div className={`font-medium truncate ${style.text} ${isFull ? 'font-bold' : ''}`}>
          {displayTitle}
        </div>
        {!compact && height >= 50 && (
          <div className={`text-[10px] mt-0.5 ${style.subText}`}>
            {fmtTime(slot.start)}–{fmtTime(slot.end)}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-0.5 ${style.subText}`}>
          {isFree && <User size={10} />}
          {isFixed && slot.capacity != null && (
            <span className={`text-[10px] ${isFull ? 'font-bold' : ''}`}>
              {slot.booked}/{slot.capacity}
            </span>
          )}
        </div>
        {isNew && (
          <span className="text-[9px] bg-blue-500 text-white rounded px-1 py-px font-medium leading-none">
            Новая
          </span>
        )}
      </div>
    </div>
  )
}
