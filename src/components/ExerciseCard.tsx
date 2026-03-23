import { useState } from 'react'
import type { Exercise } from '../db/schema'

interface Props {
  exercise: Exercise
  index: number
  onEdit?: (exercise: Exercise) => void
}

export default function ExerciseCard({ exercise, index, onEdit }: Props) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-gray-800 rounded-xl p-4 flex flex-col gap-1">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">
            {index + 1}. {exercise.type === 'mobility' ? 'Mobilidade' : 'Principal'}
          </p>
          <p className="text-lg font-semibold text-white">{exercise.name}</p>
          <p className="text-sm text-gray-300">
            {exercise.sets} × {exercise.reps}
            {exercise.weight > 0 ? ` — ${exercise.weight}kg` : ' — Peso corporal'}
          </p>
        </div>
        <div className="flex items-center gap-1 ml-2">
          {onEdit && (
            <button
              onClick={() => onEdit(exercise)}
              className="text-gray-500 hover:text-gray-300 text-sm px-2 py-1"
              aria-label="Editar exercício"
            >
              ✎
            </button>
          )}
          {exercise.description && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-gray-500 text-sm px-2 py-1"
              aria-label="Ver descrição"
            >
              {expanded ? '▲' : '▼'}
            </button>
          )}
        </div>
      </div>
      {expanded && exercise.description && (
        <p className="text-sm text-gray-400 mt-1 border-t border-gray-700 pt-2">
          {exercise.description}
        </p>
      )}
    </div>
  )
}
