import { useState } from 'react'
import { X } from 'lucide-react'

interface Props {
  onClose: () => void
  onSelect: (date: string) => void
  current?: string
}

function addDaysToDate(base: Date, days: number): string {
  const d = new Date(base)
  d.setDate(d.getDate() + days)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const PRESETS = [
  { label: '2 недели', days: 14 },
  { label: '1 месяц', days: 30 },
  { label: '2 месяца', days: 60 },
  { label: '3 месяца', days: 90 },
]

export default function AvailabilityUntilModal({ onClose, onSelect, current }: Props) {
  const today = new Date()
  const [value, setValue] = useState<string>(current ?? '')

  const applyPreset = (days: number) => {
    const date = addDaysToDate(today, days)
    setValue(date)
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center" onClick={onClose}>
        <div
          className="bg-white rounded-2xl shadow-2xl w-[360px] flex flex-col overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">До какого момента применять расписание?</h2>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
            >
              <X size={15} />
            </button>
          </div>

          {/* Body */}
          <div className="px-5 py-4 space-y-4">
            {/* Preset chips */}
            <div className="flex items-center gap-2 flex-wrap">
              {PRESETS.map(p => {
                const presetDate = addDaysToDate(today, p.days)
                const isSelected = value === presetDate
                return (
                  <button
                    key={p.label}
                    onClick={() => applyPreset(p.days)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                      isSelected
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {p.label}
                  </button>
                )
              })}
            </div>

            {/* Date input */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Конкретная дата</label>
              <input
                type="date"
                value={value}
                onChange={e => setValue(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 bg-white transition-colors"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Отменить
            </button>
            <button
              onClick={() => { if (value) onSelect(value) }}
              disabled={!value}
              className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Применить
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
