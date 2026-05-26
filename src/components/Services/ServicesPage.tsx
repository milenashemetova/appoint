import { useState } from 'react'
import { ChevronRight, ChevronDown, Search, GripVertical, MoreHorizontal, X } from 'lucide-react'
import { SERVICE_GROUPS } from '../../data/servicesData'
import { SPECIALISTS } from '../../data/mockData'

function SpecialistAvatars({ ids }: { ids: string[] }) {
  const shown = ids.slice(0, 3)
  const extra = ids.length - shown.length
  return (
    <div className="flex items-center">
      {shown.map((id, i) => {
        const sp = SPECIALISTS.find(s => s.id === id)
        if (!sp) return null
        return (
          <div
            key={id}
            title={sp.name}
            className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
            style={{ backgroundColor: sp.avatarColor, marginLeft: i > 0 ? '-8px' : 0, zIndex: shown.length - i }}
          >
            {sp.initials[0]}
          </div>
        )
      })}
      {extra > 0 && (
        <div
          className="w-7 h-7 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-gray-600 text-[10px] font-semibold flex-shrink-0"
          style={{ marginLeft: '-8px', zIndex: 0 }}
        >
          +{extra}
        </div>
      )}
    </div>
  )
}

export default function ServicesPage() {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['yoga']))
  const [search, setSearch] = useState('')

  const toggleGroup = (id: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const filtered = SERVICE_GROUPS.map(g => ({
    ...g,
    services: g.services.filter(s =>
      search === '' || s.name.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter(g => g.services.length > 0)

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-white rounded-xl border border-slate-200 overflow-hidden">

      {/* Page header */}
      <div className="flex items-center justify-between px-6 py-3">
        <h1 className="text-2xl font-semibold text-gray-900">Виды работ</h1>
        <button className="flex items-center gap-1 px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors">
          Создать
          <ChevronDown size={14} className="ml-0.5" />
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 px-6 pb-4 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по названию, цене"
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 placeholder-gray-400"
          />
        </div>

        {/* Status dropdown */}
        <button className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
          Действующие
          <ChevronDown size={13} className="text-gray-400" />
        </button>

        {/* Filter chips */}
        <button className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
          Подкатегория
          <X size={12} className="text-gray-400 ml-0.5" />
        </button>
        <button className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
          Цена
          <X size={12} className="text-gray-400 ml-0.5" />
        </button>
        <button className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
          Ас
          <ChevronDown size={13} className="text-gray-400" />
        </button>

        <div className="flex-1" />

        <button className="px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
          Новая группа
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        {/* Table header */}
        <div className="flex items-center px-6 py-2 border-t border-b border-gray-100 bg-gray-50/50">
          <div className="w-8 flex-shrink-0" /> {/* drag handle col */}
          <div className="flex-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">Название</div>
          <div className="w-36 text-xs font-semibold text-gray-500 uppercase tracking-wide">Свободная запись</div>
          <div className="w-44 text-xs font-semibold text-gray-500 uppercase tracking-wide">Подкатегория</div>
          <div className="w-28 text-xs font-semibold text-gray-500 uppercase tracking-wide">Цена</div>
          <div className="w-36 text-xs font-semibold text-gray-500 uppercase tracking-wide">Специалисты</div>
          <div className="w-8 flex-shrink-0" />
        </div>

        {filtered.map(group => {
          const expanded = expandedGroups.has(group.id)
          return (
            <div key={group.id}>
              {/* Group header */}
              <button
                onClick={() => toggleGroup(group.id)}
                className="w-full flex items-center gap-2 px-6 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100"
              >
                {expanded
                  ? <ChevronDown size={15} className="text-gray-400 flex-shrink-0" />
                  : <ChevronRight size={15} className="text-gray-400 flex-shrink-0" />
                }
                <span className="text-sm font-semibold text-gray-700">{group.name}</span>
                <span className="text-xs text-gray-400 ml-1">({group.services.length})</span>
              </button>

              {/* Rows */}
              {expanded && group.services.map((service) => (
                <div
                  key={service.id}
                  className="flex items-center px-6 py-4 border-b border-gray-50 hover:bg-gray-50/70 transition-colors group/row"
                >
                  {/* Drag handle */}
                  <div className="w-8 flex-shrink-0 opacity-0 group-hover/row:opacity-100 transition-opacity">
                    <GripVertical size={15} className="text-gray-400 cursor-grab" />
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-gray-900 hover:text-blue-600 cursor-pointer transition-colors">
                      {service.name}
                    </span>
                  </div>

                  {/* Free booking */}
                  <div className="w-36 text-sm text-gray-700">
                    {service.freeBooking ? 'Вкл' : 'Выкл'}
                  </div>

                  {/* Subcategory */}
                  <div className="w-44">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      {service.subcategory}
                    </span>
                  </div>

                  {/* Price */}
                  <div className="w-28 text-sm text-gray-900">
                    {service.price.toLocaleString('ru-RU')} ₽
                  </div>

                  {/* Specialists */}
                  <div className="w-36">
                    <SpecialistAvatars ids={service.specialistIds} />
                  </div>

                  {/* Menu */}
                  <div className="w-8 flex-shrink-0">
                    <button className="opacity-0 group-hover/row:opacity-100 w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-200 text-gray-500 transition-opacity">
                      <MoreHorizontal size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
