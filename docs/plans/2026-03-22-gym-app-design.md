# Gym Training App — Design Document
**Date:** 2026-03-22
**Status:** Approved

---

## 1. Overview

A mobile-first Progressive Web App (PWA) for personal gym training program execution. The app solves three key pain points from the user's current tool: no offline access, a poor timer, and no set counter.

**Core goals:**
- Work 100% offline after first load
- Show the training program for each day (Monday–Friday)
- Guide execution with a set counter and rest timer
- Allow program management via manual entry or import (JSON/CSV)

---

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 18 + Vite |
| Language | TypeScript |
| Styling | Tailwind CSS (mobile-first) |
| Local DB | Dexie.js (IndexedDB wrapper) |
| State | Zustand (session state: current exercise, timer) |
| PWA | vite-plugin-pwa (Workbox Service Worker) |

---

## 3. Screens

### 3.1 Home (Weekly View)
- Displays Monday through Friday (no custom day names needed)
- Highlights the current day of the week
- Shows execution counter per day (e.g., "Feito 12x")
- Tap a day to open its workout

### 3.2 Workout of the Day
- Collapsible **Mobility** section (optional exercises)
- List of **Main** exercises in order
- "Iniciar Treino" button to begin execution

### 3.3 Workout Execution (Main screen in gym)
- Exercise name (large, readable)
- Sets × Reps × Weight
- Optional description field (expandable)
- **Set counter** (e.g., "Série 2 de 4")
- **Rest timer**: starts automatically after marking a set as done; counts down; vibrates + plays sound when done
- Navigation: previous / next exercise, skip
- Finishing the last exercise → completion screen → increments workout counter

### 3.4 Program Settings
- Add / edit / remove exercises per day
- Toggle exercise type (main or mobility)
- Reorder exercises within a day
- Import program from JSON or CSV file
- Export program to JSON or CSV

---

## 4. Data Model (IndexedDB via Dexie)

### Table: `exercises`
```ts
{
  id?: number;          // auto-increment PK
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';
  type: 'main' | 'mobility';
  order: number;
  name: string;
  sets: number;
  reps: number;
  weight: number;       // kg
  description?: string;
  restSeconds?: number; // default: 60s global setting
}
```

### Table: `workout_log`
```ts
{
  id?: number;
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';
  completedAt: Date;
}
```
*Execution count = `COUNT WHERE day = X`*

### Table: `app_state`
```ts
{
  key: string;   // e.g., 'defaultRestSeconds', 'soundEnabled'
  value: any;
}
```

---

## 5. Execution Flow

1. User opens the app → Home screen highlights today
2. Taps today's day → Workout screen shows mobility + main exercises
3. Taps "Iniciar Treino" → enters Execution screen at exercise #1
4. User completes a set → taps "Série feita ✓" → counter advances (1/4 → 2/4) → rest timer starts automatically
5. Timer ends → vibration + sound alert → user starts next set
6. All sets done → advances to next exercise automatically
7. Last exercise completed → completion screen → `workout_log` entry is created → counter updates on Home

---

## 6. Import / Export Formats

### JSON
```json
{
  "monday": {
    "mobility": [
      { "name": "Hip stretch", "sets": 2, "reps": 10 }
    ],
    "main": [
      { "name": "Supino", "sets": 4, "reps": 10, "weight": 80, "description": "Retração escapular", "restSeconds": 90 }
    ]
  }
}
```

### CSV
```
day,type,order,name,sets,reps,weight,description,restSeconds
monday,main,1,Supino,4,10,80,Retração escapular,90
monday,mobility,1,Hip stretch,2,10,0,,60
```

**Import behavior:** app detects format by file extension → shows confirmation dialog before overwriting current program.

---

## 7. Offline Strategy

- **Service Worker** (via Workbox): caches all app assets on first load
- **IndexedDB** (via Dexie): all program data and logs stored locally
- No backend required — the app is fully client-side

---

## 8. Folder Structure

```
src/
  pages/
    Home.tsx
    WorkoutDay.tsx
    WorkoutExecution.tsx
    Settings.tsx
  components/
    DayCard.tsx
    ExerciseCard.tsx
    SetCounter.tsx
    RestTimer.tsx
    MobilitySection.tsx
  db/
    schema.ts        # Dexie schema definition
    queries.ts       # helper functions
  store/
    workoutSession.ts  # Zustand: current exercise, timer state
    settings.ts        # Zustand: defaultRest, soundEnabled
  utils/
    importExport.ts    # JSON + CSV import/export logic
  App.tsx
  main.tsx
```

---

## 9. Out of Scope (v1)

- User accounts or cloud sync
- Multiple user profiles
- Exercise history / progress tracking (beyond execution count)
- Video or image demos for exercises
- Custom themes
