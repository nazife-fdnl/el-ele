export type NeedCategory =
  | 'enkaz'
  | 'su'
  | 'yiyecek'
  | 'ilac'
  | 'ilkyardim'
  | 'barinak'
  | 'isik'
  | 'bebek'
  | 'tasima'
  | 'sarj'
  | 'kan'
  | 'giysi';

export interface NeedItem {
  id: NeedCategory;
  emoji: string;
  label: string;
  offerLabel?: string;
  description: string;
}

export interface Coords {
  lat: number;
  lng: number;
}

export type RequestType = 'need' | 'offer';

// Yapay zekanin (bkz. supabase/functions/analyze-urgency) bir talebin
// serbest metin notundan cikardigi aciliyet seviyesi. Talep olusturulurken
// varsayilan "normal"dir, not varsa yapay zeka analiziyle guncellenir.
export type Urgency = 'dusuk' | 'normal' | 'yuksek' | 'kritik';

// Kan ihtiyaci isaretlendiginde sorulan kan grubu secenekleri.
export type BloodType = '0 Rh+' | '0 Rh-' | 'A Rh+' | 'A Rh-' | 'B Rh+' | 'B Rh-' | 'AB Rh+' | 'AB Rh-';

export interface HelpRequest {
  id: string;
  type: RequestType;
  needs: NeedCategory[];
  location: Coords;
  hasContact?: boolean;
  note?: string | null;
  name?: string | null;
  avatar?: string | null;
  status?: 'active' | 'matched' | 'resolved';
  urgency?: Urgency;
  aiSummary?: string | null;
  // Sadece 'kan' ihtiyaci secildiginde doldurulur: talep eden kisinin kan
  // grubu ve varsa bilinen alerjileri. Yardim eden kisiye direkt gosterilir.
  bloodType?: BloodType | null;
  allergies?: string | null;
  createdAt: number;
  // Talebi oluşturan cihazın rastgele kimliği (kişisel bilgi değildir).
  // Sadece "bildir / engelle" özelliğini doğru kişiye bağlamak için kullanılır.
  deviceId?: string | null;
}

export interface MatchInfo {
  helper: HelpRequest;
  distanceKm: number;
  overlap: number;
}

// "İl Dışından Yardım" özelliği: başka illerden afet bölgesine yardıma
// gidecek gönüllülerin kaydı. HelpRequest'ten ayrı bir tip, çünkü konum
// yerine "hangi ile gidiyor" ve grup/ulaşım bilgisi taşıyor.
export interface VolunteerTrip {
  id: string;
  destination: string;
  needs: NeedCategory[];
  groupSize: number;
  needsTransport: boolean;
  hasContact?: boolean;
  note?: string | null;
  status?: 'active' | 'resolved';
  createdAt: number;
  deviceId?: string | null;
}

// "İl Dışından Yardım" bölümündeki gönüllülerin birbirine yazabildiği,
// herkese açık sohbet odasındaki tek bir mesaj.
export interface ChatMessage {
  id: string;
  name: string;
  message: string;
  createdAt: number;
  deviceId?: string | null;
}
