import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ExerciseForm from '../components/ExerciseForm'
import { getExercisesByDay, upsertExercise, deleteExercise } from '../db/queries'
import { useSettings } from '../store/settings'
import { programToJSON, programFromJSON, programToCSV, programFromCSV } from '../utils/importExport'
import { db } from '../db/schema'
import type { Day, Exercise } from '../db/schema'

const DAYS: Day[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
const DAY_LABELS: Record<Day, string> = {
  monday: 'Segunda', tuesday: 'Terça', wednesday: 'Quarta',
  thursday: 'Quinta', friday: 'Sexta',
}

export default function Settings() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [activeDay, setActiveDay] = useState<Day>('monday')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Exercise | null>(null)
  const { soundEnabled, toggleSound } = useSettings()

  const load = async () => {
    const all: Exercise[] = []
    for (const d of DAYS) {
      const ex = await getExercisesByDay(d)
      all.push(...ex)
    }
    setExercises(all)
  }

  useEffect(() => { load() }, [])

  const dayExercises = exercises.filter((e) => e.day === activeDay)

  const handleSave = async (exercise: Omit<Exercise, 'id'> & { id?: number }) => {
    await upsertExercise(exercise)
    await load()
    setShowForm(false)
    setEditing(null)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Remover exercício?')) return
    await deleteExercise(id)
    await load()
  }

  const handleExportJSON = async () => {
    const all: Exercise[] = []
    for (const d of DAYS) all.push(...await getExercisesByDay(d))
    const json = programToJSON(all)
    const blob = new Blob([json], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'treino.json'
    a.click()
  }

  const handleExportCSV = async () => {
    const all: Exercise[] = []
    for (const d of DAYS) all.push(...await getExercisesByDay(d))
    const csv = programToCSV(all)
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'treino.csv'
    a.click()
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!confirm('Isso vai substituir seu programa atual. Continuar?')) {
      e.target.value = ''
      return
    }
    try {
      const text = await file.text()
      const imported = file.name.endsWith('.csv') ? programFromCSV(text) : programFromJSON(text)
      await db.exercises.clear()
      for (let i = 0; i < imported.length; i++) {
        await db.exercises.add({ ...imported[i], order: imported[i].order ?? i })
      }
      await load()
      alert('Programa importado com sucesso!')
    } catch {
      alert('Arquivo inválido. Verifique o formato JSON ou CSV.')
    }
    e.target.value = ''
  }

  const btnClass = "w-full py-3 bg-gray-800 border border-gray-700 active:bg-gray-700 text-gray-300 rounded-xl text-sm"

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 max-w-md mx-auto pb-16">
      <div className="flex items-center gap-3 mb-6 pt-2">
        <Link to="/" className="text-gray-400 text-lg">←</Link>
        <h1 className="text-2xl font-bold">Configurações</h1>
      </div>

      {/* Global settings */}
      <div className="bg-gray-800 rounded-xl p-4 mb-6 flex flex-col gap-4">
        <h2 className="font-semibold text-gray-300 text-sm uppercase tracking-wide">Global</h2>
        <div className="flex justify-between items-center">
          <label className="text-sm text-gray-400">Som ao finalizar descanso</label>
          <button
            onClick={toggleSound}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              soundEnabled ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-400'
            }`}
          >
            {soundEnabled ? 'On' : 'Off'}
          </button>
        </div>
      </div>

      {/* Day tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
        {DAYS.map((d) => (
          <button
            key={d}
            onClick={() => { setActiveDay(d); setShowForm(false); setEditing(null) }}
            className={`px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              activeDay === d ? 'bg-green-500 text-white' : 'bg-gray-800 text-gray-400'
            }`}
          >
            {DAY_LABELS[d]}
          </button>
        ))}
      </div>

      {/* Exercise list or form */}
      {showForm || editing ? (
        <ExerciseForm
          initial={editing ?? { day: activeDay }}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditing(null) }}
        />
      ) : (
        <>
          <div className="flex flex-col gap-2 mb-3">
            {dayExercises.map((ex) => (
              <div key={ex.id} className="bg-gray-800 rounded-xl p-3 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-white">{ex.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {ex.type === 'mobility' ? 'Mobilidade · ' : 'Principal · '}
                    {ex.sets}×{ex.reps}
                    {ex.weight > 0 ? ` · ${ex.weight}kg` : ''}
                  </p>
                </div>
                <div className="flex gap-2 ml-2">
                  <button
                    onClick={() => setEditing(ex)}
                    className="text-xs text-blue-400 px-2 py-1 bg-gray-700 rounded-lg"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(ex.id!)}
                    className="text-xs text-red-400 px-2 py-1 bg-gray-700 rounded-lg"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
            {dayExercises.length === 0 && (
              <p className="text-gray-600 text-center py-6 text-sm">
                Nenhum exercício neste dia.
              </p>
            )}
          </div>
          <button
            onClick={() => setShowForm(true)}
            className={btnClass}
          >
            + Adicionar exercício
          </button>
        </>
      )}

      {/* Import / Export */}
      {!showForm && !editing && (
        <div className="mt-6 bg-gray-800 rounded-xl p-4 flex flex-col gap-3">
          <h2 className="font-semibold text-gray-300 text-sm uppercase tracking-wide">
            Importar / Exportar
          </h2>
          <div className="flex gap-2">
            <button
              onClick={handleExportJSON}
              className="flex-1 py-2.5 bg-gray-700 active:bg-gray-600 text-gray-300 rounded-xl text-sm"
            >
              ↓ JSON
            </button>
            <button
              onClick={handleExportCSV}
              className="flex-1 py-2.5 bg-gray-700 active:bg-gray-600 text-gray-300 rounded-xl text-sm"
            >
              ↓ CSV
            </button>
          </div>
          <label className="w-full py-2.5 bg-gray-700 active:bg-gray-600 text-gray-300 rounded-xl text-sm text-center cursor-pointer">
            ↑ Importar arquivo (.json ou .csv)
            <input
              type="file"
              accept=".json,.csv"
              className="hidden"
              onChange={handleImport}
            />
          </label>
        </div>
      )}
    </div>
  )
}
