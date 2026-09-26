import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const maxDuration = 60;

// Cheapest model: check-ins run after every workout, so they must stay low-cost.
const MODEL = 'claude-haiku-4-5-20251001';

const CHECKIN_SYSTEM_PROMPT = `You are the athlete's personal coach doing a short post-workout check-in. Write in English, no emojis.

You receive: the athlete's locked survey, the session just completed (with logged loads), the athlete's ratings (energy and difficulty, 1-10), their notes, a short recent history, and the NEXT scheduled session.

TASK 1 - RECOVERY (always):
Write 4-6 short, concrete bullet points (each starting with "- ") so the athlete recovers fully for the next session:
- cool-down / stretching for the muscles or systems just trained (name the stretches and durations),
- nutrition (what and when, with amounts scaled to body weight where useful),
- hydration (concrete amounts, electrolytes after long or hot sessions),
- sleep / rest,
- how to prepare for the next session (name it).
Adapt the advice to the ratings: very high difficulty or low energy means more emphasis on recovery. If the notes mention pain, advise stopping any movement that causes sharp or persistent pain and seeing a qualified professional if it does not settle.

TASK 2 - ADAPT THE NEXT SESSION (only when truly needed):
Answer ADAPT: YES only if the notes contain (a) a specific request about upcoming training (e.g. more biceps emphasis, move legs, more stretching), or (b) a real injury, pain or physical discomfort. Ratings alone, tiredness, general comments or "it was hard" are NOT reasons: answer ADAPT: NO.
When YES: rewrite ONLY the next session. Change the minimum needed (swap or lighten aggravating exercises, add mobility or stretching, add the requested emphasis) and copy everything else exactly. Keep the same heading line, the same table columns and markdown format, and give any new exercise 3-5 execution steps in the How To Perform column (separated by " ; ") and a video link only if it is a universally named exercise. Never violate the locked survey (training days, equipment, injuries). Never use "|" inside a cell.

RESPONSE FORMAT (mandatory):
RECOVERY:
- ...
ADAPT: YES or NO
REASON: <one short sentence explaining the change, only when YES>
===NEXT_DAY===
<the complete rewritten next session, only when YES>`;

type CheckinBody = {
  survey: string;
  completedDay: string;
  nextDay?: string;
  energy: number;
  difficulty: number;
  notes?: string;
  loads?: string;
  history?: string;
};

const clamp = (n: unknown) => Math.min(10, Math.max(1, Math.round(Number(n) || 5)));

export async function POST(req: Request) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY is missing' }, { status: 500 });
    }

    const body = (await req.json()) as CheckinBody;
    if (!body.survey || !body.completedDay) {
      return NextResponse.json({ error: 'Missing check-in data' }, { status: 400 });
    }

    const notes = (body.notes || '').trim().slice(0, 1000);
    // Without notes there can be no specific request or injury, so never rewrite the plan.
    const canAdapt = notes.length > 0 && !!body.nextDay;

    const userPrompt = `LOCKED SURVEY:
${body.survey}

SESSION JUST COMPLETED:
${body.completedDay.slice(0, 6000)}

LOGGED LOADS:
${body.loads || 'None logged'}

RATINGS: Energy ${clamp(body.energy)}/10, Difficulty ${clamp(body.difficulty)}/10
ATHLETE NOTES: ${notes || 'None'}

RECENT HISTORY:
${body.history || 'First logged session'}

NEXT SCHEDULED SESSION:
${body.nextDay ? body.nextDay.slice(0, 6000) : 'None'}
${canAdapt ? '' : '\nThere are no notes, so answer ADAPT: NO and do not include a next session.'}`;

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: canAdapt ? 4000 : 800,
      system: CHECKIN_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = response.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n');

    const recoveryMatch = text.match(/RECOVERY:\s*([\s\S]*?)(?:\n\s*ADAPT:|$)/i);
    const recovery = (recoveryMatch ? recoveryMatch[1] : text.split('===NEXT_DAY===')[0]).trim();

    let adapted: { reason: string; nextDay: string } | null = null;
    if (canAdapt && /ADAPT:\s*YES/i.test(text)) {
      const reason = (text.match(/REASON:\s*(.+)/i)?.[1] || 'Adjusted based on your feedback.').trim();
      const marker = text.indexOf('===NEXT_DAY===');
      const nextDay = marker >= 0 ? text.slice(marker + '===NEXT_DAY==='.length).trim() : '';
      // Only accept a well-formed session: a Day heading plus a table.
      if (/^(?:#+\s*)?(?:\*\*)?\s*Day\s+\d+/i.test(nextDay) && nextDay.includes('|')) {
        adapted = { reason, nextDay };
      }
    }

    return NextResponse.json({ recovery, adapted });
  } catch (error: unknown) {
    console.error('Checkin Route Error:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
