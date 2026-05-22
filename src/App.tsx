import { ScheduleProvider } from './context/ScheduleContext'
import GlobalSidebar from './components/GlobalSidebar'
import LeftPanel from './components/LeftPanel/LeftPanel'
import ScheduleArea from './components/Schedule/ScheduleArea'

export default function App() {
  return (
    <ScheduleProvider>
      <div className="flex w-full h-full bg-white overflow-hidden">
        <GlobalSidebar />
        <LeftPanel />
        <ScheduleArea />
      </div>
    </ScheduleProvider>
  )
}
