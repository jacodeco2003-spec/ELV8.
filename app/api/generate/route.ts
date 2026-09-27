import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { DAY_TASK, GENERATE_SYSTEM_PROMPT, OUTLINE_TASK, REFINE_SYSTEM_PROMPT } from './prompts';

export const maxDuration = 120;

const MODEL = 'claude-sonnet-5';
const MAX_REQUEST_CHARS = 1000;

type OutlineBody = { mode: 'outline'; survey: string; sport: string; coach: string; trainingDays: number };
type DayBody = { mode: 'day'; survey: string; sport: string; coach: string; outline: string; day: number };
type RefineBody = {
  mode: 'refine';
  survey: string;
  currentPlan: string;
  previousChanges?: string[];
  request: string;
};
type Body = OutlineBody | DayBody | RefineBody;

const DAY_START = /^(?:#+\s*)?(?:\*\*)?\s*Day\s+(\d+)\b/i;

async function ask(anthropic: Anthropic, system: string, content: string, maxTokens: number): Promise<string> {
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content }],
  });
  return response.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim();
}

/** "BRIEFING: … LAYOUT: … SESSIONS: … ROADMAP: …" into structured parts. */
function parseOutline(text: string) {
  const parts: Record<string, string[]> = { BRIEFING: [], LAYOUT: [], SESSIONS: [], ROADMAP: [] };
  let current: string | null = null;
  for (const raw of text.split('\n')) {
    const header = raw.match(/^\s*(?:#+\s*)?(?:\*\*)?(BRIEFING|LAYOUT|SESSIONS|ROADMAP)(?:\*\*)?\s*:\s*(.*)$/i);
    if (header) {
      current = header[1].toUpperCase();
      if (header[2].trim()) parts[current].push(header[2].trim());
      continue;
    }
    if (current) parts[current].push(raw);
  }
  const briefing = parts.BRIEFING.join('\n').trim();
  const layoutLine = parts.LAYOUT.find((l) => /Weekly Layout/i.test(l)) ?? parts.LAYOUT.find((l) => l.trim()) ?? '';
  const layout = layoutLine.trim().replace(/^(?!Weekly Layout)/i, 'Weekly Layout: ');
  const roadmap = parts.ROADMAP.join('\n').trim();
  const sessions = parts.SESSIONS.map((l) => l.trim().replace(/^[-*]\s*/, '').replace(/\*\*/g, ''))
    .map((l) => {
      const m = l.match(DAY_START);
      if (!m) return null;
      const [heading, spec = ''] = l.split('::');
      return { number: Number(m[1]), heading: heading.trim(), spec: spec.trim() };
    })
    .filter((x): x is { number: number; heading: string; spec: string } => !!x);
  return { briefing, layout, sessions, roadmap };
}

function buildRefinePrompt(body: RefineBody): string {
  const previous = (body.previousChanges ?? []).filter(Boolean);
  return `LOCKED SURVEY ANSWERS (cannot be changed):
${body.survey}

ADJUSTMENTS ALREADY APPLIED (must stay in force):
${previous.length ? previous.map((c, i) => `${i + 1}. ${c}`).join('\n') : 'None'}

CURRENT PLAN:
${body.currentPlan}

NEW ADJUSTMENT REQUEST FROM THE ATHLETE:
${body.request.slice(0, MAX_REQUEST_CHARS)}`;
}

/** "CHANGES: … ===DAY=== … ===LAYOUT=== …" into structured edits. */
function parseRefine(text: string) {
  const parts = text.split(/^\s*===(DAY|LAYOUT)===\s*$/m);
  const summary = (parts[0] || '').replace(/^\s*CHANGES:\s*/i, '').trim();
  const days: { number: number; block: string }[] = [];
  let layout: string | null = null;

  for (let i = 1; i < parts.length; i += 2) {
    const kind = parts[i];
    const content = (parts[i + 1] || '').trim();
    if (kind === 'DAY') {
      const m = content.match(DAY_START);
      if (m && content.includes('|')) days.push({ number: Number(m[1]), block: content });
    } else if (kind === 'LAYOUT') {
      const line = content.split('\n').find((l) => /Weekly Layout/i.test(l));
      if (line) layout = line.trim();
    }
  }
  return { summary, days, layout };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY is missing from the environment variables' },
        { status: 500 }
      );
    }
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    // ---------- STEP 1: short outline of the week ----------
    if (body.mode === 'outline') {
      if (!body.survey || !body.trainingDays) {
        return NextResponse.json({ error: 'Missing survey' }, { status: 400 });
      }
      const text = await ask(
        anthropic,
        GENERATE_SYSTEM_PROMPT,
        `Coach persona: ${body.coach}. Sport: ${body.sport}.

ATHLETE SURVEY (binding):
${body.survey}

The week must have exactly ${body.trainingDays} training days; every other day is a rest day.

${OUTLINE_TASK}`,
        2500
      );
      const outline = parseOutline(text);
      if (outline.sessions.length === 0) {
        return NextResponse.json({ error: 'The coach could not design the week. Please try again.' }, { status: 502 });
      }
      return NextResponse.json(outline);
    }

    // ---------- STEP 2: one full day (the browser asks for all days at once) ----------
    if (body.mode === 'day') {
      if (!body.survey || !body.outline || !body.day) {
        return NextResponse.json({ error: 'Missing day data' }, { status: 400 });
      }
      const text = await ask(
        anthropic,
        GENERATE_SYSTEM_PROMPT,
        `Coach persona: ${body.coach}. Sport: ${body.sport}.

ATHLETE SURVEY (binding):
${body.survey}

WEEK OUTLINE (already decided, follow it):
${body.outline}

Write the full session for Day ${body.day} only.

${DAY_TASK}`,
        3500
      );
      const start = text.search(/^(?:#+\s*)?(?:\*\*)?\s*Day\s+\d+/im);
      const block = start >= 0 ? text.slice(start).trim() : '';
      if (!block || !block.includes('|')) {
        return NextResponse.json({ error: 'Incomplete session' }, { status: 502 });
      }
      return NextResponse.json({ block });
    }

    // ---------- REFINE: only the changed days come back ----------
    if (body.mode === 'refine') {
      if (!body.request?.trim() || !body.currentPlan || !body.survey) {
        return NextResponse.json({ error: 'Missing refine data' }, { status: 400 });
      }
      const text = await ask(anthropic, REFINE_SYSTEM_PROMPT, buildRefinePrompt(body), 6000);
      return NextResponse.json(parseRefine(text));
    }

    return NextResponse.json({ error: 'Unknown mode' }, { status: 400 });
  } catch (error: unknown) {
    console.error('Generate Route Error:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
