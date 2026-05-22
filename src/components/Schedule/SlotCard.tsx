import { User } from 'lucide-react'
import type { Slot } from '../../types'
import { getSlotStyle, slotTop, slotHeight } from '../../utils/slotUtils'
import { fmtTime } from '../../utils/dateUtils'

interface Props {
  slot: Slot
  col: number
  numCols: number
  extraCount?: number
  compact?: boolean // week view uses compact mode
  onClick: () => void
}

export default function SlotCard({ slot, col, numCols, extraCount, compact = false, onClick }: Props) {
  const style = getSlotStyle(slot)
  const top = slotTop(slot)
  const height = slotHeight(slot)
  const left = numCols > 0 ? (col / numCols) * 100 : 0
  const width = numCols > 0 ? (1 / numCols) * 100 : 100
  const isPast = slot.end < new Date()

  const isFree = slot.type === 'free'
  const isNew = slot.status === 'new'
  const isFixed = slot.type === 'fixed'
  const isFull = slot.status === 'full'
  const isStopped = slot.status === 'stopped'

  const displayTitle = extraCount
    ? `${slot.title} и ещё ${extraCount}`
    : slot.title

  return (
    <div
      onClick={onClick}
      style={{
        position: 'absolute',
        top: `${top}px`,
        height: `${Math.max(height - 2, 18)}px`,
        left: `calc(${left}% + 1px)`,
        width: `calc(${width}% - 2px)`,
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
        {/* Bottom-left: person icon or capacity */}
        <div className={`flex items-center gap-0.5 ${style.subText}`}>
          {isFree && <User size={10} />}
          {isFixed && slot.capacity != null && (
            <span className={`text-[10px] ${isFull ? 'font-bold' : ''}`}>
              {slot.booked}/{slot.capacity}
            </span>
          )}
        </div>

        {/* Bottom-right: "Новая" badge */}
        {isNew && (
          <span className="text-[9px] bg-blue-500 text-white rounded px-1 py-px font-medium leading-none">
            Новая
          </span>
        )}
      </div>
    </div>
  )
}
