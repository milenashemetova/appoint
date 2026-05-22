import { useRef, useCallback } from 'react'
import type { Slot } from '../../types'
import { useSchedule } from '../../context/ScheduleContext'
import { isSameDay } from '../../utils/dateUtils'
import { layoutSlots, collapseDayViewSlots, TOTAL_HEIGHT, GRID_START, PX_PER_MIN, snapToGrid, minutesToPx } from '../../utils/slotUtils'
import SlotCard from './SlotCard'
import TimeAxis from './TimeAxis'
import GridLines from './GridLines'
import CurrentTimeLine from './CurrentTimeLine'

function UnavailableMask({ wh }: { wh: { start: number; end: number } | null | undefined }) {
  const gridStartMin = GRID_START * 60
  if (!wh) return <div className="absolute inset-0 bg-gray-50/70 pointer-events-none" style={{ height: TOTAL_HEIGHT }} />
  const topH = Math.max(0, minutesToPx(wh.start - gridStartMin))
  const botTop = Math.min(TOTAL_HEIGHT, minutesToPx(wh.end - gridStartMin))
  return (
    <>
      {topH > 0 && <div className="absolute top-0 inset-x-0 bg-gray-50/70 pointer-events-none" style={{ height: topH }} />}
      {botTop < TOTAL_HEIGHT && <div className="absolute inset-x-0 bg-gray-50/70 pointer-events-none" style={{ top: botTop, height: TOTAL_HEIGHT - botTop }} />}
    </>
  )
}

function Avatar({ initials, color, name }: { initials: string; color: string; name: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0" style={{ backgroundColor: color }}>
        {initials}
      </div>
      <span className="text-sm font-medium text-gray-800 truncate">{name}</span>
    </div>
  )
}

interface Column {
  key: string
  label: React.ReactNode
  workingHours: { start: number; end: number } | null | undefined
  slots: Slot[]
  count: number
}

export default function DayView() {
  const { state, dispatch, specialists, spaces } = useSchedule()
  const colRefs = useRef<(HTMLDivElement | null)[]>([])
  const day = state.selectedDate
  const gridStartMin = GRID_START * 60
  const isToday = isSameDay(day, new Date())

  const getMinFromY = (y: number) => snapToGrid(Math.max(gridStartMin, gridStartMin + y / PX_PER_MIN), 15)

  // Build columns based on toggle
  const columns: Column[] = state.dayToggle === 'specialists'
    ? specialists
        .filter(s => state.selectedSpecialistIds.includes(s.id))
        .map(s => ({
          key: s.id,
          label: <Avatar initials={s.initials} color={s.avatarColor} name={s.name} />,
          workingHours: s.workingHours[day.getDay()] ?? null,
          slots: state.slots.filter(sl => sl.specialistId === s.id && isSameDay(sl.start, day)),
          count: state.slots.filter(sl => sl.specialistId === s.id && isSameDay(sl.start, day)).length,
        }))
    : spaces
        .filter(s => state.selectedSpaceIds.includes(s.id))
        .map(s => ({
          key: s.id,
          label: <span className="text-sm font-medium text-gray-800">{s.name}</span>,
          workingHours: s.workingHours[day.getDay()] ?? null,
          slots: state.slots.filter(sl => sl.spaceId === s.id && isSameDay(sl.start, day)),
          count: state.slots.filter(sl => sl.spaceId === s.id && isSameDay(sl.start, day)).length,
        }))

  const onMouseDown = useCallback((e: React.MouseEvent, colIdx: number, colKey: string) => {
    if (e.button !== 0) return
    const rect = colRefs.current[colIdx]?.getBoundingClientRect()
    if (!rect) return
    const startMin = getMinFromY(e.clientY - rect.top)

    const onUp = (me: MouseEvent) => {
      const endMin = getMinFromY(me.clientY - rect.top)
      const s = Math.min(startMin, endMin)
      const en = Math.max(startMin, endMin)
      if (en - s >= 15) {
        const startTime = new Date(day); startTime.setHours(Math.floor(s / 60), s % 60, 0, 0)
        const endTime = new Date(day); endTime.setHours(Math.floor(en / 60), en % 60, 0, 0)
        dispatch({ type: 'SET_CREATE_MODAL', payload: { startTime, endTime, columnKey: colKey } })
      }
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mouseup', onUp)
  }, [day, dispatch])

  if (columns.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
        Выберите {state.dayToggle === 'specialists' ? 'специалистов' : 'пространства'} в левой панели
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Column headers */}
      <div className="flex border-b border-gray-200 bg-white sticky top-0 z-10 flex-shrink-0">
        <div className="w-14 flex-shrink-0" />
        {columns.map((col) => (
          <div key={col.key} className="flex-1 border-l border-gray-100 px-3 py-2.5 min-w-0">
            <div className="flex items-center justify-between gap-2">
              {col.label}
              <span className="text-xs font-semibold text-gray-400 flex-shrink-0">{col.count}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Scrollable grid */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="flex" style={{ height: TOTAL_HEIGHT }}>
          <TimeAxis />
          <div className="flex-1 relative flex" style={{ height: TOTAL_HEIGHT }}>
            {isToday && <CurrentTimeLine />}
          {columns.map((col, colIdx) => {
            const laid = collapseDayViewSlots(layoutSlots(col.slots))

            return (
              <div
                key={col.key}
                ref={el => { colRefs.current[colIdx] = el }}
                className="flex-1 border-l border-gray-100 relative cursor-crosshair"
                style={{ height: TOTAL_HEIGHT }}
                onMouseDown={e => onMouseDown(e, colIdx, col.key)}
              >
                <GridLines />
                <UnavailableMask wh={col.workingHours} />

                {laid.map(({ slot, col: c, numCols, extraCount }) => (
                  <SlotCard key={slot.id} slot={slot} col={c} numCols={numCols} extraCount={extraCount} compact={false} />
                ))}
              </div>
            )
          })}
          </div>
        </div>
      </div>
    </div>
  )
}
