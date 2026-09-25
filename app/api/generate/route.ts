import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { GENERATE_SYSTEM_PROMPT, REFINE_SYSTEM_PROMPT } from './prompts';

export const maxDuration = 120;

const MODEL = 'gpt-4o-mini';
const MAX_REQUEST_CHARS = 1000;

type RefineBody = {
  mode: 'refine';
  survey: string;
  currentPlan: string;
  previousChanges?: string[];
  request: string;
};

type GenerateBody = { mode?: 'generate'; prompt: string };

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

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as GenerateBody | RefineBody;

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key missing in the environment variables' },
        { status: 500 }
      );
    }

    const isRefine = body.mode === 'refine';
    if (isRefine && (!body.request?.trim() || !body.currentPlan || !body.survey)) {
      return NextResponse.json({ error: 'Missing refine data' }, { status: 400 });
    }
    if (!isRefine && !(body as GenerateBody).prompt) {
      return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: isRefine ? REFINE_SYSTEM_PROMPT : GENERATE_SYSTEM_PROMPT },
        {
          role: 'user',
          content: isRefine ? buildRefinePrompt(body as RefineBody) : (body as GenerateBody).prompt,
        },
      ],
      temperature: isRefine ? 0.2 : 0.5,
      max_tokens: 12000,
    });

    const text = response.choices[0]?.message?.content || '';

    if (!isRefine) {
      return NextResponse.json({ result: text || 'No plan generated.' });
    }

    // Split "CHANGES: ... ===PLAN=== ..." into a summary and the updated plan.
    const marker = text.indexOf('===PLAN===');
    if (marker === -1) {
      return NextResponse.json(
        { error: 'The coach could not apply that change. Please rephrase and try again.' },
        { status: 502 }
      );
    }
    const summary = text.slice(0, marker).replace(/^\s*CHANGES:\s*/i, '').trim();
    const plan = text.slice(marker + '===PLAN==='.length).trim();
    if (plan.length < 200) {
      return NextResponse.json(
        { error: 'The coach returned an incomplete plan. Please try again.' },
        { status: 502 }
      );
    }

    return NextResponse.json({ result: plan, summary });
  } catch (error: unknown) {
    console.error('Generate Route Error:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
