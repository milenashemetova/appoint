import type { AvailabilityBlock, AvailabilityState } from '../types'

export function toDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function mondayKey(d: Date): string {
  const date = new Date(d)
  const dow = date.getDay() // 0=Sun, 1=Mon, ..., 6=Sat
  const diff = dow === 0 ? -6 : 1 - dow
  date.setDate(date.getDate() + diff)
  return toDateKey(date)
}

export function getBlocksForDate(date: Date, avail: AvailabilityState): AvailabilityBlock[] {
  const dateKey = toDateKey(date)

  // 1. Check if explicit dailyBlocks exist for this date
  if (Object.prototype.hasOwnProperty.call(avail.dailyBlocks, dateKey)) {
    return avail.dailyBlocks[dateKey]
  }

  // 2. Check repeatPattern
  if (avail.repeatPattern) {
    const { weekdays, until } = avail.repeatPattern
    const dayOfWeek = date.getDay()

    // Check if date is within the "until" range
    if (until !== undefined) {
      if (dateKey > until) return []
    }

    if (Object.prototype.hasOwnProperty.call(weekdays, dayOfWeek)) {
      return weekdays[dayOfWeek] ?? []
    }
  }

  // 3. No availability
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
