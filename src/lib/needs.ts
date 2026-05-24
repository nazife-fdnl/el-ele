import { NeedItem } from './types';

export const NEEDS: NeedItem[] = [
  { id: 'enkaz', emoji: '🆘', label: 'Enkaz Altındayım', description: 'Kurtarma ekibi gerekiyor' },
  { id: 'su', emoji: '🚰', label: 'Su', description: 'İçme suyu ihtiyacı' },
  { id: 'yiyecek', emoji: '🍞', label: 'Yiyecek', description: 'Gıda ihtiyacı' },
  { id: 'ilac', emoji: '💊', label: 'İlaç', description: 'Acil ilaç ihtiyacı' },
  { id: 'ilkyardim', emoji: '🩹', label: 'İlkyardım', description: 'Tıbbi müdahale gerekiyor' },
  { id: 'barinак', emoji: '⛺', label: 'Barınak', description: 'Kalacak yer ihtiyacı' },
  { id: 'isik', emoji: '🔦', label: 'Işık', description: 'El feneri / ışık kaynağı' },
  { id: 'bebek', emoji: '👶', label: 'Bebek', description: 'Bebek maması / bezi' },
  { id: 'tasima', emoji: '🚗', label: 'Taşıma', description: 'Araç / taşıma yardımı' },
  { id: 'sarj', emoji: '🔋', label: 'Şarj', description: 'Telefon şarj etme' },
  { id: 'kan', emoji: '🩸', label: 'Kan', description: 'Acil kan ihtiyacı' },
  { id: 'giysi', emoji: '🧥', label: 'Giysi', description: 'Kıyafet / battaniye' },
];

export const NEED_LABELS: Record<string, string> = Object.fromEntries(
  NEEDS.map((n) => [n.id, n.label])
);
