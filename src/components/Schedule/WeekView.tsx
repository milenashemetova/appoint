import { useRef, useState, useCallback } from 'react'
import type { Slot } from '../../types'
import { useSchedule } from '../../context/ScheduleContext'
import { DAYS_SHORT_RU, weekDays, isSameDay, isToday } from '../../utils/dateUtils'
import { layoutSlots, TOTAL_HEIGHT, GRID_START, PX_PER_MIN, snapToGrid, minutesToPx } from '../../utils/slotUtils'
import SlotCard from './SlotCard'
import TimeAxis from './TimeAxis'
import GridLines from './GridLines'
import CurrentTimeLine from './CurrentTimeLine'

function UnavailableMask({ workingHours }: { workingHours: { start: number; end: number } | null | undefined }) {
  if (!workingHours) {
    return <div className="absolute inset-0 bg-gray-50/60 pointer-events-none" style={{ height: TOTAL_HEIGHT }} />
  }
  const gridStartMin = GRID_START * 60
  const topMaskH = Math.max(0, workingHours.start - gridStartMin)
  const botMaskTop = Math.min(TOTAL_HEIGHT, minutesToPx(workingHours.end - gridStartMin))
  return (
    <>
      {topMaskH > 0 && <div className="absolute top-0 left-0 right-0 bg-gray-50/60 pointer-events-none" style={{ height: minutesToPx(topMaskH) }} />}
      {botMaskTop < TOTAL_HEIGHT && <div className="absolute left-0 right-0 bg-gray-50/60 pointer-events-none" style={{ top: botMaskTop, height: TOTAL_HEIGHT - botMaskTop }} />}
    </>
  )
}

interface DragPreview { startMin: number; endMin: number }

export default function WeekView() {
  const { state, dispatch } = useSchedule()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState<{ colIdx: number; preview: DragPreview } | null>(null)
  const colRefs = useRef<(HTMLDivElement | null)[]>([])

  const days = weekDays(state.selectedDate)

  // Build the list of slots for each day (filtered by selected entities)
  const getSlotsForDay = (day: Date): Slot[] =>
    state.slots.filter(s => {
      if (!isSameDay(s.start, day)) return false
      if (s.specialistId && !state.selectedSpecialistIds.includes(s.specialistId)) return false
      if (s.spaceId && !state.selectedSpaceIds.includes(s.spaceId)) return false
      return true
    })

  const gridStartMin = GRID_START * 60

  const getMinFromY = (y: number) => snapToGrid(Math.max(gridStartMin, gridStartMin + y / PX_PER_MIN), 15)

  const onMouseDown = useCallback((e: React.MouseEvent, dayIdx: number) => {
    if (e.button !== 0) return
    const rect = colRefs.current[dayIdx]?.getBoundingClientRect()
    if (!rect) return
    const y = e.clientY - rect.top
    const startMin = getMinFromY(y)
    setDrag({ colIdx: dayIdx, preview: { startMin, endMin: startMin + 60 } })

    const onMove = (me: MouseEvent) => {
      const curY = me.clientY - rect.top
      const curMin = getMinFromY(curY)
      setDrag(d => d ? { ...d, preview: { startMin: Math.min(d.preview.startMin, curMin), endMin: Math.max(d.preview.startMin, curMin) } } : d)
    }
    const onUp = (me: MouseEvent) => {
      const curY = me.clientY - rect.top
      const curMin = getMinFromY(curY)
      const startMin = Math.min(getMinFromY(y), curMin)
      const endMin = Math.max(getMinFromY(y), curMin)
      if (endMin - startMin >= 15) {
        const day = days[dayIdx]
        const startTime = new Date(day)
        startTime.setHours(Math.floor(startMin / 60), startMin % 60, 0, 0)
        const endTime = new Date(day)
        endTime.setHours(Math.floor(endMin / 60), endMin % 60, 0, 0)
        dispatch({
          type: 'SET_CREATE_MENU',
          payload: { x: me.clientX, y: me.clientY, startTime, endTime, columnKey: '' },
        })
      }
      setDrag(null)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [days, dispatch])

  return (
    <div className="flex flex-col h-full">
      {/* Day headers */}
      <div className="flex border-b border-gray-200 bg-white sticky top-0 z-10 flex-shrink-0">
        <div className="w-14 flex-shrink-0" />
        {days.map((day, i) => {
          const isT = isToday(day)
          return (
            <div
              key={i}
              className="flex-1 text-center py-2 border-l border-gray-100 cursor-pointer hover:bg-gray-50"
              onClick={() => { dispatch({ type: 'SET_DATE', payload: day }); dispatch({ type: 'SET_VIEW', payload: 'day' }) }}
            >
              <div className="text-[10px] text-gray-400 uppercase">{DAYS_SHORT_RU[i]}</div>
              <div className={`text-sm font-semibold mx-auto mt-0.5 w-7 h-7 flex items-center justify-center rounded-full ${isT ? 'bg-blue-500 text-white' : 'text-gray-800'}`}>
                {day.getDate()}
              </div>
            </div>
          )
        })}
      </div>

      {/* Scrollable grid */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="flex" style={{ height: TOTAL_HEIGHT }}>
          <TimeAxis />
          {days.map((day, dayIdx) => {
            const daySlots = getSlotsForDay(day)
            const laid = layoutSlots(daySlots)
            const isT = isToday(day)

            return (
              <div
                key={dayIdx}
                ref={el => { colRefs.current[dayIdx] = el }}
                className="flex-1 border-l border-gray-100 relative cursor-crosshair"
                style={{ height: TOTAL_HEIGHT }}
                onMouseDown={e => onMouseDown(e, dayIdx)}
              >
                <GridLines />
                <UnavailableMask workingHours={undefined} />
                {isT && <CurrentTimeLine />}

                {laid.map(({ slot, col, numCols }) => (
                  <SlotCard
                    key={slot.id}
                    slot={slot}
                    col={col}
                    numCols={numCols}
                    compact
                    onClick={() => dispatch({ type: 'SELECT_SLOT', payload: slot })}
                  />
                ))}

                {/* Drag preview */}
                {drag && drag.colIdx === dayIdx && (
                  <div
                    className="absolute left-0 right-0 bg-green-400/20 border border-green-500 rounded pointer-events-none z-20"
                    style={{
                      top: minutesToPx(drag.preview.startMin - gridStartMin),
                      height: minutesToPx(drag.preview.endMin - drag.preview.startMin),
                    }}
                  >
                    <div className="text-[10px] text-green-700 font-medium px-1 pt-0.5">
                      {`${String(Math.floor(drag.preview.startMin/60)).padStart(2,'0')}:${String(drag.preview.startMin%60).padStart(2,'0')} – ${String(Math.floor(drag.preview.endMin/60)).padStart(2,'0')}:${String(drag.preview.endMin%60).padStart(2,'0')}`}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
