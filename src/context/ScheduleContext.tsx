import { createContext, useContext, useReducer, type ReactNode } from 'react'
import type { ViewMode, DayToggle, Slot, DragState, CreateMenuState } from '../types'
import { SPECIALISTS, SPACES, SLOTS } from '../data/mockData'

interface State {
  viewMode: ViewMode
  selectedDate: Date
  dayToggle: DayToggle
  selectedSpecialistIds: string[]
  selectedSpaceIds: string[]
  slots: Slot[]
  selectedSlot: Slot | null
  dragState: DragState | null
  createMenuState: CreateMenuState | null
}

type Action =
  | { type: 'SET_VIEW'; payload: ViewMode }
  | { type: 'SET_DATE'; payload: Date }
  | { type: 'SET_DAY_TOGGLE'; payload: DayToggle }
  | { type: 'TOGGLE_SPECIALIST'; payload: string }
  | { type: 'TOGGLE_SPACE'; payload: string }
  | { type: 'SELECT_SLOT'; payload: Slot | null }
  | { type: 'SET_DRAG'; payload: DragState | null }
  | { type: 'SET_CREATE_MENU'; payload: CreateMenuState | null }
  | { type: 'ADD_SLOT'; payload: Slot }
  | { type: 'UPDATE_SLOT'; payload: Slot }
  | { type: 'DELETE_SLOT'; payload: string }

const initialState: State = {
  viewMode: 'week',
  selectedDate: new Date(2026, 4, 22), // May 22, 2026 (today)
  dayToggle: 'specialists',
  selectedSpecialistIds: ['anna'],
  selectedSpaceIds: ['zal-a'],
  slots: SLOTS,
  selectedSlot: null,
  dragState: null,
  createMenuState: null,
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
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
    case 'SELECT_SLOT': return { ...state, selectedSlot: action.payload }
    case 'SET_DRAG': return { ...state, dragState: action.payload }
    case 'SET_CREATE_MENU': return { ...state, createMenuState: action.payload }
    case 'ADD_SLOT': return { ...state, slots: [...state.slots, action.payload] }
    case 'UPDATE_SLOT': return { ...state, slots: state.slots.map(s => s.id === action.payload.id ? action.payload : s) }
    case 'DELETE_SLOT': return { ...state, slots: state.slots.filter(s => s.id !== action.payload), selectedSlot: null }
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
