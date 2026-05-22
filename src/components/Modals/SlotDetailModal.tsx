import { X, Trash2, PauseCircle, PlayCircle } from 'lucide-react'
import { useState } from 'react'
import type { Slot } from '../../types'
import { useSchedule } from '../../context/ScheduleContext'
import { fmtTime, MONTHS_RU_GEN } from '../../utils/dateUtils'

const STATUS_LABELS: Record<string, string> = {
  confirmed: 'Подтверждено',
  waiting: 'Ожидает подтверждения',
  new: 'Новая заявка',
  'has-bookings': 'Есть записи',
  'no-bookings': 'Нет записей',
  full: 'Заполнено',
  stopped: 'Остановлено',
}

interface Props {
  slot: Slot
  onClose: () => void
}

export default function SlotDetailModal({ slot, onClose }: Props) {
  const { dispatch, specialists } = useSchedule()
  const [tab, setTab] = useState<'info' | 'clients'>('info')

  const specialist = specialists.find(s => s.id === slot.specialistId)
  const isFree = slot.type === 'free'
  const isFixed = slot.type === 'fixed'
  const canConfirm = slot.status === 'waiting' || slot.status === 'new'
  const isStopped = slot.status === 'stopped'

  const handleConfirm = () => {
    dispatch({ type: 'UPDATE_SLOT', payload: { ...slot, status: 'confirmed' } })
    onClose()
  }
  const handleReject = () => {
    dispatch({ type: 'DELETE_SLOT', payload: slot.id })
    onClose()
  }
  const handleDelete = () => {
    dispatch({ type: 'DELETE_SLOT', payload: slot.id })
    onClose()
  }
  const handleToggleStop = () => {
    dispatch({ type: 'UPDATE_SLOT', payload: { ...slot, status: isStopped ? 'no-bookings' : 'stopped' } })
    onClose()
  }

  const dateStr = `${slot.start.getDate()} ${MONTHS_RU_GEN[slot.start.getMonth()]} ${slot.start.getFullYear()}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-[420px] max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">{slot.title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Tabs for fixed slots */}
        {isFixed && (
          <div className="flex border-b border-gray-100">
            {(['info', 'clients'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                {t === 'info' ? 'Основная информация' : 'Записавшиеся'}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {(tab === 'info' || isFree) && (
            <>
              <Row label="Дата">{dateStr}</Row>
              <Row label="Время">{fmtTime(slot.start)} – {fmtTime(slot.end)}</Row>
              {specialist && <Row label="Специалист">{specialist.name}</Row>}
              {isFree && slot.clientName && <Row label="Клиент">{slot.clientName}</Row>}
              {isFree && slot.clientPhone && <Row label="Телефон">{slot.clientPhone}</Row>}
              {isFree && slot.serviceType && <Row label="Вид работ">{slot.serviceType}</Row>}
              {isFixed && slot.capacity != null && (
                <Row label="Мест">{slot.booked} / {slot.capacity}</Row>
              )}
              <Row label="Статус">{STATUS_LABELS[slot.status] ?? slot.status}</Row>
            </>
          )}

          {tab === 'clients' && isFixed && (
            <div className="text-sm text-gray-500 text-center py-6">
              {(slot.booked ?? 0) === 0
                ? 'Пока никто не записался'
                : `${slot.booked} из ${slot.capacity} мест занято`
              }
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-between gap-2">
          <div className="flex gap-2">
            <button onClick={handleDelete} className="flex items-center gap-1 text-sm text-red-500 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors">
              <Trash2 size={14} />
              Удалить
            </button>
            {isFixed && (
              <button onClick={handleToggleStop} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100 transition-colors">
                {isStopped ? <><PlayCircle size={14} /> Возобновить</> : <><PauseCircle size={14} /> Остановить</>}
              </button>
            )}
          </div>
          <div className="flex gap-2">
            {canConfirm && (
              <>
                <button onClick={handleReject} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                  Отклонить
                </button>
                <button onClick={handleConfirm} className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                  Подтвердить
                </button>
              </>
            )}
            {!canConfirm && (
              <button onClick={onClose} className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                Сохранить
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <span className="text-sm text-gray-400 w-28 flex-shrink-0">{label}</span>
      <span className="text-sm text-gray-900">{children}</span>
    </div>
  )
}
