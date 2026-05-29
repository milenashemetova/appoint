export type LocationTab = 'schedule' | 'requests' | 'events' | 'services' | 'specialists' | 'spaces' | 'content' | 'info'
export type ViewMode = 'week' | 'day'
export type DayToggle = 'specialists' | 'spaces'
export type SlotType = 'fixed' | 'free'
export type SlotStatus =
  | 'no-bookings'
  | 'has-bookings'
  | 'full'
  | 'stopped'
  | 'waiting'
  | 'new'
  | 'confirmed'

export interface WorkingHours {
  start: number // minutes from midnight
  end: number
}

export interface Specialist {
  id: string
  name: string
  initials: string
  avatarColor: string
  workingHours: Partial<Record<number, WorkingHours | null>> // getDay() keys
}

export interface Space {
  id: string
  name: string
  workingHours: Partial<Record<number, WorkingHours | null>>
}

export interface Slot {
  id: string
  title: string
  type: SlotType
  status: SlotStatus
  specialistId?: string
  spaceId?: string
  start: Date
  end: Date
  capacity?: number
  booked?: number
  clientName?: string
  clientPhone?: string
  serviceType?: string
}

export interface LayoutedSlot {
  slot: Slot
  col: number
  numCols: number
  extraCount?: number
}

export interface BookingRequest {
  id: string
  clientName: string
  clientPhone: string
  serviceId: string
  serviceName: string
  specialistId: string
  date: Date
  startHour: number
  startMin: number
  durationMin: number
  note?: string
  status: 'pending' | 'confirmed' | 'rejected'
}

export interface DragState {
  isActive: boolean
  columnKey: string
  startMin: number
  currentMin: number
}

export interface CreateMenuState {
  x: number
  y: number
  startTime: Date
  endTime: Date
  columnKey: string
}

export interface AvailabilityBlock {
  startMin: number  // minutes from midnight
  endMin: number
}

export interface AvailabilityState {
  isConfigured: boolean
  dailyBlocks: Record<string, AvailabilityBlock[]>  // key: "YYYY-MM-DD"
  repeatPattern: {
    weekdays: Partial<Record<number, AvailabilityBlock[]>>  // 0=Sun..6=Sat
    fromWeekKey: string   // "YYYY-MM-DD" of that week's Monday
    until?: string        // "YYYY-MM-DD" end date, undefined = forever
  } | null
}
