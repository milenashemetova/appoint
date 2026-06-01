import type { AvailabilityBlock, AvailabilityState } from '../types'

export function toDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function mondayKey(d: Date): string {
  const date = new Date(d)
  const dow = date.getDay()
  const diff = dow === 0 ? -6 : 1 - dow
  date.setDate(date.getDate() + diff)
  return toDateKey(date)
}

// Returns the date key for a given day-of-week within the week starting on monday (mondayKey string).
// offset: Mon=0, Tue=1, Wed=2, Thu=3, Fri=4, Sat=5, Sun=6
export function getDateKeyForDow(baseMonday: string, dow: number): string {
  const [y, m, d] = baseMonday.split('-').map(Number)
  const monday = new Date(y, m - 1, d)
  const offset = dow === 0 ? 6 : dow - 1
  monday.setDate(monday.getDate() + offset)
  return toDateKey(monday)
}

export function isInBaseWeek(dateKey: string, baseWeekMonday: string): boolean {
  const [by, bm, bd] = baseWeekMonday.split('-').map(Number)
  const monday = new Date(by, bm - 1, bd)
  const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6)
  const [y, m, d] = dateKey.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date >= monday && date <= sunday
}

// Edit mode: resolve blocks for a date from editDraft (specific date wins, then DOW pattern fallback)
export function getEditBlocksForDate(
  date: Date,
  editDraft: Record<string, AvailabilityBlock[]>,
  editBaseWeekMonday: string,
  useWeekPattern: boolean,
): AvailabilityBlock[] {
  const dateKey = toDateKey(date)
  if (Object.prototype.hasOwnProperty.call(editDraft, dateKey)) {
    return editDraft[dateKey]
  }
  if (useWeekPattern && editBaseWeekMonday) {
    const baseKey = getDateKeyForDow(editBaseWeekMonday, date.getDay())
    return editDraft[baseKey] ?? []
  }
  return []
}

export function getBlocksForDate(date: Date, avail: AvailabilityState): AvailabilityBlock[] {
  const dateKey = toDateKey(date)

  if (Object.prototype.hasOwnProperty.call(avail.dailyBlocks, dateKey)) {
    return avail.dailyBlocks[dateKey]
  }

  if (avail.repeatPattern) {
    const { weekdays, until } = avail.repeatPattern
    const dayOfWeek = date.getDay()

    if (until !== undefined) {
      if (dateKey > until) return []
    }

    if (Object.prototype.hasOwnProperty.call(weekdays, dayOfWeek)) {
      return weekdays[dayOfWeek] ?? []
    }
  }

  return []
}

export function mergeBlocks(blocks: AvailabilityBlock[]): AvailabilityBlock[] {
  if (blocks.length === 0) return []

  const sorted = [...blocks].sort((a, b) => a.startMin - b.startMin)
  const merged: AvailabilityBlock[] = [{ ...sorted[0] }]

  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1]
    const cur = sorted[i]
    if (cur.startMin <= last.endMin) {
      last.endMin = Math.max(last.endMin, cur.endMin)
    } else {
      merged.push({ ...cur })
    }
  }

  return merged
}

export function isTimeAvailable(startMin: number, endMin: number, blocks: AvailabilityBlock[]): boolean {
  const merged = mergeBlocks(blocks)
  for (const block of merged) {
    if (block.startMin <= startMin && block.endMin >= endMin) {
      return true
    }
  }
  return false
}

export function subtractBlock(existing: AvailabilityBlock[], eraseStart: number, eraseEnd: number): AvailabilityBlock[] {
  const result: AvailabilityBlock[] = []
  for (const block of existing) {
    if (block.endMin <= eraseStart || block.startMin >= eraseEnd) {
      result.push(block)
    } else {
      if (block.startMin < eraseStart) result.push({ startMin: block.startMin, endMin: eraseStart })
      if (block.endMin > eraseEnd) result.push({ startMin: eraseEnd, endMin: block.endMin })
    }
  }
  return result
}
