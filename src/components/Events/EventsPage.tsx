import { CalendarDays, User, Users } from 'lucide-react'
import { useSchedule } from '../../context/ScheduleContext'
import { SPECIALISTS } from '../../data/mockData'
import { getSlotStyle } from '../../utils/slotUtils'

const MONTHS_RU = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']
const WEEKDAYS_RU = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб']

function fmtDate(d: Date) {
  return `${d.getDate()} ${MONTHS_RU[d.getMonth()]} · ${WEEKDAYS_RU[d.getDay()]}`
}
function fmtTime(d: Date) {
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}
function fmtDur(start: Date, end: Date) {
  const m = Math.round((end.getTime() - start.getTime()) / 60000)
  const h = Math.floor(m / 60); const r = m % 60
  return h === 0 ? `${r} мин` : r === 0 ? `${h}ч` : `${h}ч ${r}мин`
}

const STATUS_LABELS: Record<string, string> = {
  'no-bookings': 'Нет записей', 'has-bookings': 'Есть записи',
  'full': 'Заполнено', 'stopped': 'Остановлено',
  'waiting': 'Ожидание', 'new': 'Новая', 'confirmed': 'Подтверждено',
}

export default function EventsPage() {
  const { state } = useSchedule()

  const events = state.slots.filter(s => s.type === 'fixed').sort((a, b) => a.start.getTime() - b.start.getTime())
  const services = state.slots.filter(s => s.type === 'free').sort((a, b) => a.start.getTime() - b.start.getTime())

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100">
        <h1 className="text-2xl font-semibold text-gray-900">Услуги и события</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Events (fixed) */}
        {events.length > 0 && (
          <Section title="События (групповые)" count={events.length}>
            {/* Table header */}
            <div className="flex items-center px-6 py-2 border-b border-gray-100 bg-gray-50/60">
              <div className="flex-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">Название</div>
              <div className="w-40 text-xs font-semibold text-gray-500 uppercase tracking-wide">Дата</div>
              <div className="w-32 text-xs font-semibold text-gray-500 uppercase tracking-wide">Время</div>
              <div className="w-24 text-xs font-semibold text-gray-500 uppercase tracking-wide">Длит.</div>
              <div className="w-28 text-xs font-semibold text-gray-500 uppercase tracking-wide">Места</div>
              <div className="w-36 text-xs font-semibold text-gray-500 uppercase tracking-wide">Специалист</div>
              <div className="w-28 text-xs font-semibold text-gray-500 uppercase tracking-wide">Статус</div>
            </div>
            {events.map(slot => {
              const style = getSlotStyle(slot)
              const specialist = SPECIALISTS.find(s => s.id === slot.specialistId)
              return (
                <div key={slot.id} className="flex items-center px-6 py-3 border-b border-gray-50 hover:bg-gray-50/70 transition-colors">
                  <div className="flex-1 flex items-center gap-2 min-w-0">
                    <span className="w-1 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: style.barColor }} />
                    <span className="text-sm text-gray-900 font-medium truncate">{slot.title}</span>
                  </div>
                  <div className="w-40 text-sm text-gray-600">{fmtDate(slot.start)}</div>
                  <div className="w-32 text-sm text-gray-600">{fmtTime(slot.start)}–{fmtTime(slot.end)}</div>
                  <div className="w-24 text-sm text-gray-500">{fmtDur(slot.start, slot.end)}</div>
                  <div className="w-28 flex items-center gap-1 text-sm text-gray-600">
                    <Users size={13} className="text-gray-400" />
                    {slot.booked ?? 0}/{slot.capacity ?? '—'}
                  </div>
                  <div className="w-36">
                    {specialist ? (
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full flex items-center justify-center text-white flex-shrink-0"
                          style={{ backgroundColor: specialist.avatarColor, fontSize: '8px', fontWeight: 700 }}>
                          {specialist.initials[0]}
                        </span>
                        <span className="text-xs text-gray-700 truncate">{specialist.name}</span>
                      </div>
                    ) : <span className="text-xs text-gray-400">—</span>}
                  </div>
                  <div className="w-28">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium"
                      style={{ backgroundColor: style.bgColor, color: style.textColor }}>
                      {STATUS_LABELS[slot.status] ?? slot.status}
                    </span>
                  </div>
                </div>
              )
            })}
          </Section>
        )}

        {/* Services (free) */}
        {services.length > 0 && (
          <Section title="Услуги (индивидуальные)" count={services.length}>
            <div className="flex items-center px-6 py-2 border-b border-gray-100 bg-gray-50/60">
              <div className="flex-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">Название</div>
              <div className="w-40 text-xs font-semibold text-gray-500 uppercase tracking-wide">Дата</div>
              <div className="w-32 text-xs font-semibold text-gray-500 uppercase tracking-wide">Время</div>
              <div className="w-36 text-xs font-semibold text-gray-500 uppercase tracking-wide">Клиент</div>
              <div className="w-36 text-xs font-semibold text-gray-500 uppercase tracking-wide">Специалист</div>
              <div className="w-28 text-xs font-semibold text-gray-500 uppercase tracking-wide">Статус</div>
            </div>
            {services.map(slot => {
              const style = getSlotStyle(slot)
              const specialist = SPECIALISTS.find(s => s.id === slot.specialistId)
              return (
                <div key={slot.id} className="flex items-center px-6 py-3 border-b border-gray-50 hover:bg-gray-50/70 transition-colors">
                  <div className="flex-1 flex items-center gap-2 min-w-0">
                    <span className="w-1 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: style.barColor }} />
                    <span className="text-sm text-gray-900 font-medium truncate">{slot.title}</span>
                  </div>
                  <div className="w-40 text-sm text-gray-600">{fmtDate(slot.start)}</div>
                  <div className="w-32 text-sm text-gray-600">{fmtTime(slot.start)}–{fmtTime(slot.end)}</div>
                  <div className="w-36">
                    {slot.clientName ? (
                      <div className="flex items-center gap-1 text-sm text-gray-700">
                        <User size={12} className="text-gray-400 flex-shrink-0" />
                        <span className="truncate">{slot.clientName}</span>
                      </div>
                    ) : <span className="text-xs text-gray-400">—</span>}
                  </div>
                  <div className="w-36">
                    {specialist ? (
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full flex items-center justify-center text-white flex-shrink-0"
                          style={{ backgroundColor: specialist.avatarColor, fontSize: '8px', fontWeight: 700 }}>
                          {specialist.initials[0]}
                        </span>
                        <span className="text-xs text-gray-700 truncate">{specialist.name}</span>
                      </div>
                    ) : <span className="text-xs text-gray-400">—</span>}
                  </div>
                  <div className="w-28">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium"
                      style={{ backgroundColor: style.bgColor, color: style.textColor }}>
                      {STATUS_LABELS[slot.status] ?? slot.status}
                    </span>
                  </div>
                </div>
              )
            })}
          </Section>
        )}

        {events.length === 0 && services.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-2">
            <CalendarDays size={36} className="text-gray-300" />
            <div className="text-sm font-medium">Нет услуг и событий</div>
            <div className="text-xs">Создайте первое событие через расписание</div>
          </div>
        )}
      </div>
    </div>
  )
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div>
      <div className="px-6 py-3 flex items-center gap-2">
        <span className="text-sm font-semibold text-gray-700">{title}</span>
        <span className="text-xs text-gray-400">({count})</span>
      </div>
      {children}
    </div>
  )
}
