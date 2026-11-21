import AsyncStorage from './asyncStorage';

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
}

export const MAX_EMERGENCY_CONTACTS = 5;

const STORAGE_KEY = 'elele_acil_durum_kisileri_v1';

/** Cihazda kayıtlı acil durum kişilerini okur. Hiç yoksa veya okunamazsa boş liste döner. */
export async function getEmergencyContacts(): Promise<EmergencyContact[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as EmergencyContact[]) : [];
  } catch {
    return [];
  }
}

/** Acil durum kişi listesini cihazda saklar. */
export async function saveEmergencyContacts(contacts: EmergencyContact[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
  } catch {
    // Kaydedilemese bile mevcut oturumda kullanılmaya devam edilir.
  }
}
