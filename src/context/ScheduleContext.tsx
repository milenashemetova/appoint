import { createContext, useContext, useReducer, type ReactNode } from 'react'
import type { LocationTab, ViewMode, DayToggle, Slot, DragState, BookingRequest, AvailabilityState, AvailabilityBlock } from '../types'
import { SPECIALISTS, SPACES, SLOTS } from '../data/mockData'
import { INITIAL_REQUESTS } from '../data/requestsData'

export interface CreateModalState {
  startTime: Date
  endTime: Date
  columnKey: string
  slotType?: 'fixed' | 'free'
}

export interface SlotRect {
  x: number
  y: number
  width: number
  height: number
}

interface State {
  locationTab: LocationTab
  currentLocationId: string
  viewMode: ViewMode
  selectedDate: Date
  dayToggle: DayToggle
  selectedSpecialistIds: string[]
  selectedSpaceIds: string[]
  slots: Slot[]
  requests: BookingRequest[]
  selectedSlot: Slot | null
  selectedSlotRect: SlotRect | null
  dragState: DragState | null
  createModalState: CreateModalState | null
  availability: AvailabilityState
  availabilityEditMode: boolean
  // Abstract week draft (keyed by getDay(): 0=Sun..6=Sat)
  weekDraft: Partial<Record<number, AvailabilityBlock[]>>
  weekDraftFromTemplate: boolean
}

type Action =
  | { type: 'SET_LOCATION_TAB'; payload: LocationTab }
  | { type: 'SET_LOCATION'; payload: string }
  | { type: 'SET_VIEW'; payload: ViewMode }
  | { type: 'SET_DATE'; payload: Date }
  | { type: 'SET_DAY_TOGGLE'; payload: DayToggle }
  | { type: 'TOGGLE_SPECIALIST'; payload: string }
  | { type: 'TOGGLE_SPACE'; payload: string }
  | { type: 'SELECT_SLOT'; payload: Slot | null }
  | { type: 'SET_SLOT_RECT'; payload: SlotRect | null }
  | { type: 'SET_DRAG'; payload: DragState | null }
  | { type: 'SET_CREATE_MODAL'; payload: CreateModalState | null }
  | { type: 'ADD_SLOT'; payload: Slot }
  | { type: 'UPDATE_SLOT'; payload: Slot }
  | { type: 'DELETE_SLOT'; payload: string }
  | { type: 'CONFIRM_REQUEST'; payload: string }
  | { type: 'REJECT_REQUEST'; payload: string }
  | { type: 'ENTER_AVAILABILITY_EDIT' }
  | { type: 'EXIT_AVAILABILITY_EDIT' }
  | { type: 'SET_WEEK_DRAFT_DAY'; payload: { dayOfWeek: number; blocks: AvailabilityBlock[] } }
  | { type: 'APPLY_WEEK_TEMPLATE'; payload: Partial<Record<number, AvailabilityBlock[]>> }
  | { type: 'SAVE_AVAILABILITY'; payload: { until?: string; weekMondayKey: string } }
  | { type: 'SET_DATE_EXCEPTION'; payload: { dateKey: string; blocks: AvailabilityBlock[] | null } }

const initialState: State = {
  locationTab: 'schedule',
  currentLocationId: 'reshape',
  viewMode: 'week',
  selectedDate: new Date(),
  dayToggle: 'specialists',
  selectedSpecialistIds: ['anna'],
  selectedSpaceIds: ['zal-a'],
  slots: SLOTS,
  requests: INITIAL_REQUESTS,
  selectedSlot: null,
  selectedSlotRect: null,
  dragState: null,
  createModalState: null,
  availability: { isConfigured: false, dailyBlocks: {}, repeatPattern: null },
  availabilityEditMode: false,
  weekDraft: {},
  weekDraftFromTemplate: false,
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_LOCATION_TAB': return { ...state, locationTab: action.payload }
    case 'SET_LOCATION': return { ...state, currentLocationId: action.payload }
    case 'SET_VIEW': return { ...state, viewMode: action.payload }
    case 'SET_DATE': return { ...state, selectedDate: action.payload }
    case 'SET_DAY_TOGGLE': return { ...state, dayToggle: action.payload }
    case 'TOGGLE_SPECIALIST': {
      const ids = state.selectedSpecialistIds
      return { ...state, selectedSpecialistIds: ids.includes(action.payload) ? ids.filter(id => id !== action.payload) : [...ids, action.payload] }
    }
    case 'TOGGLE_SPACE': {
      const ids = state.selectedSpaceIds
      return { ...state, selectedSpaceIds: ids.includes(action.payload) ? ids.filter(id => id !== action.payload) : [...ids, action.payload] }
    }
    case 'SELECT_SLOT': return { ...state, selectedSlot: action.payload, selectedSlotRect: null }
    case 'SET_SLOT_RECT': return { ...state, selectedSlotRect: action.payload }
    case 'SET_DRAG': return { ...state, dragState: action.payload }
    case 'SET_CREATE_MODAL': return { ...state, createModalState: action.payload }
    case 'ADD_SLOT': {
      const s = action.payload
      const specIds = s.specialistId && !state.selectedSpecialistIds.includes(s.specialistId)
        ? [...state.selectedSpecialistIds, s.specialistId]
        : state.selectedSpecialistIds
      const spaceIds = s.spaceId && !state.selectedSpaceIds.includes(s.spaceId)
        ? [...state.selectedSpaceIds, s.spaceId]
        : state.selectedSpaceIds
      return { ...state, slots: [...state.slots, s], selectedSpecialistIds: specIds, selectedSpaceIds: spaceIds }
    }
    case 'UPDATE_SLOT': return { ...state, slots: state.slots.map(s => s.id === action.payload.id ? action.payload : s) }
    case 'DELETE_SLOT': return { ...state, slots: state.slots.filter(s => s.id !== action.payload), selectedSlot: null, selectedSlotRect: null }
    case 'CONFIRM_REQUEST': {
      const req = state.requests.find(r => r.id === action.payload)
      if (!req) return state
      const start = new Date(req.date)
      start.setHours(req.startHour, req.startMin, 0, 0)
      const end = new Date(start)
      end.setMinutes(end.getMinutes() + req.durationMin)
      const newSlot: Slot = {
        id: `slot-${Date.now()}`,
        title: req.serviceName,
        type: 'free',
        status: 'confirmed',
        specialistId: req.specialistId,
        start, end,
        clientName: req.clientName,
        clientPhone: req.clientPhone,
        serviceType: req.serviceId,
      }
      const specIds = !state.selectedSpecialistIds.includes(req.specialistId)
        ? [...state.selectedSpecialistIds, req.specialistId]
        : state.selectedSpecialistIds
      return {
        ...state,
        requests: state.requests.map(r => r.id === action.payload ? { ...r, status: 'confirmed' as const } : r),
        slots: [...state.slots, newSlot],
        selectedSpecialistIds: specIds,
      }
    }
    case 'REJECT_REQUEST':
      return { ...state, requests: state.requests.map(r => r.id === action.payload ? { ...r, status: 'rejected' as const } : r) }

    case 'ENTER_AVAILABILITY_EDIT':
      return {
        ...state,
        availabilityEditMode: true,
        weekDraft: { ...(state.availability.repeatPattern?.weekdays ?? {}) },
        weekDraftFromTemplate: false,
      }
    case 'EXIT_AVAILABILITY_EDIT':
      return { ...state, availabilityEditMode: false, weekDraft: {}, weekDraftFromTemplate: false }

    case 'SET_WEEK_DRAFT_DAY':
      return {
        ...state,
        weekDraft: { ...state.weekDraft, [action.payload.dayOfWeek]: action.payload.blocks },
        weekDraftFromTemplate: false,  // detach template on manual edit
      }

    case 'APPLY_WEEK_TEMPLATE':
      return {
        ...state,
        weekDraft: { ...action.payload },
        weekDraftFromTemplate: true,
      }

    case 'SAVE_AVAILABILITY':
      return {
        ...state,
        availability: {
          ...state.availability,
          isConfigured: true,
          repeatPattern: {
            weekdays: state.weekDraft,
            fromWeekKey: action.payload.weekMondayKey,
            until: action.payload.until,
          },
        },
        weekDraft: {},
        weekDraftFromTemplate: false,
        availabilityEditMode: false,
      }

    case 'SET_DATE_EXCEPTION': {
      const { dateKey, blocks } = action.payload
      if (blocks === null) {
        // Remove exception — fall back to repeat pattern
        const { [dateKey]: _removed, ...rest } = state.availability.dailyBlocks
        return { ...state, availability: { ...state.availability, dailyBlocks: rest } }
      }
      return {
        ...state,
        availability: {
          ...state.availability,
          dailyBlocks: { ...state.availability.dailyBlocks, [dateKey]: blocks },
        },
      }
    }

    default: return state
  }
}

const Ctx = createContext<{ state: State; dispatch: React.Dispatch<Action>; specialists: typeof SPECIALISTS; spaces: typeof SPACES } | null>(null)

export function ScheduleProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  return <Ctx.Provider value={{ state, dispatch, specialists: SPECIALISTS, spaces: SPACES }}>{children}</Ctx.Provider>
}

export function useSchedule() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useSchedule must be used inside ScheduleProvider')
  return ctx
}
