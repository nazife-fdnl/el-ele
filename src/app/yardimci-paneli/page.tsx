'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { HelpRequest } from '@/lib/types';
import { getNeeders } from '@/lib/store';
import { NEEDS } from '@/lib/needs';
import { DEMO_HELPERS } from '@/lib/demoHelpers';
import { calcDistance } from '@/lib/store';

function YardimciPaneliContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const helperId = searchParams.get('id') || 'helper-2'; // default: Fatma Demir

  const helper = DEMO_HELPERS.find((h) => h.id === helperId) || DEMO_HELPERS[1];

  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [newCount, setNewCount] = useState(0);
  const [lastChecked, setLastChecked] = useState(Date.now());
  const [pulseNew, setPulseNew] = useState(false);
  const prevCountRef = useRef(0);

  function loadRequests() {
    const all = getNeeders();
    // Yardımcının sunduklarıyla örtüşen istekleri öne al
    const scored = all.map((req) => {
      const overlap = req.needs.filter((n) => helper.needs.includes(n)).length;
      const distance = calcDistance(
        helper.location.lat, helper.location.lng,
        req.location.lat, req.location.lng
      );
      return { req, overlap, distance };
    });
    scored.sort((a, b) => b.overlap - a.overlap || a.distance - b.distance);
    const sorted = scored.map((s) => s.req);

    // Yeni istek geldi mi?
    if (sorted.length > prevCountRef.current) {
      const diff = sorted.length - prevCountRef.current;
      setNewCount((p) => p + diff);
      setPulseNew(true);
      setTimeout(() => setPulseNew(false), 3000);
    }
    prevCountRef.current = sorted.length;
    setRequests(sorted);
    setLastChecked(Date.now());
  }

  useEffect(() => {
    loadRequests();
    const interval = setInterval(loadRequests, 5000); // her 5 saniyede kontrol
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ago = Math.round((Date.now() - lastChecked) / 1000);

  return (
    <main className="min-h-screen bg-[#0f0f0f] text-white pb-8">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 border-b border-zinc-800">
        <button onClick={() => router.back()} className="text-zinc-400 text-sm mb-3">← Geri</button>

        {/* Yardımcı profil */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-full bg-green-900 border-2 border-green-500 flex items-center justify-center text-3xl">
            {helper.avatar}
          </div>
          <div>
            <p className="font-bold text-lg">{helper.name} {helper.surname}</p>
            <p className="text-green-400 text-sm">🟢 Aktif — Yardım edebiliyorum</p>
          </div>
        </div>

        {/* Sunduğu yardımlar */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {helper.needs.map((id) => {
            const need = NEEDS.find((n) => n.id === id);
            return need ? (
              <span key={id} className="text-xs bg-green-900/60 text-green-300 border border-green-700/50 px-2 py-1 rounded-full">
                {need.emoji} {need.label}
              </span>
            ) : null;
          })}
        </div>

        {/* Canlı güncelleme durumu */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-zinc-400 text-xs">Her 5 saniyede güncelleniyor</span>
          </div>
          <span className="text-zinc-600 text-xs">{ago === 0 ? 'Az önce' : `${ago}sn önce`}</span>
        </div>
      </div>

      {/* Yeni istek bildirimi */}
      {pulseNew && (
        <div className="mx-4 mt-4 rounded-2xl bg-red-600 p-4 flex items-center gap-3 animate-bounce">
          <span className="text-2xl">🔔</span>
          <div>
            <p className="font-bold">Yeni Yardım İsteği!</p>
            <p className="text-red-200 text-sm">Bölgende birine ihtiyaç var</p>
          </div>
        </div>
      )}

      {/* Badge */}
      {newCount > 0 && !pulseNew && (
        <div className="mx-4 mt-4 rounded-xl bg-zinc-800 border border-zinc-700 px-4 py-2 flex items-center gap-2">
          <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{newCount} yeni</span>
          <span className="text-zinc-400 text-sm">istek geldi</span>
        </div>
      )}

      {/* İstekler */}
      <div className="px-4 mt-4">
        <p className="text-zinc-500 text-xs font-bold mb-3">
          YAKINIMDAKI İHTİYAÇ SAHİPLERİ ({requests.length})
        </p>

        {requests.length === 0 && (
          <div className="rounded-2xl bg-zinc-900 border border-zinc-700 p-8 text-center">
            <p className="text-4xl mb-3">✅</p>
            <p className="text-zinc-400">Şu an bölgenden ihtiyaç isteği yok</p>
            <p className="text-zinc-600 text-sm mt-1">Sistem otomatik güncellenecek</p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {requests.map((req) => {
            const distance = calcDistance(
              helper.location.lat, helper.location.lng,
              req.location.lat, req.location.lng
            );
            const overlap = req.needs.filter((n) => helper.needs.includes(n));
            const isNew = req.timestamp > lastChecked - 10000;

            return (
              <div key={req.id}
                className={`rounded-2xl border p-4 ${
                  isNew
                    ? 'bg-red-950/60 border-red-700/60'
                    : 'bg-zinc-900 border-zinc-700'
                }`}>
                {isNew && (
                  <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full font-bold mb-2 inline-block">
                    🔴 YENİ
                  </span>
                )}

                {/* İhtiyaçlar */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {req.needs.map((id) => {
                    const need = NEEDS.find((n) => n.id === id);
                    const canHelp = overlap.includes(id);
                    return need ? (
                      <span key={id}
                        className={`text-sm px-3 py-1 rounded-full border ${
                          canHelp
                            ? 'bg-green-900/60 border-green-600 text-green-300'
                            : 'bg-zinc-800 border-zinc-600 text-zinc-400'
                        }`}>
                        {need.emoji} {need.label}
                        {canHelp && ' ✓'}
                      </span>
                    ) : null;
                  })}
                </div>

                <div className="flex items-center justify-between mb-3">
                  <p className="text-zinc-400 text-sm">📍 {distance.toFixed(1)} km uzakta</p>
                  <p className="text-zinc-600 text-xs">
                    {Math.round((Date.now() - req.timestamp) / 60000)} dk önce
                  </p>
                </div>

                {req.note && (
                  <p className="text-zinc-400 text-sm bg-zinc-800 rounded-xl px-3 py-2 mb-3">
                    💬 {req.note}
                  </p>
                )}

                {req.contact ? (
                  <a href={`tel:${req.contact}`}
                    className="w-full py-3 rounded-xl bg-red-600 text-white font-bold text-center block">
                    📞 {req.contact} — Hemen Ara
                  </a>
                ) : (
                  <div className="w-full py-3 rounded-xl bg-zinc-700 text-zinc-400 text-center text-sm">
                    İletişim bilgisi paylaşılmadı
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Paneli değiştir */}
      <div className="px-4 mt-6">
        <p className="text-zinc-600 text-xs text-center mb-2">Başka bir yardımcı olarak görüntüle:</p>
        <div className="flex flex-wrap gap-2 justify-center">
          {DEMO_HELPERS.map((h) => (
            <button key={h.id}
              onClick={() => router.push(`/yardimci-paneli?id=${h.id}`)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                h.id === helper.id
                  ? 'bg-green-700 border-green-500 text-white'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400'
              }`}>
              {h.avatar} {h.name}
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}

export default function YardimciPaneli() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center text-white">Yükleniyor...</div>}>
      <YardimciPaneliContent />
    </Suspense>
  );
}
