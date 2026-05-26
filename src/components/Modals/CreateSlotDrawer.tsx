import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useSchedule } from '../../context/ScheduleContext'
import { SERVICE_GROUPS } from '../../data/servicesData'

type DrawerTab = 'free' | 'fixed'
type RepeatMode = 'none' | 'daily' | 'weekly' | 'weekdays'

interface Form {
  title: string
  startTime: string
  endTime: string
  capacity: string
  repeat: RepeatMode
  serviceTypeId: string
  specialistId: string
  spaceId: string
  clientName: string
  clientPhone: string
  description: string
  customPrice: string
}

const REPEAT_OPTIONS: { value: RepeatMode; label: string }[] = [
  { value: 'none',     label: 'Не повторять' },
  { value: 'daily',    label: 'Каждый день' },
  { value: 'weekly',   label: 'Каждую неделю' },
  { value: 'weekdays', label: 'По будням' },
]

const BREAK_OPTIONS = ['Без перерыва', '5 мин', '10 мин', '15 мин', '30 мин']

const toTimeStr = (d: Date) =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

const allServices = SERVICE_GROUPS.flatMap(g => g.services)

interface Props { onClose: () => void }

export default function CreateSlotDrawer({ onClose }: Props) {
  const { state, dispatch, specialists, spaces } = useSchedule()
  const cms = state.createModalState!

  const [tab, setTab] = useState<DrawerTab>(cms.slotType ?? 'fixed')
  const [form, setForm] = useState<Form>({
    title: '',
    startTime: toTimeStr(cms.startTime),
    endTime: toTimeStr(cms.endTime),
    capacity: '10',
    repeat: 'none',
    serviceTypeId: '',
    specialistId: cms.columnKey && specialists.find(s => s.id === cms.columnKey) ? cms.columnKey : '',
    spaceId: cms.columnKey && spaces.find(s => s.id === cms.columnKey) ? cms.columnKey : '',
    clientName: '',
    clientPhone: '',
    description: '',
    customPrice: '',
  })

  useEffect(() => {
    setTab(cms.slotType ?? 'fixed')
  }, [cms.slotType])

  const set = (k: keyof Form, v: string) => setForm(f => ({ ...f, [k]: v }))

  const selectedService = allServices.find(s => s.id === form.serviceTypeId)
  const servicePrice = selectedService?.price ?? null

  const save = () => {
    const base = new Date(cms.startTime)
    const [sh, sm] = form.startTime.split(':').map(Number)
    const [eh, em] = form.endTime.split(':').map(Number)
    const start = new Date(base); start.setHours(sh, sm, 0, 0)
    const end = new Date(base); end.setHours(eh, em, 0, 0)

    const title = form.title || selectedService?.name || (tab === 'free' ? 'Новая услуга' : 'Новое событие')

    dispatch({
      type: 'ADD_SLOT',
      payload: {
        id: `slot-${Date.now()}`,
        title,
        type: tab,
        status: tab === 'free' ? 'new' : 'no-bookings',
        specialistId: form.specialistId || undefined,
        spaceId: tab === 'fixed' ? (form.spaceId || undefined) : undefined,
        start, end,
        capacity: tab === 'fixed' ? (Number(form.capacity) || 10) : undefined,
        booked: 0,
        clientName: tab === 'free' ? (form.clientName || undefined) : undefined,
        clientPhone: tab === 'free' ? (form.clientPhone || undefined) : undefined,
        serviceType: form.serviceTypeId || undefined,
      },
    })
    onClose()
  }

  const inputCls = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 bg-white transition-colors'
  const selectCls = `${inputCls} appearance-none cursor-pointer pr-8`
  const labelCls = 'block text-xs font-medium text-gray-500 mb-1'

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-[380px] bg-white shadow-2xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            {tab === 'free' ? 'Новая услуга' : 'Новое событие'}
          </h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Type tabs */}
        <div className="flex border-b border-gray-100 px-5 flex-shrink-0">
          {(['free', 'fixed'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-2.5 mr-5 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === t ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
            >
              {t === 'free' ? 'Услуга' : 'Событие'}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {/* ── Common: title & time ──────────────────────────────── */}
          <section className="space-y-3">
            <div>
              <label className={labelCls}>Название</label>
              <input
                value={form.title}
                onChange={e => set('title', e.target.value)}
                placeholder={tab === 'free' ? 'Массаж спины' : 'Хатха-йога (Утро)'}
                className={inputCls}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Начало <span className="text-red-400">*</span></label>
                <input type="time" value={form.startTime} onChange={e => set('startTime', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Конец <span className="text-red-400">*</span></label>
                <input type="time" value={form.endTime} onChange={e => set('endTime', e.target.value)} className={inputCls} />
              </div>
            </div>
          </section>

          {/* ── Event-specific fields ─────────────────────────────── */}
          {tab === 'fixed' && (
            <section className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Максимум мест</label>
                  <input type="number" min={1} value={form.capacity} onChange={e => set('capacity', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Перерыв после записи</label>
                  <div className="relative">
                    <select className={selectCls} defaultValue="Без перерыва">
                      {BREAK_OPTIONS.map(o => <option key={o}>{o}</option>)}
                    </select>
                    <Chevron />
                  </div>
                </div>
              </div>

              <div>
                <label className={labelCls}>Повторяемость</label>
                <div className="relative">
                  <select value={form.repeat} onChange={e => set('repeat', e.target.value as RepeatMode)} className={selectCls}>
                    {REPEAT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <Chevron />
                </div>
              </div>

              <div>
                <label className={labelCls}>Описание</label>
                <textarea
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  placeholder="Расскажите клиентам об этой услуге"
                  rows={3}
                  className={`${inputCls} resize-none`}
                />
              </div>
            </section>
          )}

          {/* ── Service client fields ─────────────────────────────── */}
          {tab === 'free' && (
            <section className="space-y-3">
              <div>
                <label className={labelCls}>Имя клиента</label>
                <input value={form.clientName} onChange={e => set('clientName', e.target.value)} placeholder="Иван Иванов" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Телефон</label>
                <input value={form.clientPhone} onChange={e => set('clientPhone', e.target.value)} placeholder="+7 (999) 000-00-00" className={inputCls} />
              </div>
            </section>
          )}

          {/* ── Resources ─────────────────────────────────────────── */}
          <section>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Ресурсы</p>
            <div className="space-y-3">
              <div>
                <label className={labelCls}>Вид работ</label>
                <div className="relative">
                  <select
                    value={form.serviceTypeId}
                    onChange={e => {
                      const svc = allServices.find(s => s.id === e.target.value)
                      setForm(f => ({ ...f, serviceTypeId: e.target.value, title: f.title || svc?.name || '' }))
                    }}
                    className={selectCls}
                  >
                    <option value="">— не выбрано —</option>
                    {SERVICE_GROUPS.map(g => (
                      <optgroup key={g.id} label={g.name}>
                        {g.services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </optgroup>
                    ))}
                  </select>
                  <Chevron />
                </div>
              </div>

              <div>
                <label className={labelCls}>Специалист</label>
                <div className="relative">
                  <select value={form.specialistId} onChange={e => set('specialistId', e.target.value)} className={selectCls}>
                    <option value="">— не выбрано —</option>
                    {specialists.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <Chevron />
                </div>
              </div>

              {tab === 'fixed' && (
                <div>
                  <label className={labelCls}>Пространство</label>
                  <div className="relative">
                    <select value={form.spaceId} onChange={e => set('spaceId', e.target.value)} className={selectCls}>
                      <option value="">— не выбрано —</option>
                      {spaces.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <Chevron />
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ── Pricing ───────────────────────────────────────────── */}
          <section>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Ценообразование</p>
            <button className="text-xs text-blue-500 hover:text-blue-600 mb-3 transition-colors">Как складывается цена?</button>
            <div className="relative">
              <input
                value={form.customPrice || (servicePrice ? String(servicePrice) : '')}
                onChange={e => set('customPrice', e.target.value)}
                placeholder="Цена, ₽"
                className={inputCls}
              />
              {servicePrice && !form.customPrice && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">авто</span>
              )}
            </div>
            {servicePrice && (
              <p className="text-[11px] text-gray-400 mt-1.5">Цена складывается автоматически из выбранных ресурсов</p>
            )}
          </section>

        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-5 py-4 flex items-center justify-end gap-3 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
            Отменить
          </button>
          <button onClick={save} className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium">
            {tab === 'free' ? 'Записать' : 'Создать'}
          </button>
        </div>
      </div>
    </>
  )
}

function Chevron() {
  return (
    <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
      <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
        <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
  )
}
