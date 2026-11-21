// Deprem çantası kontrol listesi (AFAD önerileri). İşaretler cihazda saklanır.
import AsyncStorage from './asyncStorage';

export interface BagItem {
  id: string;
  label: string;
  hint: string;
}

export const BAG_ITEMS: BagItem[] = [
  { id: 'su', label: 'Su', hint: 'Kişi başı en az 3 günlük içme suyu' },
  { id: 'yiyecek', label: 'Uzun ömürlü yiyecek', hint: 'Konserve, kuru gıda, bisküvi' },
  { id: 'fener', label: 'El feneri ve yedek pil', hint: 'Telefon dışında bir ışık kaynağı' },
  { id: 'duduk', label: 'Düdük', hint: 'Enkaz altında sesini duyurmak için' },
  { id: 'ilkyardim', label: 'İlk yardım çantası', hint: 'Sargı bezi, yara bandı, antiseptik' },
  { id: 'ilac', label: 'Düzenli kullandığın ilaçlar', hint: 'En az birkaç günlük' },
  { id: 'belge', label: 'Önemli belgelerin kopyası', hint: 'Kimlik, tapu, sigorta; su geçirmez poşette' },
  { id: 'sarj', label: 'Powerbank ve şarj kablosu', hint: 'Dolu tut' },
  { id: 'giysi', label: 'Yedek giysi ve battaniye', hint: 'Mevsime uygun' },
  { id: 'para', label: 'Bir miktar nakit para', hint: 'Kart çalışmayabilir' },
];

const KEY = 'elele_deprem_cantasi_v1';

export async function getBagChecked(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function setBagChecked(ids: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    // yok say
  }
}
