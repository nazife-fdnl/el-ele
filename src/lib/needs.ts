import { NeedItem } from './types';

export const NEEDS: NeedItem[] = [
  { id: 'enkaz', emoji: '🆘', label: 'Enkaz Altındayım', description: 'Kurtarma ekibi gerekiyor' },
  { id: 'su', emoji: '🚰', label: 'Su', description: 'İçme suyu ihtiyacı' },
  { id: 'yiyecek', emoji: '🍞', label: 'Yiyecek', description: 'Gıda ihtiyacı' },
  { id: 'ilac', emoji: '💊', label: 'İlaç', description: 'Acil ilaç ihtiyacı' },
  { id: 'ilkyardim', emoji: '🩹', label: 'İlkyardım', description: 'Tıbbi müdahale gerekiyor' },
  { id: 'barinak', emoji: '⛺', label: 'Barınak', description: 'Kalacak yer ihtiyacı' },
  { id: 'isik', emoji: '🔦', label: 'Işık', offerLabel: 'El Feneri', description: 'El feneri / ışık kaynağı' },
  { id: 'bebek', emoji: '👶', label: 'Bebek Eşyaları', offerLabel: 'Bebek Eşyaları', description: 'Bebek maması, bezi, giysisi' },
  { id: 'tasima', emoji: '🚗', label: 'Taşıma', offerLabel: 'Araç/Taşıma', description: 'Araç / taşıma yardımı' },
  { id: 'sarj', emoji: '🔋', label: 'Şarj', description: 'Telefon şarj etme' },
  { id: 'kan', emoji: '🩸', label: 'Kan', description: 'Acil kan ihtiyacı' },
  { id: 'giysi', emoji: '🧥', label: 'Giysi', offerLabel: 'Giysi/Battaniye', description: 'Kıyafet / battaniye' },
];

export const NEED_MAP: Record<string, NeedItem> = Object.fromEntries(
  NEEDS.map((n) => [n.id, n])
);

export function needLabel(id: string): string {
  return NEED_MAP[id]?.label || id;
}

export function needEmoji(id: string): string {
  return NEED_MAP[id]?.emoji || '❓';
}
