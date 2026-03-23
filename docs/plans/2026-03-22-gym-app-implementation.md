# Gym Training App — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a mobile-first PWA for executing a personal gym training program with offline support, set counter, and rest timer.

**Architecture:** React 18 + Vite SPA with client-side routing. All data persisted in IndexedDB via Dexie.js. Service Worker (Workbox) enables full offline operation. Zustand manages ephemeral session state (current exercise, timer).

**Tech Stack:** React 18, Vite, TypeScript, Tailwind CSS, Dexie.js, Zustand, React Router v6, vite-plugin-pwa, Vitest, React Testing Library

---

## Phase 1: Project Setup

---

### Task 1: Scaffold Vite + React + TypeScript project

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/App.tsx`

**Step 1: Scaffold the project in the workspace folder**

```bash
cd /path/to/TimeOut
npm create vite@latest . -- --template react-ts --force
# If it asks to overwrite, confirm yes (docs/ folder is safe)
npm install
```

**Step 2: Verify it runs**

```bash
npm run dev
```
Expected: Vite dev server starts at `http://localhost:5173`

**Step 3: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite React TypeScript project"
```

---

### Task 2: Configure Tailwind CSS

**Files:**
- Create: `tailwind.config.js`, `postcss.config.js`
- Modify: `src/index.css`

**Step 1: Install Tailwind**

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**Step 2: Update `tailwind.config.js`**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

**Step 3: Replace `src/index.css` content**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Step 4: Verify Tailwind works — update `src/App.tsx`**

```tsx
export default function App() {
  return <h1 className="text-3xl font-bold text-center mt-10">TimeOut</h1>
}
```

**Step 5: Run dev server and confirm styled heading appears**

```bash
npm run dev
```

**Step 6: Commit**

```bash
git add -A
git commit -m "chore: configure Tailwind CSS"
```

---

### Task 3: Install all dependencies and configure PWA

**Files:**
- Modify: `vite.config.ts`
- Create: `public/manifest.webmanifest`, `public/icon-192.png`, `public/icon-512.png`

**Step 1: Install runtime dependencies**

```bash
npm install dexie zustand react-router-dom
```

**Step 2: Install dev dependencies**

```bash
npm install -D vite-plugin-pwa workbox-window
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @vitest/coverage-v8
```

**Step 3: Update `vite.config.ts`**

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
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
})
```

**Step 4: Create test setup file `src/test/setup.ts`**

```ts
import '@testing-library/jest-dom'
```

**Step 5: Add placeholder icons (any 192×192 and 512×512 PNG — can be replaced later)**

```bash
# Generate simple placeholder icons using Node canvas or just copy any PNG
# Minimum: place any icon-192.png and icon-512.png in public/
```

**Step 6: Add test script to `package.json`**

```json
"scripts": {
  "test": "vitest",
  "test:ui": "vitest --ui",
  "test:coverage": "vitest run --coverage"
}
```

**Step 7: Commit**

```bash
git add -A
git commit -m "chore: install deps and configure PWA + Vitest"
```

---

### Task 4: Set up folder structure and routing

**Files:**
- Create: `src/pages/Home.tsx`, `src/pages/WorkoutDay.tsx`, `src/pages/WorkoutExecution.tsx`, `src/pages/Settings.tsx`
- Create: `src/components/.gitkeep`, `src/db/.gitkeep`, `src/store/.gitkeep`, `src/utils/.gitkeep`
- Modify: `src/App.tsx`

**Step 1: Create stub pages**

`src/pages/Home.tsx`:
```tsx
export default function Home() {
  return <div className="p-4"><h1 className="text-2xl font-bold">Home</h1></div>
}
```

Repeat for `WorkoutDay.tsx`, `WorkoutExecution.tsx`, `Settings.tsx` with matching titles.

**Step 2: Set up routing in `src/App.tsx`**

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import WorkoutDay from './pages/WorkoutDay'
import WorkoutExecution from './pages/WorkoutExecution'
import Settings from './pages/Settings'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/day/:day" element={<WorkoutDay />} />
        <Route path="/execute/:day" element={<WorkoutExecution />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </BrowserRouter>
  )
}
```

**Step 3: Verify routing works**

```bash
npm run dev
# Navigate to /, /day/monday, /execute/monday, /settings
```

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add page stubs and React Router setup"
```

---

## Phase 2: Data Layer

---

### Task 5: Define Dexie schema

**Files:**
- Create: `src/db/schema.ts`
- Create: `src/db/schema.test.ts`

**Step 1: Write the failing test**

`src/db/schema.test.ts`:
```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { db } from './schema'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

afterEach(async () => {
  await db.close()
})

describe('db schema', () => {
  it('can add and retrieve an exercise', async () => {
    const id = await db.exercises.add({
      day: 'monday',
      type: 'main',
      order: 1,
      name: 'Supino',
      sets: 4,
      reps: 10,
      weight: 80,
    })
    const exercise = await db.exercises.get(id)
    expect(exercise?.name).toBe('Supino')
    expect(exercise?.day).toBe('monday')
  })

  it('can log a workout and count completions', async () => {
    await db.workoutLog.add({ day: 'monday', completedAt: new Date() })
    await db.workoutLog.add({ day: 'monday', completedAt: new Date() })
    const count = await db.workoutLog.where('day').equals('monday').count()
    expect(count).toBe(2)
  })
})
```

**Step 2: Run test to verify it fails**

```bash
npm test -- schema.test.ts
```
Expected: FAIL — `db` not found

**Step 3: Implement the schema**

`src/db/schema.ts`:
```ts
import Dexie, { type Table } from 'dexie'

export type Day = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday'
export type ExerciseType = 'main' | 'mobility'

export interface Exercise {
  id?: number
  day: Day
  type: ExerciseType
  order: number
  name: string
  sets: number
  reps: number
  weight: number
  description?: string
  restSeconds?: number
}

export interface WorkoutLog {
  id?: number
  day: Day
  completedAt: Date
}

export interface AppState {
  key: string
  value: unknown
}

class GymDB extends Dexie {
  exercises!: Table<Exercise>
  workoutLog!: Table<WorkoutLog>
  appState!: Table<AppState>

  constructor() {
    super('GymDB')
    this.version(1).stores({
      exercises: '++id, day, type, order',
      workoutLog: '++id, day, completedAt',
      appState: 'key',
    })
  }
}

export const db = new GymDB()
```

**Step 4: Run test to verify it passes**

```bash
npm test -- schema.test.ts
```
Expected: PASS (2 tests)

**Step 5: Commit**

```bash
git add src/db/schema.ts src/db/schema.test.ts
git commit -m "feat: add Dexie schema for exercises, workoutLog, appState"
```

---

### Task 6: Database query helpers

**Files:**
- Create: `src/db/queries.ts`
- Create: `src/db/queries.test.ts`

**Step 1: Write failing tests**

`src/db/queries.test.ts`:
```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { db } from './schema'
import {
  getExercisesByDay,
  getWorkoutCount,
  logWorkoutCompletion,
  upsertExercise,
  deleteExercise,
  reorderExercises,
} from './queries'

beforeEach(async () => {
  await db.delete()
  await db.open()
})
afterEach(async () => db.close())

describe('getExercisesByDay', () => {
  it('returns exercises for a given day sorted by order', async () => {
    await db.exercises.bulkAdd([
      { day: 'monday', type: 'main', order: 2, name: 'Agachamento', sets: 4, reps: 8, weight: 100 },
      { day: 'monday', type: 'main', order: 1, name: 'Supino', sets: 4, reps: 10, weight: 80 },
    ])
    const result = await getExercisesByDay('monday')
    expect(result[0].name).toBe('Supino')
    expect(result[1].name).toBe('Agachamento')
  })
})

describe('getWorkoutCount', () => {
  it('returns count of completions for a day', async () => {
    await db.workoutLog.bulkAdd([
      { day: 'monday', completedAt: new Date() },
      { day: 'monday', completedAt: new Date() },
      { day: 'tuesday', completedAt: new Date() },
    ])
    expect(await getWorkoutCount('monday')).toBe(2)
    expect(await getWorkoutCount('tuesday')).toBe(1)
  })
})

describe('logWorkoutCompletion', () => {
  it('adds a log entry for the day', async () => {
    await logWorkoutCompletion('friday')
    const count = await getWorkoutCount('friday')
    expect(count).toBe(1)
  })
})

describe('upsertExercise', () => {
  it('adds a new exercise', async () => {
    await upsertExercise({ day: 'monday', type: 'main', order: 1, name: 'Rosca', sets: 3, reps: 12, weight: 20 })
    const exercises = await getExercisesByDay('monday')
    expect(exercises).toHaveLength(1)
    expect(exercises[0].name).toBe('Rosca')
  })

  it('updates an existing exercise', async () => {
    const id = await db.exercises.add({ day: 'monday', type: 'main', order: 1, name: 'Rosca', sets: 3, reps: 12, weight: 20 })
    await upsertExercise({ id, day: 'monday', type: 'main', order: 1, name: 'Rosca Direta', sets: 3, reps: 12, weight: 22 })
    const updated = await db.exercises.get(id)
    expect(updated?.name).toBe('Rosca Direta')
    expect(updated?.weight).toBe(22)
  })
})

describe('deleteExercise', () => {
  it('removes an exercise by id', async () => {
    const id = await db.exercises.add({ day: 'monday', type: 'main', order: 1, name: 'Supino', sets: 4, reps: 10, weight: 80 })
    await deleteExercise(id)
    const result = await db.exercises.get(id)
    expect(result).toBeUndefined()
  })
})
```

**Step 2: Run test to verify it fails**

```bash
npm test -- queries.test.ts
```
Expected: FAIL

**Step 3: Implement queries**

`src/db/queries.ts`:
```ts
import { db, type Day, type Exercise } from './schema'

export async function getExercisesByDay(day: Day): Promise<Exercise[]> {
  const exercises = await db.exercises.where('day').equals(day).toArray()
  return exercises.sort((a, b) => a.order - b.order)
}

export async function getWorkoutCount(day: Day): Promise<number> {
  return db.workoutLog.where('day').equals(day).count()
}

export async function logWorkoutCompletion(day: Day): Promise<void> {
  await db.workoutLog.add({ day, completedAt: new Date() })
}

export async function upsertExercise(exercise: Exercise): Promise<void> {
  if (exercise.id !== undefined) {
    await db.exercises.put(exercise)
  } else {
    await db.exercises.add(exercise)
  }
}

export async function deleteExercise(id: number): Promise<void> {
  await db.exercises.delete(id)
}

export async function reorderExercises(updates: { id: number; order: number }[]): Promise<void> {
  await db.transaction('rw', db.exercises, async () => {
    for (const { id, order } of updates) {
      await db.exercises.update(id, { order })
    }
  })
}

export async function getAppState<T>(key: string, defaultValue: T): Promise<T> {
  const entry = await db.appState.get(key)
  return entry ? (entry.value as T) : defaultValue
}

export async function setAppState<T>(key: string, value: T): Promise<void> {
  await db.appState.put({ key, value })
}
```

**Step 4: Run tests**

```bash
npm test -- queries.test.ts
```
Expected: PASS (all tests)

**Step 5: Commit**

```bash
git add src/db/queries.ts src/db/queries.test.ts
git commit -m "feat: add database query helpers with tests"
```

---

## Phase 3: State Management

---

### Task 7: Zustand stores

**Files:**
- Create: `src/store/workoutSession.ts`
- Create: `src/store/settings.ts`
- Create: `src/store/workoutSession.test.ts`

**Step 1: Write failing test for workout session store**

`src/store/workoutSession.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useWorkoutSession } from './workoutSession'
import { act } from '@testing-library/react'

beforeEach(() => {
  // Reset store between tests
  useWorkoutSession.getState().reset()
})

describe('workoutSession store', () => {
  it('initialises with no exercises', () => {
    const state = useWorkoutSession.getState()
    expect(state.exercises).toEqual([])
    expect(state.currentIndex).toBe(0)
  })

  it('can start a session with exercises', () => {
    act(() => {
      useWorkoutSession.getState().startSession([
        { id: 1, day: 'monday', type: 'main', order: 1, name: 'Supino', sets: 4, reps: 10, weight: 80 },
      ])
    })
    expect(useWorkoutSession.getState().exercises).toHaveLength(1)
    expect(useWorkoutSession.getState().currentIndex).toBe(0)
  })

  it('advances to next exercise', () => {
    act(() => {
      useWorkoutSession.getState().startSession([
        { id: 1, day: 'monday', type: 'main', order: 1, name: 'A', sets: 3, reps: 10, weight: 50 },
        { id: 2, day: 'monday', type: 'main', order: 2, name: 'B', sets: 3, reps: 10, weight: 60 },
      ])
      useWorkoutSession.getState().next()
    })
    expect(useWorkoutSession.getState().currentIndex).toBe(1)
  })

  it('tracks completed sets', () => {
    act(() => {
      useWorkoutSession.getState().startSession([
        { id: 1, day: 'monday', type: 'main', order: 1, name: 'Supino', sets: 4, reps: 10, weight: 80 },
      ])
      useWorkoutSession.getState().completeSet()
    })
    expect(useWorkoutSession.getState().completedSets).toBe(1)
  })
})
```

**Step 2: Run test to verify it fails**

```bash
npm test -- workoutSession.test.ts
```
Expected: FAIL

**Step 3: Implement workout session store**

`src/store/workoutSession.ts`:
```ts
import { create } from 'zustand'
import type { Exercise } from '../db/schema'

interface WorkoutSessionState {
  exercises: Exercise[]
  currentIndex: number
  completedSets: number
  isTimerRunning: boolean
  timerSeconds: number
  startSession: (exercises: Exercise[]) => void
  next: () => void
  prev: () => void
  completeSet: () => void
  startTimer: (seconds: number) => void
  stopTimer: () => void
  tickTimer: () => void
  reset: () => void
}

export const useWorkoutSession = create<WorkoutSessionState>((set) => ({
  exercises: [],
  currentIndex: 0,
  completedSets: 0,
  isTimerRunning: false,
  timerSeconds: 0,

  startSession: (exercises) => set({ exercises, currentIndex: 0, completedSets: 0 }),

  next: () => set((s) => ({
    currentIndex: Math.min(s.currentIndex + 1, s.exercises.length - 1),
    completedSets: 0,
  })),

  prev: () => set((s) => ({
    currentIndex: Math.max(s.currentIndex - 1, 0),
    completedSets: 0,
  })),

  completeSet: () => set((s) => ({ completedSets: s.completedSets + 1 })),

  startTimer: (seconds) => set({ timerSeconds: seconds, isTimerRunning: true }),

  stopTimer: () => set({ isTimerRunning: false }),

  tickTimer: () => set((s) => ({
    timerSeconds: Math.max(s.timerSeconds - 1, 0),
    isTimerRunning: s.timerSeconds > 1,
  })),

  reset: () => set({ exercises: [], currentIndex: 0, completedSets: 0, isTimerRunning: false, timerSeconds: 0 }),
}))
```

`src/store/settings.ts`:
```ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
  defaultRestSeconds: number
  soundEnabled: boolean
  setDefaultRest: (seconds: number) => void
  toggleSound: () => void
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      defaultRestSeconds: 60,
      soundEnabled: true,
      setDefaultRest: (seconds) => set({ defaultRestSeconds: seconds }),
      toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
    }),
    { name: 'timeout-settings' }
  )
)
```

**Step 4: Run tests**

```bash
npm test -- workoutSession.test.ts
```
Expected: PASS

**Step 5: Commit**

```bash
git add src/store/
git commit -m "feat: add Zustand stores for workout session and settings"
```

---

## Phase 4: Core Components

---

### Task 8: RestTimer component

**Files:**
- Create: `src/components/RestTimer.tsx`
- Create: `src/components/RestTimer.test.tsx`

**Step 1: Write failing test**

`src/components/RestTimer.test.tsx`:
```tsx
import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import RestTimer from './RestTimer'

describe('RestTimer', () => {
  it('displays the time remaining', () => {
    render(<RestTimer seconds={60} running={true} onFinish={() => {}} />)
    expect(screen.getByText('1:00')).toBeInTheDocument()
  })

  it('shows 0:00 when time is up', () => {
    render(<RestTimer seconds={0} running={false} onFinish={() => {}} />)
    expect(screen.getByText('0:00')).toBeInTheDocument()
  })

  it('calls onFinish when timer reaches 0', () => {
    const onFinish = vi.fn()
    render(<RestTimer seconds={0} running={true} onFinish={onFinish} />)
    expect(onFinish).toHaveBeenCalled()
  })
})
```

**Step 2: Run test to verify it fails**

```bash
npm test -- RestTimer.test.tsx
```
Expected: FAIL

**Step 3: Implement RestTimer**

`src/components/RestTimer.tsx`:
```tsx
import { useEffect, useRef } from 'react'

interface Props {
  seconds: number
  running: boolean
  onFinish: () => void
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export default function RestTimer({ seconds, running, onFinish }: Props) {
  const calledFinish = useRef(false)

  useEffect(() => {
    if (seconds === 0 && running && !calledFinish.current) {
      calledFinish.current = true
      onFinish()
      if (navigator.vibrate) navigator.vibrate([200, 100, 200])
    }
    if (seconds > 0) calledFinish.current = false
  }, [seconds, running, onFinish])

  const radius = 54
  const circumference = 2 * Math.PI * radius

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-5xl font-mono font-bold tabular-nums">
        {formatTime(seconds)}
      </div>
      {running && (
        <p className="text-sm text-gray-400">descansando...</p>
      )}
    </div>
  )
}
```

**Step 4: Run tests**

```bash
npm test -- RestTimer.test.tsx
```
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/RestTimer.tsx src/components/RestTimer.test.tsx
git commit -m "feat: add RestTimer component with vibration support"
```

---

### Task 9: SetCounter component

**Files:**
- Create: `src/components/SetCounter.tsx`
- Create: `src/components/SetCounter.test.tsx`

**Step 1: Write failing test**

`src/components/SetCounter.test.tsx`:
```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import SetCounter from './SetCounter'

describe('SetCounter', () => {
  it('displays current and total sets', () => {
    render(<SetCounter completed={2} total={4} onComplete={() => {}} />)
    expect(screen.getByText(/série 3 de 4/i)).toBeInTheDocument()
  })

  it('shows completion state when all sets done', () => {
    render(<SetCounter completed={4} total={4} onComplete={() => {}} />)
    expect(screen.getByText(/concluído/i)).toBeInTheDocument()
  })

  it('calls onComplete when button is tapped', () => {
    const onComplete = vi.fn()
    render(<SetCounter completed={1} total={4} onComplete={onComplete} />)
    fireEvent.click(screen.getByRole('button', { name: /série feita/i }))
    expect(onComplete).toHaveBeenCalledOnce()
  })

  it('hides button when all sets are done', () => {
    render(<SetCounter completed={4} total={4} onComplete={() => {}} />)
    expect(screen.queryByRole('button', { name: /série feita/i })).not.toBeInTheDocument()
  })
})
```

**Step 2: Run test to verify it fails**

```bash
npm test -- SetCounter.test.tsx
```

**Step 3: Implement SetCounter**

`src/components/SetCounter.tsx`:
```tsx
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
      {!allDone && (
        <button
          onClick={onComplete}
          className="w-full py-5 bg-green-500 active:bg-green-600 text-white text-xl font-bold rounded-2xl select-none"
          aria-label="Série feita"
        >
          ✓ Série Feita
        </button>
      )}
    </div>
  )
}
```

**Step 4: Run tests**

```bash
npm test -- SetCounter.test.tsx
```
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/SetCounter.tsx src/components/SetCounter.test.tsx
git commit -m "feat: add SetCounter component"
```

---

### Task 10: ExerciseCard and DayCard components

**Files:**
- Create: `src/components/ExerciseCard.tsx`
- Create: `src/components/DayCard.tsx`

**Step 1: Implement ExerciseCard**

`src/components/ExerciseCard.tsx`:
```tsx
import { useState } from 'react'
import type { Exercise } from '../db/schema'

interface Props {
  exercise: Exercise
  index: number
}

const DAY_LABELS: Record<string, string> = {
  monday: 'Segunda', tuesday: 'Terça', wednesday: 'Quarta',
  thursday: 'Quinta', friday: 'Sexta',
}

export default function ExerciseCard({ exercise, index }: Props) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-gray-800 rounded-xl p-4 flex flex-col gap-1">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            {index + 1}. {exercise.type === 'mobility' ? 'Mobilidade' : 'Principal'}
          </p>
          <p className="text-lg font-semibold text-white">{exercise.name}</p>
          <p className="text-sm text-gray-300">
            {exercise.sets} × {exercise.reps} — {exercise.weight > 0 ? `${exercise.weight}kg` : 'Peso corporal'}
          </p>
        </div>
        {exercise.description && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-gray-500 text-sm px-2"
            aria-label="Ver descrição"
          >
            {expanded ? '▲' : '▼'}
          </button>
        )}
      </div>
      {expanded && exercise.description && (
        <p className="text-sm text-gray-400 mt-1 border-t border-gray-700 pt-2">
          {exercise.description}
        </p>
      )}
    </div>
  )
}
```

**Step 2: Implement DayCard**

`src/components/DayCard.tsx`:
```tsx
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
      className={`flex items-center justify-between p-4 rounded-xl ${
        isToday ? 'bg-green-600' : 'bg-gray-800'
      } active:opacity-80`}
    >
      <div>
        <p className={`text-lg font-bold ${isToday ? 'text-white' : 'text-gray-100'}`}>
          {DAY_LABELS[day]}
          {isToday && <span className="ml-2 text-xs font-normal bg-white/20 px-2 py-0.5 rounded-full">hoje</span>}
        </p>
      </div>
      <p className="text-sm text-gray-300">{count}× feito</p>
    </Link>
  )
}
```

**Step 3: Run dev and verify cards render without errors**

```bash
npm run dev
```

**Step 4: Commit**

```bash
git add src/components/ExerciseCard.tsx src/components/DayCard.tsx
git commit -m "feat: add ExerciseCard and DayCard components"
```

---

## Phase 5: Pages

---

### Task 11: Home page

**Files:**
- Modify: `src/pages/Home.tsx`

**Step 1: Implement Home page**

`src/pages/Home.tsx`:
```tsx
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">TimeOut</h1>
        <Link to="/settings" className="text-gray-400 text-sm">⚙ Config</Link>
      </div>
      <div className="flex flex-col gap-3">
        {DAYS.map((day) => (
          <DayCard key={day} day={day} count={counts[day]} />
        ))}
      </div>
    </div>
  )
}
```

**Step 2: Navigate to `/` and verify all 5 days appear**

```bash
npm run dev
```

**Step 3: Commit**

```bash
git add src/pages/Home.tsx
git commit -m "feat: implement Home page with weekly view"
```

---

### Task 12: WorkoutDay page

**Files:**
- Modify: `src/pages/WorkoutDay.tsx`
- Create: `src/components/MobilitySection.tsx`

**Step 1: Implement MobilitySection**

`src/components/MobilitySection.tsx`:
```tsx
import { useState } from 'react'
import ExerciseCard from './ExerciseCard'
import type { Exercise } from '../db/schema'

interface Props {
  exercises: Exercise[]
}

export default function MobilitySection({ exercises }: Props) {
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
            <ExerciseCard key={ex.id} exercise={ex} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}
```

**Step 2: Implement WorkoutDay page**

`src/pages/WorkoutDay.tsx`:
```tsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import ExerciseCard from '../components/ExerciseCard'
import MobilitySection from '../components/MobilitySection'
import { getExercisesByDay } from '../db/queries'
import type { Day, Exercise } from '../db/schema'

const DAY_LABELS: Record<string, string> = {
  monday: 'Segunda', tuesday: 'Terça', wednesday: 'Quarta',
  thursday: 'Quinta', friday: 'Sexta',
}

export default function WorkoutDay() {
  const { day } = useParams<{ day: string }>()
  const navigate = useNavigate()
  const [mainExercises, setMainExercises] = useState<Exercise[]>([])
  const [mobilityExercises, setMobilityExercises] = useState<Exercise[]>([])

  useEffect(() => {
    if (!day) return
    getExercisesByDay(day as Day).then((all) => {
      setMainExercises(all.filter((e) => e.type === 'main'))
      setMobilityExercises(all.filter((e) => e.type === 'mobility'))
    })
  }, [day])

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/" className="text-gray-400">← </Link>
        <h1 className="text-2xl font-bold">{DAY_LABELS[day ?? ''] ?? day}</h1>
      </div>

      <MobilitySection exercises={mobilityExercises} />

      <div className="flex flex-col gap-3 mb-24">
        {mainExercises.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Nenhum exercício cadastrado.</p>
        ) : (
          mainExercises.map((ex, i) => (
            <ExerciseCard key={ex.id} exercise={ex} index={i} />
          ))
        )}
      </div>

      {mainExercises.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-900 border-t border-gray-800 max-w-md mx-auto">
          <button
            onClick={() => navigate(`/execute/${day}`)}
            className="w-full py-4 bg-green-500 active:bg-green-600 text-white text-xl font-bold rounded-2xl"
          >
            Iniciar Treino
          </button>
        </div>
      )}
    </div>
  )
}
```

**Step 3: Test manually — navigate to `/day/monday`**

**Step 4: Commit**

```bash
git add src/pages/WorkoutDay.tsx src/components/MobilitySection.tsx
git commit -m "feat: implement WorkoutDay page with mobility section"
```

---

### Task 13: WorkoutExecution page (core gym screen)

**Files:**
- Modify: `src/pages/WorkoutExecution.tsx`

**Step 1: Implement WorkoutExecution page**

`src/pages/WorkoutExecution.tsx`:
```tsx
import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import SetCounter from '../components/SetCounter'
import RestTimer from '../components/RestTimer'
import { getExercisesByDay, logWorkoutCompletion } from '../db/queries'
import { useWorkoutSession } from '../store/workoutSession'
import { useSettings } from '../store/settings'
import type { Day } from '../db/schema'

const DAY_LABELS: Record<string, string> = {
  monday: 'Segunda', tuesday: 'Terça', wednesday: 'Quarta',
  thursday: 'Quinta', friday: 'Sexta',
}

export default function WorkoutExecution() {
  const { day } = useParams<{ day: string }>()
  const navigate = useNavigate()
  const { defaultRestSeconds } = useSettings()
  const {
    exercises, currentIndex, completedSets,
    startSession, next, prev, completeSet,
    startTimer, stopTimer, tickTimer,
    timerSeconds, isTimerRunning, reset,
  } = useWorkoutSession()

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!day) return
    getExercisesByDay(day as Day).then((all) => {
      const main = all.filter((e) => e.type === 'main')
      startSession(main)
    })
    return () => reset()
  }, [day])

  // Tick the timer
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => tickTimer(), 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [isTimerRunning])

  if (exercises.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    )
  }

  if (done) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center gap-6 p-4">
        <div className="text-6xl">🏆</div>
        <h1 className="text-3xl font-bold">Treino Concluído!</h1>
        <p className="text-gray-400 text-center">{DAY_LABELS[day ?? '']} finalizado.</p>
        <button
          onClick={() => navigate('/')}
          className="w-full max-w-xs py-4 bg-green-500 text-white text-xl font-bold rounded-2xl"
        >
          Voltar ao Início
        </button>
      </div>
    )
  }

  const exercise = exercises[currentIndex]
  const isLastExercise = currentIndex === exercises.length - 1
  const allSetsDone = completedSets >= exercise.sets
  const restTime = exercise.restSeconds ?? defaultRestSeconds

  const handleSetComplete = () => {
    completeSet()
    if (completedSets + 1 < exercise.sets) {
      startTimer(restTime)
    }
  }

  const handleNext = async () => {
    stopTimer()
    if (isLastExercise) {
      await logWorkoutCompletion(day as Day)
      setDone(true)
    } else {
      next()
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col p-4 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <Link to={`/day/${day}`} className="text-gray-400">← Sair</Link>
        <p className="text-sm text-gray-500">
          {currentIndex + 1} / {exercises.length}
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-800 rounded-full h-1.5 mb-6">
        <div
          className="bg-green-500 h-1.5 rounded-full transition-all"
          style={{ width: `${((currentIndex) / exercises.length) * 100}%` }}
        />
      </div>

      {/* Exercise info */}
      <div className="flex-1 flex flex-col gap-6">
        <div>
          <h2 className="text-3xl font-bold">{exercise.name}</h2>
          <p className="text-xl text-gray-300 mt-1">
            {exercise.sets} séries × {exercise.reps} reps
            {exercise.weight > 0 && ` — ${exercise.weight}kg`}
          </p>
          {exercise.description && (
            <p className="text-sm text-gray-500 mt-2">{exercise.description}</p>
          )}
        </div>

        {/* Timer */}
        {isTimerRunning && (
          <div className="bg-gray-800 rounded-2xl p-6 flex flex-col items-center gap-3">
            <RestTimer
              seconds={timerSeconds}
              running={isTimerRunning}
              onFinish={stopTimer}
            />
            <button onClick={stopTimer} className="text-sm text-gray-500 underline">
              Pular descanso
            </button>
          </div>
        )}

        {/* Set counter */}
        {!isTimerRunning && (
          <SetCounter
            completed={completedSets}
            total={exercise.sets}
            onComplete={handleSetComplete}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3 mt-6">
        {currentIndex > 0 && (
          <button
            onClick={() => { stopTimer(); prev() }}
            className="flex-1 py-4 bg-gray-800 text-white rounded-2xl"
          >
            ← Anterior
          </button>
        )}
        {allSetsDone && (
          <button
            onClick={handleNext}
            className="flex-1 py-4 bg-green-500 active:bg-green-600 text-white font-bold rounded-2xl"
          >
            {isLastExercise ? 'Finalizar 🏁' : 'Próximo →'}
          </button>
        )}
      </div>
    </div>
  )
}
```

**Step 2: Test manually — add exercises to DB via browser console if needed, then navigate to `/execute/monday`**

**Step 3: Commit**

```bash
git add src/pages/WorkoutExecution.tsx
git commit -m "feat: implement WorkoutExecution page with timer and set counter"
```

---

### Task 14: Settings page (manual CRUD)

**Files:**
- Modify: `src/pages/Settings.tsx`
- Create: `src/components/ExerciseForm.tsx`

**Step 1: Implement ExerciseForm**

`src/components/ExerciseForm.tsx`:
```tsx
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
        <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Ex: Supino Reto" />
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
        <input type="number" min={10} value={restSeconds} onChange={(e) => setRestSeconds(e.target.value)} className={inputClass} placeholder="Ex: 90" />
      </div>
      <div>
        <label className={labelClass}>Descrição (opcional)</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={inputClass} placeholder="Dicas de execução..." />
      </div>
      <div className="flex gap-3 mt-2">
        <button type="button" onClick={onCancel} className="flex-1 py-3 bg-gray-700 text-white rounded-xl">Cancelar</button>
        <button type="submit" className="flex-1 py-3 bg-green-500 text-white font-bold rounded-xl">Salvar</button>
      </div>
    </form>
  )
}
```

**Step 2: Implement Settings page (Part 1 — exercise management)**

`src/pages/Settings.tsx`:
```tsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ExerciseForm from '../components/ExerciseForm'
import { getExercisesByDay, upsertExercise, deleteExercise } from '../db/queries'
import { useSettings } from '../store/settings'
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
  const { defaultRestSeconds, setDefaultRest, soundEnabled, toggleSound } = useSettings()

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

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/" className="text-gray-400">←</Link>
        <h1 className="text-2xl font-bold">Configurações</h1>
      </div>

      {/* Global settings */}
      <div className="bg-gray-800 rounded-xl p-4 mb-6 flex flex-col gap-3">
        <h2 className="font-semibold text-gray-300">Global</h2>
        <div className="flex justify-between items-center">
          <label className="text-sm text-gray-400">Descanso padrão (s)</label>
          <input
            type="number" min={10} max={300} step={5}
            value={defaultRestSeconds}
            onChange={(e) => setDefaultRest(Number(e.target.value))}
            className="w-20 bg-gray-700 text-white rounded-lg px-2 py-1 text-center"
          />
        </div>
        <div className="flex justify-between items-center">
          <label className="text-sm text-gray-400">Som ao finalizar descanso</label>
          <button
            onClick={toggleSound}
            className={`px-4 py-1 rounded-full text-sm font-medium ${soundEnabled ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-400'}`}
          >
            {soundEnabled ? 'On' : 'Off'}
          </button>
        </div>
      </div>

      {/* Day tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto">
        {DAYS.map((d) => (
          <button
            key={d}
            onClick={() => setActiveDay(d)}
            className={`px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap ${
              activeDay === d ? 'bg-green-500 text-white' : 'bg-gray-800 text-gray-400'
            }`}
          >
            {DAY_LABELS[d]}
          </button>
        ))}
      </div>

      {/* Exercise list */}
      {showForm || editing ? (
        <ExerciseForm
          initial={editing ?? { day: activeDay }}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditing(null) }}
        />
      ) : (
        <>
          <div className="flex flex-col gap-2 mb-4">
            {dayExercises.map((ex) => (
              <div key={ex.id} className="bg-gray-800 rounded-xl p-3 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">{ex.name}</p>
                  <p className="text-xs text-gray-500">
                    {ex.type === 'mobility' ? 'Mobilidade · ' : ''}{ex.sets}×{ex.reps} {ex.weight > 0 ? `${ex.weight}kg` : ''}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditing(ex)} className="text-xs text-blue-400 px-2 py-1">Editar</button>
                  <button onClick={() => handleDelete(ex.id!)} className="text-xs text-red-400 px-2 py-1">✕</button>
                </div>
              </div>
            ))}
            {dayExercises.length === 0 && (
              <p className="text-gray-600 text-center py-4 text-sm">Nenhum exercício neste dia.</p>
            )}
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="w-full py-3 bg-gray-800 border border-gray-700 text-gray-300 rounded-xl text-sm"
          >
            + Adicionar exercício
          </button>
        </>
      )}
    </div>
  )
}
```

**Step 3: Test manually — add, edit, delete exercises**

**Step 4: Commit**

```bash
git add src/pages/Settings.tsx src/components/ExerciseForm.tsx
git commit -m "feat: implement Settings page with exercise CRUD"
```

---

## Phase 6: Import / Export

---

### Task 15: Import/Export utilities

**Files:**
- Create: `src/utils/importExport.ts`
- Create: `src/utils/importExport.test.ts`

**Step 1: Write failing tests**

`src/utils/importExport.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { programToJSON, programFromJSON, programToCSV, programFromCSV } from './importExport'
import type { Exercise } from '../db/schema'

const sampleExercises: Exercise[] = [
  { id: 1, day: 'monday', type: 'main', order: 1, name: 'Supino', sets: 4, reps: 10, weight: 80, description: 'Retração' },
  { id: 2, day: 'monday', type: 'mobility', order: 1, name: 'Hip stretch', sets: 2, reps: 10, weight: 0 },
]

describe('JSON round-trip', () => {
  it('serializes and deserializes correctly', () => {
    const json = programToJSON(sampleExercises)
    const parsed = programFromJSON(json)
    expect(parsed).toHaveLength(2)
    expect(parsed[0].name).toBe('Supino')
    expect(parsed[1].type).toBe('mobility')
    // IDs should be stripped on export
    expect(parsed[0].id).toBeUndefined()
  })
})

describe('CSV round-trip', () => {
  it('serializes and deserializes correctly', () => {
    const csv = programToCSV(sampleExercises)
    const parsed = programFromCSV(csv)
    expect(parsed).toHaveLength(2)
    expect(parsed[0].name).toBe('Supino')
    expect(parsed[0].description).toBe('Retração')
    expect(parsed[1].weight).toBe(0)
  })
})
```

**Step 2: Run test to verify it fails**

```bash
npm test -- importExport.test.ts
```

**Step 3: Implement importExport**

`src/utils/importExport.ts`:
```ts
import type { Day, Exercise, ExerciseType } from '../db/schema'

type ExportExercise = Omit<Exercise, 'id'>

interface ProgramJSON {
  [day: string]: {
    main: ExportExercise[]
    mobility: ExportExercise[]
  }
}

export function programToJSON(exercises: Exercise[]): string {
  const program: ProgramJSON = {}
  for (const ex of exercises) {
    if (!program[ex.day]) program[ex.day] = { main: [], mobility: [] }
    const { id: _id, ...rest } = ex
    program[ex.day][ex.type].push(rest)
  }
  return JSON.stringify(program, null, 2)
}

export function programFromJSON(json: string): ExportExercise[] {
  const program: ProgramJSON = JSON.parse(json)
  const result: ExportExercise[] = []
  for (const [day, types] of Object.entries(program)) {
    for (const ex of types.main ?? []) result.push({ ...ex, day: day as Day, type: 'main' })
    for (const ex of types.mobility ?? []) result.push({ ...ex, day: day as Day, type: 'mobility' })
  }
  return result
}

const CSV_HEADERS = 'day,type,order,name,sets,reps,weight,description,restSeconds'

export function programToCSV(exercises: Exercise[]): string {
  const rows = exercises.map((ex) =>
    [
      ex.day, ex.type, ex.order, `"${ex.name}"`,
      ex.sets, ex.reps, ex.weight,
      `"${ex.description ?? ''}"`,
      ex.restSeconds ?? '',
    ].join(',')
  )
  return [CSV_HEADERS, ...rows].join('\n')
}

export function programFromCSV(csv: string): ExportExercise[] {
  const lines = csv.trim().split('\n')
  const headers = lines[0].split(',')
  return lines.slice(1).map((line) => {
    // Handle quoted fields
    const parts = line.match(/(".*?"|[^,]+|(?<=,)(?=,)|^(?=,)|(?<=,)$)/g) ?? []
    const clean = (s: string) => s?.replace(/^"|"$/g, '').trim() ?? ''
    const get = (col: string) => clean(parts[headers.indexOf(col)] ?? '')
    return {
      day: get('day') as Day,
      type: get('type') as ExerciseType,
      order: parseInt(get('order')) || 0,
      name: get('name'),
      sets: parseInt(get('sets')),
      reps: parseInt(get('reps')),
      weight: parseFloat(get('weight')) || 0,
      description: get('description') || undefined,
      restSeconds: get('restSeconds') ? parseInt(get('restSeconds')) : undefined,
    }
  })
}
```

**Step 4: Run tests**

```bash
npm test -- importExport.test.ts
```
Expected: PASS

**Step 5: Commit**

```bash
git add src/utils/importExport.ts src/utils/importExport.test.ts
git commit -m "feat: add import/export utilities for JSON and CSV"
```

---

### Task 16: Import/Export UI in Settings

**Files:**
- Modify: `src/pages/Settings.tsx`

**Step 1: Add import/export section to Settings page**

Add below the exercise list section (before the closing `</div>`):

```tsx
// Import section
import { programToJSON, programFromJSON, programToCSV, programFromCSV } from '../utils/importExport'
import { db } from '../db/schema'

// Add this JSX block after the "+ Adicionar exercício" button:
```

```tsx
{/* Import / Export */}
<div className="mt-6 bg-gray-800 rounded-xl p-4 flex flex-col gap-3">
  <h2 className="font-semibold text-gray-300">Importar / Exportar</h2>

  {/* Export buttons */}
  <div className="flex gap-2">
    <button
      onClick={async () => {
        const all: Exercise[] = []
        for (const d of DAYS) all.push(...await getExercisesByDay(d))
        const json = programToJSON(all)
        const blob = new Blob([json], { type: 'application/json' })
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
        a.download = 'treino.json'; a.click()
      }}
      className="flex-1 py-2 bg-gray-700 text-gray-300 rounded-xl text-sm"
    >
      ↓ JSON
    </button>
    <button
      onClick={async () => {
        const all: Exercise[] = []
        for (const d of DAYS) all.push(...await getExercisesByDay(d))
        const csv = programToCSV(all)
        const blob = new Blob([csv], { type: 'text/csv' })
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
        a.download = 'treino.csv'; a.click()
      }}
      className="flex-1 py-2 bg-gray-700 text-gray-300 rounded-xl text-sm"
    >
      ↓ CSV
    </button>
  </div>

  {/* Import */}
  <label className="w-full py-2 bg-gray-700 text-gray-300 rounded-xl text-sm text-center cursor-pointer">
    ↑ Importar arquivo
    <input
      type="file"
      accept=".json,.csv"
      className="hidden"
      onChange={async (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (!confirm('Isso vai substituir seu programa atual. Continuar?')) return
        const text = await file.text()
        let imported
        try {
          imported = file.name.endsWith('.csv') ? programFromCSV(text) : programFromJSON(text)
        } catch {
          alert('Arquivo inválido.'); return
        }
        await db.exercises.clear()
        for (let i = 0; i < imported.length; i++) {
          await db.exercises.add({ ...imported[i], order: imported[i].order ?? i })
        }
        await load()
        alert('Programa importado com sucesso!')
      }}
    />
  </label>
</div>
```

**Step 2: Test manually — export as JSON, clear DB, reimport**

**Step 3: Commit**

```bash
git add src/pages/Settings.tsx
git commit -m "feat: add import/export UI to Settings page"
```

---

## Phase 7: PWA & Polish

---

### Task 17: App icons and PWA manifest

**Files:**
- Create: `public/icon-192.png`, `public/icon-512.png`
- Modify: `index.html`

**Step 1: Generate or source icons**

Create a simple icon (e.g. dark green background with a stopwatch silhouette). Any tool (Figma, GIMP, online favicon generator) works. Must be:
- `public/icon-192.png` — 192×192px
- `public/icon-512.png` — 512×512px

**Step 2: Update `index.html` meta tags**

```html
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <meta name="theme-color" content="#111827" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="TimeOut" />
  <link rel="apple-touch-icon" href="/icon-192.png" />
  <title>TimeOut — Treino</title>
</head>
```

**Step 3: Build and verify PWA works**

```bash
npm run build
npm run preview
# Open Chrome DevTools → Application → Service Workers — verify registered
# Application → Manifest — verify all fields present
```

**Step 4: Commit**

```bash
git add public/ index.html
git commit -m "feat: add PWA icons and meta tags"
```

---

### Task 18: Final build verification

**Step 1: Run all tests**

```bash
npm test -- --run
```
Expected: all tests PASS

**Step 2: Run build**

```bash
npm run build
```
Expected: no TypeScript errors, build succeeds

**Step 3: Run preview and smoke-test on mobile**

```bash
npm run preview
```

Open `http://localhost:4173` on your phone browser. Test:
- [ ] All 5 days appear on Home
- [ ] Can add an exercise in Settings
- [ ] Can start workout and mark sets
- [ ] Timer counts down and vibrates
- [ ] Workout completion increments counter
- [ ] Export and import JSON works
- [ ] App works with network disabled (DevTools → Offline)

**Step 4: Final commit**

```bash
git add -A
git commit -m "chore: final build verification and polish"
```

---

## Summary

| Task | Description |
|------|-------------|
| 1–4 | Project setup (Vite, Tailwind, PWA, routing) |
| 5–6 | Data layer (Dexie schema + queries) |
| 7 | State management (Zustand) |
| 8–10 | Core components (Timer, SetCounter, Cards) |
| 11–14 | All 4 pages |
| 15–16 | Import/Export (JSON + CSV) |
| 17–18 | Icons, manifest, final verification |

**Total estimated time:** 3–5 hours of focused implementation
