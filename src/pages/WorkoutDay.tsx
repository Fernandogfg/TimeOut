import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import ExerciseCard from '../components/ExerciseCard'
import ExerciseForm from '../components/ExerciseForm'
import TabBar from '../components/TabBar'
import { getExercisesByDay, upsertExercise } from '../db/queries'
import type { Day, Exercise } from '../db/schema'

const DAY_LABELS: Record<string, string> = {
  monday: 'Segunda', tuesday: 'Terça', wednesday: 'Quarta',
  thursday: 'Quinta', friday: 'Sexta',
}

const TABS = [
  { key: 'main', label: 'Principal' },
  { key: 'mobility', label: 'Mobilidade' },
]

export default function WorkoutDay() {
  const { day } = useParams<{ day: string }>()
  const navigate = useNavigate()
  const [mainExercises, setMainExercises] = useState<Exercise[]>([])
  const [mobilityExercises, setMobilityExercises] = useState<Exercise[]>([])
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null)
  const [activeTab, setActiveTab] = useState<'main' | 'mobility'>('main')

  const load = () => {
    if (!day) return
    getExercisesByDay(day as Day).then((all) => {
      setMainExercises(all.filter((e) => e.type === 'main'))
      setMobilityExercises(all.filter((e) => e.type === 'mobility'))
    })
  }

  useEffect(() => { load() }, [day])

  const handleSave = async (exercise: Omit<Exercise, 'id'> & { id?: number }) => {
    await upsertExercise(exercise)
    load()
    setEditingExercise(null)
  }

  if (editingExercise) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4 max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-6 pt-2">
          <button onClick={() => setEditingExercise(null)} className="text-gray-400 text-lg">←</button>
          <h1 className="text-2xl font-bold">Editar Exercício</h1>
        </div>
        <ExerciseForm
          initial={editingExercise}
          onSave={handleSave}
          onCancel={() => setEditingExercise(null)}
        />
      </div>
    )
  }

  const visibleExercises = activeTab === 'main' ? mainExercises : mobilityExercises

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-4 pt-2">
        <Link to="/" className="text-gray-400 text-lg">←</Link>
        <h1 className="text-2xl font-bold">{DAY_LABELS[day ?? ''] ?? day}</h1>
      </div>

      <TabBar
        tabs={TABS}
        active={activeTab}
        onChange={(k) => setActiveTab(k as 'main' | 'mobility')}
      />

      <div className="flex flex-col gap-3 mb-28">
        {visibleExercises.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-3">
              {activeTab === 'main'
                ? 'Nenhum exercício cadastrado.'
                : 'Nenhum exercício de mobilidade.'}
            </p>
            <Link to="/settings" className="text-green-500 text-sm underline">
              Adicionar exercícios →
            </Link>
          </div>
        ) : (
          visibleExercises.map((ex, i) => (
            <ExerciseCard
              key={ex.id}
              exercise={ex}
              index={i}
              onEdit={setEditingExercise}
            />
          ))
        )}
      </div>

      {activeTab === 'main' && mainExercises.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-900 border-t border-gray-800 max-w-md mx-auto">
          <button
            onClick={() => navigate(`/execute/${day}`)}
            className="w-full py-4 bg-green-500 active:bg-green-600 text-white text-xl font-bold rounded-2xl"
          >
            Iniciar Treino →
          </button>
        </div>
      )}
    </div>
  )
}
