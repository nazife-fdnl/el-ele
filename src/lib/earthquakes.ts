// Son depremler. Öncelik sırası:
//  1) Kendi sunucu fonksiyonumuz (supabase/functions/son-depremler): AFAD'dan
//     çekip tek biçime çevirir. Kaynak biçimi değişirse uygulamayı
//     güncellemeden sunucudan düzeltebiliriz.
//  2) Fonksiyon kurulu değilse ya da çalışmazsa doğrudan AFAD.
//  3) AFAD da yanıt vermezse Kandilli (gayriresmî açık API).
// Not: Bu bilgi depremden SONRA gelir, erken uyarı değildir.

import { supabase, isSupabaseConfigured } from './supabase';
import { calcDistanceKm } from './geo';
import { Coords } from './types';

export interface Quake {
  id: string;
  mag: number;
  place: string;
  province: string | null;
  lat: number;
  lng: number;
  depthKm: number | null;
  time: number; // ms (UTC)
  source: 'AFAD' | 'Kandilli';
}

function num(v: unknown): number | null {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? parseFloat(v) : NaN;
  return Number.isFinite(n) ? n : null;
}

/** AFAD tarihleri saat dilimi belirtilmeden UTC olarak gelir. */
function parseAfadDate(v: unknown): number | null {
  if (typeof v !== 'string' || !v) return null;
  const hasZone = /([zZ]|[+-]\d{2}:?\d{2})$/.test(v);
  const t = Date.parse(hasZone ? v : `${v.replace(' ', 'T')}Z`);
  return Number.isFinite(t) ? t : null;
}

export function parseAfad(json: unknown): Quake[] {
  const arr: any[] = Array.isArray(json) ? json : Array.isArray((json as any)?.result) ? (json as any).result : [];
  const out: Quake[] = [];
  for (const e of arr) {
    const mag = num(e.magnitude ?? e.mag);
    const lat = num(e.latitude ?? e.lat);
    const lng = num(e.longitude ?? e.lng ?? e.lon);
    const time = parseAfadDate(e.date ?? e.eventDate);
    if (mag === null || lat === null || lng === null || time === null) continue;
    const province = typeof e.province === 'string' && e.province ? e.province : null;
    const district = typeof e.district === 'string' && e.district ? e.district : null;
    const place =
      district && province ? `${district} (${province})` : typeof e.location === 'string' && e.location ? e.location : province ?? 'Bilinmeyen konum';
    out.push({
      id: `afad-${e.eventID ?? e.eventId ?? `${time}-${lat}-${lng}`}`,
      mag,
      place,
      province,
      lat,
      lng,
      depthKm: num(e.depth),
      time,
      source: 'AFAD',
    });
  }
  return out;
}

function titleCaseTr(s: string): string {
  return s
    .toLocaleLowerCase('tr-TR')
    .split(' ')
    .map((w) => (w ? w.charAt(0).toLocaleUpperCase('tr-TR') + w.slice(1) : w))
    .join(' ');
}

export function parseKandilli(json: unknown): Quake[] {
  const arr: any[] = Array.isArray((json as any)?.result) ? (json as any).result : [];
  const out: Quake[] = [];
  for (const e of arr) {
    const mag = num(e.mag);
    const coords = e.geojson?.coordinates;
    const lng = num(Array.isArray(coords) ? coords[0] : e.lng);
    const lat = num(Array.isArray(coords) ? coords[1] : e.lat);
    let time: number | null = null;
    if (typeof e.created_at === 'number') time = e.created_at * 1000;
    else if (typeof e.date_time === 'string') {
      // Kandilli saatleri Türkiye saatidir (UTC+3).
      const t = Date.parse(`${e.date_time.replace(' ', 'T')}+03:00`);
      time = Number.isFinite(t) ? t : null;
    }
    if (mag === null || lat === null || lng === null || time === null) continue;
    const title = typeof e.title === 'string' ? e.title : '';
    const m = title.match(/\(([^)]+)\)\s*$/);
    const province = m ? titleCaseTr(m[1].trim()) : null;
    out.push({
      id: `kandilli-${e.earthquake_id ?? `${time}-${lat}-${lng}`}`,
      mag,
      place: title ? titleCaseTr(title) : 'Bilinmeyen konum',
      province,
      lat,
      lng,
      depthKm: num(e.depth),
      time,
      source: 'Kandilli',
    });
  }
  return out;
}

function fmtUtc(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}`;
}

async function fetchJson(url: string, ms = 12000): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`http ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchAfadDirect(hours = 48): Promise<Quake[]> {
  const end = new Date(Date.now() + 60 * 60 * 1000);
  const start = new Date(Date.now() - hours * 60 * 60 * 1000);
  const url =
    'https://deprem.afad.gov.tr/apiv2/event/filter' +
    `?start=${encodeURIComponent(fmtUtc(start))}&end=${encodeURIComponent(fmtUtc(end))}` +
    '&orderby=timedesc&limit=200';
  return parseAfad(await fetchJson(url));
}

export async function fetchKandilliDirect(): Promise<Quake[]> {
  return parseKandilli(await fetchJson('https://api.orhanaydogdu.com.tr/deprem/kandilli/live'));
}

function sortAndTrim(list: Quake[]): Quake[] {
  return [...list].sort((a, b) => b.time - a.time).slice(0, 200);
}

export async function fetchRecentQuakes(): Promise<Quake[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.functions.invoke('son-depremler', { method: 'GET' });
      const list = (data as { quakes?: Quake[] } | null)?.quakes;
      if (!error && Array.isArray(list) && list.length > 0) return sortAndTrim(list);
    } catch {
      // sunucu fonksiyonu yoksa doğrudan kaynaklara geç
    }
  }
  try {
    const afad = await fetchAfadDirect();
    if (afad.length > 0) return sortAndTrim(afad);
  } catch {
    // AFAD yanıt vermedi
  }
  return sortAndTrim(await fetchKandilliDirect());
}

/** Kullanıcının yakınında son 3 saatte büyük (≥5.0) bir deprem oldu mu? Afet modunu önermek için. */
export function findMajorNearby(quakes: Quake[], where: Coords | null, province: string | null): Quake | null {
  const since = Date.now() - 3 * 60 * 60 * 1000;
  for (const q of quakes) {
    if (q.time < since || q.mag < 5) continue;
    if (where && calcDistanceKm(where.lat, where.lng, q.lat, q.lng) <= 150) return q;
    if (province && q.province && normalizeTr(q.province) === normalizeTr(province)) return q;
  }
  return null;
}

export function normalizeTr(s: string): string {
  return s
    .toLocaleLowerCase('tr-TR')
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/ı/g, 'i')
    .replace(/i̇/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ş/g, 's')
    .replace(/ü/g, 'u')
    .trim();
}

export function magColor(mag: number): { bg: string; fg: string } {
  if (mag >= 4) return { bg: '#D32F2F', fg: '#FFFFFF' };
  if (mag >= 3) return { bg: '#F6C6C6', fg: '#111827' };
  return { bg: '#E5E7EB', fg: '#111827' };
}

export function formatQuakeTime(t: number): string {
  const mins = Math.round((Date.now() - t) / 60000);
  if (mins < 1) return 'az önce';
  if (mins < 60) return `${mins} dk önce`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} sa önce`;
  const d = new Date(t);
  return d.toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}
