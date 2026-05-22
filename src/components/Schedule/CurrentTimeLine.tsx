import { useEffect, useState } from 'react'
import { GRID_START, minutesToPx } from '../../utils/slotUtils'
import { toMinutes } from '../../utils/dateUtils'

export default function CurrentTimeLine() {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])

  const top = minutesToPx(toMinutes(now) - GRID_START * 60)
  if (top < 0) return null

  return (
    <div
      className="absolute left-0 right-0 z-20 pointer-events-none"
      style={{ top: `${top}px` }}
    >
      <div className="flex items-center">
        <div className="w-2 h-2 rounded-full bg-red-500 -ml-1 flex-shrink-0" />
        <div className="h-px flex-1 bg-red-400" />
      </div>
    </div>
  )
}
