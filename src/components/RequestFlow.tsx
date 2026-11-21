'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CircleCheck, LoaderCircle, TriangleAlert } from 'lucide-react';
import NeedGrid from './NeedGrid';
import LocationPicker from './LocationPicker';
import RequestCard from './RequestCard';
import { Back, Button, Card, Page, Title } from './ui';
import { BloodType, Coords, HelpRequest, NeedCategory, RequestType } from '@/lib/types';
import { createRequest, fetchAllOnce, getNeeders, getOffers, matchHelpers } from '@/lib/store';
import { calcDistanceKm } from '@/lib/geo';
import { getBlocked, isRequestHidden } from '@/lib/moderation';
import AsyncStorage from '@/lib/asyncStorage';

const BLOOD: BloodType[] = ['0 Rh+', '0 Rh-', 'A Rh+', 'A Rh-', 'B Rh+', 'B Rh-', 'AB Rh+', 'AB Rh-'];
const AI_KEY = 'elele_yapay_zeka_izni_v1';

/**
 * "Yardıma İhtiyacım Var" ve "Yardım Edebilirim" akışı (uygulamayla aynı adımlar):
 * 1) tür seç  2) konum  3) not ve telefon  4) sonuç: en yakın eşleşmeler.
 * Talepler mobil uygulamayla aynı veritabanına kaydedilir.
 */
export default function RequestFlow({ type }: { type: RequestType }) {
  const isNeed = type === 'need';
  const [step, setStep] = useState<'select' | 'location' | 'details' | 'saving' | 'done'>('select');
  const [selected, setSelected] = useState<NeedCategory[]>([]);
  const [location, setLocation] = useState<Coords | null>(null);
  const [note, setNote] = useState('');
  const [contact, setContact] = useState('');
  const [blood, setBlood] = useState<BloodType | null>(null);
  const [allergies, setAllergies] = useState('');
  const [allowAi, setAllowAi] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [matches, setMatches] = useState<{ req: HelpRequest; km: number }[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(AI_KEY).then((v) => setAllowAi(v === 'evet'));
  }, []);

  function toggle(id: NeedCategory) {
    setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  async function submit() {
    if (!location) return;
    setError('');
    setStep('saving');
    try {
      const wantsBlood = isNeed && selected.includes('kan');
      const created = await createRequest({
        type,
        needs: selected,
        location,
        contact: contact.trim() || null,
        note: note.trim() || null,
        bloodType: wantsBlood ? blood : null,
        allergies: wantsBlood ? allergies.trim() || null : null,
        allowAi: isNeed && allowAi,
      });
      const [all, blocked] = await Promise.all([fetchAllOnce(), getBlocked()]);
      const visible = all.filter((r) => r.id !== created.id && !isRequestHidden(blocked, r));
      if (isNeed) {
        setMatches(matchHelpers(created, getOffers(visible)).slice(0, 5).map((m) => ({ req: m.helper, km: m.distanceKm })));
      } else {
        const needs = getNeeders(visible)
          .map((r) => ({ req: r, km: calcDistanceKm(location.lat, location.lng, r.location.lat, r.location.lng) }))
          .filter((m) => m.req.needs.some((n) => selected.includes(n)))
          .sort((a, b) => a.km - b.km)
          .slice(0, 5);
        setMatches(needs);
      }
      setStep('done');
    } catch (err) {
      const msg = String((err as { message?: string })?.message ?? '');
      setError(
        msg.includes('RATE_LIMIT')
          ? 'Kısa sürede çok fazla kayıt oluşturuldu. Birkaç dakika sonra tekrar dene.'
          : msg === 'not_configured'
            ? 'Site şu an veritabanına bağlı değil. Lütfen El Ele uygulamasını kullan.'
            : 'Kaydedilemedi. İnternet bağlantını kontrol edip tekrar dene.'
      );
      setStep('details');
    }
  }

  const accent = isNeed ? 'brand' : 'ok';

  return (
    <Page>
      {step === 'select' ? (
        <>
          <Back />
          <Title sub={isNeed ? 'Birden fazla seçebilirsin.' : 'Hangi konularda yardım edebilirsin? Birden fazla seçebilirsin.'}>
            {isNeed ? 'Neye ihtiyacın var?' : 'Ne ile yardım edebilirsin?'}
          </Title>
          {isNeed ? (
            <div className="flex items-start gap-2 rounded-[6px] bg-brand-soft p-3 text-[15px]">
              <TriangleAlert size={20} className="mt-0.5 shrink-0 text-brand" />
              <span>Hayati tehlike varsa önce <a href="tel:112" className="font-extrabold text-brand underline">112’yi ara</a>. El Ele resmî bir acil durum hizmeti değildir.</span>
            </div>
          ) : null}
          <NeedGrid selected={selected} onToggle={toggle} offer={!isNeed} />
          <Button variant={accent} disabled={selected.length === 0} onClick={() => setStep('location')}>
            Devam
          </Button>
        </>
      ) : null}

      {step === 'location' ? (
        <>
          <Title sub="Konumun, ilanınla birlikte haritada diğer kullanıcılara gösterilir.">Neredesin?</Title>
          <LocationPicker
            offer={!isNeed}
            onLocation={(c) => {
              setLocation(c);
              setStep('details');
            }}
          />
          <Button variant="outline" onClick={() => setStep('select')}>Geri dön</Button>
        </>
      ) : null}

      {step === 'details' || step === 'saving' ? (
        <>
          <Title sub="Hepsi isteğe bağlı.">{isNeed ? 'Son bir adım' : 'İletişim bilgileri'}</Title>
          <Card className="flex flex-col gap-3">
            <label className="text-[15px] font-bold" htmlFor="not">
              {isNeed ? 'Durumunu kısaca yaz' : 'Not (ne getirebilirsin, nereye gidebilirsin?)'}
            </label>
            <textarea
              id="not"
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 500))}
              rows={4}
              placeholder={isNeed ? 'Örn. 3 kişiyiz, yaşlı annem var, 2. kattayız' : 'Örn. 20 koli su getirebilirim, aracım var'}
              className="rounded-[6px] border border-line p-3 text-[17px] outline-none focus:border-ink"
            />
            <label className="text-[15px] font-bold" htmlFor="tel">Telefon numaran</label>
            <input
              id="tel"
              type="tel"
              inputMode="tel"
              value={contact}
              onChange={(e) => setContact(e.target.value.slice(0, 20))}
              placeholder="05xx xxx xx xx"
              className="min-h-12 rounded-[6px] border border-line px-3 text-[17px] outline-none focus:border-ink"
            />
            <p className="text-sm text-muted">Numaran listelerde görünmez; sadece ilanındaki “Ara”ya basan kişiye gösterilir.</p>
          </Card>

          {isNeed && selected.includes('kan') ? (
            <Card className="flex flex-col gap-3">
              <p className="text-[15px] font-bold">Kan grubu</p>
              <div className="grid grid-cols-4 gap-2">
                {BLOOD.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBlood(b === blood ? null : b)}
                    className={`min-h-11 rounded-[4px] border text-[15px] font-bold ${blood === b ? 'border-brand bg-brand text-white' : 'border-line bg-card'}`}
                  >
                    {b}
                  </button>
                ))}
              </div>
              <input
                value={allergies}
                onChange={(e) => setAllergies(e.target.value.slice(0, 200))}
                placeholder="Bilinen alerjiler (isteğe bağlı)"
                className="min-h-12 rounded-[6px] border border-line px-3 text-[17px] outline-none focus:border-ink"
              />
            </Card>
          ) : null}

          {isNeed && note.trim() ? (
            <label className="flex items-start gap-3 rounded-[6px] border border-line bg-card p-3 text-[15px]">
              <input
                type="checkbox"
                checked={allowAi}
                onChange={(e) => {
                  setAllowAi(e.target.checked);
                  AsyncStorage.setItem(AI_KEY, e.target.checked ? 'evet' : 'hayir');
                }}
                className="mt-1 h-5 w-5"
              />
              <span>Notumun aciliyetini değerlendirmek için bir yapay zekâ hizmetine (Anthropic) gönderilmesine izin veriyorum. Telefonum ve konumum gönderilmez.</span>
            </label>
          ) : null}

          <label className="flex items-start gap-3 rounded-[6px] border border-line bg-card p-3 text-[15px]">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 h-5 w-5" />
            <span>
              Konumumun ve notumun ilanla birlikte diğer kullanıcılara gösterileceğini anladım.{' '}
              <Link href="/hakkinda" className="font-bold underline">Gizlilik ve koşullar</Link>
            </span>
          </label>

          {error ? <p className="rounded-[6px] bg-brand-soft p-3 text-[15px] text-brand">{error}</p> : null}
          <Button variant={accent} disabled={!agreed || step === 'saving'} onClick={submit}>
            {step === 'saving' ? <LoaderCircle className="animate-spin" size={22} /> : null}
            {step === 'saving' ? 'Kaydediliyor...' : isNeed ? 'Yardım talebini gönder' : 'Yardım teklifini gönder'}
          </Button>
          <Button variant="outline" onClick={() => setStep('location')}>Geri dön</Button>
        </>
      ) : null}

      {step === 'done' ? (
        <>
          <div className="flex items-center gap-3 rounded-[6px] bg-ok-soft p-4">
            <CircleCheck size={32} className="text-ok" />
            <div>
              <p className="text-lg font-extrabold">{isNeed ? 'Talebin alındı' : 'Teklifin alındı'}</p>
              <p className="text-[15px] text-muted">
                {isNeed ? 'Yakınındaki gönüllüler talebini haritada ve panelde görüyor.' : 'İhtiyacı olanlar seni haritada görebilir.'}
              </p>
            </div>
          </div>
          <p className="mt-2 text-[17px] font-extrabold">
            {isNeed ? 'Sana en uygun gönüllüler' : 'Yakınında yardım bekleyenler'}
          </p>
          {matches.length === 0 ? (
            <Card><p className="text-[15px] text-muted">Şu an yakınında eşleşen kimse yok. Kaydın açık kalıyor; yeni kişiler geldikçe görünecek.</p></Card>
          ) : (
            matches.map((m) => <RequestCard key={m.req.id} req={m.req} distanceKm={m.km} />)
          )}
          <Link href="/harita" className="mt-2"><Button variant="ink">Haritayı aç</Button></Link>
          <Link href="/"><Button variant="outline">Ana sayfa</Button></Link>
        </>
      ) : null}
    </Page>
  );
}
