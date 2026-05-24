'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { NEEDS } from '@/lib/needs';
import { NeedCategory, HelpRequest, Location } from '@/lib/types';
import { saveRequest } from '@/lib/store';

type Step = 'select' | 'location' | 'contact' | 'matching' | 'result';

export default function IhtiyacimVar() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('select');
  const [selected, setSelected] = useState<NeedCategory[]>([]);
  const [location, setLocation] = useState<Location | null>(null);
  const [contact, setContact] = useState('');
  const [note, setNote] = useState('');
  const [locError, setLocError] = useState('');
  const [matchResult, setMatchResult] = useState<{
    matchReason: string;
    distance: number;
    helperName?: string;
    helperAvatar?: string;
    helperNote?: string;
    helperOffers?: string[];
    contact?: string;
    topMatches?: { name: string; avatar: string; distance: number; offers: string[]; contact: string; note: string }[];
  } | null>(null);
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
        // GPS başarısız → IP'den konum dene
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

  async function submit() {
    if (!location) return;
    setStep('matching');

    const request: HelpRequest = {
      id: crypto.randomUUID(),
      type: 'need',
      needs: selected,
      location,
      note,
      contact,
      timestamp: Date.now(),
    };
    saveRequest(request);

    try {
      const res = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      const data = await res.json();
      setMatchResult(data);
    } catch {
      setMatchResult({ matchReason: 'En yakın yardımcı aranıyor...', distance: 0 });
    }

    setStep('result');
  }

  if (step === 'select') {
    return (
      <main className="min-h-screen bg-[#0f0f0f] text-white pb-8">
        <div className="sticky top-0 bg-[#0f0f0f]/95 backdrop-blur z-10 px-4 pt-6 pb-4 border-b border-zinc-800">
          <button onClick={() => router.back()} className="text-zinc-400 text-sm mb-3 flex items-center gap-1">
            ← Geri
          </button>
          <h1 className="text-2xl font-bold">Neye ihtiyacın var?</h1>
          <p className="text-zinc-400 text-sm mt-1">Birden fazla seçebilirsin</p>
        </div>

        <div className="grid grid-cols-3 gap-3 px-4 pt-5">
          {NEEDS.map((need) => (
            <button
              key={need.id}
              onClick={() => toggleNeed(need.id as NeedCategory)}
              className={`need-card rounded-2xl border-2 border-zinc-700 bg-zinc-900 p-4 flex flex-col items-center gap-2 ${
                selected.includes(need.id as NeedCategory) ? 'selected' : ''
              }`}
            >
              <span className="text-4xl">{need.emoji}</span>
              <span className="text-xs font-semibold text-center leading-tight">{need.label}</span>
            </button>
          ))}
        </div>

        <div className="px-4 mt-6">
          <button
            onClick={() => setStep('location')}
            disabled={selected.length === 0}
            className="w-full py-4 rounded-2xl text-lg font-bold bg-red-600 disabled:bg-zinc-700 disabled:text-zinc-500 transition-colors"
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
          Sana en yakın yardımcıyı bulabilmemiz için konumuna ihtiyacımız var.
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
          className="w-full py-5 rounded-2xl text-xl font-bold bg-red-600 disabled:bg-zinc-700 transition-colors flex items-center justify-center gap-2"
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
        <h2 className="text-2xl font-bold mb-2">İletişim Bilgisi (İsteğe Bağlı)</h2>
        <p className="text-zinc-400 text-sm mb-6">
          Yardımcının seni bulmasını kolaylaştırmak için telefon numarası yazabilirsin.
        </p>
        <input
          type="tel"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="0555 123 45 67"
          className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl px-5 py-4 text-lg text-white placeholder-zinc-600 mb-4 focus:outline-none focus:border-red-500"
        />
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ek not (isteğe bağlı): kaçıncı kat, bininin rengi..."
          rows={3}
          className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl px-5 py-4 text-base text-white placeholder-zinc-600 mb-6 focus:outline-none focus:border-red-500 resize-none"
        />
        <button
          onClick={submit}
          className="w-full py-5 rounded-2xl text-xl font-bold bg-red-600 transition-colors"
        >
          Yardım İste 🆘
        </button>
      </main>
    );
  }

  if (step === 'matching') {
    return (
      <main className="min-h-screen bg-[#0f0f0f] text-white flex flex-col items-center justify-center px-6 gap-6">
        <div className="relative flex items-center justify-center w-32 h-32">
          <div className="pulse-ring absolute w-20 h-20 rounded-full bg-red-500/30" />
          <div className="pulse-ring absolute w-20 h-20 rounded-full bg-red-500/20" style={{ animationDelay: '0.5s' }} />
          <span className="text-5xl relative z-10">🔍</span>
        </div>
        <h2 className="text-2xl font-bold text-center">Yardımcı Aranıyor...</h2>
        <p className="text-zinc-400 text-center">AI en yakın ve uygun yardımcıyı buluyor</p>
      </main>
    );
  }

  if (step === 'result') {
    const top = matchResult?.topMatches || [];
    return (
      <main className="min-h-screen bg-[#0f0f0f] text-white pb-10">
        <div className="px-6 pt-10 pb-4 flex flex-col items-center gap-2">
          <div className="text-6xl">✅</div>
          <h2 className="text-2xl font-bold text-center">Eşleşme Bulundu!</h2>
          <p className="text-zinc-400 text-sm text-center">AI sana en uygun yardımcıları seçti</p>
        </div>

        {/* AI mesajı */}
        {matchResult?.matchReason && (
          <div className="mx-4 mb-4 rounded-2xl bg-blue-950/50 border border-blue-700/40 px-4 py-3">
            <p className="text-blue-200 text-sm">🤖 {matchResult.matchReason}</p>
          </div>
        )}

        {/* En iyi eşleşme */}
        {matchResult?.helperName && (
          <div className="mx-4 mb-3 rounded-2xl bg-green-950/60 border border-green-700/50 p-4">
            <p className="text-green-400 text-xs font-bold mb-3">⭐ EN YAKIN YARDIMCI</p>
            <div className="flex items-start gap-3">
              <div className="w-14 h-14 rounded-full bg-zinc-700 flex items-center justify-center text-3xl flex-shrink-0">
                {matchResult.helperAvatar}
              </div>
              <div className="flex-1">
                <p className="font-bold text-lg">{matchResult.helperName}</p>
                <p className="text-green-400 text-sm">📍 {matchResult.distance} km uzakta</p>
                {matchResult.helperOffers && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {matchResult.helperOffers.map((o) => (
                      <span key={o} className="bg-green-900/60 text-green-200 text-xs px-2 py-0.5 rounded-full">{o}</span>
                    ))}
                  </div>
                )}
                {matchResult.helperNote && (
                  <p className="text-zinc-400 text-xs mt-2">{matchResult.helperNote}</p>
                )}
              </div>
            </div>
            {matchResult.contact && (
              <a
                href={`tel:${matchResult.contact}`}
                className="mt-3 w-full py-3 rounded-xl bg-green-700 text-white font-bold text-center block text-sm"
              >
                📞 {matchResult.contact} — Hemen Ara
              </a>
            )}
          </div>
        )}

        {/* Diğer yardımcılar */}
        {top.length > 1 && (
          <div className="mx-4 mb-4">
            <p className="text-zinc-500 text-xs font-bold mb-2 px-1">DİĞER YAKIN YARDIMCILAR</p>
            <div className="flex flex-col gap-2">
              {top.slice(1).map((m) => (
                <div key={m.name} className="rounded-xl bg-zinc-900 border border-zinc-700 p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-xl flex-shrink-0">
                    {m.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{m.name}</p>
                    <p className="text-zinc-400 text-xs">📍 {m.distance} km · {m.offers.slice(0, 2).join(', ')}</p>
                  </div>
                  <a href={`tel:${m.contact}`} className="text-green-400 text-xs font-semibold whitespace-nowrap">Ara →</a>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mx-4 rounded-2xl bg-red-950/60 border border-red-800/50 p-4 mb-4">
          <p className="text-red-300 font-bold text-center">⚠️ Hayati tehlike varsa önce 112!</p>
        </div>

        <div className="flex flex-col gap-3 px-4">
          <button onClick={() => router.push('/harita')} className="w-full py-4 rounded-2xl text-lg font-semibold bg-zinc-800 border border-zinc-700">
            🗺️ Haritayı Gör
          </button>
          <button onClick={() => router.push('/')} className="w-full py-4 rounded-2xl text-lg font-semibold bg-zinc-900 text-zinc-400">
            Ana Sayfa
          </button>
        </div>
      </main>
    );
  }

  return null;
}
