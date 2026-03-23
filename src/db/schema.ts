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
