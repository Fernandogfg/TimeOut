import { create } from 'zustand'
import type { Exercise } from '../db/schema'

interface WorkoutSessionState {
  // Exercises in session
  exercises: Exercise[]

  // Which exercise card is expanded (null = all collapsed)
  activeExerciseId: number | null

  // Sets completed per exercise id
  setsCompleted: Record<number, number>

  // Rest timer (counts down)
  isRestTimerRunning: boolean
  restTimerSeconds: number

  // General workout stopwatch (counts up)
  elapsedSeconds: number
  isWorkoutTimerRunning: boolean

  // Actions
  startSession: (exercises: Exercise[]) => void
  setActiveExercise: (id: number | null) => void
  completeSet: (exerciseId: number) => void
  startRestTimer: (seconds: number) => void
  stopRestTimer: () => void
  pauseRestTimer: () => void
  resumeRestTimer: () => void
  tickRestTimer: () => void
  tickWorkout: () => void
  toggleWorkoutTimer: () => void
  reset: () => void
}

export const useWorkoutSession = create<WorkoutSessionState>((set) => ({
  exercises: [],
  activeExerciseId: null,
  setsCompleted: {},
  isRestTimerRunning: false,
  restTimerSeconds: 0,
  elapsedSeconds: 0,
  isWorkoutTimerRunning: false,

  startSession: (exercises) => set({
    exercises,
    activeExerciseId: null,
    setsCompleted: {},
    isRestTimerRunning: false,
    restTimerSeconds: 0,
    elapsedSeconds: 0,
    isWorkoutTimerRunning: true,
  }),

  setActiveExercise: (id) => set({ activeExerciseId: id }),

  completeSet: (exerciseId) => set((s) => ({
    setsCompleted: {
      ...s.setsCompleted,
      [exerciseId]: (s.setsCompleted[exerciseId] ?? 0) + 1,
    },
  })),

  startRestTimer: (seconds) => set({ restTimerSeconds: seconds, isRestTimerRunning: true }),

  stopRestTimer: () => set({ isRestTimerRunning: false, restTimerSeconds: 0 }),

  pauseRestTimer: () => set({ isRestTimerRunning: false }),

  resumeRestTimer: () => set({ isRestTimerRunning: true }),

  tickRestTimer: () => set((s) => ({
    restTimerSeconds: Math.max(s.restTimerSeconds - 1, 0),
    // Keep running at 0 so RestTimer can fire onFinish + sound
  })),

  tickWorkout: () => set((s) => ({
    elapsedSeconds: s.isWorkoutTimerRunning ? s.elapsedSeconds + 1 : s.elapsedSeconds,
  })),

  toggleWorkoutTimer: () => set((s) => ({
    isWorkoutTimerRunning: !s.isWorkoutTimerRunning,
  })),

  reset: () => set({
    exercises: [],
    activeExerciseId: null,
    setsCompleted: {},
    isRestTimerRunning: false,
    restTimerSeconds: 0,
    elapsedSeconds: 0,
    isWorkoutTimerRunning: false,
  }),
}))
