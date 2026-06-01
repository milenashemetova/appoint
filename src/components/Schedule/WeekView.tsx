import { useRef, useState, useCallback } from 'react'
import { Clock, Lock } from 'lucide-react'
import type { Slot, AvailabilityBlock } from '../../types'
import { useSchedule } from '../../context/ScheduleContext'
import { DAYS_SHORT_RU, weekDays, isSameDay, isToday } from '../../utils/dateUtils'
import { layoutSlots, TOTAL_HEIGHT, GRID_START, PX_PER_MIN, snapToGrid, minutesToPx } from '../../utils/slotUtils'
import { getBlocksForDate, toDateKey, mergeBlocks, subtractBlock } from '../../utils/availabilityUtils'
import SlotCard from './SlotCard'
import TimeAxis from './TimeAxis'
import GridLines from './GridLines'
import CurrentTimeLine from './CurrentTimeLine'
import AvailabilityMask from './AvailabilityMask'

// Abstract week: Mon–Sun for the availability editor
const ABSTRACT_DAYS: { label: string; dow: number }[] = [
  { label: 'Пн', dow: 1 },
  { label: 'Вт', dow: 2 },
  { label: 'Ср', dow: 3 },
  { label: 'Чт', dow: 4 },
  { label: 'Пт', dow: 5 },
  { label: 'Сб', dow: 6 },
  { label: 'Вс', dow: 0 },
]

interface DragPreview { startMin: number; endMin: number }
const fmtMin = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`

// ── Exception menu popup ─────────────────────────────────────────────────────

interface ExcMenu {
  dateKey: string
  colIdx: number
  label: string
  hasException: boolean
  initialBlocks: AvailabilityBlock[]
  dow: number
}

// ── Main component ───────────────────────────────────────────────────────────

export default function WeekView() {
  const { state, dispatch } = useSchedule()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState<{ colIdx: number; preview: DragPreview; isErase: boolean } | null>(null)
  const [excMenu, setExcMenu] = useState<ExcMenu | null>(null)
  const colRefs = useRef<(HTMLDivElement | null)[]>([])

  const days = weekDays(state.selectedDate)
  const gridStartMin = GRID_START * 60
  const getMinFromY = (y: number) => snapToGrid(Math.max(gridStartMin, gridStartMin + y / PX_PER_MIN), 15)

  const getSlotsForDay = (day: Date): Slot[] =>
    state.slots.filter(s => {
      if (!isSameDay(s.start, day)) return false
      if (s.specialistId && !state.selectedSpecialistIds.includes(s.specialistId)) return false
      if (s.spaceId && !state.selectedSpaceIds.includes(s.spaceId)) return false
      return true
    })

  // ── Drag handlers ──────────────────────────────────────────────────────────

  const onMouseDown = useCallback((e: React.MouseEvent, colIdx: number) => {
    if (e.button !== 0) return
    setExcMenu(null)
    const rect = colRefs.current[colIdx]?.getBoundingClientRect()
    if (!rect) return
    const y = e.clientY - rect.top
    const startMin = getMinFromY(y)

    // ── Abstract week edit mode ──
    if (state.availabilityEditMode) {
      const dow = ABSTRACT_DAYS[colIdx].dow
      const existing = state.weekDraft[dow] ?? []
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
          if (isErase) {
            dispatch({ type: 'SET_WEEK_DRAFT_DAY', payload: { dayOfWeek: dow, blocks: subtractBlock(existing, sMin, eMin) } })
          } else {
            dispatch({ type: 'SET_WEEK_DRAFT_DAY', payload: { dayOfWeek: dow, blocks: mergeBlocks([...existing, { startMin: sMin, endMin: eMin }]) } })
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

    // ── Single-day exception edit mode ──
    if (state.exceptionEdit) {
      const day = days[colIdx]
      if (!day || toDateKey(day) !== state.exceptionEdit.dateKey) return
      const existing = state.exceptionDraft
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
          dispatch({ type: 'SET_EXCEPTION_DRAFT', payload: updated })
        }
        setDrag(null)
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
      }
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
      return
    }

    // ── Normal mode — create slot ──
    const day = days[colIdx]
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
  }, [days, dispatch, state.availabilityEditMode, state.exceptionEdit, state.exceptionDraft, state.weekDraft, state.availability])

  // ── Day header click → exception menu ─────────────────────────────────────

  const openExcMenu = (colIdx: number, day: Date) => {
    if (state.availabilityEditMode || state.exceptionEdit) return
    const dateKey = toDateKey(day)
    const blocks = getBlocksForDate(day, state.availability)
    const hasException = Object.prototype.hasOwnProperty.call(state.availability.dailyBlocks, dateKey)
    const MONTHS_SHORT = ['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек']
    const label = `${DAYS_SHORT_RU[colIdx]}, ${day.getDate()} ${MONTHS_SHORT[day.getMonth()]}`
    setExcMenu({ dateKey, colIdx, label, hasException, initialBlocks: blocks, dow: day.getDay() })
  }

  // ── Chip helper ────────────────────────────────────────────────────────────

  const removeChip = (dow: number, idx: number) => {
    const current = state.weekDraft[dow] ?? []
    const updated = current.filter((_, i) => i !== idx)
    dispatch({ type: 'SET_WEEK_DRAFT_DAY', payload: { dayOfWeek: dow, blocks: updated } })
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const columns = state.availabilityEditMode
    ? ABSTRACT_DAYS
    : days.map((d, i) => ({ label: DAYS_SHORT_RU[i], dow: d.getDay(), date: d }))

  return (
    <div className="flex flex-col h-full" onClick={() => setExcMenu(null)}>

      {/* Day headers */}
      <div className="flex border-b border-gray-200 bg-white sticky top-0 z-10 flex-shrink-0">
        <div className="w-14 flex-shrink-0" />
        {columns.map((col, i) => {
          const day = !state.availabilityEditMode ? (col as { date: Date }).date : null
          const isT = day ? isToday(day) : false
          const dow = col.dow
          const draftBlocks = state.availabilityEditMode ? (state.weekDraft[dow] ?? []) : []
          const dateKey = day ? toDateKey(day) : ''
          const hasException = day ? Object.prototype.hasOwnProperty.call(state.availability.dailyBlocks, dateKey) : false
          const isExcCol = !state.availabilityEditMode && state.exceptionEdit !== null && dateKey === state.exceptionEdit.dateKey

          return (
            <div
              key={i}
              className={`flex-1 border-l py-2 relative transition-colors ${
                isExcCol
                  ? 'border-l-blue-400 bg-blue-50/40 cursor-default'
                  : state.availabilityEditMode
                    ? 'border-l-gray-100 cursor-default'
                    : 'border-l-gray-100 cursor-pointer hover:bg-gray-50'
              }`}
              onClick={e => {
                e.stopPropagation()
                if (day && !state.availabilityEditMode && !state.exceptionEdit) openExcMenu(i, day)
              }}
            >
              {/* Day label row */}
              <div className="flex items-center justify-center gap-1 px-1">
                <span className="text-[10px] text-gray-400 uppercase">{col.label}</span>
                {day && (
                  <span className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full flex-shrink-0 ${isT ? 'bg-blue-500 text-white' : 'text-gray-800'}`}>
                    {day.getDate()}
                  </span>
                )}
                {hasException && !isExcCol && (
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" title="Исключение" />
                )}
              </div>

              {/* Time chips (abstract week edit mode) */}
              {state.availabilityEditMode && (
                <div className="flex flex-wrap gap-1 px-1 mt-1 min-h-[22px]">
                  {draftBlocks.length === 0 ? (
                    <span className="text-[10px] text-gray-400 italic px-1">не рабочий</span>
                  ) : (
                    draftBlocks.map((block, bi) => (
                      <span
                        key={bi}
                        className="inline-flex items-center gap-0.5 bg-blue-50 border border-blue-200 text-blue-700 text-[10px] rounded-full px-2 py-0.5 font-medium"
                      >
                        {fmtMin(block.startMin)}–{fmtMin(block.endMin)}
                        <button
                          onClick={e => { e.stopPropagation(); removeChip(dow, bi) }}
                          className="hover:text-blue-900 ml-0.5 leading-none"
                        >×</button>
                      </span>
                    ))
                  )}
                </div>
              )}

              {/* Exception menu popup */}
              {excMenu && excMenu.colIdx === i && (
                <div
                  className="absolute top-full mt-1 left-0 z-50 bg-white rounded-xl shadow-xl border border-gray-100 py-1 w-52"
                  onClick={e => e.stopPropagation()}
                >
                  <p className="px-3 py-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{excMenu.label}</p>
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      dispatch({ type: 'ENTER_EXCEPTION_EDIT', payload: { dateKey: excMenu.dateKey, dow: excMenu.dow, initialBlocks: excMenu.initialBlocks } })
                      setExcMenu(null)
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Clock size={14} className="text-gray-400 flex-shrink-0" />
                    Изменить время работы
                  </button>
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      dispatch({ type: 'SET_DATE_EXCEPTION', payload: { dateKey: excMenu.dateKey, blocks: [] } })
                      setExcMenu(null)
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Lock size={14} className="text-gray-400 flex-shrink-0" />
                    Закрыть для записи
                  </button>
                  {excMenu.hasException && (
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        dispatch({ type: 'SET_DATE_EXCEPTION', payload: { dateKey: excMenu.dateKey, blocks: null } })
                        setExcMenu(null)
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-blue-500 hover:bg-blue-50 transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
                        <path d="M2 7C2 7 3.5 4 7 4C10.5 4 12 7 12 7C12 7 10.5 10 7 10C3.5 10 2 7 2 7Z" stroke="currentColor" strokeWidth="1.2"/>
                        <circle cx="7" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
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
          {columns.map((col, colIdx) => {
            const day = !state.availabilityEditMode ? (col as { date: Date }).date : null
            const daySlots = day ? getSlotsForDay(day) : []
            const laid = layoutSlots(daySlots)
            const isT = day ? isToday(day) : false
            const dow = col.dow
            const dateKey = day ? toDateKey(day) : ''
            const isExcCol = !state.availabilityEditMode && state.exceptionEdit !== null && dateKey === state.exceptionEdit.dateKey

            // Availability mask
            let availMask: React.ReactNode = null
            if (state.availabilityEditMode) {
              const draftBlocks = state.weekDraft[dow] ?? []
              availMask = (
                <>
                  <div className="absolute inset-0 pointer-events-none" style={{ height: TOTAL_HEIGHT, backgroundColor: 'rgba(241,245,249,0.92)' }} />
                  {draftBlocks.map((block, i) => (
                    <div key={i} className="absolute left-0 right-0 pointer-events-none"
                      style={{ top: minutesToPx(block.startMin - gridStartMin), height: minutesToPx(block.endMin - block.startMin), backgroundColor: '#ffffff', zIndex: 1 }} />
                  ))}
                </>
              )
            } else if (isExcCol) {
              // Exception edit column: show exceptionDraft blocks as white on gray
              availMask = (
                <>
                  <div className="absolute inset-0 pointer-events-none" style={{ height: TOTAL_HEIGHT, backgroundColor: 'rgba(241,245,249,0.92)' }} />
                  {state.exceptionDraft.map((block, i) => (
                    <div key={i} className="absolute left-0 right-0 pointer-events-none"
                      style={{ top: minutesToPx(block.startMin - gridStartMin), height: minutesToPx(block.endMin - block.startMin), backgroundColor: '#ffffff', zIndex: 1 }} />
                  ))}
                </>
              )
            } else if (state.exceptionEdit) {
              // Other columns in exception edit mode: show their normal availability (dimmed)
              availMask = day ? <AvailabilityMask blocks={getBlocksForDate(day, state.availability)} /> : null
            } else if (state.availability.isConfigured && day) {
              availMask = <AvailabilityMask blocks={getBlocksForDate(day, state.availability)} />
            } else if (!state.availability.isConfigured) {
              availMask = <div className="absolute inset-0 pointer-events-none" style={{ height: TOTAL_HEIGHT, backgroundColor: 'rgba(241,245,249,0.92)' }} />
            }

            const isOtherExcCol = state.exceptionEdit && !isExcCol && !state.availabilityEditMode

            return (
              <div
                key={colIdx}
                ref={el => { colRefs.current[colIdx] = el }}
                className={`flex-1 border-l relative ${
                  isExcCol
                    ? 'border-l-blue-300 cursor-crosshair bg-blue-50/20'
                    : isOtherExcCol
                      ? 'border-l-gray-100 cursor-default opacity-60'
                      : 'border-l-gray-100 cursor-crosshair'
                }`}
                style={{ height: TOTAL_HEIGHT }}
                onMouseDown={e => onMouseDown(e, colIdx)}
              >
                <GridLines />
                {availMask}
                {isT && !state.exceptionEdit && <CurrentTimeLine />}

                {!state.availabilityEditMode && !state.exceptionEdit && laid.map(({ slot, col: c, numCols }) => (
                  <SlotCard key={slot.id} slot={slot} col={c} numCols={numCols} compact />
                ))}
                {!state.availabilityEditMode && state.exceptionEdit && !isExcCol && laid.map(({ slot, col: c, numCols }) => (
                  <SlotCard key={slot.id} slot={slot} col={c} numCols={numCols} compact />
                ))}

                {/* Exception edit column: blue side borders + bottom hint */}
                {isExcCol && (
                  <>
                    <div className="absolute inset-y-0 left-0 w-0.5 bg-blue-400 pointer-events-none z-10" />
                    <div className="absolute inset-y-0 right-0 w-0.5 bg-blue-400 pointer-events-none z-10" />
                    <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center py-2 pointer-events-none z-10">
                      <span className="text-xs text-blue-500 font-medium bg-blue-50/90 px-2 py-1 rounded">Отредактируйте время</span>
                    </div>
                  </>
                )}

                {/* Drag preview */}
                {drag && drag.colIdx === colIdx && (() => {
                  const { startMin, endMin } = drag.preview
                  const durMin = endMin - startMin
                  const durH = Math.floor(durMin / 60); const durM = durMin % 60
                  const durLabel = durH === 0 ? `${durM} мин` : durM === 0 ? `${durH}ч` : `${durH}ч ${durM}мин`

                  const isEraseMode = state.availabilityEditMode || isExcCol
                  if (isEraseMode) {
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
              </div>
            )
          })}
        </div>

        {/* Abstract week edit mode hint */}
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
