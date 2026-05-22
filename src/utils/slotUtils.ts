import type { Slot, LayoutedSlot, SlotStatus } from '../types'
import { toMinutes } from './dateUtils'

// ─── Layout algorithm ──────────────────────────────────────────────────────

export function layoutSlots(slots: Slot[]): LayoutedSlot[] {
  if (!slots.length) return []

  const sorted = [...slots].sort((a, b) => a.start.getTime() - b.start.getTime())
  const columns: Slot[][] = []
  const colMap = new Map<string, number>()

  for (const slot of sorted) {
    let placed = false
    for (let i = 0; i < columns.length; i++) {
      const last = columns[i][columns[i].length - 1]
      if (last.end <= slot.start) {
        columns[i].push(slot)
        colMap.set(slot.id, i)
        placed = true
        break
      }
    }
    if (!placed) {
      colMap.set(slot.id, columns.length)
      columns.push([slot])
    }
  }

  return sorted.map(slot => {
    const col = colMap.get(slot.id)!
    let maxCol = col
    for (const other of sorted) {
      if (other.id !== slot.id && other.start < slot.end && other.end > slot.start) {
        maxCol = Math.max(maxCol, colMap.get(other.id)!)
      }
    }
    return { slot, col, numCols: maxCol + 1 }
  })
}

/**
 * Post-process for day view: collapse groups of 3+ simultaneous slots
 * into a single card with "и ещё N" text.
 */
export function collapseDayViewSlots(layouted: LayoutedSlot[]): LayoutedSlot[] {
  const collapsed = new Set<string>()
  const extraCounts = new Map<string, number>()

  const sorted = [...layouted].sort((a, b) => a.slot.start.getTime() - b.slot.start.getTime())

  for (const item of sorted) {
    if (collapsed.has(item.slot.id) || item.numCols < 3) continue

    // Find all uncollapsed overlapping slots that are also "crowded"
    const group = sorted.filter(other =>
      !collapsed.has(other.slot.id) &&
      other.slot.start < item.slot.end &&
      other.slot.end > item.slot.start &&
      other.numCols >= 3
    )

    if (group.length >= 3) {
      const rep = group[0]
      group.slice(1).forEach(s => collapsed.add(s.slot.id))
      extraCounts.set(rep.slot.id, group.length - 1)
    }
  }

  return layouted
    .filter(item => !collapsed.has(item.slot.id))
    .map(item => ({
      ...item,
      col: extraCounts.has(item.slot.id) ? 0 : item.col,
      numCols: extraCounts.has(item.slot.id) ? 1 : item.numCols,
      extraCount: extraCounts.get(item.slot.id),
    }))
}

// ─── Visual style helpers ──────────────────────────────────────────────────

interface SlotStyle {
  bg: string
  border: string
  text: string
  subText: string
  dashed: boolean
  opacity: boolean
}

const isPast = (slot: Slot) => slot.end < new Date()

export function getSlotStyle(slot: Slot): SlotStyle {
  const past = isPast(slot)
  const base: Omit<SlotStyle, 'opacity' | 'dashed'> = (() => {
    const s: SlotStatus = slot.status
    if (s === 'confirmed')
      return { bg: 'bg-blue-50', border: 'border-l-blue-400', text: 'text-blue-900', subText: 'text-blue-500' }
    if (s === 'new')
      return { bg: 'bg-blue-100', border: 'border-l-blue-500', text: 'text-blue-900', subText: 'text-blue-600' }
    if (s === 'waiting')
      return { bg: 'bg-slate-100', border: 'border-l-slate-400', text: 'text-slate-700', subText: 'text-slate-500' }
    if (s === 'has-bookings')
      return { bg: 'bg-green-50', border: 'border-l-green-500', text: 'text-green-900', subText: 'text-green-600' }
    if (s === 'full')
      return { bg: 'bg-green-100', border: 'border-l-green-600', text: 'text-green-900', subText: 'text-green-700' }
    if (s === 'no-bookings')
      return { bg: 'bg-emerald-50', border: 'border-l-emerald-300', text: 'text-emerald-700', subText: 'text-emerald-500' }
    if (s === 'stopped')
      return { bg: 'bg-gray-50', border: 'border-l-gray-300', text: 'text-gray-500', subText: 'text-gray-400' }
    return { bg: 'bg-gray-50', border: 'border-l-gray-300', text: 'text-gray-600', subText: 'text-gray-400' }
  })()
  return { ...base, dashed: slot.status === 'stopped', opacity: past }
}

export function snapToGrid(minutes: number, step = 15): number {
  return Math.round(minutes / step) * step
}

export const HOUR_HEIGHT = 60 // px per hour
export const GRID_START = 7  // 07:00
export const GRID_END = 23   // 23:00
export const TOTAL_HOURS = GRID_END - GRID_START
export const TOTAL_HEIGHT = TOTAL_HOURS * HOUR_HEIGHT
export const PX_PER_MIN = HOUR_HEIGHT / 60

export const minutesToPx = (min: number) => min * PX_PER_MIN
export const pxToMinutes = (px: number) => px / PX_PER_MIN

export const slotTop = (slot: Slot) =>
  minutesToPx(toMinutes(slot.start) - GRID_START * 60)

export const slotHeight = (slot: Slot) =>
  minutesToPx(toMinutes(slot.end) - toMinutes(slot.start))
