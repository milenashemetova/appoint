import { Home, BarChart2, PieChart, LayoutGrid, Settings, Bell } from 'lucide-react'

const navItems = [
  { icon: Home, label: 'Главная' },
  { icon: BarChart2, label: 'Аналитика' },
  { icon: PieChart, label: 'Статистика' },
  { icon: LayoutGrid, label: 'Сервисы' },
]

export default function GlobalSidebar() {
  return (
    <div className="w-12 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col items-center py-2 z-10">
      {/* Logo */}
      <div className="w-8 h-8 bg-gray-900 rounded-lg mb-4 flex items-center justify-center">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M9 2L16 6V12L9 16L2 12V6L9 2Z" stroke="white" strokeWidth="1.5" fill="none"/>
          <circle cx="9" cy="9" r="2" fill="white"/>
        </svg>
      </div>

      {/* Nav icons */}
      <div className="flex flex-col gap-1 flex-1">
        {navItems.map(({ icon: Icon, label }, i) => (
          <button
            key={label}
            title={label}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${i === 0 ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'}`}
          >
            <Icon size={18} />
          </button>
        ))}
      </div>

      {/* Bottom icons */}
      <div className="flex flex-col gap-1 pb-2">
        <button title="Настройки" className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700">
          <Settings size={18} />
        </button>
        <button title="Уведомления" className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700">
          <Bell size={18} />
        </button>
        {/* User avatar */}
        <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-semibold mt-1 cursor-pointer">
          АТ
        </div>
      </div>
    </div>
  )
}
