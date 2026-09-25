import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const VALID_CATEGORIES = ['tops', 'bottoms', 'shoes', 'accessories'];
const VALID_COLORS = ['navy', 'black', 'white', 'grey', 'brown', 'light blue', 'blue', 'tan', 'silver', 'beige', 'maroon', 'olive'];

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    // Explicit, honest "not configured" response — the client uses this to
    // fall back to the manual quick-add flow instead of pretending to scan.
    return NextResponse.json({ available: false, reason: 'ANTHROPIC_API_KEY not configured' }, { status: 501 });
  }

  const body = await req.json();
  const { imageBase64, mediaType } = body as { imageBase64: string; mediaType: string };
  if (!imageBase64 || !mediaType) {
    return NextResponse.json({ error: 'imageBase64 and mediaType are required' }, { status: 400 });
  }

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 200,
        system: `Identify the single clothing item in the photo. Respond ONLY with compact JSON, no prose, no markdown fences: {"category":one of ${JSON.stringify(VALID_CATEGORIES)},"sub":short type like "Formal shirt" or "Loafers","color":one of ${JSON.stringify(VALID_COLORS)} (closest match),"formality":integer 1-5,"name":short display name}`,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageBase64 } },
              { type: 'text', text: 'Identify this clothing item.' },
            ],
          },
        ],
      }),
    });

    if (!res.ok) throw new Error(`anthropic api ${res.status}`);
    const data = await res.json();
    const textBlock = (data.content || []).find((b: any) => b.type === 'text');
    const raw = textBlock?.text?.trim() || '';
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    if (!VALID_CATEGORIES.includes(parsed.category)) parsed.category = 'tops';
    if (!VALID_COLORS.includes(parsed.color)) parsed.color = 'navy';
    parsed.formality = Math.min(5, Math.max(1, Math.round(parsed.formality) || 3));

    return NextResponse.json({ available: true, item: parsed });
  } catch (err) {
    return NextResponse.json({ available: false, reason: 'recognition failed, try manual entry' }, { status: 502 });
  }
}
