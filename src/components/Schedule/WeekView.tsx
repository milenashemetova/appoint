import { useRef, useState, useCallback } from 'react'
import type { Slot } from '../../types'
import { useSchedule } from '../../context/ScheduleContext'
import { DAYS_SHORT_RU, weekDays, isSameDay, isToday } from '../../utils/dateUtils'
import { layoutSlots, TOTAL_HEIGHT, GRID_START, PX_PER_MIN, snapToGrid, minutesToPx } from '../../utils/slotUtils'
import { getBlocksForDate, toDateKey, mergeBlocks } from '../../utils/availabilityUtils'
import SlotCard from './SlotCard'
import TimeAxis from './TimeAxis'
import GridLines from './GridLines'
import CurrentTimeLine from './CurrentTimeLine'
import AvailabilityMask from './AvailabilityMask'

interface DragPreview { startMin: number; endMin: number }

export default function WeekView() {
  const { state, dispatch } = useSchedule()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState<{ colIdx: number; preview: DragPreview; isAvailEdit: boolean } | null>(null)
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

    if (state.availabilityEditMode) {
      // In edit mode: paint availability blocks
      setDrag({ colIdx: dayIdx, preview: { startMin, endMin: startMin + 60 }, isAvailEdit: true })

      const onMove = (me: MouseEvent) => {
        const curY = me.clientY - rect.top
        const curMin = getMinFromY(curY)
        setDrag(d => d ? { ...d, preview: { startMin: Math.min(d.preview.startMin, curMin), endMin: Math.max(d.preview.startMin, curMin) } } : d)
      }
      const onUp = (me: MouseEvent) => {
        const curY = me.clientY - rect.top
        const curMin = getMinFromY(curY)
        const sMin = Math.min(getMinFromY(y), curMin)
        const eMin = Math.max(getMinFromY(y), curMin)
        if (eMin - sMin >= 15) {
          const day = days[dayIdx]
          const dateKey = toDateKey(day)
          const existing = state.draftAvailability[dateKey] ?? []
          const newBlock = { startMin: sMin, endMin: eMin }
          const merged = mergeBlocks([...existing, newBlock])
          dispatch({ type: 'SET_DRAFT_DAY', payload: { dateKey, blocks: merged } })
        }
        setDrag(null)
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
      }
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
      return
    }

    // Normal mode: create events
    // Prevent drag in the past
    const tentativeStart = new Date(days[dayIdx])
    tentativeStart.setHours(Math.floor(startMin / 60), startMin % 60, 0, 0)
    if (tentativeStart < new Date()) return

    setDrag({ colIdx: dayIdx, preview: { startMin, endMin: startMin + 60 }, isAvailEdit: false })

    const onMove = (me: MouseEvent) => {
      const curY = me.clientY - rect.top
      const curMin = getMinFromY(curY)
      setDrag(d => d ? { ...d, preview: { startMin: Math.min(d.preview.startMin, curMin), endMin: Math.max(d.preview.startMin, curMin) } } : d)
    }
    const onUp = (me: MouseEvent) => {
      const curY = me.clientY - rect.top
      const curMin = getMinFromY(curY)
      const sMin = Math.min(getMinFromY(y), curMin)
      const eMin = Math.max(getMinFromY(y), curMin)
      if (eMin - sMin >= 15) {
        const day = days[dayIdx]
        const startTime = new Date(day)
        startTime.setHours(Math.floor(sMin / 60), sMin % 60, 0, 0)
        const endTime = new Date(day)
        endTime.setHours(Math.floor(eMin / 60), eMin % 60, 0, 0)
        dispatch({ type: 'SET_CREATE_MODAL', payload: { startTime, endTime, columnKey: '' } })
      }
      setDrag(null)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [days, dispatch, state.availabilityEditMode, state.draftAvailability])

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
            const dateKey = toDateKey(day)

            // Determine availability mask content
            let availMask: React.ReactNode = null
            if (state.availabilityEditMode) {
              // Gray background + white draft blocks
              const draftBlocks = state.draftAvailability[dateKey] ?? []
              availMask = (
                <>
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ height: TOTAL_HEIGHT, backgroundColor: 'rgba(241,245,249,0.9)' }}
                  />
                  {draftBlocks.map((block, i) => {
                    const top = minutesToPx(block.startMin - gridStartMin)
                    const height = minutesToPx(block.endMin - block.startMin)
                    return (
                      <div
                        key={i}
                        className="absolute left-0 right-0 pointer-events-none"
                        style={{ top, height, backgroundColor: 'rgba(255,255,255,0.95)', zIndex: 1 }}
                      />
                    )
                  })}
                </>
              )
            } else if (state.availability.isConfigured) {
              const blocks = getBlocksForDate(day, state.availability)
              availMask = <AvailabilityMask blocks={blocks} />
            } else {
              // Not configured: show full gray
              availMask = (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ height: TOTAL_HEIGHT, backgroundColor: 'rgba(241,245,249,0.9)' }}
                />
              )
            }

            return (
              <div
                key={dayIdx}
                ref={el => { colRefs.current[dayIdx] = el }}
                className="flex-1 border-l border-gray-100 relative cursor-crosshair"
                style={{ height: TOTAL_HEIGHT }}
                onMouseDown={e => onMouseDown(e, dayIdx)}
              >
                <GridLines />
                {availMask}
                {isT && <CurrentTimeLine />}

                {/* Slot cards hidden in edit mode */}
                {!state.availabilityEditMode && laid.map(({ slot, col, numCols }) => (
                  <SlotCard key={slot.id} slot={slot} col={col} numCols={numCols} compact />
                ))}

                {/* Drag preview */}
                {drag && drag.colIdx === dayIdx && (() => {
                  const { startMin, endMin } = drag.preview
                  const durMin = endMin - startMin
                  const durH = Math.floor(durMin / 60); const durM = durMin % 60
                  const durLabel = durH === 0 ? `${durM} мин` : durM === 0 ? `${durH}ч` : `${durH}ч ${durM}мин`
                  const fmt = (m: number) => `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`
                  const isEditDrag = drag.isAvailEdit

                  return (
                    <div
                      className={`absolute left-0 right-0 border rounded pointer-events-none z-20 flex flex-col justify-between ${
                        isEditDrag
                          ? 'bg-blue-500/20 border-blue-500'
                          : 'bg-blue-400/15 border-blue-400'
                      }`}
                      style={{
                        top: minutesToPx(startMin - gridStartMin),
                        height: minutesToPx(durMin),
                      }}
                    >
                      <div className={`text-[10px] font-medium px-1.5 pt-1 ${isEditDrag ? 'text-blue-800' : 'text-blue-700'}`}>
                        {fmt(startMin)} – {fmt(endMin)}
                      </div>
                      <div className="px-1.5 pb-1 flex justify-end">
                        <span className="text-[10px] bg-blue-500 text-white rounded px-1.5 py-0.5 font-medium leading-none">
                          {durLabel}
                        </span>
                      </div>
                    </div>
                  )
                })()}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
