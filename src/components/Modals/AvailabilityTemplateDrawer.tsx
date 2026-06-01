import { useState } from 'react'
import { X, Plus } from 'lucide-react'
import type { AvailabilityBlock } from '../../types'

interface Props {
  onClose: () => void
  onApply: (weekdays: Partial<Record<number, AvailabilityBlock[]>>, until?: string) => void
  currentUntil?: string
}

const DAY_BTNS: { label: string; dow: number }[] = [
  { label: 'Пн', dow: 1 },
  { label: 'Вт', dow: 2 },
  { label: 'Ср', dow: 3 },
  { label: 'Чт', dow: 4 },
  { label: 'Пт', dow: 5 },
  { label: 'Сб', dow: 6 },
  { label: 'Вс', dow: 0 },
]

const timeToMin = (t: string): number => {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + (m || 0)
}

function buildBlocks(
  start: string,
  end: string,
  breaks: { start: string; end: string }[],
): AvailabilityBlock[] {
  const sMin = timeToMin(start)
  const eMin = timeToMin(end)
  if (eMin <= sMin) return []

  const gaps = breaks
    .map(b => ({ s: timeToMin(b.start), e: timeToMin(b.end) }))
    .filter(b => b.s < b.e && b.s >= sMin && b.e <= eMin)
    .sort((a, b) => a.s - b.s)

  if (gaps.length === 0) return [{ startMin: sMin, endMin: eMin }]

  const result: AvailabilityBlock[] = []
  let cursor = sMin
  for (const g of gaps) {
    if (g.s > cursor) result.push({ startMin: cursor, endMin: g.s })
    cursor = g.e
  }
  if (cursor < eMin) result.push({ startMin: cursor, endMin: eMin })
  return result
}

export default function AvailabilityTemplateDrawer({ onClose, onApply, currentUntil }: Props) {
  const [selectedDows, setSelectedDows] = useState<number[]>([1, 2, 3, 4, 5])
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('18:00')
  const [breaks, setBreaks] = useState<{ start: string; end: string }[]>([])
  const [until, setUntil] = useState(currentUntil ?? '')

  const toggleDow = (dow: number) =>
    setSelectedDows(d => d.includes(dow) ? d.filter(x => x !== dow) : [...d, dow])

  const addBreak = () => setBreaks(b => [...b, { start: '13:00', end: '14:00' }])
  const removeBreak = (i: number) => setBreaks(b => b.filter((_, idx) => idx !== i))
  const updateBreak = (i: number, field: 'start' | 'end', val: string) =>
    setBreaks(b => b.map((br, idx) => idx === i ? { ...br, [field]: val } : br))

  const handleApply = () => {
    const blocks = buildBlocks(startTime, endTime, breaks)
    const weekdays: Partial<Record<number, AvailabilityBlock[]>> = {}
    for (const dow of selectedDows) weekdays[dow] = blocks
    onApply(weekdays, until || undefined)
  }

  const inputCls = 'px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 bg-white'

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-[320px] bg-white shadow-2xl flex flex-col border-l border-gray-100">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-base font-semibold text-gray-900">Шаблоны</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {/* Template type */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Шаблоны</p>
            <div className="relative">
              <select className={`${inputCls} w-full appearance-none pr-8 cursor-pointer`} defaultValue="weekdays">
                <option value="weekdays">По дням недели</option>
              </select>
              <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                  <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
            </div>
          </div>

          {/* Working days */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Рабочие дни</p>
            <div className="flex gap-1.5 flex-wrap">
              {DAY_BTNS.map(({ label, dow }) => {
                const active = selectedDows.includes(dow)
                return (
                  <button
                    key={dow}
                    onClick={() => toggleDow(dow)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium border transition-colors ${
                      active
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Working hours */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Рабочее время</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Начало</label>
                <div className="relative flex items-center">
                  <input
                    type="time"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className={`${inputCls} w-full pr-7`}
                  />
                  <button onClick={() => setStartTime('09:00')} className="absolute right-2 text-gray-300 hover:text-gray-500 transition-colors">
                    <X size={12} />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Конец</label>
                <div className="relative flex items-center">
                  <input
                    type="time"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    className={`${inputCls} w-full pr-7`}
                  />
                  <button onClick={() => setEndTime('18:00')} className="absolute right-2 text-gray-300 hover:text-gray-500 transition-colors">
                    <X size={12} />
                  </button>
                </div>
              </div>
            </div>

            {/* Breaks */}
            {breaks.map((br, i) => (
              <div key={i} className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Перерыв с</label>
                  <input
                    type="time"
                    value={br.start}
                    onChange={e => updateBreak(i, 'start', e.target.value)}
                    className={`${inputCls} w-full`}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    до
                    <button onClick={() => removeBreak(i)} className="ml-2 text-red-400 hover:text-red-500 transition-colors text-[11px]">удалить</button>
                  </label>
                  <input
                    type="time"
                    value={br.end}
                    onChange={e => updateBreak(i, 'end', e.target.value)}
                    className={`${inputCls} w-full`}
                  />
                </div>
              </div>
            ))}

            <button
              onClick={addBreak}
              className="mt-2 flex items-center gap-1.5 text-sm text-blue-500 hover:text-blue-600 transition-colors"
            >
              <Plus size={13} />
              Добавить перерыв
            </button>
          </div>

          {/* Application interval */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Интервал применения</p>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Дата</label>
              <input
                type="date"
                value={until}
                onChange={e => setUntil(e.target.value)}
                placeholder="до..."
                className={`${inputCls} w-full`}
              />
              {until && (
                <p className="text-[11px] text-gray-400 mt-1">
                  до {until.split('-').reverse().join('.')}
                </p>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-5 py-4 flex items-center justify-between gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Отменить
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium transition-colors"
          >
            Применить
          </button>
        </div>
      </div>
    </>
  )
}
