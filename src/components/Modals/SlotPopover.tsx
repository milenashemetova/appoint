import { useState } from 'react'
import { Pencil, Trash2, Users, Clock, User, Box, RefreshCw, LayoutGrid, X } from 'lucide-react'
import type { Slot } from '../../types'
import type { SlotRect } from '../../context/ScheduleContext'
import { useSchedule } from '../../context/ScheduleContext'
import { fmtTime } from '../../utils/dateUtils'
import { getSlotStyle } from '../../utils/slotUtils'
import { SERVICE_GROUPS } from '../../data/servicesData'

const POPOVER_WIDTH = 300
const POPOVER_GAP = 8

function durationStr(slot: Slot): string {
  const mins = Math.round((slot.end.getTime() - slot.start.getTime()) / 60000)
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m} мин`
  if (m === 0) return `${h}ч`
  return `${h}ч ${m}мин`
}

const allServices = SERVICE_GROUPS.flatMap(g => g.services)

interface Props {
  slot: Slot
  rect: SlotRect
  onClose: () => void
  onEdit: () => void
}

export default function SlotPopover({ slot, rect, onClose, onEdit }: Props) {
  const { dispatch, specialists, spaces } = useSchedule()
  const style = getSlotStyle(slot)
  const [tab, setTab] = useState<'info' | 'clients'>('info')

  const specialist = specialists.find(s => s.id === slot.specialistId)
  const space = spaces.find(s => s.id === slot.spaceId)
  const serviceItem = allServices.find(s => s.id === slot.serviceType)

  // Position: prefer right of slot, fall back to left
  const rightPos = rect.x + rect.width + POPOVER_GAP
  const fitsRight = rightPos + POPOVER_WIDTH <= window.innerWidth - 12
  const left = fitsRight ? rightPos : rect.x - POPOVER_WIDTH - POPOVER_GAP
  const top = Math.max(8, Math.min(rect.y, window.innerHeight - 320))

  const handleDelete = () => {
    dispatch({ type: 'DELETE_SLOT', payload: slot.id })
    onClose()
  }

  const isFixed = slot.type === 'fixed'

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex flex-col"
        style={{ left, top, width: POPOVER_WIDTH }}
        onClick={e => e.stopPropagation()}
      >
        {/* Top color bar */}
        <div className="h-1 flex-shrink-0" style={{ backgroundColor: style.barColor }} />

        {/* Header */}
        <div className="px-4 pt-3 pb-2 flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900 text-sm leading-snug flex-1 min-w-0 truncate">
            {slot.title}
          </h3>
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <button
              onClick={onEdit}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={handleDelete}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
            >
              <Trash2 size={13} />
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
            >
              <X size={13} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-4">
          {(['info', 'clients'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-2 mr-5 text-xs font-medium border-b-2 -mb-px transition-colors ${
                tab === t ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {t === 'info' ? 'Об услуге' : 'Клиенты'}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="px-4 py-3 space-y-2.5">
          {tab === 'info' && (
            <>
              {/* Capacity */}
              {isFixed && slot.capacity != null && (
                <Row icon={<Users size={13} className="text-gray-400" />}>
                  {slot.booked ?? 0}/{slot.capacity} мест занято
                </Row>
              )}

              {/* Duration */}
              <Row icon={<Clock size={13} className="text-gray-400" />}>
                {fmtTime(slot.start)} – {fmtTime(slot.end)} · {durationStr(slot)}
              </Row>

              {/* Specialist */}
              {specialist && (
                <Row
                  icon={
                    <div
                      className="w-[13px] h-[13px] rounded-full flex items-center justify-center text-white flex-shrink-0"
                      style={{ backgroundColor: specialist.avatarColor, fontSize: '7px', fontWeight: 700 }}
                    >
                      {specialist.initials[0]}
                    </div>
                  }
                >
                  {specialist.name}
                </Row>
              )}

              {/* Client (for free/service slots) */}
              {!isFixed && slot.clientName && (
                <Row icon={<User size={13} className="text-gray-400" />}>
                  {slot.clientName}
                  {slot.clientPhone && <span className="ml-1 text-gray-400">{slot.clientPhone}</span>}
                </Row>
              )}

              {/* Space */}
              {space && (
                <Row icon={<Box size={13} className="text-gray-400" />}>
                  {space.name}
                </Row>
              )}

              {/* Service type */}
              {serviceItem && (
                <Row icon={<LayoutGrid size={13} className="text-gray-400" />}>
                  {serviceItem.name}
                </Row>
              )}
            </>
          )}

          {tab === 'clients' && (
            <div className="text-center py-6 text-gray-400 text-sm">
              {(slot.booked ?? 0) === 0
                ? 'Пока никто не записался'
                : `${slot.booked} из ${slot.capacity} мест занято`}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function Row({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-700">
      <span className="flex-shrink-0 w-4 flex items-center justify-center">{icon}</span>
      <span className="leading-snug">{children}</span>
    </div>
  )
}
