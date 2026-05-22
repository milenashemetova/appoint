import { TOTAL_HOURS, HOUR_HEIGHT, TOTAL_HEIGHT } from '../../utils/slotUtils'

export default function GridLines() {
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ height: TOTAL_HEIGHT }}>
      {Array.from({ length: TOTAL_HOURS }, (_, i) => (
        <div key={i} className="absolute w-full" style={{ top: i * HOUR_HEIGHT }}>
          <div className="border-t border-gray-100 w-full" />
          <div className="border-t border-gray-50 w-full mt-[30px]" />
        </div>
      ))}
    </div>
  )
}
