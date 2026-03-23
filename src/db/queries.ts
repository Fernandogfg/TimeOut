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
