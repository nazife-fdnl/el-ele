// "Depremde Ne Yaparsın?" oyununun bölümleri ve ilerleme kaydı.
// Davranışlar AFAD önerilerine göre: Çök-Kapan-Tutun, camlardan ve devrilebilecek
// eşyalardan uzak durma, gaz kokusunda ateş/kıvılcım yok, enkazda ses çıkarıp
// gücünü koruma. "Yaşam üçgeni" ve kapı eşiği artık önerilmediği için kullanılmaz.

import AsyncStorage from './asyncStorage';

export type ObjKind =
  | 'table' | 'window' | 'shelf' | 'door' | 'bed' | 'wardrobe'
  | 'building' | 'pole' | 'park'
  | 'stove' | 'valve' | 'switch' | 'match'
  | 'cloth' | 'whistle' | 'pipe' | 'shout';

export type SceneKind = 'salon' | 'yatak' | 'sokak' | 'mutfak' | 'enkaz' | 'canta';

export interface Spot {
  id: string;
  kind: ObjKind;
  label: string;
  // Sahne içindeki yeri, sahne genişliği/yüksekliğinin oranı olarak (0..1).
  x: number;
  y: number;
  w: number;
  h: number;
  safe?: boolean; // "ulaş" bölümlerinde doğru yer
  fail?: string; // tehlikeli seçim olursa ne olduğunu anlatan metin
  labelAbove?: boolean; // etiket yanındaki eşyanın etiketiyle çakışmasın diye üstte gösterilir
}

export interface BagItemG {
  id: string;
  label: string;
  icon: string; // lucide-react ikon adı
  good: boolean;
  why: string;
}

interface LevelBase {
  id: string;
  no: number;
  phase: 'Önce' | 'Anında' | 'Sonra';
  title: string;
  scene: SceneKind;
  intro: string;
  success: string;
  lesson: string;
}

export interface ReachLevel extends LevelBase {
  type: 'reach';
  start: { x: number; y: number; lying?: boolean };
  spots: Spot[];
  holdLabel: string;
  holdFail: string;
}

export interface SequenceLevel extends LevelBase {
  type: 'sequence';
  spots: Spot[];
  steps: string[]; // doğru sıra (son adım çıkış/kurtuluş)
  finals: string[]; // bu id'lerden birine basılınca bölüm biter
  earlyNote: string; // son adıma erken basılırsa
}

export interface CollectLevel extends LevelBase {
  type: 'collect';
  items: BagItemG[];
  seconds: number;
}

export type Level = ReachLevel | SequenceLevel | CollectLevel;

export const LEVELS: Level[] = [
  {
    id: 'canta',
    no: 1,
    phase: 'Önce',
    title: 'Çantanı hazırla',
    scene: 'canta',
    type: 'collect',
    seconds: 25,
    intro: 'Deprem olmadan önce hazırlık her şeydir. Deprem çantana gerekenleri koy, gereksizleri bırak. Süren 25 saniye!',
    items: [
      { id: 'su', label: 'Su', icon: 'GlassWater', good: true, why: '' },
      { id: 'fener', label: 'El feneri', icon: 'Flashlight', good: true, why: '' },
      { id: 'duduk', label: 'Düdük', icon: 'Megaphone', good: true, why: '' },
      { id: 'ilkyardim', label: 'İlk yardım', icon: 'BriefcaseMedical', good: true, why: '' },
      { id: 'ilac', label: 'İlaçlar', icon: 'Pill', good: true, why: '' },
      { id: 'belge', label: 'Belgeler', icon: 'FileText', good: true, why: '' },
      { id: 'konsol', label: 'Oyun konsolu', icon: 'Gamepad2', good: false, why: 'Oyun konsolu acil durumda işe yaramaz, çantanı ağırlaştırır.' },
      { id: 'tv', label: 'Televizyon', icon: 'Tv', good: false, why: 'Televizyon çok ağır; çantada yeri yok.' },
      { id: 'parfum', label: 'Parfüm', icon: 'SprayCan', good: false, why: 'Parfüm gerekli değil; yerine su ya da yiyecek koy.' },
    ],
    success: 'Çantan hazır! Su, fener, düdük, ilk yardım malzemesi, ilaçların ve belgelerin yanında.',
    lesson: 'Deprem çantanı kapının yakınında tut. İçinde su, uzun ömürlü yiyecek, el feneri, düdük, ilk yardım malzemesi, ilaçların ve önemli belgelerinin kopyası olsun.',
  },
  {
    id: 'salon',
    no: 2,
    phase: 'Anında',
    title: 'Oturma odası',
    scene: 'salon',
    type: 'reach',
    intro: 'Oturma odasındasın. Birazdan deprem başlayacak! Ekran sallanınca güvenli yere dokun, sonra sarsıntı bitene kadar tutun.',
    start: { x: 0.45, y: 0.92 },
    spots: [
      { id: 'pencere', kind: 'window', label: 'Pencere', x: 0.04, y: 0.1, w: 0.26, h: 0.34, fail: 'Camlar kırıldı ve kıymıklar etrafa saçıldı! Sarsıntıda pencerelerden uzak dur.' },
      { id: 'kitaplik', kind: 'shelf', label: 'Kitaplık', x: 0.34, y: 0.16, w: 0.17, h: 0.66, fail: 'Kitaplık üstüne devrildi! Ağır ve uzun eşyaların yanından uzaklaş.' },
      { id: 'masa', kind: 'table', label: 'Sağlam masa', x: 0.54, y: 0.6, w: 0.28, h: 0.24, safe: true },
      { id: 'kapi', kind: 'door', label: 'Kapı', labelAbove: true, x: 0.85, y: 0.22, w: 0.13, h: 0.62, fail: 'Koşarken sendeleyip düştün! Sarsıntı sırasında koşma; önce Çök-Kapan-Tutun, sarsıntı bitince çık.' },
    ],
    holdLabel: 'TUTUN',
    holdFail: 'Masanın ayağını bıraktın ve masa kaydı! Sarsıntı bitene kadar tutunmalısın.',
    success: 'Harika! Masanın altına çöktün, başını korudun ve sarsıntı bitene kadar tutundun.',
    lesson: 'Çök-Kapan-Tutun: Sağlam bir masanın altına ya da yanına çök, başını ve enseni koru, sarsıntı bitene kadar tutun.',
  },
  {
    id: 'yatak',
    no: 3,
    phase: 'Anında',
    title: 'Gece, yatak odası',
    scene: 'yatak',
    type: 'reach',
    intro: 'Gece yarısı uyurken deprem başlıyor. Karanlıkta ne yaparsın? Ekran sallanınca doğru yere dokun.',
    start: { x: 0.5, y: 0.74, lying: true },
    spots: [
      { id: 'kapi', kind: 'door', label: 'Kapı', x: 0.03, y: 0.2, w: 0.13, h: 0.62, fail: 'Karanlıkta koşarken yere düşen eşyalara takıldın! Yataktaysan yatakta kal.' },
      { id: 'pencere', kind: 'window', label: 'Pencere', x: 0.36, y: 0.06, w: 0.28, h: 0.26, fail: 'Pencereye gitmek tehlikeliydi; camlar kırıldı. Camlardan uzak dur.' },
      { id: 'yatak', kind: 'bed', label: 'Yatakta kal', x: 0.26, y: 0.6, w: 0.46, h: 0.24, safe: true },
      { id: 'dolap', kind: 'wardrobe', label: 'Dolap', labelAbove: true, x: 0.78, y: 0.12, w: 0.19, h: 0.7, fail: 'Dolap devrildi! Uzun dolapların yanında durma.' },
    ],
    holdLabel: 'BAŞINI KORU',
    holdFail: 'Yastığı bıraktın! Sarsıntı bitene kadar başını ve enseni yastıkla korumalısın.',
    success: 'Çok iyi! Yatakta kaldın ve başını yastıkla korudun.',
    lesson: 'Gece yataktaysan yatakta kal, başını ve enseni yastıkla koru. Karanlıkta koşmak kırık camlar ve devrilen eşyalar yüzünden tehlikelidir.',
  },
  {
    id: 'sokak',
    no: 4,
    phase: 'Anında',
    title: 'Sokakta',
    scene: 'sokak',
    type: 'reach',
    intro: 'Okuldan eve yürürken deprem başlıyor. Etrafında binalar ve elektrik direkleri var. Nereye gidersin?',
    start: { x: 0.42, y: 0.93 },
    spots: [
      { id: 'bina', kind: 'building', label: 'Bina girişi', x: 0.02, y: 0.04, w: 0.34, h: 0.78, fail: 'Binadan sıva ve cam parçaları düştü! Bina girişlerine ve balkon altlarına sığınma.' },
      { id: 'direk', kind: 'pole', label: 'Elektrik direği', x: 0.44, y: 0.08, w: 0.1, h: 0.74, fail: 'Direk yana yattı ve teller sarktı! Direklerden ve tellerden uzak dur.' },
      { id: 'park', kind: 'park', label: 'Açık alan', labelAbove: true, x: 0.6, y: 0.56, w: 0.38, h: 0.3, safe: true },
    ],
    holdLabel: 'ÇÖK, BAŞINI KORU',
    holdFail: 'Açık alanda bile sarsıntı bitene kadar çökmeli ve başını korumalısın; ayakta durursan düşebilirsin.',
    success: 'Doğru! Binalardan ve direklerden uzak, açık bir alanda çöktün ve başını korudun.',
    lesson: 'Dışarıdaysan binalardan, direklerden, tellerden ve balkonlardan uzak, açık bir alana geç; çök ve başını koru.',
  },
  {
    id: 'mutfak',
    no: 5,
    phase: 'Sonra',
    title: 'Gaz kokusu',
    scene: 'mutfak',
    type: 'sequence',
    intro: 'Sarsıntı bitti ama mutfakta gaz kokusu var! Dikkatli ol: yanlış bir hareket tehlikeli olabilir. Doğru sırayla dokun.',
    spots: [
      { id: 'dugme', kind: 'switch', label: 'Işık düğmesi', x: 0.06, y: 0.26, w: 0.12, h: 0.12, fail: 'Düğmeye bastığında küçük bir kıvılcım çıktı! Gaz kokusu varken elektrik düğmelerine dokunma.' },
      { id: 'kibrit', kind: 'match', label: 'Kibrit', x: 0.08, y: 0.64, w: 0.14, h: 0.12, fail: 'Kibrit yakmak gazı tutuşturabilirdi! Gaz kokusu varken asla ateş yakma.' },
      { id: 'ocak', kind: 'stove', label: 'Ocak', x: 0.28, y: 0.52, w: 0.3, h: 0.3, fail: 'Ocağın düğmeleriyle oynamak kıvılcım çıkarabilir. Ocağa dokunma, ana vanayı kapat.' },
      { id: 'vana', kind: 'valve', label: 'Gaz vanası', x: 0.62, y: 0.58, w: 0.14, h: 0.18 },
      { id: 'kapi', kind: 'door', label: 'Dışarı çık', labelAbove: true, x: 0.84, y: 0.2, w: 0.13, h: 0.62 },
    ],
    steps: ['vana', 'kapi'],
    finals: ['kapi'],
    earlyNote: 'Güvendesin! Ama mümkünse çıkmadan önce gaz vanasını kapatmak daha iyi olurdu.',
    success: 'Mükemmel! Önce gaz vanasını kapattın, hiçbir düğmeye dokunmadan dışarı çıktın.',
    lesson: 'Gaz kokusu varsa kibrit, çakmak yakma; elektrik düğmelerine dokunma. Mümkünse ana vanayı kapat ve binayı terk et.',
  },
  {
    id: 'enkaz',
    no: 6,
    phase: 'Sonra',
    title: 'Enkaz altında',
    scene: 'enkaz',
    type: 'sequence',
    intro: 'Enkaz altındasın ama iyisin. Kurtarma ekipleri yakında. Tozdan korun ve sesini duyur, ama gücünü koru!',
    spots: [
      { id: 'boru', kind: 'pipe', label: 'Boruya vur', x: 0.22, y: 0.18, w: 0.56, h: 0.1 },
      { id: 'bez', kind: 'cloth', label: 'Bezle ağzını kapat', x: 0.04, y: 0.6, w: 0.24, h: 0.2 },
      { id: 'bagir', kind: 'shout', label: 'Sürekli bağır', x: 0.3, y: 0.6, w: 0.22, h: 0.2, fail: 'Uzun süre bağırınca boğazın kurudu ve toz yuttun. Gücünü korumalısın; ses çıkarmanın daha iyi yolları var.' },
      { id: 'kibrit', kind: 'match', label: 'Kibrit yak', x: 0.54, y: 0.62, w: 0.16, h: 0.16, fail: 'Enkazda gaz kaçağı olabilir! Kibrit ya da çakmak yakma; fenerini kullan.' },
      { id: 'duduk', kind: 'whistle', label: 'Düdük çal', x: 0.74, y: 0.6, w: 0.22, h: 0.2 },
    ],
    steps: ['bez', 'duduk'],
    finals: ['duduk', 'boru'],
    earlyNote: 'Seni duydular! Ama önce ağzını bezle kapatsaydın tozdan korunurdun.',
    success: 'Kurtarma ekibi düdüğünü duydu! Ağzını bezle kapattın ve gücünü korudun.',
    lesson: 'Enkaz altındaysan ağzını bezle kapat, gücünü korumak için bağırmak yerine düdük çal ya da borulara vurarak ses çıkar. Kibrit yakma.',
  },
];

const KEY = 'elele_oyun_v2';

export type Stars = Record<string, number>;

export async function getStars(): Promise<Stars> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export async function saveStars(levelId: string, stars: number): Promise<Stars> {
  const all = await getStars();
  if ((all[levelId] ?? 0) < stars) all[levelId] = stars;
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // kaydedilemese de oyun sürer
  }
  return all;
}

export function isUnlocked(levelId: string, stars: Stars): boolean {
  const idx = LEVELS.findIndex((l) => l.id === levelId);
  if (idx <= 0) return true;
  return (stars[LEVELS[idx - 1].id] ?? 0) > 0;
}

export function nextLevel(stars: Stars): Level | null {
  return LEVELS.find((l) => !(stars[l.id] > 0)) ?? null;
}
