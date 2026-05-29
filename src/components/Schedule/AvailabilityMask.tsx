import type { AvailabilityBlock } from '../../types'
import { TOTAL_HEIGHT, GRID_START, minutesToPx } from '../../utils/slotUtils'

const GRAY = 'rgba(241,245,249,0.9)'
const gridStartMin = GRID_START * 60

export default function AvailabilityMask({ blocks }: { blocks: AvailabilityBlock[] }) {
  // If no available blocks, render a full-height gray div
  if (blocks.length === 0) {
    return (
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ height: TOTAL_HEIGHT, backgroundColor: GRAY }}
      />
    )
  }

  // Sort blocks by startMin
  const sorted = [...blocks].sort((a, b) => a.startMin - b.startMin)

  const gaps: { top: number; height: number }[] = []

  // Gap before first block (from grid start)
  const firstBlockStart = minutesToPx(sorted[0].startMin - gridStartMin)
  if (firstBlockStart > 0) {
    gaps.push({ top: 0, height: firstBlockStart })
  }

  // Gaps between blocks
  for (let i = 0; i < sorted.length - 1; i++) {
    const gapTop = minutesToPx(sorted[i].endMin - gridStartMin)
    const gapBottom = minutesToPx(sorted[i + 1].startMin - gridStartMin)
    if (gapBottom > gapTop) {
      gaps.push({ top: gapTop, height: gapBottom - gapTop })
    }
  }

  // Gap after last block (to end of grid)
  const lastBlockEnd = minutesToPx(sorted[sorted.length - 1].endMin - gridStartMin)
  if (lastBlockEnd < TOTAL_HEIGHT) {
    gaps.push({ top: lastBlockEnd, height: TOTAL_HEIGHT - lastBlockEnd })
  }

  return (
    <>
      {gaps.map((gap, i) => (
        <div
          key={i}
          className="absolute left-0 right-0 pointer-events-none"
          style={{
            top: gap.top,
            height: gap.height,
            backgroundColor: GRAY,
          }}
        />
      ))}
    </>
  )
}
