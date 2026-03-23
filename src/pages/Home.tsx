import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import DayCard from '../components/DayCard'
import { getWorkoutCount } from '../db/queries'
import type { Day } from '../db/schema'

const DAYS: Day[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']

export default function Home() {
  const [counts, setCounts] = useState<Record<Day, number>>({
    monday: 0, tuesday: 0, wednesday: 0, thursday: 0, friday: 0,
  })

  useEffect(() => {
    async function load() {
      const results = await Promise.all(DAYS.map((d) => getWorkoutCount(d)))
      const map = {} as Record<Day, number>
      DAYS.forEach((d, i) => (map[d] = results[i]))
      setCounts(map)
    }
    load()
  }, [])

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 max-w-md mx-auto">
      <div className="flex justify-between items-center mb-6 pt-2">
        <h1 className="text-2xl font-bold">⏱ TimeOut</h1>
        <Link to="/settings" className="text-gray-400 text-sm px-3 py-2 bg-gray-800 rounded-xl">
          ⚙ Config
        </Link>
      </div>
      <div className="flex flex-col gap-3">
        {DAYS.map((day) => (
          <DayCard key={day} day={day} count={counts[day]} />
        ))}
      </div>
    </div>
  )
}
