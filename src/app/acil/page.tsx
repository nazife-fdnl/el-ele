'use client';

import { useEffect, useRef, useState } from 'react';
import { MessageSquare, Phone, Plus, Trash2 } from 'lucide-react';
import { Back, Button, Page } from '@/components/ui';
import { EmergencyContact, MAX_EMERGENCY_CONTACTS, getEmergencyContacts, saveEmergencyContacts } from '@/lib/emergencyContacts';
import { getBrowserLocation } from '@/lib/location';
import { createRequest } from '@/lib/store';
import { Coords } from '@/lib/types';

const HOLD_MS = 3000;
const CANCEL_SECONDS = 5;

type Phase = 'idle' | 'countdown' | 'sending' | 'done';

function smsLink(phones: string[], body: string): string {
  const text = encodeURIComponent(body);
  const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (ios) return phones.length > 1 ? `sms://open?addresses=${phones.join(',')}&body=${text}` : `sms:${phones[0]}&body=${text}`;
  return `sms:${phones.join(',')}?body=${text}`;
}

/**
 * Acil Buton (uygulamadakinin web hali): 3 saniye basılı tut → 5 saniye iptal süresi →
 * kritik öncelikli yardım talebi + acil kişilere konumlu SMS + 112'yi ara düğmesi.
 */
export default function Acil() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [left, setLeft] = useState(CANCEL_SECONDS);
  const [progress, setProgress] = useState(0);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [result, setResult] = useState<{ loc: Coords | null; requestOk: boolean; sms: string | null } | null>(null);
  const holdStart = useRef<number>(0);
  const raf = useRef<number>(0);
  const countdown = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    getEmergencyContacts().then(setContacts);
    return () => {
      cancelAnimationFrame(raf.current);
      if (countdown.current) clearInterval(countdown.current);
    };
  }, []);

  function pressStart() {
    if (phase !== 'idle') return;
    holdStart.current = performance.now();
    const tick = () => {
      const p = Math.min(1, (performance.now() - holdStart.current) / HOLD_MS);
      setProgress(p);
      if (p >= 1) {
        startCountdown();
        return;
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  }

  function pressEnd() {
    if (phase !== 'idle') return;
    cancelAnimationFrame(raf.current);
    setProgress(0);
  }

  function startCountdown() {
    navigator.vibrate?.(200);
    setPhase('countdown');
    let n = CANCEL_SECONDS;
    setLeft(n);
    countdown.current = setInterval(() => {
      n -= 1;
      setLeft(n);
      if (n <= 0) {
        if (countdown.current) clearInterval(countdown.current);
        trigger();
      }
    }, 1000);
  }

  function cancel() {
    if (countdown.current) clearInterval(countdown.current);
    setProgress(0);
    setPhase('idle');
  }

  async function trigger() {
    setPhase('sending');
    const r = await getBrowserLocation();
    const loc = r.ok ? r.coords : null;
    let requestOk = false;
    if (loc) {
      try {
        await createRequest({
          type: 'need',
          needs: ['ilkyardim'],
          location: loc,
          note: 'ACİL BUTON: Kullanıcı acil butona bastı, hayati tehlike olabilir.',
          source: 'acil_buton',
        });
        requestOk = true;
      } catch {
        requestOk = false;
      }
    }
    let sms: string | null = null;
    if (contacts.length > 0) {
      const where = loc ? `Konumum: https://maps.google.com/?q=${loc.lat},${loc.lng}` : 'Konumum alınamadı.';
      sms = smsLink(contacts.map((c) => c.phone), `ACİL! Yardıma ihtiyacım var. ${where} (El Ele'den gönderildi)`);
    }
    setResult({ loc, requestOk, sms });
    setPhase('done');
    if (sms) window.location.href = sms;
  }

  async function addContact() {
    const p = phone.replace(/[^\d+]/g, '');
    if (!name.trim() || p.length < 10 || contacts.length >= MAX_EMERGENCY_CONTACTS) return;
    const next = [...contacts, { id: `${Date.now()}`, name: name.trim().slice(0, 40), phone: p }];
    setContacts(next);
    await saveEmergencyContacts(next);
    setName('');
    setPhone('');
  }

  async function removeContact(id: string) {
    const next = contacts.filter((c) => c.id !== id);
    setContacts(next);
    await saveEmergencyContacts(next);
  }

  return (
    <Page dark>
      <Back dark />
      <h1 className="text-[26px] font-extrabold">Acil Buton</h1>

      {phase === 'idle' ? (
        <>
          <div className="flex flex-col items-center gap-4 py-4">
            <button
              type="button"
              onPointerDown={pressStart}
              onPointerUp={pressEnd}
              onPointerLeave={pressEnd}
              onContextMenu={(e) => e.preventDefault()}
              className="flex h-60 w-60 select-none flex-col items-center justify-center rounded-full border-[12px] border-red-900 bg-red-600 text-white"
              aria-label="Acil durum bildirimi için 3 saniye basılı tut"
            >
              <span className="text-5xl font-black">ACİL</span>
              <span className="mt-1 text-[15px] font-bold text-red-100">3 saniye basılı tut</span>
            </button>
            <div className="h-2.5 w-60 overflow-hidden rounded-[2px] bg-night-line">
              <div className="h-2.5 bg-red-500" style={{ width: `${progress * 100}%` }} />
            </div>
            <p className="text-center text-[15px] text-zinc-400">Yanlışlıkla basmaya karşı 5 saniye iptal süresi var.</p>
          </div>

          <div className="rounded-[6px] border border-night-line bg-night-2 p-4">
            <p className="text-lg font-extrabold">Basınca ne olur?</p>
            <ol className="mt-2 flex list-decimal flex-col gap-1.5 pl-5 text-[16px] text-zinc-300">
              <li>Acil kişilerine konumlu SMS hazırlanır; Gönder’e sen basarsın.</li>
              <li>El Ele’de kritik öncelikli bir yardım talebi açılır.</li>
              <li>112’yi tek dokunuşla arayabileceğin düğme çıkar.</li>
            </ol>
          </div>

          <div className="rounded-[6px] border border-night-line bg-night-2 p-4">
            <p className="text-lg font-extrabold">Acil kişilerin</p>
            <p className="mt-1 text-[13px] text-zinc-400">Sadece bu tarayıcıda saklanır, sunucuya gönderilmez.</p>
            <div className="mt-3 flex flex-col gap-2">
              {contacts.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-[4px] bg-night px-3 py-2">
                  <span>
                    <span className="block font-bold">{c.name}</span>
                    <span className="block text-sm text-zinc-400">{c.phone}</span>
                  </span>
                  <button type="button" onClick={() => removeContact(c.id)} aria-label={`${c.name} kişisini sil`} className="p-2 text-zinc-400">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              {contacts.length < MAX_EMERGENCY_CONTACTS ? (
                <div className="flex flex-col gap-2">
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ad (örn. Annem)" className="min-h-12 rounded-[4px] border border-night-line bg-night px-3 text-[17px] outline-none" />
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" inputMode="tel" placeholder="Telefon (05xx...)" className="min-h-12 rounded-[4px] border border-night-line bg-night px-3 text-[17px] outline-none" />
                  <Button variant="night" onClick={addContact}><Plus size={20} /> Kişi ekle</Button>
                </div>
              ) : null}
            </div>
          </div>
          <a href="tel:112" className="flex min-h-14 items-center justify-center gap-2 rounded-[6px] border border-red-800 text-[17px] font-extrabold text-red-300">
            <Phone size={20} /> 112’yi hemen ara
          </a>
        </>
      ) : null}

      {phase === 'countdown' ? (
        <div className="flex flex-col items-center gap-4 py-10">
          <span className="text-8xl font-black text-red-500">{left}</span>
          <p className="text-center text-xl font-bold">saniye sonra acil bildirim başlayacak</p>
          <Button variant="night" onClick={cancel}>İPTAL ET</Button>
        </div>
      ) : null}

      {phase === 'sending' ? <p className="py-10 text-center text-xl font-bold">Konumun alınıyor ve bildirim hazırlanıyor...</p> : null}

      {phase === 'done' && result ? (
        <div className="flex flex-col gap-3">
          <a href="tel:112" className="flex min-h-28 items-center justify-center gap-3 rounded-[6px] bg-red-600 text-4xl font-black text-white">
            <Phone size={36} /> 112’yi Ara
          </a>
          <div className="rounded-[6px] border border-night-line bg-night-2 p-4 text-[16px] text-zinc-300">
            <p>
              {result.requestOk
                ? '✓ El Ele’de kritik öncelikli yardım talebin açıldı.'
                : result.loc
                  ? '⚠ Yardım talebi açılamadı. İnternet bağlantını kontrol et.'
                  : '⚠ Konumun alınamadığı için yardım talebi açılamadı.'}
            </p>
            <p className="mt-2">
              {contacts.length === 0 ? '⚠ Kayıtlı acil kişin yok, SMS hazırlanmadı.' : '✓ SMS ekranı açıldı. Gönder’e bastığından emin ol.'}
            </p>
          </div>
          {result.sms ? (
            <a href={result.sms} className="flex min-h-14 items-center justify-center gap-2 rounded-[6px] border border-night-line text-[17px] font-bold">
              <MessageSquare size={20} /> SMS ekranını tekrar aç
            </a>
          ) : null}
          <Button variant="night" onClick={() => { setResult(null); setProgress(0); setPhase('idle'); }}>Bitti</Button>
        </div>
      ) : null}
    </Page>
  );
}
