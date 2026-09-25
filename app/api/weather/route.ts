import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// -----------------------------------------------------------------------
// Weather provider adapter. Default: Open-Meteo (api.open-meteo.com) — a
// free, keyless weather API, good enough for a real production reading.
//
// To switch providers later (e.g. OpenWeatherMap, WeatherAPI):
//   1. Set WEATHER_API_KEY in your environment.
//   2. Replace the fetch below with the new provider's call.
//   3. Keep the return shape (WeatherSnapshot) identical — nothing else
//      in the app needs to change, since every screen goes through
//      lib/weatherService.ts -> this route.
// -----------------------------------------------------------------------

function weatherCodeToCondition(code: number, tempC: number, humidity: number): string {
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'rain';
  if ([95, 96, 99].includes(code)) return 'storm';
  if ([1, 2, 3, 45, 48].includes(code)) return humidity > 75 ? 'humid' : 'clouds';
  if (tempC >= 34) return 'hot';
  if (tempC < 18) return 'cool';
  return 'clear';
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get('lat') || '');
  const lon = parseFloat(searchParams.get('lon') || '');

  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    return NextResponse.json({ error: 'lat and lon query params are required' }, { status: 400 });
  }

  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(lat));
  url.searchParams.set('longitude', String(lon));
  url.searchParams.set('current', 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m');
  url.searchParams.set('hourly', 'precipitation_probability,uv_index');
  url.searchParams.set('daily', 'sunrise,sunset');
  url.searchParams.set('timezone', 'auto');
  url.searchParams.set('forecast_days', '1');

  try {
    const upstream = await fetch(url.toString(), { next: { revalidate: 600 } });
    if (!upstream.ok) throw new Error(`open-meteo ${upstream.status}`);
    const data = await upstream.json();

    const cur = data.current;
    const currentHourIso: string = cur.time; // e.g. "2026-09-25T10:00"
    const hourlyTimes: string[] = data.hourly?.time || [];
    let hourIdx = hourlyTimes.indexOf(currentHourIso);
    if (hourIdx === -1) hourIdx = 0;

    const rainChance = data.hourly?.precipitation_probability?.[hourIdx] ?? 0;
    const uv = data.hourly?.uv_index?.[hourIdx] ?? 4;

    const snapshot = {
      tempC: Math.round(cur.temperature_2m * 10) / 10,
      feelsLikeC: Math.round(cur.apparent_temperature * 10) / 10,
      humidity: Math.round(cur.relative_humidity_2m),
      rainChance: Math.round(rainChance),
      windKph: Math.round(cur.wind_speed_10m),
      uv: Math.round(uv),
      condition: weatherCodeToCondition(cur.weather_code, cur.temperature_2m, cur.relative_humidity_2m),
      sunrise: data.daily?.sunrise?.[0],
      sunset: data.daily?.sunset?.[0],
      source: 'live' as const,
      fetchedAt: Date.now(),
    };

    return NextResponse.json(snapshot, {
      headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=600' },
    });
  } catch (err) {
    return NextResponse.json({ error: 'weather provider unavailable' }, { status: 502 });
  }
}
