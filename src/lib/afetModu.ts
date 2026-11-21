// Afet modu: deprem anında ana ekran sadeleşir ve sadece hayati düğmeler
// kalır. Kullanıcı açabilir ya da kullanıcının yakınında büyük bir deprem
// olduğunda uygulama bir kez otomatik açar.

import AsyncStorage from './asyncStorage';

const MODE_KEY = 'elele_afet_modu_v1';
const AUTO_KEY = 'elele_afet_modu_oto_v1';

export async function isAfetModu(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(MODE_KEY)) === '1';
  } catch {
    return false;
  }
}

export async function setAfetModu(on: boolean): Promise<void> {
  try {
    if (on) await AsyncStorage.setItem(MODE_KEY, '1');
    else await AsyncStorage.removeItem(MODE_KEY);
  } catch {
    // yok say
  }
}

/** Bu deprem için afet modu daha önce otomatik açıldı mı? Kullanıcı kapattıysa tekrar açmayalım. */
export async function wasAutoOpenedFor(quakeId: string): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(AUTO_KEY)) === quakeId;
  } catch {
    return true;
  }
}

export async function markAutoOpened(quakeId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(AUTO_KEY, quakeId);
  } catch {
    // yok say
  }
}
