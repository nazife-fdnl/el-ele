'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { NEEDS } from '@/lib/needs';
import { NeedCategory, HelpRequest, Location } from '@/lib/types';
import { saveRequest } from '@/lib/store';

type Step = 'select' | 'location' | 'contact' | 'done';

export default function YardimEdebilirim() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('select');
  const [selected, setSelected] = useState<NeedCategory[]>([]);
  const [location, setLocation] = useState<Location | null>(null);
  const [contact, setContact] = useState('');
  const [note, setNote] = useState('');
  const [locError, setLocError] = useState('');
  const [loading, setLoading] = useState(false);

  function toggleNeed(id: NeedCategory) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function getLocation() {
    setLocError('');
    setLoading(true);
    if (!navigator.geolocation) {
      fetchIPLocation();
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoading(false);
        setStep('contact');
      },
      () => {
        fetchIPLocation();
      },
      { timeout: 6000, enableHighAccuracy: false, maximumAge: 0 }
    );
  }

  async function fetchIPLocation() {
    try {
      const res = await fetch('https://ipapi.co/json/');
      const data = await res.json();
      if (data.latitude && data.longitude) {
        setLocation({ lat: data.latitude, lng: data.longitude });
        setLoading(false);
        setStep('contact');
        return;
      }
    } catch {
      // IP de olmadı
    }
    setLoading(false);
    setLocError('Konum alınamadı. Demo konumu ile devam edebilirsin.');
  }

  function useDemoLocation() {
    setLocation({ lat: 41.0082, lng: 28.9784 });
    setLoading(false);
    setStep('contact');
  }

  function submit() {
    if (!location) return;
    const offer: HelpRequest = {
      id: crypto.randomUUID(),
      type: 'offer',
      needs: selected,
      location,
      note,
      contact,
      timestamp: Date.now(),
    };
    saveRequest(offer);
    setStep('done');
  }

  const OFFER_LABELS: Record<string, string> = {
    su: 'Su',
    yiyecek: 'Yiyecek',
    ilac: 'İlaç',
    ilkyardim: 'İlkyardım',
    'barinак': 'Barınak',
    isik: 'El Feneri',
    bebek: 'Bebek Malz.',
    tasima: 'Araç/Taşıma',
    sarj: 'Şarj',
    kan: 'Kan',
    enkaz: 'Kurtarma',
    giysi: 'Giysi/Battaniye',
  };

  if (step === 'select') {
    return (
      <main className="min-h-screen bg-[#0f0f0f] text-white pb-8">
        <div className="sticky top-0 bg-[#0f0f0f]/95 backdrop-blur z-10 px-4 pt-6 pb-4 border-b border-zinc-800">
          <button onClick={() => router.back()} className="text-zinc-400 text-sm mb-3 flex items-center gap-1">
            ← Geri
          </button>
          <h1 className="text-2xl font-bold">Ne sunabilirsin?</h1>
          <p className="text-zinc-400 text-sm mt-1">Elindeki kaynakları seç</p>
        </div>

        <div className="grid grid-cols-3 gap-3 px-4 pt-5">
          {NEEDS.filter((n) => n.id !== 'enkaz').map((need) => (
            <button
              key={need.id}
              onClick={() => toggleNeed(need.id as NeedCategory)}
              className={`need-card offer-card rounded-2xl border-2 border-zinc-700 bg-zinc-900 p-4 flex flex-col items-center gap-2 ${
                selected.includes(need.id as NeedCategory) ? 'selected' : ''
              }`}
            >
              <span className="text-4xl">{need.emoji}</span>
              <span className="text-xs font-semibold text-center leading-tight">
                {OFFER_LABELS[need.id] || need.label}
              </span>
            </button>
          ))}
          {/* Kurtarma ekibi seçeneği ayrı */}
          <button
            onClick={() => toggleNeed('enkaz')}
            className={`need-card offer-card rounded-2xl border-2 border-zinc-700 bg-zinc-900 p-4 flex flex-col items-center gap-2 ${
              selected.includes('enkaz') ? 'selected' : ''
            }`}
          >
            <span className="text-4xl">⛑️</span>
            <span className="text-xs font-semibold text-center leading-tight">Kurtarma</span>
          </button>
        </div>

        <div className="px-4 mt-6">
          <button
            onClick={() => setStep('location')}
            disabled={selected.length === 0}
            className="w-full py-4 rounded-2xl text-lg font-bold bg-green-700 disabled:bg-zinc-700 disabled:text-zinc-500 transition-colors"
          >
            Devam Et ({selected.length} seçildi)
          </button>
        </div>
      </main>
    );
  }

  if (step === 'location') {
    return (
      <main className="min-h-screen bg-[#0f0f0f] text-white flex flex-col items-center justify-center px-6 gap-6">
        <div className="text-7xl">📍</div>
        <h2 className="text-2xl font-bold text-center">Konumunu Paylaş</h2>
        <p className="text-zinc-400 text-center">
          İhtiyaç sahipleriyle seni eşleştirebilmemiz için konumuna ihtiyacımız var.
        </p>
        {locError && (
          <div className="w-full">
            <p className="text-red-400 text-sm text-center mb-3">{locError}</p>
            <button
              onClick={useDemoLocation}
              className="w-full py-4 rounded-2xl text-lg font-bold bg-zinc-700 transition-colors flex items-center justify-center gap-2"
            >
              🗺️ Demo Konumu Kullan
            </button>
          </div>
        )}
        <button
          onClick={getLocation}
          disabled={loading}
          className="w-full py-5 rounded-2xl text-xl font-bold bg-green-700 disabled:bg-zinc-700 transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <><span className="animate-spin">⏳</span> Konum Alınıyor...</>
          ) : (
            <><span>📍</span> Konumumu Paylaş</>
          )}
        </button>
        <button onClick={() => setStep('select')} className="text-zinc-500 text-sm">
          ← Geri Dön
        </button>
      </main>
    );
  }

  if (step === 'contact') {
    return (
      <main className="min-h-screen bg-[#0f0f0f] text-white px-6 pt-12">
        <button onClick={() => setStep('location')} className="text-zinc-400 text-sm mb-6 flex items-center gap-1">
          ← Geri
        </button>
        <div className="text-5xl mb-4">📞</div>
        <h2 className="text-2xl font-bold mb-2">İletişim Bilgisi</h2>
        <p className="text-zinc-400 text-sm mb-6">
          İhtiyaç sahiplerinin sana ulaşabilmesi için numaran yardımcı olur.
        </p>
        <input
          type="tel"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="0555 123 45 67"
          className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl px-5 py-4 text-lg text-white placeholder-zinc-600 mb-4 focus:outline-none focus:border-green-500"
        />
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ek bilgi (kaç kişiye yardım edebilirsin, araç kapasitesi...)"
          rows={3}
          className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl px-5 py-4 text-base text-white placeholder-zinc-600 mb-6 focus:outline-none focus:border-green-500 resize-none"
        />
        <button
          onClick={submit}
          className="w-full py-5 rounded-2xl text-xl font-bold bg-green-700 transition-colors"
        >
          Yardım Listesine Katıl 🙌
        </button>
      </main>
    );
  }

  if (step === 'done') {
    return (
      <main className="min-h-screen bg-[#0f0f0f] text-white flex flex-col items-center justify-center px-6 gap-6">
        <div className="text-7xl">✅</div>
        <h2 className="text-2xl font-bold text-center">Harika! Kayıt Oldun</h2>
        <p className="text-zinc-400 text-center">
          Bölgendeki ihtiyaç sahipleriyle eşleştirileceksin. Teşekkür ederiz.
        </p>

        <div className="w-full rounded-2xl bg-green-950/60 border border-green-700/50 p-5">
          <p className="text-green-300 font-semibold text-sm mb-2">SUNABİLECEKLERİN</p>
          <div className="flex flex-wrap gap-2">
            {selected.map((id) => {
              const need = NEEDS.find((n) => n.id === id);
              return need ? (
                <span key={id} className="bg-green-900/50 px-3 py-1 rounded-full text-sm text-green-200">
                  {need.emoji} {need.label}
                </span>
              ) : null;
            })}
          </div>
        </div>

        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={() => router.push('/harita')}
            className="w-full py-4 rounded-2xl text-lg font-semibold bg-zinc-800 border border-zinc-700"
          >
            🗺️ Haritayı Gör
          </button>
          <button
            onClick={() => router.push('/')}
            className="w-full py-4 rounded-2xl text-lg font-semibold bg-zinc-900 text-zinc-400"
          >
            Ana Sayfa
          </button>
        </div>
      </main>
    );
  }

  return null;
}
