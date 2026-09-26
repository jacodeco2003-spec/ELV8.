// Goal timeframe options and the shortest realistic timeframe per goal and level.

export const TIMEFRAME_OPTIONS = [
  { label: '4 Weeks', weeks: 4 },
  { label: '8 Weeks', weeks: 8 },
  { label: '12 Weeks', weeks: 12 },
  { label: '16 Weeks', weeks: 16 },
  { label: '24 Weeks', weeks: 24 },
  { label: 'No Fixed Deadline', weeks: 0 },
] as const;

export type Level = 'Beginner' | 'Intermediate' | 'Advanced / Elite';

// [Beginner, Intermediate, Advanced]. Infinity = only "No Fixed Deadline" is realistic.
const MIN_WEEKS: Record<string, [number, number, number]> = {
  // Running
  '5K Sprint Race': [8, 4, 4],
  '10K Road Race': [12, 8, 4],
  'Half-Marathon (21.1 km)': [16, 12, 8],
  'Marathon (42.2 km)': [24, 16, 12],
  'Trail / Ultra Distance': [Infinity, 24, 16],
  // Cycling
  'FTP & Threshold Power': [8, 8, 4],
  'Climbing & Gran Fondo Prep': [12, 8, 8],
  'Sprint & Anaerobic Power': [8, 4, 4],
  // Swimming
  'Long Distance Endurance & Open Water': [12, 8, 4],
  'Threshold Pace & Interval Sets': [8, 4, 4],
  // Triathlon
  'Sprint Distance': [12, 8, 4],
  'Olympic Distance': [16, 12, 8],
  'Half-Ironman (70.3)': [24, 16, 12],
  'Full Ironman (140.6)': [Infinity, 24, 16],
  // Gym
  'Hypertrophy & Muscle Growth': [8, 8, 8],
  'Maximum Heavy Strength': [8, 8, 8],
  'Explosive Athletic Power': [8, 8, 4],
  'Body Recomposition & Definition': [12, 12, 8],
};

export function minimumWeeks(goal: string, level: string): number {
  const row = MIN_WEEKS[goal];
  if (!row) return 4;
  const i = level === 'Beginner' ? 0 : level === 'Intermediate' ? 1 : 2;
  return row[i];
}

export function isRealistic(weeks: number, min: number): boolean {
  return weeks === 0 || weeks >= min; // "No Fixed Deadline" is always allowed
}

/** The chosen timeframe, or the shortest realistic one if the choice is too aggressive. */
export function effectiveTimeframe(label: string, min: number): (typeof TIMEFRAME_OPTIONS)[number] {
  const chosen = TIMEFRAME_OPTIONS.find((o) => o.label === label) ?? TIMEFRAME_OPTIONS[2];
  if (isRealistic(chosen.weeks, min)) return chosen;
  return TIMEFRAME_OPTIONS.find((o) => o.weeks !== 0 && o.weeks >= min) ?? TIMEFRAME_OPTIONS[TIMEFRAME_OPTIONS.length - 1];
}
