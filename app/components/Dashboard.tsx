'use client';

import { useMemo, useState } from 'react';
import {
  ActiveProtocol,
  EMPTY_CELL,
  PlanDay,
  SessionLog,
  WEEKDAYS,
  cleanCell,
  currentWeek,
  parsePlan,
  parseTable,
  replaceDay,
  sessionKey,
  setCount,
  todayISO,
  weekdayIndex,
} from '@/lib/protocol';

type Props = {
  protocol: ActiveProtocol;
  onChange: (p: ActiveProtocol) => void;
  onViewPlan: () => void;
  onNewProtocol: () => void;
};

type CheckinResult = { recovery: string; adapted: { reason: string; nextDay: string } | null };

const isUsefulVideoLink = (url: string) =>
  /^https:\/\/(www\.)?youtube\.com\/results\?search_query=/.test(url) &&
  !/search_query=(exercise\+)?(tutorial|exercise)(\+tutorial)?$/i.test(url);

export default function Dashboard({ protocol, onChange, onViewPlan, onNewProtocol }: Props) {
  const days = useMemo(() => parsePlan(protocol.plan), [protocol.plan]);
  const week = currentWeek(protocol.startedAt);
  const todayIdx = weekdayIndex();
  const hasWeekdays = days.some((d) => d.weekday);

  const isDone = (dayNumber: number, w = week) =>
    protocol.sessions.some((s) => s.key === sessionKey(w, dayNumber));

  const todayDay: PlanDay | null = hasWeekdays
    ? days.find((d) => d.weekday === WEEKDAYS[todayIdx]) ?? null
    : days.find((d) => !isDone(d.number)) ?? null;

  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [feedbackFor, setFeedbackFor] = useState<PlanDay | null>(null);

  const shownDay = selectedDay !== null ? days.find((d) => d.number === selectedDay) ?? null : todayDay;

  const nextTrainingDay = (after: PlanDay | null): PlanDay | null => {
    if (!days.length) return null;
    if (after) {
      const i = days.findIndex((d) => d.number === after.number);
      return days[(i + 1) % days.length] ?? null;
    }
    if (hasWeekdays) {
      return days.find((d) => d.weekday && WEEKDAYS.indexOf(d.weekday) > todayIdx) ?? days[0];
    }
    return days[0];
  };

  const lastSession = [...protocol.sessions].reverse().find((s) => s.recovery);
  const todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <span className="text-xs uppercase tracking-widest text-zinc-500 block mb-1">
            {todayLabel} · Week {week}
            {protocol.targetWeeks ? ` of ${protocol.targetWeeks}` : ''}
          </span>
          <h2 className="text-2xl font-light text-white">{protocol.sport} — Active Protocol</h2>
        </div>
        <div className="flex gap-2">
          <button onClick={onViewPlan} className="px-4 py-2 rounded-full border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs transition">
            Full Protocol
          </button>
          <button
            onClick={() => {
              if (window.confirm('Start a new protocol? Your current protocol and its history will be replaced.')) onNewProtocol();
            }}
            className="px-4 py-2 rounded-full border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs transition"
          >
            New Protocol
          </button>
        </div>
      </div>

      {/* WEEK STRIP */}
      <WeekStrip
        days={days}
        hasWeekdays={hasWeekdays}
        todayIdx={todayIdx}
        shownDay={shownDay}
        isDone={isDone}
        onSelect={(n) => setSelectedDay(n)}
        onToday={() => setSelectedDay(null)}
        adaptations={protocol.adaptations}
      />

      {/* TODAY / SELECTED */}
      {shownDay ? (
        <DayWorkout
          key={`${week}-${shownDay.number}`}
          day={shownDay}
          week={week}
          protocol={protocol}
          isToday={shownDay === todayDay}
          onChange={onChange}
          onComplete={() => setFeedbackFor(shownDay)}
        />
      ) : (
        <RestDay next={nextTrainingDay(null)} lastSession={lastSession} onPreview={(n) => setSelectedDay(n)} />
      )}

      <ProgressPanel protocol={protocol} />

      {feedbackFor && (
        <FeedbackModal
          day={feedbackFor}
          week={week}
          protocol={protocol}
          nextDay={nextTrainingDay(feedbackFor)}
          onChange={onChange}
          onClose={() => setFeedbackFor(null)}
        />
      )}
    </div>
  );
}

/* ---------------- week strip ---------------- */

function WeekStrip({
  days,
  hasWeekdays,
  todayIdx,
  shownDay,
  isDone,
  onSelect,
  onToday,
  adaptations,
}: {
  days: PlanDay[];
  hasWeekdays: boolean;
  todayIdx: number;
  shownDay: PlanDay | null;
  isDone: (n: number) => boolean;
  onSelect: (n: number) => void;
  onToday: () => void;
  adaptations: Record<number, string>;
}) {
  const cells = hasWeekdays
    ? WEEKDAYS.map((w, i) => ({ label: w.slice(0, 3), idx: i, day: days.find((d) => d.weekday === w) ?? null }))
    : days.map((d, i) => ({ label: `D${d.number}`, idx: i, day: d }));

  return (
    <div className={`grid gap-2 ${hasWeekdays ? 'grid-cols-7' : 'grid-cols-4 sm:grid-cols-7'}`}>
      {cells.map((c) => {
        const done = c.day ? isDone(c.day.number) : false;
        const isToday = hasWeekdays && c.idx === todayIdx;
        const missed = hasWeekdays && c.day && !done && c.idx < todayIdx;
        const selected = c.day ? shownDay?.number === c.day.number : isToday && !shownDay;
        return (
          <button
            key={c.label}
            type="button"
            onClick={() => (c.day ? onSelect(c.day.number) : isToday ? onToday() : undefined)}
            disabled={!c.day && !isToday}
            className={`rounded-xl border px-1 py-2.5 text-center transition ${
              selected ? 'border-white bg-zinc-100 text-black' : 'border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-zinc-600'
            } ${!c.day && !isToday ? 'opacity-50 cursor-default' : ''}`}
          >
            <span className={`block text-[10px] uppercase tracking-wider ${isToday && !selected ? 'text-white font-semibold' : ''}`}>
              {c.label}
            </span>
            <span className="block text-[11px] mt-1 font-medium">
              {c.day ? (done ? '✓' : `D${c.day.number}`) : 'Rest'}
            </span>
            {c.day && (missed || adaptations[c.day.number]) && (
              <span className={`block text-[9px] mt-0.5 ${selected ? 'text-zinc-600' : missed ? 'text-amber-400' : 'text-sky-400'}`}>
                {missed ? 'Missed' : 'Adapted'}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ---------------- rest day ---------------- */

function RestDay({
  next,
  lastSession,
  onPreview,
}: {
  next: PlanDay | null;
  lastSession?: SessionLog;
  onPreview: (n: number) => void;
}) {
  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 md:p-8 space-y-5">
      <div>
        <span className="text-xs uppercase tracking-widest text-zinc-500">Today</span>
        <h3 className="text-xl font-light text-white mt-1">Rest & Recovery Day</h3>
        <p className="text-sm text-zinc-400 font-light mt-2">
          No training scheduled today. Recovery is part of the protocol: sleep well, stay hydrated and keep moving lightly.
        </p>
      </div>
      {lastSession?.recovery && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
          <p className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold mb-2">Your coach&apos;s recovery notes</p>
          <RecoveryText text={lastSession.recovery} />
        </div>
      )}
      {next && (
        <button
          type="button"
          onClick={() => onPreview(next.number)}
          className="px-5 py-2.5 rounded-full border border-zinc-700 text-zinc-200 hover:bg-zinc-800 text-xs tracking-wider uppercase transition"
        >
          Preview next session: Day {next.number}
          {next.weekday ? ` · ${next.weekday}` : ''} ↗
        </button>
      )}
    </div>
  );
}

/* ---------------- a day's workout ---------------- */

function columnIndex(headers: string[], pattern: RegExp, fallback: number) {
  const i = headers.findIndex((h) => pattern.test(h));
  return i >= 0 ? i : fallback;
}

function DayWorkout({
  day,
  week,
  protocol,
  isToday,
  onChange,
  onComplete,
}: {
  day: PlanDay;
  week: number;
  protocol: ActiveProtocol;
  isToday: boolean;
  onChange: (p: ActiveProtocol) => void;
  onComplete: () => void;
}) {
  const key = sessionKey(week, day.number);
  const session = protocol.sessions.find((s) => s.key === key);
  const loads = session?.loads ?? protocol.drafts[key] ?? {};
  const table = parseTable(day.block);
  const [openTip, setOpenTip] = useState<number | null>(null);
  const unit = protocol.weightUnit;

  const notes = day.block
    .split('\n')
    .slice(1)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('|'))
    .map((l) => l.replace(/\*\*/g, '').replace(/^#+\s*/, ''));

  const lastLoads = (name: string): string[] | null => {
    const prev = [...protocol.sessions]
      .filter((s) => s.key !== key)
      .reverse()
      .find((s) => s.loads[name]?.some((v) => v));
    return prev ? prev.loads[name] : null;
  };

  const setLoad = (name: string, setIdx: number, value: string, sets: number) => {
    const current = protocol.drafts[key]?.[name] ?? Array(sets).fill('');
    const updated = [...current];
    updated[setIdx] = value;
    onChange({ ...protocol, drafts: { ...protocol.drafts, [key]: { ...(protocol.drafts[key] ?? {}), [name]: updated } } });
  };

  const restoreOriginal = () => {
    const original = protocol.originalDays[day.number];
    if (!original) return;
    const originalDays = { ...protocol.originalDays };
    const adaptations = { ...protocol.adaptations };
    delete originalDays[day.number];
    delete adaptations[day.number];
    onChange({ ...protocol, plan: replaceDay(protocol.plan, day.number, original), originalDays, adaptations });
  };

  const h = table?.headers ?? [];
  const col = {
    sets: columnIndex(h, /sets|reps|distance|duration/i, 1),
    rest: columnIndex(h, /rest|pace|zone/i, 2),
    cue: columnIndex(h, /cue/i, 3),
    video: columnIndex(h, /video/i, 4),
    howTo: columnIndex(h, /how\s*to/i, -1),
  };

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <span className="text-xs uppercase tracking-widest text-zinc-500">
            {isToday ? "Today's Training" : 'Session'} · Day {day.number}
            {day.weekday ? ` · ${day.weekday}` : ''}
          </span>
          <h3 className="text-xl md:text-2xl font-light text-white mt-1">{day.focus}</h3>
        </div>
        {session && (
          <span className="self-start px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] uppercase tracking-wider">
            Completed ✓
          </span>
        )}
      </div>

      {protocol.adaptations[day.number] && (
        <div className="rounded-xl border border-sky-500/30 bg-sky-500/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs text-sky-200">
            <span className="font-semibold uppercase tracking-wider mr-2">Adapted</span>
            {protocol.adaptations[day.number]}
          </p>
          {!session && (
            <button onClick={restoreOriginal} className="shrink-0 px-3 py-1.5 rounded-lg border border-sky-500/40 text-sky-200 text-[11px] hover:bg-sky-500/10">
              Restore original
            </button>
          )}
        </div>
      )}

      {notes.length > 0 && (
        <div className="space-y-1">
          {notes.map((n, i) => (
            <p key={i} className="text-sm text-zinc-400 font-light">{n}</p>
          ))}
        </div>
      )}

      {table ? (
        <div className="space-y-3">
          {table.rows.map((row, rIndex) => {
            const name = cleanCell(row[0]);
            const prescription = cleanCell(row[col.sets]);
            const rest = cleanCell(row[col.rest]);
            const cue = cleanCell(row[col.cue]);
            const videoCell = cleanCell(row[col.video]);
            const link = videoCell.match(/\[(.*?)\]\((.*?)\)/);
            const tipRaw = col.howTo >= 0 ? cleanCell(row[col.howTo]) : '';
            const tip = tipRaw && !EMPTY_CELL.test(tipRaw) ? tipRaw.split(/\s*;\s*/).filter(Boolean) : null;
            const sets = setCount(prescription);
            const last = sets ? lastLoads(name) : null;
            const values = loads[name] ?? [];

            return (
              <div key={rIndex} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2 min-w-0">
                    <p className="text-sm text-white font-medium">{name}</p>
                    {tip && (
                      <button
                        type="button"
                        onClick={() => setOpenTip(openTip === rIndex ? null : rIndex)}
                        className={`shrink-0 px-2 py-0.5 rounded-md border text-[10px] font-semibold uppercase tracking-wider transition ${
                          openTip === rIndex ? 'bg-white text-black border-white' : 'border-zinc-600 text-zinc-300 hover:bg-zinc-800'
                        }`}
                      >
                        Tip
                      </button>
                    )}
                  </div>
                  {link && isUsefulVideoLink(link[2]) && (
                    <a href={link[2]} target="_blank" rel="noreferrer" className="shrink-0 text-xs text-white underline underline-offset-4 hover:text-zinc-400">
                      Video ↗
                    </a>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 text-[11px]">
                  {!EMPTY_CELL.test(prescription) && <span className="px-2 py-1 rounded-md bg-zinc-800/70 text-zinc-200">{prescription}</span>}
                  {!EMPTY_CELL.test(rest) && <span className="px-2 py-1 rounded-md bg-zinc-800/70 text-zinc-300">{rest}</span>}
                </div>
                {!EMPTY_CELL.test(cue) && <p className="text-xs text-zinc-400 font-light">{cue}</p>}

                {tip && openTip === rIndex && (
                  <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-2">How to perform</p>
                    <ol className="list-decimal list-inside space-y-1 text-xs text-zinc-300 leading-relaxed">
                      {tip.map((s, i) => <li key={i}>{s}</li>)}
                    </ol>
                  </div>
                )}

                {sets > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider text-zinc-500">Weight used ({unit})</span>
                      {last && (
                        <span className="text-[10px] text-zinc-500">
                          Last time: {last.filter(Boolean).join(' / ')} {unit}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {Array.from({ length: sets }).map((_, sIdx) => (
                        <label key={sIdx} className="block">
                          <span className="block text-[10px] text-zinc-500 mb-1">Set {sIdx + 1}</span>
                          <input
                            type="number"
                            inputMode="decimal"
                            min="0"
                            step="0.5"
                            disabled={!!session}
                            value={values[sIdx] ?? ''}
                            placeholder={last?.[sIdx] || '—'}
                            onChange={(e) => setLoad(name, sIdx, e.target.value, sets)}
                            className="w-full bg-zinc-800/50 border border-zinc-800 rounded-lg px-2 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 disabled:opacity-70 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <pre className="whitespace-pre-wrap text-sm text-zinc-300 font-light">{day.block}</pre>
      )}

      {session ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 space-y-3">
          <p className="text-xs text-zinc-400">
            Energy <span className="text-white font-semibold">{session.energy}/10</span> · Difficulty{' '}
            <span className="text-white font-semibold">{session.difficulty}/10</span>
          </p>
          {session.notes && <p className="text-xs text-zinc-400 italic">&ldquo;{session.notes}&rdquo;</p>}
          {session.recovery && (
            <div>
              <p className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold mb-2">Recovery plan</p>
              <RecoveryText text={session.recovery} />
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={onComplete}
          className="w-full px-6 py-4 rounded-full bg-white text-black hover:bg-zinc-200 transition font-semibold text-xs tracking-wider uppercase shadow-[0_0_20px_rgba(255,255,255,0.15)]"
        >
          Mark this training as completed ✓
        </button>
      )}
    </div>
  );
}

/* ---------------- feedback ---------------- */

function RatingPicker({ label, low, high, value, onChange }: { label: string; low: string; high: string; value: number; onChange: (n: number) => void }) {
  return (
    <div>
      <div className="flex justify-between items-baseline mb-2">
        <span className="text-xs uppercase tracking-wider text-zinc-400 font-medium">{label}</span>
        <span className="text-sm text-white font-semibold">{value}/10</span>
      </div>
      <div className="grid grid-cols-10 gap-1">
        {Array.from({ length: 10 }).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i + 1)}
            className={`py-2 rounded-md text-[11px] font-medium border transition ${
              value === i + 1 ? 'bg-white text-black border-white' : 'bg-zinc-800/40 text-zinc-400 border-zinc-800 hover:bg-zinc-800'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-zinc-600 mt-1">
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </div>
  );
}

function formatLoads(loads: Record<string, string[]>, unit: string): string {
  const lines = Object.entries(loads)
    .filter(([, v]) => v.some(Boolean))
    .map(([name, v]) => `${name}: ${v.map((x) => x || '-').join(' / ')} ${unit}`);
  return lines.join('\n');
}

function FeedbackModal({
  day,
  week,
  protocol,
  nextDay,
  onChange,
  onClose,
}: {
  day: PlanDay;
  week: number;
  protocol: ActiveProtocol;
  nextDay: PlanDay | null;
  onChange: (p: ActiveProtocol) => void;
  onClose: () => void;
}) {
  const key = sessionKey(week, day.number);
  const [energy, setEnergy] = useState(7);
  const [difficulty, setDifficulty] = useState(6);
  const [notes, setNotes] = useState('');
  const [phase, setPhase] = useState<'form' | 'loading' | 'done' | 'error'>('form');
  const [result, setResult] = useState<CheckinResult | null>(null);
  const [saved, setSaved] = useState<ActiveProtocol | null>(null);

  const runCheckin = async (base: ActiveProtocol, log: SessionLog) => {
    setPhase('loading');
    const history = base.sessions
      .filter((s) => s.key !== log.key)
      .slice(-3)
      .map((s) => `Week ${s.week} Day ${s.day}: energy ${s.energy}/10, difficulty ${s.difficulty}/10${s.notes ? `, notes: ${s.notes}` : ''}`)
      .join('\n');
    const nextBlock = nextDay && nextDay.number !== day.number ? nextDay.block : undefined;

    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          survey: base.survey,
          completedDay: day.block,
          nextDay: nextBlock,
          energy: log.energy,
          difficulty: log.difficulty,
          notes: log.notes,
          loads: formatLoads(log.loads, base.weightUnit),
          history,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.recovery) throw new Error(data.error || 'Check-in failed');

      const r = data as CheckinResult;
      let updated: ActiveProtocol = {
        ...base,
        sessions: base.sessions.map((s) =>
          s.key === log.key
            ? { ...s, recovery: r.recovery, adaptedNext: r.adapted && nextDay ? { day: nextDay.number, reason: r.adapted.reason } : null }
            : s
        ),
      };
      if (r.adapted && nextDay && nextBlock) {
        updated = {
          ...updated,
          plan: replaceDay(updated.plan, nextDay.number, r.adapted.nextDay),
          originalDays: { ...updated.originalDays, [nextDay.number]: updated.originalDays[nextDay.number] ?? nextDay.block },
          adaptations: { ...updated.adaptations, [nextDay.number]: r.adapted.reason },
        };
      }
      onChange(updated);
      setSaved(updated);
      setResult(r);
      setPhase('done');
    } catch (error) {
      console.error(error);
      setPhase('error');
    }
  };

  const submit = () => {
    const log: SessionLog = {
      key,
      week,
      day: day.number,
      date: todayISO(),
      energy,
      difficulty,
      notes: notes.trim(),
      loads: protocol.drafts[key] ?? {},
    };
    const drafts = { ...protocol.drafts };
    delete drafts[key];
    const updated = { ...protocol, drafts, sessions: [...protocol.sessions.filter((s) => s.key !== key), log] };
    onChange(updated); // the session is saved even if the coach's reply fails
    setSaved(updated);
    runCheckin(updated, log);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto p-6 space-y-6">
        {phase === 'form' && (
          <>
            <div>
              <span className="text-xs uppercase tracking-widest text-zinc-500">Post-Workout Check-in</span>
              <h3 className="text-lg font-light text-white mt-1">Day {day.number}: {day.focus}</h3>
            </div>
            <RatingPicker label="Energy / How you feel" low="Drained" high="Excellent" value={energy} onChange={setEnergy} />
            <RatingPicker label="Perceived difficulty" low="Very easy" high="Maximal" value={difficulty} onChange={setDifficulty} />
            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-400 font-medium mb-2">Notes for your coach (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={1000}
                rows={3}
                placeholder="e.g. My knees felt tight, I had to lighten the squats. / More biceps emphasis next time."
                className="w-full bg-zinc-800/50 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 resize-none"
              />
              <p className="text-[10px] text-zinc-600 mt-1">Your next session only changes if you mention a specific request or real pain/discomfort.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 px-4 py-3 rounded-full border border-zinc-700 text-zinc-300 text-xs uppercase tracking-wider hover:bg-zinc-800">
                Cancel
              </button>
              <button onClick={submit} className="flex-[2] px-4 py-3 rounded-full bg-white text-black text-xs font-semibold uppercase tracking-wider hover:bg-zinc-200">
                Save & Get Recovery Plan
              </button>
            </div>
          </>
        )}

        {phase === 'loading' && (
          <div className="py-10 text-center space-y-3">
            <div className="mx-auto h-8 w-8 rounded-full border-2 border-zinc-700 border-t-white animate-spin" />
            <p className="text-sm text-zinc-300">Session saved. Your coach is preparing your recovery plan…</p>
          </div>
        )}

        {phase === 'error' && (
          <div className="space-y-4">
            <p className="text-sm text-white">Session saved ✓</p>
            <p className="text-xs text-zinc-400">We couldn&apos;t get your recovery plan right now.</p>
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 px-4 py-3 rounded-full border border-zinc-700 text-zinc-300 text-xs uppercase tracking-wider">Close</button>
              <button
                onClick={() => {
                  const log = saved?.sessions.find((s) => s.key === key);
                  if (saved && log) runCheckin(saved, log);
                }}
                className="flex-1 px-4 py-3 rounded-full bg-white text-black text-xs font-semibold uppercase tracking-wider"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {phase === 'done' && result && (
          <div className="space-y-5">
            <div>
              <span className="text-xs uppercase tracking-widest text-emerald-400">Session completed ✓</span>
              <h3 className="text-lg font-light text-white mt-1">Your recovery plan</h3>
            </div>
            <RecoveryText text={result.recovery} />
            {nextDay && (
              <div className={`rounded-xl border p-4 text-xs ${result.adapted ? 'border-sky-500/30 bg-sky-500/5 text-sky-200' : 'border-zinc-800 bg-zinc-950/60 text-zinc-400'}`}>
                {result.adapted ? (
                  <>
                    <span className="font-semibold uppercase tracking-wider mr-2">Next session adapted</span>
                    Day {nextDay.number}: {result.adapted.reason}
                  </>
                ) : (
                  <>Next session (Day {nextDay.number}{nextDay.weekday ? `, ${nextDay.weekday}` : ''}) stays as planned.</>
                )}
              </div>
            )}
            <button onClick={onClose} className="w-full px-4 py-3 rounded-full bg-white text-black text-xs font-semibold uppercase tracking-wider hover:bg-zinc-200">
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function RecoveryText({ text }: { text: string }) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  return (
    <ul className="space-y-2">
      {lines.map((l, i) => (
        <li key={i} className="text-sm text-zinc-300 font-light leading-relaxed flex gap-2">
          {/^[-*•]\s/.test(l) && <span className="text-zinc-600">—</span>}
          <span>{l.replace(/^[-*•]\s*/, '').replace(/\*\*/g, '')}</span>
        </li>
      ))}
    </ul>
  );
}

/* ---------------- progress ---------------- */

function ProgressPanel({ protocol }: { protocol: ActiveProtocol }) {
  const sessions = protocol.sessions;
  if (sessions.length === 0) return null;

  const byExercise: Record<string, { date: string; top: number }[]> = {};
  for (const s of sessions) {
    for (const [name, values] of Object.entries(s.loads)) {
      const nums = values.map(Number).filter((n) => !isNaN(n) && n > 0);
      if (!nums.length) continue;
      (byExercise[name] ??= []).push({ date: s.date, top: Math.max(...nums) });
    }
  }
  const recent = sessions.slice(-5);
  const avg = (k: 'energy' | 'difficulty') => (recent.reduce((a, s) => a + s[k], 0) / recent.length).toFixed(1);

  return (
    <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 md:p-6 space-y-4">
      <h4 className="text-sm font-semibold text-white uppercase tracking-wide">Your Progress</h4>
      <div className="grid grid-cols-3 gap-3 text-center">
        <Stat label="Sessions done" value={String(sessions.length)} />
        <Stat label="Avg energy" value={`${avg('energy')}/10`} />
        <Stat label="Avg difficulty" value={`${avg('difficulty')}/10`} />
      </div>
      {Object.keys(byExercise).length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold">Top set per session</p>
          {Object.entries(byExercise).map(([name, entries]) => {
            const last5 = entries.slice(-5);
            const delta = last5.length > 1 ? last5[last5.length - 1].top - last5[0].top : 0;
            return (
              <div key={name} className="flex items-center justify-between gap-3 text-xs border-b border-zinc-800/60 pb-2">
                <span className="text-zinc-300 truncate">{name}</span>
                <span className="text-zinc-400 shrink-0">
                  {last5.map((e) => e.top).join(' → ')} {protocol.weightUnit}
                  {delta !== 0 && (
                    <span className={`ml-2 ${delta > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {delta > 0 ? '+' : ''}
                      {delta}
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-zinc-950/60 border border-zinc-800 p-3">
      <p className="text-lg text-white font-light">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-zinc-500 mt-1">{label}</p>
    </div>
  );
}
