// Yakındaki market, bakkal, fırın ve eczaneler.
// 1) Önce kendi sunucu fonksiyonumuz (supabase/functions/yakindaki-yerler)
//    üzerinden Google Places'ten çekilir; Google anahtarı uygulamada değil sunucuda.
// 2) O çalışmazsa ücretsiz OpenStreetMap (Overpass API) denenir. Afetten sonra hangi yerin
// açık olduğu bilinemeyeceği için kullanıcılar "açık / kapalı / stok yok"
// bildirimi yapabilir (place_reports tablosu).

import { supabase, isSupabaseConfigured } from './supabase';
import { getDeviceId } from './moderation';
import { calcDistanceKm } from './geo';
import { Coords } from './types';

export type PlaceKind = 'market' | 'bakkal' | 'firin' | 'eczane';
export type PlaceStatus = 'acik' | 'kapali' | 'stok_yok';

export interface Place {
  id: string; // örn. "node/123"
  kind: PlaceKind;
  name: string;
  lat: number;
  lng: number;
  distanceKm: number;
}

export interface PlaceReport {
  status: PlaceStatus;
  createdAt: number;
}

export const PLACE_KIND_LABEL: Record<PlaceKind, string> = {
  market: 'Market',
  bakkal: 'Bakkal',
  firin: 'Fırın',
  eczane: 'Eczane',
};

export const PLACE_KIND_EMOJI: Record<PlaceKind, string> = {
  market: '🛒',
  bakkal: '🏪',
  firin: '🥖',
  eczane: '💊',
};

export const STATUS_LABEL: Record<PlaceStatus, string> = {
  acik: 'Açık',
  kapali: 'Kapalı',
  stok_yok: 'Açık ama ürün yok',
};

// OpenStreetMap'in ücretsiz, herkese açık Overpass sunucuları. Biri yoğunsa
// ya da yanıt vermezse sıradakine geçilir. Hiçbiri ücret ya da anahtar istemez.
const OVERPASS_URLS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

// Tarayıcı kendi User-Agent bilgisini gönderir; burada sadece içerik türleri.
const HEADERS = {
  'Content-Type': 'application/x-www-form-urlencoded',
  Accept: 'application/json',
};

function kindFromTags(tags: Record<string, string>): PlaceKind | null {
  if (tags.amenity === 'pharmacy') return 'eczane';
  const shop = tags.shop;
  if (shop === 'supermarket') return 'market';
  if (shop === 'convenience' || shop === 'grocery' || shop === 'greengrocer') return 'bakkal';
  if (shop === 'bakery') return 'firin';
  return null;
}

async function fetchWithTimeout(url: string, init: RequestInit, ms: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export type PlacesSource = 'google' | 'osm';

async function fromGoogle(center: Coords, radius: number): Promise<Place[] | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data, error } = await supabase.functions.invoke('yakindaki-yerler', {
      body: { lat: center.lat, lng: center.lng, radius },
    });
    const list = (data as { places?: Omit<Place, 'distanceKm'>[] } | null)?.places;
    if (error || !Array.isArray(list)) return null;
    return list
      .map((p) => ({ ...p, name: p.name || PLACE_KIND_LABEL[p.kind], distanceKm: calcDistanceKm(center.lat, center.lng, p.lat, p.lng) }))
      .sort((a, b) => a.distanceKm - b.distanceKm);
  } catch {
    return null;
  }
}

/**
 * Önce Google (1,5 km, bulunamazsa 4 km), olmazsa OpenStreetMap.
 * Hangi kaynaktan geldiği de döner; ekranda kaynak olarak gösterilir.
 */
export async function fetchNearbyPlaces(center: Coords): Promise<{ places: Place[]; source: PlacesSource }> {
  const g1 = await fromGoogle(center, 1500);
  if (g1 && g1.length > 0) return { places: g1, source: 'google' };
  if (g1) {
    const g2 = await fromGoogle(center, 4000);
    if (g2 && g2.length > 0) return { places: g2, source: 'google' };
  }
  const near = await queryPlaces(center, 1500);
  if (near.length > 0) return { places: near, source: 'osm' };
  return { places: await queryPlaces(center, 4000), source: 'osm' };
}

async function queryPlaces(center: Coords, radiusM: number): Promise<Place[]> {
  const around = `(around:${radiusM},${center.lat},${center.lng})`;
  const query = `[out:json][timeout:20];
(
  nwr["shop"~"^(supermarket|convenience|grocery|greengrocer|bakery)$"]${around};
  nwr["amenity"="pharmacy"]${around};
);
out center 100;`;

  let lastError: unknown = null;
  for (const url of OVERPASS_URLS) {
    try {
      const res = await fetchWithTimeout(
        url,
        {
          method: 'POST',
          headers: HEADERS,
          body: `data=${encodeURIComponent(query)}`,
        },
        25000
      );
      if (!res.ok) throw new Error(`overpass ${res.status}`);
      const raw = await res.text();
      // Yoğunluk anında sunucu JSON yerine bir hata sayfası döndürebilir.
      if (!raw.trim().startsWith('{')) throw new Error('overpass_busy');
      const json = JSON.parse(raw);
      const elements: any[] = Array.isArray(json?.elements) ? json.elements : [];
      const places: Place[] = [];
      for (const el of elements) {
        const tags = (el.tags ?? {}) as Record<string, string>;
        const kind = kindFromTags(tags);
        const lat = typeof el.lat === 'number' ? el.lat : el.center?.lat;
        const lng = typeof el.lon === 'number' ? el.lon : el.center?.lon;
        if (!kind || typeof lat !== 'number' || typeof lng !== 'number') continue;
        places.push({
          id: `${el.type}/${el.id}`,
          kind,
          name: tags.name || PLACE_KIND_LABEL[kind],
          lat,
          lng,
          distanceKm: calcDistanceKm(center.lat, center.lng, lat, lng),
        });
      }
      return places.sort((a, b) => a.distanceKm - b.distanceKm);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError ?? new Error('overpass_failed');
}

/** Son 6 saatte yapılan durum bildirimlerinden her yer için en yenisini döner. */
export async function fetchPlaceReports(ids: string[]): Promise<Record<string, PlaceReport>> {
  if (!isSupabaseConfigured || !supabase || ids.length === 0) return {};
  const since = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('place_reports')
    .select('place_id, status, created_at')
    .in('place_id', ids.slice(0, 150))
    .gte('created_at', since)
    .order('created_at', { ascending: false });
  if (error || !data) return {};
  const out: Record<string, PlaceReport> = {};
  for (const row of data as { place_id: string; status: PlaceStatus; created_at: string }[]) {
    if (!out[row.place_id]) {
      out[row.place_id] = { status: row.status, createdAt: new Date(row.created_at).getTime() };
    }
  }
  return out;
}

export async function reportPlaceStatus(placeId: string, status: PlaceStatus): Promise<void> {
  if (!isSupabaseConfigured || !supabase) throw new Error('not_configured');
  const deviceId = await getDeviceId();
  const { error } = await supabase
    .from('place_reports')
    .insert({ place_id: placeId, status, device_id: deviceId });
  if (error) throw error;
}
