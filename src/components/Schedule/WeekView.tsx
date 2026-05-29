import { useRef, useState, useCallback } from 'react'
import type { Slot, AvailabilityBlock } from '../../types'
import { useSchedule } from '../../context/ScheduleContext'
import { DAYS_SHORT_RU, weekDays, isSameDay, isToday } from '../../utils/dateUtils'
import { layoutSlots, TOTAL_HEIGHT, GRID_START, PX_PER_MIN, snapToGrid, minutesToPx } from '../../utils/slotUtils'
import { getBlocksForDate, toDateKey, mondayKey, mergeBlocks, subtractBlock } from '../../utils/availabilityUtils'
import SlotCard from './SlotCard'
import TimeAxis from './TimeAxis'
import GridLines from './GridLines'
import CurrentTimeLine from './CurrentTimeLine'
import AvailabilityMask from './AvailabilityMask'

interface DragPreview { startMin: number; endMin: number }

interface Props {
  availRepeat: boolean
  patternByDow: Partial<Record<number, AvailabilityBlock[]>>
  patternSourceDate: Date | null
}

function blocksEqual(a: AvailabilityBlock[] | undefined, b: AvailabilityBlock[] | undefined): boolean {
  const aa = a ?? []
  const bb = b ?? []
  if (aa.length !== bb.length) return false
  return aa.every((blk, i) => blk.startMin === bb[i].startMin && blk.endMin === bb[i].endMin)
}

export default function WeekView({ availRepeat, patternByDow, patternSourceDate }: Props) {
  const { state, dispatch } = useSchedule()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState<{ colIdx: number; preview: DragPreview; isAvailEdit: boolean; isErase: boolean } | null>(null)
  const colRefs = useRef<(HTMLDivElement | null)[]>([])

  const days = weekDays(state.selectedDate)

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
      const dateKey = toDateKey(days[dayIdx])
      const existing = state.draftAvailability[dateKey] ?? []
      // Auto-detect: click on existing white block → erase; click on gray → draw
      const isErase = existing.some(b => b.startMin <= startMin && b.endMin > startMin)
      setDrag({ colIdx: dayIdx, preview: { startMin, endMin: startMin + 60 }, isAvailEdit: true, isErase })

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
          if (isErase) {
            dispatch({ type: 'SET_DRAFT_DAY', payload: { dateKey, blocks: subtractBlock(existing, sMin, eMin) } })
          } else {
            dispatch({ type: 'SET_DRAFT_DAY', payload: { dateKey, blocks: mergeBlocks([...existing, { startMin: sMin, endMin: eMin }]) } })
          }
        }
        setDrag(null)
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
      }
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
      return
    }

    // Normal mode
    const tentativeStart = new Date(days[dayIdx])
    tentativeStart.setHours(Math.floor(startMin / 60), startMin % 60, 0, 0)
    if (tentativeStart < new Date()) return

    // Block drag in unavailable zones (only free events can be created in white zones)
    let slotTypeForCreate: 'free' | 'fixed' | undefined
    if (state.availability.isConfigured) {
      const blocks = getBlocksForDate(days[dayIdx], state.availability)
      const isInAvailable = blocks.some(b => b.startMin <= startMin && b.endMin > startMin)
      if (!isInAvailable) return  // gray zone: no drag creation
      slotTypeForCreate = 'free'  // white zone → open as service
    }

    setDrag({ colIdx: dayIdx, preview: { startMin, endMin: startMin + 60 }, isAvailEdit: false, isErase: false })

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
        const startTime = new Date(day); startTime.setHours(Math.floor(sMin / 60), sMin % 60, 0, 0)
        const endTime = new Date(day); endTime.setHours(Math.floor(eMin / 60), eMin % 60, 0, 0)
        dispatch({ type: 'SET_CREATE_MODAL', payload: { startTime, endTime, columnKey: '', slotType: slotTypeForCreate } })
      }
      setDrag(null)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [days, dispatch, state.availabilityEditMode, state.draftAvailability, state.availability])

  const isSourceWeek = patternSourceDate
    ? mondayKey(state.selectedDate) === mondayKey(patternSourceDate)
    : true

  return (
    <div className="flex flex-col h-full">
      {/* Day headers */}
      <div className="flex border-b border-gray-200 bg-white sticky top-0 z-10 flex-shrink-0">
        <div className="w-14 flex-shrink-0" />
        {days.map((day, i) => {
          const isT = isToday(day)

          // Exception indicator: this day differs from the weekly pattern
          const dateKey = toDateKey(day)
          const isException = state.availabilityEditMode &&
            availRepeat &&
            !isSourceWeek &&
            Object.keys(patternByDow).length > 0 &&
            !blocksEqual(patternByDow[day.getDay()], state.draftAvailability[dateKey])

          return (
            <div
              key={i}
              className={`flex-1 text-center py-2 border-l border-gray-100 relative ${state.availabilityEditMode ? 'cursor-default' : 'cursor-pointer hover:bg-gray-50'}`}
              onClick={() => {
                if (!state.availabilityEditMode) {
                  dispatch({ type: 'SET_DATE', payload: day })
                  dispatch({ type: 'SET_VIEW', payload: 'day' })
                }
              }}
            >
              <div className="text-[10px] text-gray-400 uppercase">{DAYS_SHORT_RU[i]}</div>
              <div className={`text-sm font-semibold mx-auto mt-0.5 w-7 h-7 flex items-center justify-center rounded-full ${isT ? 'bg-blue-500 text-white' : 'text-gray-800'}`}>
                {day.getDate()}
              </div>
              {isException && (
                <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex items-center gap-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 inline-block" />
                  <span className="text-[9px] text-orange-500 leading-none">искл.</span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Scrollable grid */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden relative">
        <div className="flex" style={{ height: TOTAL_HEIGHT }}>
          <TimeAxis />
          {days.map((day, dayIdx) => {
            const daySlots = getSlotsForDay(day)
            const laid = layoutSlots(daySlots)
            const isT = isToday(day)
            const dateKey = toDateKey(day)

            let availMask: React.ReactNode = null
            if (state.availabilityEditMode) {
              const draftBlocks = state.draftAvailability[dateKey] ?? []
              availMask = (
                <>
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ height: TOTAL_HEIGHT, backgroundColor: 'rgba(241,245,249,0.92)' }}
                  />
                  {draftBlocks.map((block, i) => (
                    <div
                      key={i}
                      className="absolute left-0 right-0 pointer-events-none"
                      style={{
                        top: minutesToPx(block.startMin - gridStartMin),
                        height: minutesToPx(block.endMin - block.startMin),
                        backgroundColor: '#ffffff',
                        zIndex: 1,
                      }}
                    />
                  ))}
                </>
              )
            } else if (state.availability.isConfigured) {
              const blocks = getBlocksForDate(day, state.availability)
              availMask = <AvailabilityMask blocks={blocks} />
            } else {
              availMask = (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ height: TOTAL_HEIGHT, backgroundColor: 'rgba(241,245,249,0.92)' }}
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

                {!state.availabilityEditMode && laid.map(({ slot, col, numCols }) => (
                  <SlotCard key={slot.id} slot={slot} col={col} numCols={numCols} compact />
                ))}

                {/* Drag preview */}
                {drag && drag.colIdx === dayIdx && (() => {
                  const { startMin, endMin } = drag.preview
                  const durMin = endMin - startMin
                  const durH = Math.floor(durMin / 60); const durM = durMin % 60
                  const durLabel = durH === 0 ? `${durM} мин` : durM === 0 ? `${durH}ч` : `${durH}ч ${durM}мин`
                  const fmt = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`

                  if (drag.isAvailEdit) {
                    return drag.isErase ? (
                      <div
                        className="absolute left-0 right-0 border border-dashed border-red-400 pointer-events-none z-20 flex flex-col justify-between"
                        style={{ top: minutesToPx(startMin - gridStartMin), height: minutesToPx(durMin), backgroundColor: 'rgba(239,68,68,0.1)' }}
                      >
                        <div className="text-[10px] font-medium px-1.5 pt-1 text-red-500">{fmt(startMin)} – {fmt(endMin)}</div>
                        <div className="px-1.5 pb-1 flex justify-end">
                          <span className="text-[10px] bg-red-400 text-white rounded px-1.5 py-0.5 font-medium leading-none">{durLabel}</span>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="absolute left-0 right-0 border border-dashed border-blue-400 pointer-events-none z-20 flex flex-col justify-between"
                        style={{ top: minutesToPx(startMin - gridStartMin), height: minutesToPx(durMin), backgroundColor: 'rgba(255,255,255,0.95)' }}
                      >
                        <div className="text-[10px] font-medium px-1.5 pt-1 text-blue-500">{fmt(startMin)} – {fmt(endMin)}</div>
                        <div className="px-1.5 pb-1 flex justify-end">
                          <span className="text-[10px] bg-blue-500 text-white rounded px-1.5 py-0.5 font-medium leading-none">{durLabel}</span>
                        </div>
                      </div>
                    )
                  }

                  return (
                    <div
                      className="absolute left-0 right-0 border border-blue-400 rounded pointer-events-none z-20 flex flex-col justify-between bg-blue-400/15"
                      style={{ top: minutesToPx(startMin - gridStartMin), height: minutesToPx(durMin) }}
                    >
                      <div className="text-[10px] font-medium px-1.5 pt-1 text-blue-700">{fmt(startMin)} – {fmt(endMin)}</div>
                      <div className="px-1.5 pb-1 flex justify-end">
                        <span className="text-[10px] bg-blue-500 text-white rounded px-1.5 py-0.5 font-medium leading-none">{durLabel}</span>
                      </div>
                    </div>
                  )
                })()}
              </div>
            )
          })}
        </div>

        {/* Hint strip at bottom of grid in edit mode */}
        {state.availabilityEditMode && (
          <div className="sticky bottom-0 left-0 right-0 bg-blue-50/95 border-t border-blue-100 flex items-center justify-center py-1.5 z-20 pointer-events-none">
            <p className="text-xs text-blue-500 font-medium">
              Белые окна — открыты для записи · Рисуйте по серому чтобы открыть, по белому — чтобы закрыть
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
