import { Home, TrendingUp, Network, Ticket, Settings, Plus, Bell } from 'lucide-react'

const TOP_ICONS = [
  { icon: Home,      label: 'Главная',    active: true },
  { icon: TrendingUp, label: 'Аналитика', active: false },
  { icon: Network,   label: 'Структура',  active: false },
]

const MID_ICONS = [
  { icon: Ticket,   label: 'Абонементы', active: false },
]

export default function GlobalSidebar() {
  return (
    <div className="w-[58px] flex-shrink-0 bg-white rounded-xl border border-slate-200 flex flex-col items-center py-3 gap-1">
      {/* Logo */}
      <div className="w-8 h-8 bg-slate-900 rounded-lg mb-2 flex items-center justify-center flex-shrink-0">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M9 2L16 6V12L9 16L2 12V6L9 2Z" stroke="white" strokeWidth="1.5" fill="none"/>
          <circle cx="9" cy="9" r="2" fill="white"/>
        </svg>
      </div>

      {/* Top nav */}
      <div className="flex flex-col gap-0.5 w-full px-2">
        {TOP_ICONS.map(({ icon: Icon, label, active }) => (
          <button
            key={label}
            title={label}
            className={`w-full h-9 rounded-lg flex items-center justify-center transition-colors ${
              active
                ? 'bg-[#cae2ed] text-[#005880]'
                : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
            }`}
          >
            <Icon size={16} />
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="w-8 h-px bg-slate-200 my-1 flex-shrink-0" />

      {/* Mid nav */}
      <div className="flex flex-col gap-0.5 w-full px-2">
        {MID_ICONS.map(({ icon: Icon, label }) => (
          <button
            key={label}
            title={label}
            className="w-full h-9 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <Icon size={16} />
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="w-8 h-px bg-slate-200 my-1 flex-shrink-0" />

      {/* Settings */}
      <div className="flex flex-col gap-0.5 w-full px-2">
        <button title="Настройки" className="w-full h-9 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
          <Settings size={16} />
        </button>
        {/* Create button */}
        <button title="Создать" className="w-full h-7 rounded-full flex items-center justify-center bg-[#005880] text-white hover:bg-[#004d73] transition-colors">
          <Plus size={13} />
        </button>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Footer */}
      <div className="flex flex-col gap-2 items-center pb-1">
        <button title="Уведомления" className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
          <Bell size={16} />
        </button>
        <div className="w-9 h-9 rounded-full overflow-hidden cursor-pointer flex-shrink-0">
          <div className="w-full h-full bg-indigo-500 flex items-center justify-center text-white text-xs font-semibold">АТ</div>
        </div>
      </div>
    </div>
  )
}
