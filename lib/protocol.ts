// Active protocol: storage on the device, plan parsing and day tracking.

export type WeightUnit = 'kg' | 'lb';

export type SessionLog = {
  key: string; // `${week}-${day}`
  week: number;
  day: number;
  date: string; // YYYY-MM-DD
  energy: number;
  difficulty: number;
  notes: string;
  loads: Record<string, string[]>; // exercise name -> weight per set
  recovery?: string;
  adaptedNext?: { day: number; reason: string } | null;
};

export type ActiveProtocol = {
  v: 1;
  sport: string;
  survey: string;
  plan: string;
  weightUnit: WeightUnit;
  targetWeeks?: number; // 0 or missing = no fixed deadline
  startedAt: string; // YYYY-MM-DD
  changeLog: { request: string; summary: string }[];
  sessions: SessionLog[];
  drafts: Record<string, Record<string, string[]>>; // unsaved loads per session key
  originalDays: Record<number, string>; // day number -> block before an automatic adaptation
  adaptations: Record<number, string>; // day number -> reason
};

const STORAGE_KEY = 'elv8_active_protocol';

export function loadProtocol(): ActiveProtocol | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as ActiveProtocol;
    if (p?.v !== 1 || !p.plan) return null;
    return { ...p, drafts: p.drafts ?? {}, originalDays: p.originalDays ?? {}, adaptations: p.adaptations ?? {}, sessions: p.sessions ?? [] };
  } catch {
    return null;
  }
}

export function saveProtocol(p: ActiveProtocol): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch (error) {
    console.error('Could not save protocol', error);
  }
}

export function clearProtocol(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

// ---------- dates ----------

export const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function todayISO(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Monday = 0 … Sunday = 6 */
export function weekdayIndex(d = new Date()): number {
  return (d.getDay() + 6) % 7;
}

function mondayOf(d: Date): Date {
  const m = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  m.setDate(m.getDate() - weekdayIndex(m));
  return m;
}

/** Week 1 is the calendar week (Mon-Sun) in which the protocol was activated. */
export function currentWeek(startedAt: string, now = new Date()): number {
  const diff = mondayOf(now).getTime() - mondayOf(parseISO(startedAt)).getTime();
  return Math.max(1, Math.round(diff / (7 * 24 * 3600 * 1000)) + 1);
}

// ---------- plan parsing ----------

export type PlanDay = {
  number: number;
  weekday: string | null;
  focus: string;
  heading: string;
  block: string; // markdown from the heading to the end of the day
};

const DAY_HEADING = /^(?:#+\s*)?(?:\*\*)?\s*Day\s+(\d+)\b(.*)$/i;
const SECTION_END = /^(?:#+\s*)?(?:\*\*)?\s*Progression\b/i;

export function parsePlan(plan: string): PlanDay[] {
  const lines = plan.split('\n');
  const days: PlanDay[] = [];
  let current: { number: number; rest: string; heading: string; lines: string[] } | null = null;

  const push = () => {
    if (!current) return;
    const weekday = WEEKDAYS.find((w) => new RegExp(`\\b${w}\\b`, 'i').test(current!.rest)) ?? null;
    const focus = current.rest
      .replace(/\*\*/g, '')
      .replace(/^[\s\-–—:]+/, '')
      .replace(new RegExp(`^${weekday ?? '___'}\\s*[:\\-–—]?\\s*`, 'i'), '')
      .replace(/^[\s\-–—:]+/, '')
      .trim();
    days.push({
      number: current.number,
      weekday,
      focus: focus || `Day ${current.number}`,
      heading: current.heading,
      block: current.lines.join('\n').trim(),
    });
  };

  for (const line of lines) {
    const t = line.trim();
    const m = t.match(DAY_HEADING);
    if (m && t.length < 90) {
      push();
      current = { number: Number(m[1]), rest: m[2], heading: t.replace(/\*\*/g, '').replace(/^#+\s*/, ''), lines: [line] };
      continue;
    }
    if (current && SECTION_END.test(t) && !t.startsWith('|')) {
      push();
      current = null;
      continue;
    }
    if (current) current.lines.push(line);
  }
  push();
  return days;
}

/** Replace one day's block in the plan, leaving every other line untouched. */
export function replaceDay(plan: string, dayNumber: number, newBlock: string): string {
  const day = parsePlan(plan).find((d) => d.number === dayNumber);
  if (!day) return plan;
  const idx = plan.indexOf(day.block);
  if (idx === -1) return plan;
  return plan.slice(0, idx) + newBlock.trim() + plan.slice(idx + day.block.length);
}

// ---------- tables ----------

export const parseRow = (row: string): string[] =>
  row.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());

export function parseTable(block: string): { headers: string[]; rows: string[][] } | null {
  const tableLines = block
    .replace(/\|\|/g, '\n|')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.startsWith('|') && l.endsWith('|'));
  if (tableLines.length < 2) return null;
  const headers = parseRow(tableLines[0]);
  const rows = tableLines
    .slice(1)
    .filter((r) => !/^\|?\s*:?-{3,}/.test(r))
    .map(parseRow)
    .filter((r) => r.some(Boolean));
  return rows.length ? { headers, rows } : null;
}

/** Number of sets when the prescription looks like "4 x 8" (strength work), otherwise 0. */
export function setCount(prescription: string): number {
  const m = prescription.match(/^\s*(\d{1,2})\s*[x×]\s*\d/i);
  if (!m) return 0;
  const n = Number(m[1]);
  return n >= 1 && n <= 10 ? n : 0;
}

export const cleanCell = (c: string) => (c || '').replace(/\*\*/g, '').trim();
export const EMPTY_CELL = /^[-—–\s]*$/;

export function sessionKey(week: number, day: number): string {
  return `${week}-${day}`;
}
