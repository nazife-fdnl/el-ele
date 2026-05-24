import { HelpRequest } from './types';

const STORE_KEY = 'elele_requests';

export function getRequests(): HelpRequest[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveRequest(req: HelpRequest): void {
  const all = getRequests();
  all.push(req);
  localStorage.setItem(STORE_KEY, JSON.stringify(all));
}

export function getHelpers(): HelpRequest[] {
  return getRequests().filter((r) => r.type === 'offer');
}

export function getNeeders(): HelpRequest[] {
  return getRequests().filter((r) => r.type === 'need');
}

export function calcDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
