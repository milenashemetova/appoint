import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { MONTHS_RU, DAYS_SHORT_RU, calendarGrid, isSameDay, isToday, startOfWeek, addDays } from '../../utils/dateUtils'
import { useSchedule } from '../../context/ScheduleContext'

export default function MiniCalendar() {
  const { state, dispatch } = useSchedule()
  const sel = state.selectedDate

  const [viewYear, setViewYear] = useState(sel.getFullYear())
  const [viewMonth, setViewMonth] = useState(sel.getMonth())

  const grid = calendarGrid(viewYear, viewMonth)
  const weekStart = startOfWeek(sel)
  const weekEnd = addDays(weekStart, 6)

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  const handleDayClick = (day: Date) => {
    dispatch({ type: 'SET_DATE', payload: day })
    if (state.viewMode === 'week') dispatch({ type: 'SET_VIEW', payload: 'day' })
  }

  const isInCurrentWeek = (day: Date) => day >= weekStart && day <= weekEnd
  const isCurrentMonth = (day: Date) => day.getMonth() === viewMonth

  return (
    <div className="px-3 py-2 select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <button onClick={prevMonth} className="p-0.5 rounded hover:bg-gray-100">
          <ChevronLeft size={14} className="text-gray-500" />
        </button>
        <span className="text-xs font-semibold text-gray-700">
          {MONTHS_RU[viewMonth]} {viewYear}
        </span>
        <button onClick={nextMonth} className="p-0.5 rounded hover:bg-gray-100">
          <ChevronRight size={14} className="text-gray-500" />
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS_SHORT_RU.map(d => (
          <div key={d} className="text-center text-[10px] text-gray-400 font-medium py-0.5">{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7">
        {grid.map((day, i) => {
          const same = isSameDay(day, sel)
          const today = isToday(day)
          const inWeek = isInCurrentWeek(day)
          const inMonth = isCurrentMonth(day)

          return (
            <button
              key={i}
              onClick={() => handleDayClick(day)}
              className={`
                relative h-7 w-full flex items-center justify-center text-[11px] rounded transition-colors
                ${!inMonth ? 'text-gray-300' : today ? 'text-blue-600 font-bold' : 'text-gray-700'}
                ${same ? 'bg-blue-500 !text-white rounded-full font-bold' : inWeek && state.viewMode === 'week' ? 'bg-blue-50' : 'hover:bg-gray-100'}
              `}
            >
              {day.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}
