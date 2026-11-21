// Bildirme, gizleme ve engelleme (mobil uygulamadaki lib/moderation.ts'nin web hali).
// Hesap sistemi olmadığı için tarayıcıya özel, kişisel bilgi içermeyen rastgele bir kimlik kullanılır.
import AsyncStorage from './asyncStorage';
import { supabase, isSupabaseConfigured } from './supabase';

const DEVICE_ID_KEY = 'elele_device_id';
const BLOCKED_KEY = 'elele_blocked_devices';

export const REPORT_REASONS = [
  'Uygunsuz veya müstehcen içerik',
  'Hakaret veya nefret söylemi',
  'Dolandırıcılık veya sahte ilan',
  'Spam',
  'Diğer',
] as const;

function randomId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < 32; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

let cachedDeviceId: string | null = null;

export async function getDeviceId(): Promise<string> {
  if (cachedDeviceId) return cachedDeviceId;
  const saved = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (saved) return (cachedDeviceId = saved);
  const fresh = randomId();
  await AsyncStorage.setItem(DEVICE_ID_KEY, fresh);
  return (cachedDeviceId = fresh);
}

export function requestHideKey(requestId: string): string {
  return `request:${requestId}`;
}

export async function getBlocked(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(BLOCKED_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export async function addBlocked(key: string): Promise<Set<string>> {
  const next = await getBlocked();
  next.add(key);
  await AsyncStorage.setItem(BLOCKED_KEY, JSON.stringify(Array.from(next)));
  return next;
}

export function isRequestHidden(blocked: Set<string>, r: { id: string; deviceId?: string | null }): boolean {
  if (blocked.has(requestHideKey(r.id))) return true;
  return !!r.deviceId && blocked.has(r.deviceId);
}

/** Bir yardım talebini şikâyet eder. Şikâyetler sadece yönetici tarafından görülebilir. */
export async function reportRequest(requestId: string, reportedDeviceId: string | null | undefined, reason: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  const row = {
    content_type: 'request',
    content_id: requestId,
    reported_device_id: reportedDeviceId || null,
    reporter_device_id: await getDeviceId(),
    reason,
  };
  let { error } = await supabase.from('content_reports').insert(row);
  if (error) {
    ({ error } = await supabase.from('content_reports').insert({ ...row, content_type: 'trip', content_id: requestHideKey(requestId) }));
  }
  return !error;
}
