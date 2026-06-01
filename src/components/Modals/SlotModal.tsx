import { useState, useEffect } from 'react'
import { X, Trash2, User } from 'lucide-react'
import { useSchedule } from '../../context/ScheduleContext'
import { SERVICE_GROUPS } from '../../data/servicesData'

type RepeatMode = 'none' | 'daily' | 'weekly' | 'weekdays'

interface FormData {
  title: string
  startDate: string
  startTime: string
  endTime: string
  capacity: string
  repeat: RepeatMode
  serviceTypeId: string
  specialistId: string
  spaceId: string
  customPrice: string
  clientName: string
  clientPhone: string
}

const toTimeStr = (d: Date) =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

const toDateStr = (d: Date) => d.toISOString().slice(0, 10)

const fromTimeStr = (base: Date, t: string): Date => {
  const [h, m] = t.split(':').map(Number)
  const d = new Date(base)
  d.setHours(h, m, 0, 0)
  return d
}

const REPEAT_OPTIONS: { value: RepeatMode; label: string }[] = [
  { value: 'none', label: 'Не повторять' },
  { value: 'daily', label: 'Каждый день' },
  { value: 'weekly', label: 'Каждую неделю' },
  { value: 'weekdays', label: 'По будням' },
]


interface SlotModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SlotModal({ isOpen, onClose }: SlotModalProps) {
  const { state, dispatch, specialists, spaces } = useSchedule()
  const { selectedSlot, createModalState } = state

  const isEdit = !!selectedSlot
  const baseDate = selectedSlot?.start ?? createModalState?.startTime ?? new Date()

  // Resolve which type we're creating/editing
  const resolvedType: 'fixed' | 'free' = isEdit
    ? (selectedSlot?.type ?? 'fixed')
    : (createModalState?.slotType ?? 'fixed')
  const isService = resolvedType === 'free'

  const makeForm = (): FormData => ({
    title: selectedSlot?.title ?? '',
    startDate: toDateStr(baseDate),
    startTime: selectedSlot ? toTimeStr(selectedSlot.start) : createModalState ? toTimeStr(createModalState.startTime) : '09:00',
    endTime: selectedSlot ? toTimeStr(selectedSlot.end) : createModalState ? toTimeStr(createModalState.endTime) : '10:00',
    capacity: String(selectedSlot?.capacity ?? 5),
    repeat: 'none',
    serviceTypeId: selectedSlot?.serviceType ?? '',
    specialistId: selectedSlot?.specialistId ?? createModalState?.columnKey ?? '',
    spaceId: selectedSlot?.spaceId ?? '',
    customPrice: '',
    clientName: selectedSlot?.clientName ?? '',
    clientPhone: selectedSlot?.clientPhone ?? '',
  })

  const [tab, setTab] = useState<'info' | 'clients'>('info')
  const [form, setForm] = useState<FormData>(makeForm)

  useEffect(() => {
    if (isOpen) { setForm(makeForm()); setTab('info') }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSlot?.id, createModalState?.startTime?.getTime()])

  if (!isOpen) return null

  const set = (k: keyof FormData, v: string) => setForm(f => ({ ...f, [k]: v }))

  const close = () => onClose()

  const save = () => {
    const dateParts = form.startDate.split('-').map(Number)
    const baseD = new Date(dateParts[0], dateParts[1] - 1, dateParts[2])
    const start = fromTimeStr(baseD, form.startTime)
    const end = fromTimeStr(baseD, form.endTime)

    if (isEdit && selectedSlot) {
      dispatch({
        type: 'UPDATE_SLOT',
        payload: {
          ...selectedSlot,
          title: form.title || selectedSlot.title,
          start, end,
          capacity: isService ? undefined : (Number(form.capacity) || selectedSlot.capacity),
          specialistId: form.specialistId || selectedSlot.specialistId,
          spaceId: isService ? undefined : (form.spaceId || selectedSlot.spaceId),
          clientName: isService ? form.clientName : undefined,
          clientPhone: isService ? form.clientPhone : undefined,
          serviceType: form.serviceTypeId || undefined,
        },
      })
    } else {
      const colKey = createModalState?.columnKey ?? ''
      const specId = form.specialistId || specialists.find(s => s.id === colKey)?.id
      const spaceId = form.spaceId || spaces.find(s => s.id === colKey)?.id

      const allServices = SERVICE_GROUPS.flatMap(g => g.services)
      const svc = allServices.find(s => s.id === form.serviceTypeId)
      const title = form.title || svc?.name || (isService ? 'Новая услуга' : 'Новое событие')

      dispatch({
        type: 'ADD_SLOT',
        payload: {
          id: `slot-${Date.now()}`,
          title,
          type: resolvedType,
          status: isService ? 'new' : 'no-bookings',
          specialistId: specId,
          spaceId: isService ? undefined : spaceId,
          start, end,
          capacity: isService ? undefined : (Number(form.capacity) || 5),
          booked: 0,
          clientName: isService ? (form.clientName || undefined) : undefined,
          clientPhone: isService ? (form.clientPhone || undefined) : undefined,
          serviceType: form.serviceTypeId || undefined,
        },
      })
    }
    close()
  }

  const allServices = SERVICE_GROUPS.flatMap(g => g.services)
  const selectedService = allServices.find(s => s.id === form.serviceTypeId)
  const servicePrice = selectedService?.price ?? null
  const showTabs = isEdit && !isService

  const accentColor = isService ? 'green' : 'blue'
  const tabActiveClass = isService
    ? 'border-green-500 text-green-600'
    : 'border-blue-500 text-blue-600'
  const saveBtnClass = isService
    ? 'bg-green-500 hover:bg-green-600'
    : 'bg-blue-500 hover:bg-blue-600'

  const modalTitle = isEdit
    ? selectedSlot!.title
    : isService ? 'Новая услуга' : 'Новое событие'

  const inputCls = `w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-${accentColor}-100 focus:border-${accentColor}-400 transition-colors`
  const sectionLabel = 'text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={close}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-[480px] max-h-[90vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            {isService && (
              <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center">
                <User size={14} className="text-green-600" />
              </div>
            )}
            <h2 className="text-lg font-semibold text-gray-900">{modalTitle}</h2>
          </div>
          <button onClick={close} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Tabs (only for editing fixed events) */}
        {showTabs && (
          <div className="flex border-b border-gray-100 px-6 flex-shrink-0">
            {(['info', 'clients'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`pb-3 mr-6 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === t ? tabActiveClass : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                {t === 'info' ? 'Основная информация' : 'Записавшиеся'}
              </button>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {(tab === 'info' || !showTabs) && (
            isService ? (
              // ── Service form ──────────────────────────────────────────────
              <>
                <section>
                  <p className={sectionLabel}>Услуга</p>
                  <div className="space-y-3">
                    {/* Service type selector */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Вид работ <span className="text-red-400">*</span></label>
                      <div className="relative">
                        <select value={form.serviceTypeId} onChange={e => {
                          const svc = allServices.find(s => s.id === e.target.value)
                          setForm(f => ({ ...f, serviceTypeId: e.target.value, title: svc?.name ?? f.title }))
                        }}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-400 bg-white appearance-none pr-8 cursor-pointer transition-colors">
                          <option value="">— выбрать услугу —</option>
                          {SERVICE_GROUPS.map(g => (
                            <optgroup key={g.id} label={g.name}>
                              {g.services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </optgroup>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                          <svg width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                        </div>
                      </div>
                    </div>

                    {/* Specialist */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Специалист</label>
                      <div className="relative">
                        <select value={form.specialistId} onChange={e => set('specialistId', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-400 bg-white appearance-none pr-8 cursor-pointer transition-colors">
                          <option value="">— не выбрано —</option>
                          {specialists.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                          <svg width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <p className={sectionLabel}>Дата и время</p>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Дата</label>
                      <input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)}
                        className={inputCls} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {(['startTime', 'endTime'] as const).map((k, i) => (
                        <div key={k}>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">{i === 0 ? 'Начало' : 'Конец'} <span className="text-red-400">*</span></label>
                          <input type="time" value={form[k]} onChange={e => set(k, e.target.value)} className={inputCls} />
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                <section>
                  <p className={sectionLabel}>Клиент</p>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Имя клиента</label>
                      <input value={form.clientName} onChange={e => set('clientName', e.target.value)}
                        placeholder="Иван Иванов"
                        className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Телефон</label>
                      <input value={form.clientPhone} onChange={e => set('clientPhone', e.target.value)}
                        placeholder="+7 (999) 000-00-00"
                        className={inputCls} />
                    </div>
                  </div>
                </section>

                {/* Price summary */}
                {servicePrice && (
                  <section>
                    <p className={sectionLabel}>Стоимость</p>
                    <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center justify-between">
                      <span className="text-sm text-gray-600">{selectedService?.name}</span>
                      <span className="text-sm font-semibold text-gray-900">{servicePrice.toLocaleString('ru-RU')} ₽</span>
                    </div>
                  </section>
                )}
              </>
            ) : (
              // ── Event form ────────────────────────────────────────────────
              <>
                <section>
                  <p className={sectionLabel}>Основное</p>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Название <span className="text-red-400">*</span></label>
                      <input value={form.title} onChange={e => set('title', e.target.value)}
                        placeholder="Напр. Хатха-йога (Утро)"
                        className={inputCls} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {(['startTime', 'endTime'] as const).map((k, i) => (
                        <div key={k}>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">{i === 0 ? 'Начало' : 'Конец'} <span className="text-red-400">*</span></label>
                          <input type="time" value={form[k]} onChange={e => set(k, e.target.value)} className={inputCls} />
                        </div>
                      ))}
                    </div>
                    <div className="w-36">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Максимум мест</label>
                      <input type="number" value={form.capacity} onChange={e => set('capacity', e.target.value)} min={1} className={inputCls} />
                    </div>
                  </div>
                </section>

                <section>
                  <p className={sectionLabel}>Повторяемость</p>
                  <div className="flex flex-wrap gap-2">
                    {REPEAT_OPTIONS.map(opt => (
                      <button key={opt.value} onClick={() => set('repeat', opt.value)}
                        className={`px-3.5 py-1.5 rounded-full text-sm border transition-colors ${form.repeat === opt.value ? 'bg-blue-50 border-blue-400 text-blue-700 font-medium' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                  <p className={sectionLabel}>Ресурсы</p>
                  <div className="space-y-3">
                    {[
                      { label: 'Вид работ', key: 'serviceTypeId' as const, isService: true },
                      { label: 'Специалист', key: 'specialistId' as const },
                      { label: 'Пространство', key: 'spaceId' as const },
                    ].map(({ label, key, isService: isSvc }) => (
                      <div key={key}>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
                        <div className="relative">
                          <select value={form[key]} onChange={e => set(key, e.target.value)}
                            className={`${inputCls} appearance-none pr-8 bg-white cursor-pointer`}>
                            <option value="">— не выбрано —</option>
                            {isSvc
                              ? SERVICE_GROUPS.map(g => (
                                  <optgroup key={g.id} label={g.name}>
                                    {g.services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                  </optgroup>
                                ))
                              : key === 'specialistId'
                              ? specialists.map(s => <option key={s.id} value={s.id}>{s.name}</option>)
                              : spaces.map(s => <option key={s.id} value={s.id}>{s.name}</option>)
                            }
                          </select>
                          <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                            <svg width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <p className={sectionLabel}>Ценообразование</p>
                  <button className="text-sm text-blue-600 hover:text-blue-700 transition-colors mb-4">Как складывается цена?</button>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <table className="w-full">
                      <tbody className="text-sm divide-y divide-gray-100">
                        {[
                          ['Вид работ', servicePrice ? `${servicePrice.toLocaleString('ru-RU')} ₽` : '—'],
                          ['Коэффициент специалиста', '×1'],
                          ['Пространство', '—'],
                        ].map(([label, val]) => (
                          <tr key={label}>
                            <td className="py-2 text-gray-600">{label}</td>
                            <td className="py-2 text-right text-gray-900">{val}</td>
                          </tr>
                        ))}
                        <tr className="font-semibold">
                          <td className="pt-3 text-gray-900">Итого</td>
                          <td className="pt-3 text-right text-gray-900">{servicePrice ? `${servicePrice.toLocaleString('ru-RU')} ₽` : '—'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-sm text-gray-600 whitespace-nowrap">Своя цена:</span>
                    <input value={form.customPrice} onChange={e => set('customPrice', e.target.value)}
                      placeholder="Оставить автоматически"
                      className={inputCls} />
                  </div>
                </section>
              </>
            )
          )}

          {tab === 'clients' && showTabs && (
            <div className="text-center py-10 text-gray-400 text-sm">
              {(selectedSlot?.booked ?? 0) === 0
                ? 'Пока никто не записался'
                : `${selectedSlot?.booked} из ${selectedSlot?.capacity} мест занято`}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            {isEdit && (
              <button
                onClick={() => { dispatch({ type: 'DELETE_SLOT', payload: selectedSlot!.id }); close() }}
                className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 px-2 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 size={14} /> Удалить
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={close} className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
              Отмена
            </button>
            <button onClick={save} className={`px-4 py-2 text-sm text-white rounded-lg transition-colors font-medium ${saveBtnClass}`}>
              {isEdit ? 'Сохранить' : isService ? 'Записать' : 'Создать'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
