// Tarayıcıdan konum alma. İzin verilmezse konum başka hiçbir yoldan (IP vb.)
// tahmin edilmez; kullanıcı ilini listeden seçebilir.
import { Coords } from './types';

export type LocationResult = { ok: true; coords: Coords } | { ok: false; reason: 'denied' | 'unavailable' };

export function getBrowserLocation(timeoutMs = 15000): Promise<LocationResult> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve({ ok: false, reason: 'unavailable' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ ok: true, coords: { lat: pos.coords.latitude, lng: pos.coords.longitude } }),
      (err) => resolve({ ok: false, reason: err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable' }),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 60000 }
    );
  });
}

/** İzin penceresi açmadan, izin daha önce verilmişse konumu döner. */
export async function getLocationIfGranted(): Promise<Coords | null> {
  try {
    const perm = await navigator.permissions?.query({ name: 'geolocation' as PermissionName });
    if (perm && perm.state !== 'granted') return null;
  } catch {
    return null;
  }
  const r = await getBrowserLocation(8000);
  return r.ok ? r.coords : null;
}
