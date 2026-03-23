import { unlockAudio } from '../utils/audio'

interface Props {
  completed: number
  total: number
  onComplete: () => void
}

export default function SetCounter({ completed, total, onComplete }: Props) {
  const allDone = completed >= total
  const next = completed + 1

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-xl font-semibold text-gray-200">
        {allDone ? 'Concluído!' : `Série ${next} de ${total}`}
      </p>
      {/* Set dots indicator */}
      <div className="flex gap-2">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full ${
              i < completed ? 'bg-green-500' : 'bg-gray-700'
            }`}
          />
        ))}
      </div>
      {!allDone && (
        <button
          onClick={() => { unlockAudio(); onComplete() }}
          className="w-full py-5 bg-green-500 active:bg-green-600 text-white text-xl font-bold rounded-2xl select-none"
          aria-label="Série feita"
        >
          ✓ Série Feita
        </button>
      )}
    </div>
  )
}
