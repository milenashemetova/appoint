import { ScheduleProvider, useSchedule } from './context/ScheduleContext'
import GlobalSidebar from './components/GlobalSidebar'
import LeftPanel from './components/LeftPanel/LeftPanel'
import ScheduleArea from './components/Schedule/ScheduleArea'
import LocationSidebar from './components/LocationSidebar'
import ServicesPage from './components/Services/ServicesPage'
import PlaceholderPage from './components/PlaceholderPage'

function AppContent() {
  const { state } = useSchedule()

  const locationContent = () => {
    switch (state.locationTab) {
      case 'services': return <ServicesPage />
      default: return <PlaceholderPage tab={state.locationTab} />
    }
  }

  return (
    <div className="flex w-full h-full bg-white overflow-hidden">
      <GlobalSidebar />
      {state.appPage === 'schedule' ? (
        <>
          <LeftPanel />
          <ScheduleArea />
        </>
      ) : (
        <>
          <LocationSidebar />
          {locationContent()}
        </>
      )}
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
