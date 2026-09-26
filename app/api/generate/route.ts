import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { GENERATE_SYSTEM_PROMPT, REFINE_SYSTEM_PROMPT } from './prompts';
import { STREAM_ERROR_MARKER } from '@/lib/constants';

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

const DAY_START = /^(?:#+\s*)?(?:\*\*)?\s*Day\s+(\d+)\b/i;

/** Parse "CHANGES: … ===DAY=== … ===LAYOUT=== …" into structured edits. */
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
    const body = (await req.json()) as GenerateBody | RefineBody;

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY is missing from the environment variables' },
        { status: 500 }
      );
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    // ---------- REFINE: only the changed days come back, so it is fast ----------
    if (body.mode === 'refine') {
      if (!body.request?.trim() || !body.currentPlan || !body.survey) {
        return NextResponse.json({ error: 'Missing refine data' }, { status: 400 });
      }
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 6000,
        system: REFINE_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: buildRefinePrompt(body) }],
      });
      const text = response.content
        .filter((block) => block.type === 'text')
        .map((block) => block.text)
        .join('\n');
      return NextResponse.json(parseRefine(text));
    }

    // ---------- GENERATE: streamed, so the plan appears while it is written ----------
    if (!body.prompt) {
      return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
    }

    const stream = anthropic.messages.stream({
      model: MODEL,
      max_tokens: 12000,
      system: GENERATE_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: body.prompt }],
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
        } catch (error) {
          console.error('Generate stream error:', error);
          const message = error instanceof Error ? error.message : 'Generation failed';
          controller.enqueue(encoder.encode(`\n${STREAM_ERROR_MARKER} ${message}`));
        } finally {
          controller.close();
        }
      },
      cancel() {
        stream.abort();
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error: unknown) {
    console.error('Generate Route Error:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
