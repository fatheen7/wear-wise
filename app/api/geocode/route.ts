import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  // Reverse geocoding (device location -> readable place name), used by
  // the "Use my location" onboarding flow. BigDataCloud's client endpoint
  // is free and keyless, same spirit as the Open-Meteo forward search below.
  if (lat && lon) {
    try {
      const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
      const upstream = await fetch(url);
      if (!upstream.ok) throw new Error(`reverse geocode ${upstream.status}`);
      const data = await upstream.json();
      const name = data.city || data.locality || data.principalSubdivision || 'Current location';
      return NextResponse.json({ results: [{ name, lat: parseFloat(lat), lon: parseFloat(lon) }] });
    } catch {
      return NextResponse.json({ results: [{ name: 'Current location', lat: parseFloat(lat), lon: parseFloat(lon) }] });
    }
  }

  const q = searchParams.get('q');
  if (!q || q.trim().length < 2) {
    return NextResponse.json({ results: [] });
  }

  const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
  url.searchParams.set('name', q.trim());
  url.searchParams.set('count', '5');
  url.searchParams.set('language', 'en');

  try {
    const upstream = await fetch(url.toString());
    if (!upstream.ok) throw new Error(`geocoding ${upstream.status}`);
    const data = await upstream.json();
    const results = (data.results || []).map((r: any) => ({
      name: r.admin1 ? `${r.name}, ${r.admin1}, ${r.country}` : `${r.name}, ${r.country}`,
      lat: r.latitude,
      lon: r.longitude,
    }));
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
