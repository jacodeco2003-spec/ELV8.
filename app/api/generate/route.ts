import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { GENERATE_SYSTEM_PROMPT, REFINE_SYSTEM_PROMPT } from './prompts';

export const maxDuration = 120;

const MODEL = 'claude-sonnet-5';
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

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY is missing from the environment variables' },
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

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 12000,
      system: isRefine ? REFINE_SYSTEM_PROMPT : GENERATE_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: isRefine ? buildRefinePrompt(body as RefineBody) : (body as GenerateBody).prompt,
        },
      ],
    });

    const text = response.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n');

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
