import { ScheduleProvider, useSchedule } from './context/ScheduleContext'
import GlobalSidebar from './components/GlobalSidebar'
import LeftPanel from './components/LeftPanel/LeftPanel'
import ScheduleArea from './components/Schedule/ScheduleArea'
import ServicesPage from './components/Services/ServicesPage'
import PlaceholderPage from './components/PlaceholderPage'

function AppContent() {
  const { state } = useSchedule()

  const content = () => {
    switch (state.locationTab) {
      case 'schedule': return <ScheduleArea />
      case 'services': return <ServicesPage />
      default: return <PlaceholderPage tab={state.locationTab} />
    }
  }

  return (
    <div className="flex w-full h-full bg-slate-100 overflow-hidden gap-2 p-2">
      <GlobalSidebar />
      <LeftPanel />
      {content()}
    </div>
  )
}

export default function App() {
  return (
    <ScheduleProvider>
      <AppContent />
    </ScheduleProvider>
  )
}
