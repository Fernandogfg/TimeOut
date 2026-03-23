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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
      ex.day,
      ex.type,
      ex.order,
      `"${(ex.name ?? '').replace(/"/g, '""')}"`,
      ex.sets,
      ex.reps,
      ex.weight,
      `"${(ex.description ?? '').replace(/"/g, '""')}"`,
      ex.restSeconds ?? '',
    ].join(',')
  )
  return [CSV_HEADERS, ...rows].join('\n')
}

export function programFromCSV(csv: string): ExportExercise[] {
  const lines = csv.trim().split('\n')
  // skip header
  return lines.slice(1).map((line) => {
    // Parse CSV with basic quoted field support
    const fields: string[] = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (ch === ',' && !inQuotes) {
        fields.push(current)
        current = ''
      } else {
        current += ch
      }
    }
    fields.push(current)

    const [day, type, order, name, sets, reps, weight, description, restSeconds] = fields
    return {
      day: day.trim() as Day,
      type: type.trim() as ExerciseType,
      order: parseInt(order) || 0,
      name: name.trim(),
      sets: parseInt(sets),
      reps: parseInt(reps),
      weight: parseFloat(weight) || 0,
      description: description.trim() || undefined,
      restSeconds: restSeconds?.trim() ? parseInt(restSeconds.trim()) : undefined,
    }
  })
}
