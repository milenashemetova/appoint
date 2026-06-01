import { User } from 'lucide-react'
import type { Slot } from '../../types'
import { useSchedule } from '../../context/ScheduleContext'
import { getSlotStyle, slotTop, slotHeight } from '../../utils/slotUtils'
import { fmtTime } from '../../utils/dateUtils'

const CASCADE_OFFSET = 10

interface Props {
  slot: Slot
  col: number
  numCols: number
  extraCount?: number
  compact?: boolean
  ghost?: boolean
}

export default function SlotCard({ slot, col, numCols, extraCount, compact = false, ghost = false }: Props) {
  const { dispatch } = useSchedule()
  const style = getSlotStyle(slot)
  const top = slotTop(slot)
  const height = slotHeight(slot)
  const isPast = slot.end < new Date()

  const isOverlapping = numCols > 1
  const leftPx = isOverlapping ? col * CASCADE_OFFSET : 2

  const isNew = slot.status === 'new'
  const isFull = slot.status === 'full'
  const isFree = slot.type === 'free'

  const displayTitle = isFree
    ? extraCount ? `${slot.title} +${extraCount}` : slot.title
    : extraCount ? `${slot.title} и ещё ${extraCount}` : slot.title

  const cardH = Math.max(height - 2, 18)
  const showTime = !compact && cardH >= 42
  const showMeta = cardH >= 30

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (ghost) return
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    dispatch({ type: 'SELECT_SLOT', payload: slot })
    dispatch({ type: 'SET_SLOT_RECT', payload: { x: rect.x, y: rect.y, width: rect.width, height: rect.height } })
  }

  const borderRadius = isFree ? '8px' : '4px'

  if (ghost) {
    return (
      <div
        style={{
          position: 'absolute',
          top: `${top}px`,
          height: `${cardH}px`,
          left: `${leftPx}px`,
          right: '2px',
          zIndex: col + 1,
          backgroundColor: 'rgba(255,255,255,0.6)',
          borderColor: style.borderColor,
          borderWidth: '1.5px',
          borderStyle: 'dashed',
          borderRadius,
        }}
        className="overflow-hidden pointer-events-none select-none flex"
      >
        <div className="w-1 flex-shrink-0 self-stretch" style={{ backgroundColor: style.barColor, opacity: 0.4 }} />
        <div className="flex-1 min-w-0 px-2 py-1.5 overflow-hidden">
          <div className="font-semibold text-[12px] leading-snug truncate pr-5" style={{ color: style.textColor, opacity: 0.5 }}>
            {displayTitle}
          </div>
          {!compact && cardH >= 42 && (
            <div className="text-[11px] leading-tight mt-0.5 truncate" style={{ color: style.subTextColor, opacity: 0.4 }}>
              {fmtTime(slot.start)}-{fmtTime(slot.end)}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={handleClick}
      style={{
        position: 'absolute',
        top: `${top}px`,
        height: `${cardH}px`,
        left: `${leftPx}px`,
        right: '2px',
        zIndex: col + 1,
        backgroundColor: style.bgColor,
        borderColor: style.borderColor,
        borderWidth: '1px',
        borderStyle: style.dashed ? 'dashed' : 'solid',
        borderRadius,
      }}
      className="overflow-hidden cursor-pointer select-none hover:brightness-95 transition-all flex shadow-sm"
    >
      {/* 4px left color bar */}
      <div
        className="w-1 flex-shrink-0 self-stretch"
        style={{ backgroundColor: style.barColor }}
      />

      {/* ── Free / service card layout ── */}
      {isFree ? (
        <div className="flex-1 min-w-0 px-2 py-1.5 relative overflow-hidden">
          {/* User icon — top right */}
          <div
            className="absolute top-1.5 right-1.5"
            style={{ color: style.subTextColor, opacity: isPast ? 0.45 : 1 }}
          >
            <User size={13} />
          </div>

          {/* Title */}
          <div
            className="font-semibold text-[12px] leading-snug truncate pr-5"
            style={{ color: style.textColor, opacity: isPast ? 0.45 : 1 }}
          >
            {displayTitle}
          </div>

          {/* Time */}
          {showTime && (
            <div
              className="text-[11px] leading-tight mt-0.5 truncate"
              style={{ color: style.subTextColor, opacity: isPast ? 0.45 : 1 }}
            >
              {fmtTime(slot.start)}-{fmtTime(slot.end)}
            </div>
          )}
        </div>
      ) : (
        /* ── Fixed / event card layout ── */
        <div className="flex-1 min-w-0 px-1.5 py-0.5 flex flex-col justify-between overflow-hidden">
          {/* Title */}
          <div
            className="font-semibold text-[11px] leading-tight truncate"
            style={{ color: style.textColor, opacity: isPast ? 0.45 : 1 }}
          >
            {displayTitle}
          </div>

          {showTime && (
            <div
              className="text-[10px] leading-tight truncate mt-0.5"
              style={{ color: style.subTextColor, opacity: isPast ? 0.45 : 1 }}
            >
              {fmtTime(slot.start)}–{fmtTime(slot.end)}
            </div>
          )}

          {showMeta && (
            <div className="flex items-center justify-between mt-auto">
              <div
                className="flex items-center gap-0.5"
                style={{ color: style.subTextColor, opacity: isPast ? 0.45 : 1 }}
              >
                {slot.capacity != null && (
                  <span className={`text-[10px] ${isFull ? 'font-bold' : ''}`}>
                    {slot.booked ?? 0}/{slot.capacity}
                  </span>
                )}
              </div>
              {isNew && !isPast && (
                <span className="text-[9px] bg-blue-500 text-white rounded px-1 py-px font-medium leading-none flex-shrink-0">
                  Новая
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
