import { Link } from 'react-router-dom'
import type { Day } from '../db/schema'

const DAY_LABELS: Record<Day, string> = {
  monday: 'Segunda', tuesday: 'Terça', wednesday: 'Quarta',
  thursday: 'Quinta', friday: 'Sexta',
}

const DAY_ORDER: Day[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']

function todayKey(): Day | null {
  const d = new Date().getDay()
  // 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri
  if (d >= 1 && d <= 5) return DAY_ORDER[d - 1]
  return null
}

interface Props {
  day: Day
  count: number
}

export default function DayCard({ day, count }: Props) {
  const isToday = todayKey() === day

  return (
    <Link
      to={`/day/${day}`}
      className={`flex items-center justify-between p-4 rounded-xl transition-opacity active:opacity-70 ${
        isToday ? 'bg-green-600' : 'bg-gray-800'
      }`}
    >
      <div>
        <p className={`text-lg font-bold ${isToday ? 'text-white' : 'text-gray-100'}`}>
          {DAY_LABELS[day]}
          {isToday && (
            <span className="ml-2 text-xs font-normal bg-white/20 px-2 py-0.5 rounded-full">
              hoje
            </span>
          )}
        </p>
      </div>
      <p className="text-sm text-gray-300">{count}× feito</p>
    </Link>
  )
}
