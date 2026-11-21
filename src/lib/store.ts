import { supabase, isSupabaseConfigured } from './supabase';
import { HelpRequest, NeedCategory, RequestType, Coords, BloodType } from './types';
import { calcDistanceKm } from './geo';
import { getDeviceId } from './moderation';

const TABLE = 'help_requests';
const CONTACTS_TABLE = 'help_request_contacts';

// ---- Supabase satırı <-> uygulama tipi dönüşümü ----
// Not: telefon numarası artık bu satırda YOK — ayrı, kilitli bir tabloda
// tutuluyor ve sadece revealContact() ile tek tek açığa çıkarılıyor. Böylece
// uygulamanın içine gömülü (herkes tarafından çıkarılabilir) anahtarla kimse
// tüm kullanıcıların telefon numaralarını toplu çekemiyor.
interface Row {
  id: string;
  type: RequestType;
  needs: NeedCategory[];
  lat: number;
  lng: number;
  has_contact: boolean | null;
  note: string | null;
  name: string | null;
  avatar: string | null;
  status: string | null;
  urgency: string | null;
  ai_summary: string | null;
  blood_type: string | null;
  allergies: string | null;
  created_at: string;
  device_id?: string | null;
}

function rowToRequest(r: Row): HelpRequest {
  return {
    id: r.id,
    type: r.type,
    needs: r.needs || [],
    location: { lat: r.lat, lng: r.lng },
    hasContact: !!r.has_contact,
    note: r.note,
    name: r.name,
    avatar: r.avatar,
    status: (r.status as HelpRequest['status']) || 'active',
    urgency: (r.urgency as HelpRequest['urgency']) || 'normal',
    aiSummary: r.ai_summary,
    bloodType: (r.blood_type as HelpRequest['bloodType']) || null,
    allergies: r.allergies,
    createdAt: new Date(r.created_at).getTime(),
    deviceId: r.device_id || null,
  };
}

export interface NewRequestInput {
  type: RequestType;
  needs: NeedCategory[];
  location: Coords;
  contact?: string | null;
  note?: string | null;
  // Sadece 'kan' ihtiyaci secildiginde doldurulur.
  bloodType?: BloodType | null;
  allergies?: string | null;
  // Kullanıcı, notunun yapay zekâ hizmetiyle değerlendirilmesine AÇIKÇA
  // izin verdiyse true. İzin yoksa not hiçbir yapay zekâ hizmetine gönderilmez.
  allowAi?: boolean;
  // 'acil_buton': talep Acil Buton ekranından geldi. Veritabanındaki bir
  // tetikleyici bu talebi otomatik olarak "kritik" önceliğe alır
  // (bkz. supabase/migration_yeni_ozellikler.sql).
  source?: 'acil_buton' | null;
}

export async function createRequest(input: NewRequestInput): Promise<HelpRequest> {
  const deviceId = await getDeviceId();
  if (isSupabaseConfigured && supabase) {
    const base = {
      type: input.type,
      needs: input.needs,
      lat: input.location.lat,
      lng: input.location.lng,
      has_contact: !!input.contact,
      note: input.note || null,
      blood_type: input.bloodType || null,
      allergies: input.allergies || null,
      status: 'active',
    };
    const withSource = input.source ? { ...base, source: input.source } : base;
    let { data, error } = await supabase
      .from(TABLE)
      .insert({ ...withSource, device_id: deviceId })
      .select()
      .single();
    if (error && input.source) {
      // "source" sütunu henüz yoksa (yeni migration çalıştırılmamışsa) talep
      // yine de kaydedilsin.
      ({ data, error } = await supabase
        .from(TABLE)
        .insert({ ...base, device_id: deviceId })
        .select()
        .single());
    }
    if (error) {
      // Veritabanında device_id sütunu henüz yoksa (bkz.
      // supabase/migration_talep_bildirim.sql çalıştırılmamışsa) gerçek bir
      // yardım talebi bu yüzden ASLA kaybolmasın: sütunsuz tekrar dene.
      ({ data, error } = await supabase.from(TABLE).insert(base).select().single());
    }

    if (error) throw error;
    const created = rowToRequest(data as Row);

    if (input.contact) {
      // Telefon numarası ayrı, kilitli tabloya gider. Bu adım başarısız olsa
      // bile ana talep zaten kaydedildiği için hatayı sadece logluyoruz —
      // kullanıcıya "kaydedilemedi" demek yanlış olur.
      const { error: contactError } = await supabase
        .from(CONTACTS_TABLE)
        .insert({ request_id: created.id, contact: input.contact });
      if (contactError) {
        console.error('İletişim bilgisi kaydedilemedi:', contactError);
      }
    }

    // Yapay zeka destekli aciliyet analizi: sadece "ihtiyacım var" tipindeki
    // ve bir not içeren taleplerde, arka planda (sonucunu beklemeden)
    // tetiklenir. Başarısız olursa talep yine de "normal" aciliyetle var
    // olmaya devam eder — kullanıcı deneyimini bloklamaz.
    if (input.type === 'need' && input.note && input.allowAi) {
      supabase.functions
        .invoke('analyze-urgency', {
          body: { requestId: created.id },
        })
        .catch((err) => console.error('Aciliyet analizi tetiklenemedi:', err));
    }

    return created;
  }

  throw new Error('not_configured');
}

/**
 * Bir talebin telefon numarasını TEK TEK açığa çıkarır — kullanıcı "Ara"
 * butonuna bastığı anda çağrılır. Numaralar başka hiçbir yerden toplu
 * çekilemez (bkz. lib/store.ts başındaki not ve supabase/schema.sql).
 */
export async function revealContact(requestId: string): Promise<string | null> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.rpc('reveal_contact', { p_request_id: requestId });
    if (error) {
      console.error('Telefon numarası alınamadı:', error);
      return null;
    }
    return (data as string) || null;
  }
  return null;
}

/**
 * Tüm yardım taleplerini (ihtiyaç + yardımcı) çeker ve canlı günceller.
 * Supabase bağlıysa gerçek zamanlı (realtime) abonelik kullanır,
 * değilse hafıza-içi demo veriyle çalışır.
 * Dönen fonksiyon aboneliği iptal eder.
 */
export function subscribeToRequests(onChange: (all: HelpRequest[]) => void): () => void {
  if (isSupabaseConfigured && supabase) {
    let cancelled = false;

    async function loadAll() {
      const { data, error } = await supabase!
        .from(TABLE)
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(500);
      if (!cancelled && !error && data) {
        onChange((data as Row[]).map(rowToRequest));
      }
    }

    loadAll();

    // Kanal adı her abonelikte benzersiz olmalı: aynı isimle art arda
    // channel() çağrılırsa (örn. ekran hızlıca yeniden render olursa / Expo
    // Fast Refresh sırasında), supabase-js önceki (hâlâ "subscribed"
    // durumundaki) kanalı geri verebiliyor ve buna yeni bir .on() eklemek
    // "cannot add postgres_changes callbacks ... after subscribe()" hatası
    // fırlatıyor. Benzersiz isim bu çakışmayı tamamen ortadan kaldırıyor.
    const channel = supabase
      .channel(`help_requests_changes_${Date.now()}_${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, () => {
        loadAll();
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase!.removeChannel(channel);
    };
  }

  onChange([]);
  return () => {};
}

/** Abonelik açmadan, o anki talep listesinin tek seferlik bir görüntüsünü döner. */
export async function fetchAllOnce(): Promise<HelpRequest[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(500);
    if (error || !data) return [];
    return (data as Row[]).map(rowToRequest);
  }
  return [];
}

export function getNeeders(all: HelpRequest[]): HelpRequest[] {
  return all.filter((r) => r.type === 'need');
}

export function getOffers(all: HelpRequest[]): HelpRequest[] {
  return all.filter((r) => r.type === 'offer');
}

export interface ScoredHelper {
  helper: HelpRequest;
  distanceKm: number;
  overlap: number;
}

// Yapay zekanın belirlediği aciliyet seviyesinin sıralamadaki ağırlığı.
// "Akıllı Eşleştirme": önce aciliyet, sonra ortak kaynak sayısı, en son
// mesafe dikkate alınır.
const URGENCY_WEIGHT: Record<string, number> = {
  kritik: 3,
  yuksek: 2,
  normal: 1,
  dusuk: 0,
};

/**
 * İhtiyaca en uygun yardımcıları sıralar. "Akıllı Eşleştirme": yapay
 * zekanın notlardan çıkardığı aciliyet seviyesini, ortak kaynak sayısını
 * ve mesafeyi birlikte değerlendirir — bu, help_requests tablosundaki
 * yardımcıları, EN ACİL ihtiyaç sahiplerine göre sıralamak için
 * yardımcı panelinde kullanılır.
 */
export function matchHelpers(need: HelpRequest, helpers: HelpRequest[]): ScoredHelper[] {
  return helpers
    .map((helper) => {
      const distanceKm = calcDistanceKm(
        need.location.lat,
        need.location.lng,
        helper.location.lat,
        helper.location.lng
      );
      const overlap = need.needs.filter((n) => helper.needs.includes(n)).length;
      return { helper, distanceKm, overlap };
    })
    .sort((a, b) => {
      const urgencyDiff =
        (URGENCY_WEIGHT[b.helper.urgency || 'normal'] ?? 1) -
        (URGENCY_WEIGHT[a.helper.urgency || 'normal'] ?? 1);
      if (urgencyDiff !== 0) return urgencyDiff;
      return b.overlap - a.overlap || a.distanceKm - b.distanceKm;
    });
}
