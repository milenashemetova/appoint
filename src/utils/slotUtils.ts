import type { Slot, LayoutedSlot } from '../types'
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

export interface SlotStyle {
  bgColor: string
  barColor: string
  borderColor: string
  textColor: string
  subTextColor: string
  dashed: boolean
}

export function getSlotStyle(slot: Slot): SlotStyle {
  const { type, status } = slot

  if (status === 'stopped') {
    return {
      bgColor: 'rgba(248,250,252,0.95)',
      barColor: '#94a3b8',
      borderColor: '#cbd5e1',
      textColor: '#64748b',
      subTextColor: '#94a3b8',
      dashed: true,
    }
  }

  if (type === 'free') {
    if (status === 'confirmed') {
      return {
        bgColor: '#16a34a',
        barColor: '#15803d',
        borderColor: '#15803d',
        textColor: '#ffffff',
        subTextColor: 'rgba(255,255,255,0.75)',
        dashed: false,
      }
    }
    return {
      bgColor: 'rgba(240,253,244,0.95)',
      barColor: '#16a34a',
      borderColor: '#bbf7d0',
      textColor: '#14532d',
      subTextColor: '#166534',
      dashed: false,
    }
  }

  // type === 'fixed' → blue event theme
  if (status === 'confirmed') {
    return {
      bgColor: '#2563eb',
      barColor: '#1d4ed8',
      borderColor: '#1d4ed8',
      textColor: '#ffffff',
      subTextColor: 'rgba(255,255,255,0.75)',
      dashed: false,
    }
  }
  if (status === 'has-bookings' || status === 'full') {
    return {
      bgColor: 'rgba(239,246,255,0.95)',
      barColor: '#2563eb',
      borderColor: '#bfdbfe',
      textColor: '#1e3a8a',
      subTextColor: '#3b82f6',
      dashed: false,
    }
  }
  return {
    bgColor: 'rgba(241,245,249,0.95)',
    barColor: '#2563eb',
    borderColor: '#bfdbfe',
    textColor: '#1e40af',
    subTextColor: '#3b82f6',
    dashed: false,
  }
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
