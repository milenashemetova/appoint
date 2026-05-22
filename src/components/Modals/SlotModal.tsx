import { useState, useEffect } from 'react'
import { X, Trash2 } from 'lucide-react'
import { useSchedule } from '../../context/ScheduleContext'
import { SERVICE_GROUPS } from '../../data/servicesData'

type RepeatMode = 'none' | 'daily' | 'weekly' | 'weekdays'

interface FormData {
  title: string
  startTime: string
  endTime: string
  capacity: string
  repeat: RepeatMode
  serviceTypeId: string
  specialistId: string
  spaceId: string
  customPrice: string
}

const toTimeStr = (d: Date) =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

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

  const makeForm = (): FormData => ({
    title: selectedSlot?.title ?? '',
    startTime: selectedSlot ? toTimeStr(selectedSlot.start) : createModalState ? toTimeStr(createModalState.startTime) : '09:00',
    endTime: selectedSlot ? toTimeStr(selectedSlot.end) : createModalState ? toTimeStr(createModalState.endTime) : '10:00',
    capacity: String(selectedSlot?.capacity ?? 5),
    repeat: 'none',
    serviceTypeId: '',
    specialistId: selectedSlot?.specialistId ?? createModalState?.columnKey ?? '',
    spaceId: selectedSlot?.spaceId ?? '',
    customPrice: '',
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
    const start = fromTimeStr(baseDate, form.startTime)
    const end = fromTimeStr(baseDate, form.endTime)
    if (isEdit && selectedSlot) {
      dispatch({
        type: 'UPDATE_SLOT',
        payload: { ...selectedSlot, title: form.title || selectedSlot.title, start, end, capacity: Number(form.capacity) || selectedSlot.capacity, specialistId: form.specialistId || selectedSlot.specialistId, spaceId: form.spaceId || selectedSlot.spaceId },
      })
    } else {
      const colKey = createModalState?.columnKey ?? ''
      dispatch({
        type: 'ADD_SLOT',
        payload: {
          id: `slot-${Date.now()}`,
          title: form.title || 'Новая услуга',
          type: 'fixed', status: 'no-bookings',
          specialistId: form.specialistId || (specialists.find(s => s.id === colKey)?.id),
          spaceId: form.spaceId || (spaces.find(s => s.id === colKey)?.id),
          start, end,
          capacity: Number(form.capacity) || 5, booked: 0,
        },
      })
    }
    close()
  }

  const allServices = SERVICE_GROUPS.flatMap(g => g.services)
  const selectedService = allServices.find(s => s.id === form.serviceTypeId)
  const servicePrice = selectedService?.price ?? null
  const showTabs = isEdit && selectedSlot?.type === 'fixed'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={close}>
      <div className="bg-white rounded-2xl shadow-2xl w-[480px] max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">{isEdit ? selectedSlot!.title : 'Новая услуга'}</h2>
          <button onClick={close} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        {showTabs && (
          <div className="flex border-b border-gray-100 px-6 flex-shrink-0">
            {(['info', 'clients'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`pb-3 mr-6 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === t ? 'border-green-500 text-green-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                {t === 'info' ? 'Основная информация' : 'Записавшиеся'}
              </button>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {(tab === 'info' || !showTabs) && <>

            {/* ОСНОВНОЕ */}
            <section>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Основное</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Название <span className="text-red-400">*</span></label>
                  <input value={form.title} onChange={e => set('title', e.target.value)}
                    placeholder="Напр. Хатха-йога (Утро)"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-colors" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {(['startTime', 'endTime'] as const).map((k, i) => (
                    <div key={k}>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">{i === 0 ? 'Начало' : 'Конец'} <span className="text-red-400">*</span></label>
                      <input type="time" value={form[k]} onChange={e => set(k, e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-colors" />
                    </div>
                  ))}
                </div>
                <div className="w-36">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Максимум мест</label>
                  <input type="number" value={form.capacity} onChange={e => set('capacity', e.target.value)} min={1}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-colors" />
                </div>
              </div>
            </section>

            {/* ПОВТОРЯЕМОСТЬ */}
            <section>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Повторяемость</p>
              <div className="flex flex-wrap gap-2">
                {REPEAT_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => set('repeat', opt.value)}
                    className={`px-3.5 py-1.5 rounded-full text-sm border transition-colors ${form.repeat === opt.value ? 'bg-green-50 border-green-400 text-green-700 font-medium' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </section>

            {/* РЕСУРСЫ */}
            <section>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Ресурсы</p>
              <div className="space-y-3">
                {[
                  { label: 'Вид работ', key: 'serviceTypeId' as const, isService: true },
                  { label: 'Специалист', key: 'specialistId' as const },
                  { label: 'Пространство', key: 'spaceId' as const },
                ].map(({ label, key, isService }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
                    <div className="relative">
                      <select value={form[key]} onChange={e => set(key, e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white appearance-none pr-8 cursor-pointer transition-colors">
                        <option value="">— не выбрано —</option>
                        {isService
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

            {/* ЦЕНООБРАЗОВАНИЕ */}
            <section>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Ценообразование</p>
              <button className="text-sm text-green-600 hover:text-green-700 transition-colors mb-4">Как складывается цена?</button>
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
                  className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-colors" />
              </div>
            </section>
          </>}

          {tab === 'clients' && showTabs && (
            <div className="text-center py-10 text-gray-400 text-sm">
              {(selectedSlot?.booked ?? 0) === 0 ? 'Пока никто не записался' : `${selectedSlot?.booked} из ${selectedSlot?.capacity} мест занято`}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            {isEdit && (
              <button onClick={() => { dispatch({ type: 'DELETE_SLOT', payload: selectedSlot!.id }); close() }}
                className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 px-2 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
                <Trash2 size={14} /> Удалить
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={close} className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">Отмена</button>
            <button onClick={save} className="px-4 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium">Сохранить</button>
          </div>
        </div>
      </div>
    </div>
  )
}
