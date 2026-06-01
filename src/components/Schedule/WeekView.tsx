import { useRef, useState, useCallback } from 'react'
import { Lock } from 'lucide-react'
import type { Slot, AvailabilityBlock } from '../../types'
import { useSchedule } from '../../context/ScheduleContext'
import { DAYS_SHORT_RU, weekDays, isSameDay, isToday } from '../../utils/dateUtils'
import { layoutSlots, TOTAL_HEIGHT, GRID_START, PX_PER_MIN, snapToGrid, minutesToPx } from '../../utils/slotUtils'
import {
  getBlocksForDate, getEditBlocksForDate, toDateKey,
  mergeBlocks, subtractBlock,
} from '../../utils/availabilityUtils'
import SlotCard from './SlotCard'
import TimeAxis from './TimeAxis'
import GridLines from './GridLines'
import CurrentTimeLine from './CurrentTimeLine'
import AvailabilityMask from './AvailabilityMask'

interface DragPreview { startMin: number; endMin: number }
const fmtMin = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
const MONTHS_SHORT = ['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек']

interface DayPopup {
  dateKey: string
  colIdx: number
  label: string
  hasException: boolean
}

export default function WeekView() {
  const { state, dispatch } = useSchedule()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState<{ colIdx: number; preview: DragPreview; isErase: boolean } | null>(null)
  const [dayPopup, setDayPopup] = useState<DayPopup | null>(null)
  const colRefs = useRef<(HTMLDivElement | null)[]>([])

  const days = weekDays(state.selectedDate)
  const gridStartMin = GRID_START * 60
  const getMinFromY = (y: number) => snapToGrid(Math.max(gridStartMin, gridStartMin + y / PX_PER_MIN), 15)
  const today = new Date(); today.setHours(0, 0, 0, 0)

  const isPastUntil = (day: Date) =>
    state.availabilityEditMode && state.editUntil !== undefined && toDateKey(day) > state.editUntil

  const getSlotsForDay = (day: Date): Slot[] =>
    state.slots.filter(s => {
      if (!isSameDay(s.start, day)) return false
      if (s.specialistId && !state.selectedSpecialistIds.includes(s.specialistId)) return false
      if (s.spaceId && !state.selectedSpaceIds.includes(s.spaceId)) return false
      if (s.type === 'fixed' && !state.showFixed) return false
      if (s.type === 'free' && !state.showFree) return false
      return true
    })

  // ── Drag handlers ──────────────────────────────────────────────────────────

  const onMouseDown = useCallback((e: React.MouseEvent, colIdx: number, day: Date) => {
    if (e.button !== 0) return
    setDayPopup(null)
    const rect = colRefs.current[colIdx]?.getBoundingClientRect()
    if (!rect) return
    const y = e.clientY - rect.top
    const startMin = getMinFromY(y)

    if (state.availabilityEditMode) {
      // Past days and post-until days are not editable
      const dayStart = new Date(day); dayStart.setHours(0, 0, 0, 0)
      if (dayStart < today || isPastUntil(day)) return

      const dateKey = toDateKey(day)
      const existing = getEditBlocksForDate(day, state.editDraft, state.editBaseWeekMonday, state.useWeekPattern)
      const isErase = existing.some(b => b.startMin <= startMin && b.endMin > startMin)
      setDrag({ colIdx, preview: { startMin, endMin: startMin + 60 }, isErase })

      const onMove = (me: MouseEvent) => {
        const curMin = getMinFromY(me.clientY - rect.top)
        setDrag(d => d ? { ...d, preview: { startMin: Math.min(d.preview.startMin, curMin), endMin: Math.max(d.preview.startMin, curMin) } } : d)
      }
      const onUp = (me: MouseEvent) => {
        const curMin = getMinFromY(me.clientY - rect.top)
        const sMin = Math.min(getMinFromY(y), curMin)
        const eMin = Math.max(getMinFromY(y), curMin)
        if (eMin - sMin >= 15) {
          const updated = isErase
            ? subtractBlock(existing, sMin, eMin)
            : mergeBlocks([...existing, { startMin: sMin, endMin: eMin }])
          dispatch({ type: 'SET_EDIT_DAY', payload: { dateKey, blocks: updated } })
        }
        setDrag(null)
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
      }
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
      return
    }

    // Normal mode — create slot
    const tentativeStart = new Date(day)
    tentativeStart.setHours(Math.floor(startMin / 60), startMin % 60, 0, 0)
    if (tentativeStart < new Date()) return

    let slotType: 'free' | 'fixed' | undefined
    if (state.availability.isConfigured) {
      const blocks = getBlocksForDate(day, state.availability)
      if (!blocks.some(b => b.startMin <= startMin && b.endMin > startMin)) return
      slotType = 'free'
    }

    setDrag({ colIdx, preview: { startMin, endMin: startMin + 60 }, isErase: false })
    const onMove = (me: MouseEvent) => {
      const curMin = getMinFromY(me.clientY - rect.top)
      setDrag(d => d ? { ...d, preview: { startMin: Math.min(d.preview.startMin, curMin), endMin: Math.max(d.preview.startMin, curMin) } } : d)
    }
    const onUp = (me: MouseEvent) => {
      const curMin = getMinFromY(me.clientY - rect.top)
      const sMin = Math.min(getMinFromY(y), curMin)
      const eMin = Math.max(getMinFromY(y), curMin)
      if (eMin - sMin >= 15) {
        const startTime = new Date(day); startTime.setHours(Math.floor(sMin / 60), sMin % 60, 0, 0)
        const endTime = new Date(day); endTime.setHours(Math.floor(eMin / 60), eMin % 60, 0, 0)
        dispatch({ type: 'SET_CREATE_MODAL', payload: { startTime, endTime, columnKey: '', slotType } })
      }
      setDrag(null)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [days, dispatch, state.availabilityEditMode, state.editDraft, state.editBaseWeekMonday, state.useWeekPattern, state.availability, today])

  // ── Day header click (normal mode only) ───────────────────────────────────

  const openDayPopup = (colIdx: number, day: Date) => {
    if (state.availabilityEditMode) return
    const dateKey = toDateKey(day)
    const hasException = Object.prototype.hasOwnProperty.call(state.availability.dailyBlocks, dateKey)
    const label = `${DAYS_SHORT_RU[colIdx]}, ${day.getDate()} ${MONTHS_SHORT[day.getMonth()]}`
    setDayPopup({ dateKey, colIdx, label, hasException })
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full" onClick={() => setDayPopup(null)}>

      {/* Day headers */}
      <div className="flex border-b border-gray-200 bg-white sticky top-0 z-10 flex-shrink-0">
        <div className="w-14 flex-shrink-0" />
        {days.map((day, i) => {
          const isT = isToday(day)
          const dateKey = toDateKey(day)
          const hasException = Object.prototype.hasOwnProperty.call(state.availability.dailyBlocks, dateKey)
          const isAfterUntil = isPastUntil(day)
          const isDimmed = day < today || isAfterUntil

          return (
            <div
              key={i}
              className={`flex-1 border-l border-gray-100 py-2 relative ${state.availabilityEditMode ? 'cursor-default' : 'cursor-pointer hover:bg-gray-50'}`}
              onClick={e => {
                e.stopPropagation()
                if (!state.availabilityEditMode) openDayPopup(i, day)
              }}
            >
              <div className="flex items-center justify-center gap-1 px-1">
                <span className={`text-[10px] uppercase ${isDimmed && state.availabilityEditMode ? 'text-gray-300' : 'text-gray-400'}`}>{DAYS_SHORT_RU[i]}</span>
                <span className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full flex-shrink-0 ${
                  isT ? 'bg-blue-500 text-white' : isDimmed && state.availabilityEditMode ? 'text-gray-300' : 'text-gray-800'
                }`}>
                  {day.getDate()}
                </span>
                {hasException && !state.availabilityEditMode && (
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" title="Исключение" />
                )}
              </div>

              {/* Day popup (normal mode) */}
              {dayPopup && dayPopup.colIdx === i && (
                <div
                  className="absolute top-full mt-1 left-0 z-50 bg-white rounded-xl shadow-xl border border-gray-100 py-1 w-48"
                  onClick={e => e.stopPropagation()}
                >
                  <p className="px-3 py-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{dayPopup.label}</p>
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      dispatch({ type: 'SET_DATE_EXCEPTION', payload: { dateKey: dayPopup.dateKey, blocks: [] } })
                      setDayPopup(null)
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Lock size={13} className="text-gray-400 flex-shrink-0" />
                    Закрыть для записи
                  </button>
                  {dayPopup.hasException && (
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        dispatch({ type: 'SET_DATE_EXCEPTION', payload: { dateKey: dayPopup.dateKey, blocks: null } })
                        setDayPopup(null)
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-blue-500 hover:bg-blue-50 transition-colors"
                    >
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="flex-shrink-0">
                        <path d="M1.5 6.5C1.5 6.5 3.5 3 6.5 3C9.5 3 11.5 6.5 11.5 6.5C11.5 6.5 9.5 10 6.5 10C3.5 10 1.5 6.5 1.5 6.5Z" stroke="currentColor" strokeWidth="1.2"/>
                        <circle cx="6.5" cy="6.5" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
                      </svg>
                      Использовать шаблон
                    </button>
                  )}
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
          {days.map((day, colIdx) => {
            const daySlots = getSlotsForDay(day)
            const laid = layoutSlots(daySlots)
            const isT = isToday(day)
            const isPast = day < today
            const isAfterUntil = isPastUntil(day)
            const isDimmed = isPast || isAfterUntil
            const dateKey = toDateKey(day)

            // Availability blocks for this column
            let availBlocks: AvailabilityBlock[]
            if (state.availabilityEditMode) {
              availBlocks = getEditBlocksForDate(day, state.editDraft, state.editBaseWeekMonday, state.useWeekPattern)
            } else if (state.availability.isConfigured) {
              availBlocks = getBlocksForDate(day, state.availability)
            } else {
              availBlocks = []
            }

            // Conflict detection: free slots outside availBlocks in edit mode
            const conflictedSlots = state.availabilityEditMode
              ? daySlots.filter(s => {
                  if (s.type !== 'free') return false
                  const sMin = s.start.getHours() * 60 + s.start.getMinutes()
                  const eMin = s.end.getHours() * 60 + s.end.getMinutes()
                  return !availBlocks.some(b => b.startMin <= sMin && b.endMin >= eMin)
                })
              : []

            // Availability mask
            let availMask: React.ReactNode = null
            if (state.availabilityEditMode) {
              availMask = (
                <>
                  <div className="absolute inset-0 pointer-events-none" style={{ height: TOTAL_HEIGHT, backgroundColor: 'rgba(241,245,249,0.92)' }} />
                  {availBlocks.map((block, i) => (
                    <div key={i} className="absolute left-0 right-0 pointer-events-none"
                      style={{ top: minutesToPx(block.startMin - gridStartMin), height: minutesToPx(block.endMin - block.startMin), backgroundColor: isDimmed ? 'rgba(255,255,255,0.5)' : '#ffffff', zIndex: 1 }} />
                  ))}
                </>
              )
            } else if (state.availability.isConfigured) {
              availMask = <AvailabilityMask blocks={availBlocks} />
            } else {
              availMask = <div className="absolute inset-0 pointer-events-none" style={{ height: TOTAL_HEIGHT, backgroundColor: 'rgba(241,245,249,0.92)' }} />
            }

            // Dimmed column overlay in edit mode (past or post-until)
            const dimmedOverlay = state.availabilityEditMode && isDimmed ? (
              <div className="absolute inset-0 pointer-events-none z-20" style={{ backgroundColor: 'rgba(255,255,255,0.45)' }} />
            ) : null

            return (
              <div
                key={colIdx}
                ref={el => { colRefs.current[colIdx] = el }}
                className={`flex-1 border-l border-gray-100 relative ${
                  state.availabilityEditMode && isDimmed ? 'cursor-not-allowed' : 'cursor-crosshair'
                }`}
                style={{ height: TOTAL_HEIGHT }}
                onMouseDown={e => onMouseDown(e, colIdx, day)}
              >
                <GridLines />
                {availMask}
                {isT && <CurrentTimeLine />}
                {dimmedOverlay}

                {/* Slots */}
                {laid.map(({ slot, col: c, numCols }) => {
                  const isConflict = conflictedSlots.includes(slot)
                  return (
                    <div key={slot.id} className="relative z-10">
                      <SlotCard slot={slot} col={c} numCols={numCols} compact ghost={state.availabilityEditMode} />
                      {isConflict && (
                        <div
                          className="absolute left-0 right-0 pointer-events-none z-20 border-2 border-red-400 rounded flex items-center justify-center"
                          style={{
                            top: minutesToPx((slot.start.getHours() * 60 + slot.start.getMinutes()) - gridStartMin),
                            height: minutesToPx((slot.end.getHours() * 60 + slot.end.getMinutes()) - (slot.start.getHours() * 60 + slot.start.getMinutes())),
                            backgroundColor: 'rgba(239,68,68,0.15)',
                          }}
                        >
                          <span className="text-[9px] font-bold text-red-600 bg-white/90 px-1 py-0.5 rounded">⚠ конфликт</span>
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* Drag preview */}
                {drag && drag.colIdx === colIdx && (() => {
                  const { startMin, endMin } = drag.preview
                  const durMin = endMin - startMin
                  const durH = Math.floor(durMin / 60); const durM = durMin % 60
                  const durLabel = durH === 0 ? `${durM} мин` : durM === 0 ? `${durH}ч` : `${durH}ч ${durM}мин`

                  if (state.availabilityEditMode) {
                    return drag.isErase ? (
                      <div className="absolute left-0 right-0 border border-dashed border-red-400 pointer-events-none z-20 flex flex-col justify-between"
                        style={{ top: minutesToPx(startMin - gridStartMin), height: minutesToPx(durMin), backgroundColor: 'rgba(239,68,68,0.1)' }}>
                        <div className="text-[10px] font-medium px-1.5 pt-1 text-red-500">{fmtMin(startMin)} – {fmtMin(endMin)}</div>
                        <div className="px-1.5 pb-1 flex justify-end">
                          <span className="text-[10px] bg-red-400 text-white rounded px-1.5 py-0.5 font-medium leading-none">{durLabel}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="absolute left-0 right-0 border border-dashed border-blue-400 pointer-events-none z-20 flex flex-col justify-between"
                        style={{ top: minutesToPx(startMin - gridStartMin), height: minutesToPx(durMin), backgroundColor: 'rgba(255,255,255,0.95)' }}>
                        <div className="text-[10px] font-medium px-1.5 pt-1 text-blue-500">{fmtMin(startMin)} – {fmtMin(endMin)}</div>
                        <div className="px-1.5 pb-1 flex justify-end">
                          <span className="text-[10px] bg-blue-500 text-white rounded px-1.5 py-0.5 font-medium leading-none">{durLabel}</span>
                        </div>
                      </div>
                    )
                  }

                  return (
                    <div className="absolute left-0 right-0 border border-blue-400 rounded pointer-events-none z-20 flex flex-col justify-between bg-blue-400/15"
                      style={{ top: minutesToPx(startMin - gridStartMin), height: minutesToPx(durMin) }}>
                      <div className="text-[10px] font-medium px-1.5 pt-1 text-blue-700">{fmtMin(startMin)} – {fmtMin(endMin)}</div>
                      <div className="px-1.5 pb-1 flex justify-end">
                        <span className="text-[10px] bg-blue-500 text-white rounded px-1.5 py-0.5 font-medium leading-none">{durLabel}</span>
                      </div>
                    </div>
                  )
                })()}

                {/* Dot indicator for manually edited dates */}
                {state.availabilityEditMode && !isDimmed && Object.prototype.hasOwnProperty.call(state.editDraft, dateKey) && (
                  <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-blue-400 pointer-events-none z-10" title="Настроено вручную" />
                )}

                {/* Post-until label on the first out-of-range column */}
                {isAfterUntil && state.editUntil && colIdx === days.findIndex(d => toDateKey(d) > state.editUntil!) && (
                  <div className="absolute inset-x-0 top-4 flex justify-center pointer-events-none z-25">
                    <span className="text-[9px] text-gray-400 bg-white/80 px-1.5 py-0.5 rounded border border-gray-200">вне периода</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Edit mode hint */}
        {state.availabilityEditMode && (
          <div className="sticky bottom-0 left-0 right-0 bg-blue-50/95 border-t border-blue-100 flex items-center justify-center py-1.5 z-20 pointer-events-none">
            <p className="text-xs text-blue-500 font-medium">
              Выделите время, в которое пользователи смогут к вам записаться
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
