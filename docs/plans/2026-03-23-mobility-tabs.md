# Mobility Tabs Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Separar exercícios de mobilidade e principais em abas próprias nas telas WorkoutDay e WorkoutExecution.

**Architecture:** Criar um componente `TabBar` reutilizável; adicionar estado `activeTab` nas duas telas; substituir `MobilitySection` e `MobilityCollapse` pelas abas. Na execução, a aba de mobilidade é read-only (sem contador/timer).

**Tech Stack:** React 18 + TypeScript + Tailwind CSS + Vitest + @testing-library/react

---

## Task 1: Configurar Vitest com jsdom

**Files:**
- Modify: `vite.config.ts`

**Step 1: Adicionar bloco `test` no vite.config.ts**

Abra `vite.config.ts` e adicione a configuração de test. O arquivo final deve ficar assim:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'TimeOut — Treino',
        short_name: 'TimeOut',
        description: 'App de execução de programa de treino',
        theme_color: '#111827',
        background_color: '#111827',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
```

**Step 2: Instalar jsdom (se necessário)**

```bash
cd /sessions/vibrant-confident-brahmagupta/mnt/TimeOut
npm list jsdom 2>/dev/null | grep jsdom || npm install -D jsdom
```

**Step 3: Verificar que os testes rodam (sem erros de config)**

```bash
cd /sessions/vibrant-confident-brahmagupta/mnt/TimeOut
npm run test:run -- --reporter=verbose 2>&1 | tail -20
```

Expected: zero test files found (mas sem erros de configuração)

**Step 4: Commit**

```bash
cd /sessions/vibrant-confident-brahmagupta/mnt/TimeOut
git add vite.config.ts package.json package-lock.json
git commit -m "chore: configurar vitest com jsdom"
```

---

## Task 2: Criar componente TabBar

**Files:**
- Create: `src/components/TabBar.tsx`
- Create: `src/components/TabBar.test.tsx`

**Step 1: Escrever o teste antes do componente**

Crie `src/components/TabBar.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import TabBar from './TabBar'

const TABS = [
  { key: 'main', label: 'Principal' },
  { key: 'mobility', label: 'Mobilidade' },
]

describe('TabBar', () => {
  it('renders all tab labels', () => {
    render(<TabBar tabs={TABS} active="main" onChange={() => {}} />)
    expect(screen.getByText('Principal')).toBeInTheDocument()
    expect(screen.getByText('Mobilidade')).toBeInTheDocument()
  })

  it('marks the active tab with aria-selected', () => {
    render(<TabBar tabs={TABS} active="main" onChange={() => {}} />)
    expect(screen.getByRole('tab', { name: 'Principal' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Mobilidade' })).toHaveAttribute('aria-selected', 'false')
  })

  it('calls onChange with the correct key when a tab is clicked', async () => {
    const onChange = vi.fn()
    render(<TabBar tabs={TABS} active="main" onChange={onChange} />)
    await userEvent.click(screen.getByRole('tab', { name: 'Mobilidade' }))
    expect(onChange).toHaveBeenCalledWith('mobility')
  })

  it('does NOT call onChange when the already-active tab is clicked', async () => {
    const onChange = vi.fn()
    render(<TabBar tabs={TABS} active="main" onChange={onChange} />)
    await userEvent.click(screen.getByRole('tab', { name: 'Principal' }))
    expect(onChange).not.toHaveBeenCalled()
  })
})
```

**Step 2: Rodar o teste — deve falhar**

```bash
cd /sessions/vibrant-confident-brahmagupta/mnt/TimeOut
npm run test:run -- src/components/TabBar.test.tsx --reporter=verbose
```

Expected: FAIL — "Cannot find module './TabBar'"

**Step 3: Implementar `TabBar.tsx`**

Crie `src/components/TabBar.tsx`:

```tsx
interface Tab {
  key: string
  label: string
}

interface TabBarProps {
  tabs: Tab[]
  active: string
  onChange: (key: string) => void
}

export default function TabBar({ tabs, active, onChange }: TabBarProps) {
  return (
    <div role="tablist" className="flex border-b border-gray-700 mb-4">
      {tabs.map((tab) => {
        const isActive = tab.key === active
        return (
          <button
            key={tab.key}
            role="tab"
            aria-selected={isActive}
            onClick={() => { if (!isActive) onChange(tab.key) }}
            className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
              isActive
                ? 'text-white border-b-2 border-green-500 -mb-px'
                : 'text-gray-500'
            }`}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
```

**Step 4: Rodar o teste — deve passar**

```bash
cd /sessions/vibrant-confident-brahmagupta/mnt/TimeOut
npm run test:run -- src/components/TabBar.test.tsx --reporter=verbose
```

Expected: PASS — 4 tests passing

**Step 5: Commit**

```bash
cd /sessions/vibrant-confident-brahmagupta/mnt/TimeOut
git add src/components/TabBar.tsx src/components/TabBar.test.tsx
git commit -m "feat: componente TabBar reutilizável com testes"
```

---

## Task 3: Refatorar WorkoutDay para usar abas

**Files:**
- Modify: `src/pages/WorkoutDay.tsx`

O objetivo é substituir a lógica de `MobilitySection` por `TabBar` com estado `activeTab`.

**Step 1: Reescrever `WorkoutDay.tsx`**

Substitua todo o conteúdo de `src/pages/WorkoutDay.tsx` por:

```tsx
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
```

**Step 2: Verificar que o build não quebra**

```bash
cd /sessions/vibrant-confident-brahmagupta/mnt/TimeOut
npm run build 2>&1 | tail -20
```

Expected: sem erros de TypeScript ou build

**Step 3: Commit**

```bash
cd /sessions/vibrant-confident-brahmagupta/mnt/TimeOut
git add src/pages/WorkoutDay.tsx
git commit -m "feat: abas Principal/Mobilidade na tela WorkoutDay"
```

---

## Task 4: Refatorar WorkoutExecution para usar abas

**Files:**
- Modify: `src/pages/WorkoutExecution.tsx`

Remove o `MobilityCollapse` interno e adiciona `TabBar` + lista read-only de mobilidade.

**Step 1: Reescrever `WorkoutExecution.tsx`**

A mudança principal é: (a) importar `TabBar`, (b) adicionar estado `activeTab`, (c) substituir o bloco `{mobilityExercises.length > 0 && <MobilityCollapse ...>}` pelas abas, (d) deletar a função `MobilityCollapse` do final do arquivo.

Substitua todo o conteúdo de `src/pages/WorkoutExecution.tsx` por:

```tsx
import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import SetCounter from '../components/SetCounter'
import RestTimer from '../components/RestTimer'
import TabBar from '../components/TabBar'
import { getExercisesByDay, logWorkoutCompletion } from '../db/queries'
import { useWorkoutSession } from '../store/workoutSession'
import { useSettings } from '../store/settings'
import type { Day, Exercise } from '../db/schema'

const DAY_LABELS: Record<string, string> = {
  monday: 'Segunda', tuesday: 'Terça', wednesday: 'Quarta',
  thursday: 'Quinta', friday: 'Sexta',
}

const TABS = [
  { key: 'main', label: 'Principal' },
  { key: 'mobility', label: 'Mobilidade' },
]

function formatElapsed(s: number): string {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  return `${m}:${sec.toString().padStart(2, '0')}`
}

function ExerciseRow({
  exercise,
  index,
  completedSets,
  isActive,
  onToggle,
}: {
  exercise: Exercise
  index: number
  completedSets: number
  isActive: boolean
  onToggle: () => void
}) {
  const { defaultRestSeconds } = useSettings()
  const {
    isRestTimerRunning, restTimerSeconds,
    completeSet, startRestTimer, stopRestTimer,
    pauseRestTimer, resumeRestTimer, tickRestTimer,
  } = useWorkoutSession()

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const allDone = completedSets >= exercise.sets
  const restTime = exercise.restSeconds ?? defaultRestSeconds

  useEffect(() => {
    if (isActive && isRestTimerRunning) {
      timerRef.current = setInterval(() => tickRestTimer(), 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [isActive, isRestTimerRunning])

  const handleSetComplete = () => {
    completeSet(exercise.id!)
    const newCompleted = completedSets + 1
    if (newCompleted < exercise.sets) {
      startRestTimer(restTime)
    }
  }

  return (
    <div className={`rounded-xl overflow-hidden transition-all ${isActive ? 'bg-gray-700' : 'bg-gray-800'}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-gray-500 text-sm w-5">{index + 1}</span>
          <div>
            <p className="text-white font-medium leading-tight">{exercise.name}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {exercise.sets} × {exercise.reps}
              {exercise.weight > 0 ? ` · ${exercise.weight}kg` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-2 shrink-0">
          {allDone ? (
            <span className="text-green-400 font-bold text-lg">✓</span>
          ) : completedSets > 0 ? (
            <span className="text-sm text-gray-300 font-semibold">
              {completedSets}/{exercise.sets}
            </span>
          ) : (
            <span className="text-gray-600 text-sm">{isActive ? '▲' : '▼'}</span>
          )}
        </div>
      </button>

      {isActive && (
        <div className="px-4 pb-4 flex flex-col gap-4 border-t border-gray-600 pt-4">
          {exercise.description && (
            <p className="text-sm text-gray-400">{exercise.description}</p>
          )}
          {(isRestTimerRunning || restTimerSeconds > 0) && (
            <div className="bg-gray-800 rounded-2xl p-5 flex flex-col items-center gap-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Descanso</p>
              <RestTimer
                seconds={restTimerSeconds}
                running={isRestTimerRunning}
                onFinish={stopRestTimer}
              />
              <div className="flex gap-3 w-full">
                <button
                  onClick={isRestTimerRunning ? pauseRestTimer : resumeRestTimer}
                  className="flex-1 py-2 bg-gray-700 active:bg-gray-600 text-white text-sm font-semibold rounded-xl"
                >
                  {isRestTimerRunning ? '⏸ Pausar' : '▶ Retomar'}
                </button>
                <button
                  onClick={stopRestTimer}
                  className="flex-1 py-2 bg-gray-700 active:bg-gray-600 text-gray-400 text-sm rounded-xl"
                >
                  Pular ➔
                </button>
              </div>
            </div>
          )}
          {!isRestTimerRunning && restTimerSeconds === 0 && (
            <SetCounter
              completed={completedSets}
              total={exercise.sets}
              onComplete={handleSetComplete}
            />
          )}
        </div>
      )}
    </div>
  )
}

function MobilityReadOnly({ exercises }: { exercises: Exercise[] }) {
  if (exercises.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Nenhum exercício de mobilidade.</p>
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-2">
      {exercises.map((ex, i) => (
        <div key={ex.id} className="bg-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">
            {i + 1}. Mobilidade
          </p>
          <p className="text-white font-medium">{ex.name}</p>
          <p className="text-sm text-gray-400 mt-0.5">
            {ex.sets} × {ex.reps}
            {ex.weight > 0 ? ` — ${ex.weight}kg` : ' — Peso corporal'}
          </p>
          {ex.description && (
            <p className="text-xs text-gray-500 mt-1">{ex.description}</p>
          )}
        </div>
      ))}
    </div>
  )
}

export default function WorkoutExecution() {
  const { day } = useParams<{ day: string }>()
  const navigate = useNavigate()
  const {
    exercises, activeExerciseId, setsCompleted,
    startSession, setActiveExercise,
    elapsedSeconds, isWorkoutTimerRunning, tickWorkout, toggleWorkoutTimer,
    reset,
  } = useWorkoutSession()

  const workoutTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [done, setDone] = useState(false)
  const [mobilityExercises, setMobilityExercises] = useState<Exercise[]>([])
  const [activeTab, setActiveTab] = useState<'main' | 'mobility'>('main')

  useEffect(() => {
    if (!day) return
    getExercisesByDay(day as Day).then((all) => {
      const main = all.filter((e) => e.type === 'main')
      const mobility = all.filter((e) => e.type === 'mobility')
      setMobilityExercises(mobility)
      startSession(main)
    })
    return () => reset()
  }, [day])

  useEffect(() => {
    workoutTimerRef.current = setInterval(() => tickWorkout(), 1000)
    return () => { if (workoutTimerRef.current) clearInterval(workoutTimerRef.current) }
  }, [])

  const allMainDone = exercises.length > 0 && exercises.every(
    (ex) => (setsCompleted[ex.id!] ?? 0) >= ex.sets
  )

  const handleFinish = async () => {
    await logWorkoutCompletion(day as Day)
    setDone(true)
  }

  const handleToggle = (id: number) => {
    setActiveExercise(activeExerciseId === id ? null : id)
  }

  if (exercises.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p className="text-gray-500">Carregando...</p>
      </div>
    )
  }

  if (done) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center gap-6 p-4">
        <div className="text-7xl">🏆</div>
        <h1 className="text-3xl font-bold">Treino Concluído!</h1>
        <p className="text-gray-400 text-center">{DAY_LABELS[day ?? '']} · {formatElapsed(elapsedSeconds)}</p>
        <button
          onClick={() => navigate('/')}
          className="w-full max-w-xs py-4 bg-green-500 active:bg-green-600 text-white text-xl font-bold rounded-2xl"
        >
          Voltar ao Início
        </button>
      </div>
    )
  }

  const doneCount = exercises.filter((ex) => (setsCompleted[ex.id!] ?? 0) >= ex.sets).length

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <Link to={`/day/${day}`} className="text-gray-400 text-sm px-2 py-1">
          ← Sair
        </Link>
        <p className="text-sm text-gray-500">
          {DAY_LABELS[day ?? '']} · {doneCount}/{exercises.length}
        </p>
      </div>

      {/* Workout timer */}
      <button
        onClick={toggleWorkoutTimer}
        className={`mx-4 mb-4 rounded-2xl py-4 flex flex-col items-center gap-1 transition-colors ${
          isWorkoutTimerRunning ? 'bg-gray-800' : 'bg-red-900/60 border border-red-700'
        }`}
      >
        <span className={`text-4xl font-mono font-bold tabular-nums ${
          isWorkoutTimerRunning ? 'text-white' : 'text-red-400'
        }`}>
          {formatElapsed(elapsedSeconds)}
        </span>
        <span className={`text-xs uppercase tracking-widest ${
          isWorkoutTimerRunning ? 'text-gray-500' : 'text-red-500'
        }`}>
          {isWorkoutTimerRunning ? 'tempo de treino · toque para pausar' : '⏸ pausado · toque para retomar'}
        </span>
      </button>

      {/* Progress bar (only counts main exercises) */}
      <div className="mx-4 mb-2">
        <div className="w-full bg-gray-800 rounded-full h-1.5">
          <div
            className="bg-green-500 h-1.5 rounded-full transition-all duration-500"
            style={{ width: exercises.length > 0 ? `${(doneCount / exercises.length) * 100}%` : '0%' }}
          />
        </div>
      </div>

      {/* Tab bar */}
      <div className="px-4">
        <TabBar
          tabs={TABS}
          active={activeTab}
          onChange={(k) => setActiveTab(k as 'main' | 'mobility')}
        />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col gap-2 px-4 pb-28 overflow-y-auto">
        {activeTab === 'main' ? (
          exercises.map((ex, i) => (
            <ExerciseRow
              key={ex.id}
              exercise={ex}
              index={i}
              completedSets={setsCompleted[ex.id!] ?? 0}
              isActive={activeExerciseId === ex.id}
              onToggle={() => handleToggle(ex.id!)}
            />
          ))
        ) : (
          <MobilityReadOnly exercises={mobilityExercises} />
        )}
      </div>

      {/* Footer: Finalizar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-900 border-t border-gray-800 max-w-md mx-auto">
        <button
          onClick={handleFinish}
          className={`w-full py-4 text-white text-lg font-bold rounded-2xl transition-colors ${
            allMainDone
              ? 'bg-green-500 active:bg-green-600'
              : 'bg-gray-700 active:bg-gray-600'
          }`}
        >
          {allMainDone ? 'Finalizar Treino 🏁' : `Encerrar (${doneCount}/${exercises.length} completos)`}
        </button>
      </div>
    </div>
  )
}
```

**Step 2: Verificar que o build não quebra**

```bash
cd /sessions/vibrant-confident-brahmagupta/mnt/TimeOut
npm run build 2>&1 | tail -20
```

Expected: sem erros

**Step 3: Commit**

```bash
cd /sessions/vibrant-confident-brahmagupta/mnt/TimeOut
git add src/pages/WorkoutExecution.tsx
git commit -m "feat: abas Principal/Mobilidade na tela WorkoutExecution"
```

---

## Task 5: Remover MobilitySection

**Files:**
- Delete: `src/components/MobilitySection.tsx`

O componente `MobilitySection` não é mais usado (foi substituído pelo `TabBar` nas duas telas).

**Step 1: Verificar que nenhum arquivo importa MobilitySection**

```bash
cd /sessions/vibrant-confident-brahmagupta/mnt/TimeOut
grep -r "MobilitySection" src/ --include="*.tsx" --include="*.ts"
```

Expected: nenhum resultado (zero linhas)

**Step 2: Deletar o arquivo**

```bash
cd /sessions/vibrant-confident-brahmagupta/mnt/TimeOut
rm src/components/MobilitySection.tsx
```

**Step 3: Build final de verificação**

```bash
cd /sessions/vibrant-confident-brahmagupta/mnt/TimeOut
npm run build 2>&1 | tail -20
```

Expected: build bem-sucedido, sem referência a MobilitySection

**Step 4: Rodar todos os testes**

```bash
cd /sessions/vibrant-confident-brahmagupta/mnt/TimeOut
npm run test:run -- --reporter=verbose
```

Expected: TabBar tests — 4 passing

**Step 5: Commit final**

```bash
cd /sessions/vibrant-confident-brahmagupta/mnt/TimeOut
git add -A
git commit -m "feat: remover MobilitySection — substituído por TabBar"
```
