import { createContext, useContext, useReducer, type ReactNode } from 'react'
import type { LocationTab, ViewMode, DayToggle, Slot, DragState, BookingRequest, AvailabilityState, AvailabilityBlock } from '../types'
import { SPECIALISTS, SPACES, SLOTS } from '../data/mockData'
import { INITIAL_REQUESTS } from '../data/requestsData'
import { toDateKey, getDateKeyForDow, isInBaseWeek } from '../utils/availabilityUtils'

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
  showFixed: boolean
  showFree: boolean
  requests: BookingRequest[]
  selectedSlot: Slot | null
  selectedSlotRect: SlotRect | null
  dragState: DragState | null
  createModalState: CreateModalState | null
  availability: AvailabilityState
  availabilityEditMode: boolean
  // Edit mode state — date-keyed draft of availability blocks
  editDraft: Record<string, AvailabilityBlock[]>
  editBaseWeekMonday: string    // Monday of the "template" week
  editUntil: string | undefined // "YYYY-MM-DD" end date for the pattern being configured
  useWeekPattern: boolean       // checkbox: propagate base week DOW pattern to all weeks
  editPriorDate: Date           // selectedDate before entering edit mode (restored on exit)
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
  | { type: 'TOGGLE_SHOW_FIXED' }
  | { type: 'TOGGLE_SHOW_FREE' }
  | { type: 'CONFIRM_REQUEST'; payload: string }
  | { type: 'REJECT_REQUEST'; payload: string }
  | { type: 'ENTER_AVAILABILITY_EDIT' }
  | { type: 'EXIT_AVAILABILITY_EDIT' }
  | { type: 'SET_EDIT_DAY'; payload: { dateKey: string; blocks: AvailabilityBlock[] } }
  | { type: 'SET_EDIT_UNTIL'; payload: string | undefined }
  | { type: 'SET_USE_WEEK_PATTERN'; payload: boolean }
  | { type: 'APPLY_EDIT_TEMPLATE'; payload: Partial<Record<number, AvailabilityBlock[]>> }
  | { type: 'SAVE_AVAILABILITY' }
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
  showFixed: true,
  showFree: true,
  requests: INITIAL_REQUESTS,
  selectedSlot: null,
  selectedSlotRect: null,
  dragState: null,
  createModalState: null,
  availability: { isConfigured: false, dailyBlocks: {}, repeatPattern: null },
  availabilityEditMode: false,
  editDraft: {},
  editBaseWeekMonday: '',
  editUntil: undefined,
  useWeekPattern: true,
  editPriorDate: new Date(),
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
    case 'TOGGLE_SHOW_FIXED': return { ...state, showFixed: !state.showFixed }
    case 'TOGGLE_SHOW_FREE': return { ...state, showFree: !state.showFree }
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

    case 'ENTER_AVAILABILITY_EDIT': {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const dow = today.getDay()
      // Use next Monday as base week if today is not Monday (so user always edits a full week)
      const daysUntilNextMon = dow === 1 ? 0 : dow === 0 ? 1 : 8 - dow
      const baseDate = new Date(today)
      baseDate.setDate(baseDate.getDate() + daysUntilNextMon)
      const editBaseWeekMonday = toDateKey(baseDate)

      // Initialize editDraft from existing repeatPattern (populate base week days)
      const editDraft: Record<string, AvailabilityBlock[]> = {}
      if (state.availability.repeatPattern?.weekdays) {
        const { weekdays } = state.availability.repeatPattern
        for (const dowStr of Object.keys(weekdays)) {
          const d = parseInt(dowStr)
          const blocks = weekdays[d as keyof typeof weekdays]
          if (blocks) {
            editDraft[getDateKeyForDow(editBaseWeekMonday, d)] = blocks
          }
        }
      }

      return {
        ...state,
        availabilityEditMode: true,
        editDraft,
        editBaseWeekMonday,
        editUntil: state.availability.repeatPattern?.until,
        useWeekPattern: true,
        editPriorDate: state.selectedDate,
        selectedDate: baseDate,
      }
    }

    case 'EXIT_AVAILABILITY_EDIT':
      return {
        ...state,
        availabilityEditMode: false,
        editDraft: {},
        editBaseWeekMonday: '',
        editUntil: undefined,
        useWeekPattern: true,
        selectedDate: state.editPriorDate,
      }

    case 'SET_EDIT_DAY':
      return { ...state, editDraft: { ...state.editDraft, [action.payload.dateKey]: action.payload.blocks } }

    case 'SET_EDIT_UNTIL':
      return { ...state, editUntil: action.payload }

    case 'SET_USE_WEEK_PATTERN':
      return { ...state, useWeekPattern: action.payload }

    case 'APPLY_EDIT_TEMPLATE': {
      const weekdays = action.payload
      const editDraft = { ...state.editDraft }
      for (const dowStr of Object.keys(weekdays)) {
        const dow = parseInt(dowStr)
        const blocks = weekdays[dow as keyof typeof weekdays]
        if (blocks) {
          editDraft[getDateKeyForDow(state.editBaseWeekMonday, dow)] = blocks
        }
      }
      return { ...state, editDraft, useWeekPattern: true }
    }

    case 'SAVE_AVAILABILITY': {
      const until = state.editUntil
      const weekdays: Partial<Record<number, AvailabilityBlock[]>> = {}
      const [by, bm, bd] = state.editBaseWeekMonday.split('-').map(Number)
      const baseMonday = new Date(by, bm - 1, bd)

      if (state.useWeekPattern) {
        // Derive DOW pattern from base week entries
        for (let offset = 0; offset <= 6; offset++) {
          const day = new Date(baseMonday)
          day.setDate(day.getDate() + offset)
          const key = toDateKey(day)
          if (state.editDraft[key]) {
            weekdays[day.getDay()] = state.editDraft[key]
          }
        }
      }

      // Carry over existing daily exceptions + add non-base-week overrides
      const dailyBlocks: Record<string, AvailabilityBlock[]> = { ...state.availability.dailyBlocks }
      for (const [dateKey, blocks] of Object.entries(state.editDraft)) {
        if (!isInBaseWeek(dateKey, state.editBaseWeekMonday)) {
          dailyBlocks[dateKey] = blocks
        }
      }

      return {
        ...state,
        availability: {
          isConfigured: true,
          dailyBlocks,
          repeatPattern: state.useWeekPattern
            ? { weekdays, fromWeekKey: state.editBaseWeekMonday, until }
            : null,
        },
        editDraft: {},
        editBaseWeekMonday: '',
        editUntil: undefined,
        useWeekPattern: true,
        availabilityEditMode: false,
        selectedDate: state.editPriorDate,
      }
    }

    case 'SET_DATE_EXCEPTION': {
      const { dateKey, blocks } = action.payload
      if (blocks === null) {
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
