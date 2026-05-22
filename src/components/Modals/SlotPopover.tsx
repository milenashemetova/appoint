import { X, Pencil, Trash2, Clock, Users } from 'lucide-react'
import type { Slot } from '../../types'
import type { SlotRect } from '../../context/ScheduleContext'
import { useSchedule } from '../../context/ScheduleContext'
import { fmtTime } from '../../utils/dateUtils'
import { getSlotStyle } from '../../utils/slotUtils'

const POPOVER_WIDTH = 272
const POPOVER_GAP = 10

const STATUS_LABELS: Record<string, string> = {
  'no-bookings': 'Нет записей',
  'has-bookings': 'Есть записи',
  'full': 'Мест нет',
  'stopped': 'Остановлено',
  'waiting': 'Ожидание',
  'new': 'Новая',
  'confirmed': 'Подтверждено',
}

interface Props {
  slot: Slot
  rect: SlotRect
  onClose: () => void
  onEdit: () => void
}

export default function SlotPopover({ slot, rect, onClose, onEdit }: Props) {
  const { dispatch, specialists, spaces } = useSchedule()
  const style = getSlotStyle(slot)

  const specialist = specialists.find(s => s.id === slot.specialistId)
  const space = spaces.find(s => s.id === slot.spaceId)

  // Position: prefer right of slot, fall back to left
  const rightPos = rect.x + rect.width + POPOVER_GAP
  const fitsRight = rightPos + POPOVER_WIDTH <= window.innerWidth - 12
  const left = fitsRight ? rightPos : rect.x - POPOVER_WIDTH - POPOVER_GAP
  const top = Math.max(8, Math.min(rect.y, window.innerHeight - 260))

  const handleDelete = () => {
    dispatch({ type: 'DELETE_SLOT', payload: slot.id })
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
        style={{ left, top, width: POPOVER_WIDTH }}
        onClick={e => e.stopPropagation()}
      >
        {/* Color accent strip */}
        <div className={`h-1 ${style.border.replace('border-l-', 'bg-')}`} />

        {/* Header */}
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-sm leading-snug truncate">{slot.title}</h3>
              <div className={`inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${style.bg} ${style.text}`}>
                {STATUS_LABELS[slot.status] ?? slot.status}
              </div>
            </div>
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <button
                onClick={onEdit}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                title="Редактировать"
              >
                <Pencil size={13} />
              </button>
              <button
                onClick={handleDelete}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                title="Удалить"
              >
                <Trash2 size={13} />
              </button>
              <button
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
                title="Закрыть"
              >
                <X size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="px-4 pb-4 space-y-2.5">
          {/* Time */}
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Clock size={13} className="text-gray-400 flex-shrink-0" />
            <span>{fmtTime(slot.start)} – {fmtTime(slot.end)}</span>
          </div>

          {/* Capacity */}
          {slot.type === 'fixed' && slot.capacity != null && (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Users size={13} className="text-gray-400 flex-shrink-0" />
              <span>{slot.booked ?? 0} из {slot.capacity} мест занято</span>
            </div>
          )}

          {/* Specialist */}
          {specialist && (
            <div className="flex items-center gap-2">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
                style={{ backgroundColor: specialist.avatarColor }}
              >
                {specialist.initials[0]}
              </div>
              <span className="text-sm text-gray-700">{specialist.name}</span>
            </div>
          )}

          {/* Space */}
          {space && (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <div className="w-5 h-5 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                <span className="text-[9px] font-bold text-gray-500">П</span>
              </div>
              <span>{space.name}</span>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
