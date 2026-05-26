import { Check, X, Phone, User, Clock, Calendar } from 'lucide-react'
import { useSchedule } from '../../context/ScheduleContext'
import { SPECIALISTS } from '../../data/mockData'
import type { BookingRequest } from '../../types'

const STATUS_LABELS = {
  pending: { label: 'Ожидает', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400' },
  confirmed: { label: 'Подтверждено', bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-400' },
  rejected: { label: 'Отклонено', bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-400' },
}

const MONTHS_RU = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']

function fmtDate(d: Date) {
  return `${d.getDate()} ${MONTHS_RU[d.getMonth()]}, ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

function fmtDuration(min: number) {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m} мин`
  if (m === 0) return `${h}ч`
  return `${h}ч ${m}мин`
}

function RequestCard({ req }: { req: BookingRequest }) {
  const { dispatch } = useSchedule()
  const specialist = SPECIALISTS.find(s => s.id === req.specialistId)
  const st = STATUS_LABELS[req.status]
  const isPending = req.status === 'pending'

  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-4 flex flex-col gap-3 ${!isPending ? 'opacity-60' : ''}`}>
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full ${st.bg} ${st.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
              {st.label}
            </span>
          </div>
          <h3 className="font-semibold text-gray-900 text-sm">{req.serviceName}</h3>
        </div>
        {isPending && (
          <div className="flex gap-1.5 flex-shrink-0">
            <button
              onClick={() => dispatch({ type: 'CONFIRM_REQUEST', payload: req.id })}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-lg transition-colors"
            >
              <Check size={12} /> Подтвердить
            </button>
            <button
              onClick={() => dispatch({ type: 'REJECT_REQUEST', payload: req.id })}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-red-50 text-red-500 border border-red-200 text-xs font-medium rounded-lg transition-colors"
            >
              <X size={12} /> Отклонить
            </button>
          </div>
        )}
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-2">
        <Detail icon={<User size={12} />}>{req.clientName}</Detail>
        <Detail icon={<Phone size={12} />}>{req.clientPhone}</Detail>
        <Detail icon={<Calendar size={12} />}>{fmtDate(req.date)}</Detail>
        <Detail icon={<Clock size={12} />}>{fmtDuration(req.durationMin)}</Detail>
        {specialist && (
          <div className="col-span-2 flex items-center gap-1.5 text-xs text-gray-600">
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center text-white flex-shrink-0"
              style={{ backgroundColor: specialist.avatarColor, fontSize: '8px', fontWeight: 700 }}
            >
              {specialist.initials[0]}
            </span>
            {specialist.name}
          </div>
        )}
      </div>

      {req.note && (
        <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 leading-relaxed">
          💬 {req.note}
        </p>
      )}
    </div>
  )
}

function Detail({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-gray-600">
      <span className="text-gray-400 flex-shrink-0">{icon}</span>
      {children}
    </div>
  )
}

export default function RequestsPage() {
  const { state } = useSchedule()

  const pending = state.requests.filter(r => r.status === 'pending')
  const done = state.requests.filter(r => r.status !== 'pending')

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-gray-900">Заявки</h1>
          {pending.length > 0 && (
            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
              {pending.length} новых
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        {/* Pending */}
        {pending.length > 0 && (
          <section>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Ожидают подтверждения</p>
            <div className="grid grid-cols-1 gap-3 max-w-2xl">
              {pending.map(r => <RequestCard key={r.id} req={r} />)}
            </div>
          </section>
        )}

        {/* Done */}
        {done.length > 0 && (
          <section>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Обработанные</p>
            <div className="grid grid-cols-1 gap-3 max-w-2xl">
              {done.map(r => <RequestCard key={r.id} req={r} />)}
            </div>
          </section>
        )}

        {state.requests.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-2">
            <div className="text-4xl">📭</div>
            <div className="text-sm font-medium">Нет заявок</div>
          </div>
        )}
      </div>
    </div>
  )
}
