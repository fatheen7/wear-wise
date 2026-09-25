import { NextRequest, NextResponse } from 'next/server';
import { assistantReply, AssistantContext } from '@/lib/assistantEngine';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { message, context } = body as { message: string; context: AssistantContext };

  if (!message || typeof message !== 'string') {
    return NextResponse.json({ error: 'message is required' }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  // No key configured: fall back to the deterministic, fully-functional
  // rule-based engine. This is not a placeholder — it's the real answer,
  // just without the more conversational phrasing the AI layer adds.
  if (!apiKey) {
    const reply = assistantReply(message, context);
    return NextResponse.json({ reply, mode: 'rules' });
  }

  try {
    const wardrobeSummary = (context.wardrobe || [])
      .map((w) => `${w.name} (${w.category}, formality ${w.formality})`)
      .join('; ');
    const weatherSummary = context.weather
      ? `${Math.round(context.weather.tempC)}°C, feels like ${Math.round(context.weather.feelsLikeC)}°C, ${context.weather.humidity}% humidity, ${context.weather.rainChance}% rain chance`
      : 'unavailable';

    const system = `You are WearWise's stylist assistant, embedded in a mobile outfit app. You know the user's wardrobe, today's weather, and their current outfit. Answer ONLY fashion/outfit questions (colour matching, socks, shoes, belts, layering, weather-appropriateness). Keep answers to 1-3 short sentences, concrete and specific to their actual wardrobe items when possible. Never mention that you are an AI model or discuss anything outside fashion/outfit advice.

Context:
Wardrobe: ${wardrobeSummary || 'empty'}
Today's weather: ${weatherSummary}
Occasion: ${context.context}
Current outfit: ${context.currentOutfit ? JSON.stringify(context.currentOutfit) : 'none selected'}`;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 300,
        system,
        messages: [{ role: 'user', content: message }],
      }),
    });

    if (!res.ok) throw new Error(`anthropic api ${res.status}`);
    const data = await res.json();
    const textBlock = (data.content || []).find((b: any) => b.type === 'text');
    const reply = textBlock?.text?.trim();
    if (!reply) throw new Error('empty AI response');

    return NextResponse.json({ reply, mode: 'ai' });
  } catch (err) {
    // AI call failed for any reason — degrade to the deterministic engine
    // rather than surfacing an error for a question the app can still answer.
    const reply = assistantReply(message, context);
    return NextResponse.json({ reply, mode: 'rules-fallback' });
  }
}
