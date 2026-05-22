import { GRID_START, TOTAL_HOURS, HOUR_HEIGHT } from '../../utils/slotUtils'

export default function TimeAxis() {
  return (
    <div className="w-14 flex-shrink-0 relative select-none" style={{ height: TOTAL_HOURS * HOUR_HEIGHT }}>
      {Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => (
        <div
          key={i}
          className="absolute right-2 text-[10px] text-gray-400 leading-none"
          style={{ top: i * HOUR_HEIGHT - 6 }}
        >
          {i === 0 ? '' : `${String(GRID_START + i).padStart(2, '0')}:00`}
        </div>
      ))}
    </div>
  )
}
