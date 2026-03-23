import { useState } from 'react'
import ExerciseCard from './ExerciseCard'
import type { Exercise } from '../db/schema'

interface Props {
  exercises: Exercise[]
  onEdit?: (exercise: Exercise) => void
}

export default function MobilitySection({ exercises, onEdit }: Props) {
  const [open, setOpen] = useState(false)

  if (exercises.length === 0) return null

  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center py-3 px-1 text-left"
      >
        <span className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
          Mobilidade ({exercises.length})
        </span>
        <span className="text-gray-500">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="flex flex-col gap-2">
          {exercises.map((ex, i) => (
            <ExerciseCard key={ex.id} exercise={ex} index={i} onEdit={onEdit} />
          ))}
        </div>
      )}
    </div>
  )
}
