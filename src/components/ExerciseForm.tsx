import { useState } from 'react'
import type { Day, Exercise, ExerciseType } from '../db/schema'

const DAYS: Day[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
const DAY_LABELS: Record<Day, string> = {
  monday: 'Segunda', tuesday: 'Terça', wednesday: 'Quarta',
  thursday: 'Quinta', friday: 'Sexta',
}

interface Props {
  initial?: Partial<Exercise>
  onSave: (exercise: Omit<Exercise, 'id'> & { id?: number }) => void
  onCancel: () => void
}

export default function ExerciseForm({ initial, onSave, onCancel }: Props) {
  const [day, setDay] = useState<Day>(initial?.day ?? 'monday')
  const [type, setType] = useState<ExerciseType>(initial?.type ?? 'main')
  const [name, setName] = useState(initial?.name ?? '')
  const [sets, setSets] = useState(String(initial?.sets ?? 3))
  const [reps, setReps] = useState(String(initial?.reps ?? 10))
  const [weight, setWeight] = useState(String(initial?.weight ?? 0))
  const [description, setDescription] = useState(initial?.description ?? '')
  const [restSeconds, setRestSeconds] = useState(String(initial?.restSeconds ?? ''))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      id: initial?.id,
      day, type,
      order: initial?.order ?? 999,
      name: name.trim(),
      sets: parseInt(sets),
      reps: parseInt(reps),
      weight: parseFloat(weight) || 0,
      description: description.trim() || undefined,
      restSeconds: restSeconds ? parseInt(restSeconds) : undefined,
    })
  }

  const inputClass = "w-full bg-gray-800 text-white rounded-xl px-3 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
  const labelClass = "text-sm text-gray-400 mb-1 block"

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className={labelClass}>Dia</label>
        <select value={day} onChange={(e) => setDay(e.target.value as Day)} className={inputClass}>
          {DAYS.map((d) => <option key={d} value={d}>{DAY_LABELS[d]}</option>)}
        </select>
      </div>
      <div>
        <label className={labelClass}>Tipo</label>
        <select value={type} onChange={(e) => setType(e.target.value as ExerciseType)} className={inputClass}>
          <option value="main">Principal</option>
          <option value="mobility">Mobilidade</option>
        </select>
      </div>
      <div>
        <label className={labelClass}>Nome do exercício *</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
          placeholder="Ex: Supino Reto"
        />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className={labelClass}>Séries</label>
          <input type="number" min={1} value={sets} onChange={(e) => setSets(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Reps</label>
          <input type="number" min={1} value={reps} onChange={(e) => setReps(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Kg</label>
          <input type="number" min={0} step={0.5} value={weight} onChange={(e) => setWeight(e.target.value)} className={inputClass} />
        </div>
      </div>
      <div>
        <label className={labelClass}>Descanso (s) — deixe vazio para usar o padrão</label>
        <input
          type="number"
          min={0}
          value={restSeconds}
          onChange={(e) => setRestSeconds(e.target.value)}
          className={inputClass}
          placeholder="Ex: 90"
        />
      </div>
      <div>
        <label className={labelClass}>Descrição (opcional)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className={inputClass}
          placeholder="Dicas de execução..."
        />
      </div>
      <div className="flex gap-3 mt-2">
        <button type="button" onClick={onCancel} className="flex-1 py-3 bg-gray-700 active:bg-gray-600 text-white rounded-xl">
          Cancelar
        </button>
        <button type="submit" className="flex-1 py-3 bg-green-500 active:bg-green-600 text-white font-bold rounded-xl">
          Salvar
        </button>
      </div>
    </form>
  )
}
