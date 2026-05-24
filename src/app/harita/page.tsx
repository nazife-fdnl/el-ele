'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { HelpRequest } from '@/lib/types';
import { getRequests } from '@/lib/store';
import { NEEDS } from '@/lib/needs';
import { DEMO_HELPERS } from '@/lib/demoHelpers';

// Demo ihtiyaç noktaları (İstanbul)
const DEMO_NEEDS: HelpRequest[] = [
  {
    id: 'need-demo-1',
    type: 'need',
    needs: ['su', 'yiyecek'],
    location: { lat: 41.0135, lng: 28.9650 },
    contact: '0532 100 11 22',
    note: '3. kat, mavi bina',
    timestamp: Date.now() - 180000,
  },
  {
    id: 'need-demo-2',
    type: 'need',
    needs: ['enkaz', 'ilkyardim'],
    location: { lat: 41.0060, lng: 28.9810 },
    contact: '0544 200 33 44',
    note: 'Enkaz altında 2 kişi var',
    timestamp: Date.now() - 420000,
  },
  {
    id: 'need-demo-3',
    type: 'need',
    needs: ['ilac', 'bebek'],
    location: { lat: 41.0220, lng: 28.9720 },
    contact: '',
    note: 'Bebekli aile, ilaç ve mama gerekiyor',
    timestamp: Date.now() - 90000,
  },
  {
    id: 'need-demo-4',
    type: 'need',
    needs: ['tasima', 'barinак'],
    location: { lat: 40.9970, lng: 28.9560 },
    contact: '0511 300 55 66',
    note: 'Taşınacak yer arıyoruz',
    timestamp: Date.now() - 600000,
  },
  {
    id: 'need-demo-5',
    type: 'need',
    needs: ['kan'],
    location: { lat: 41.0080, lng: 29.0050 },
    contact: '0555 400 77 88',
    note: '0 Rh- kan grubuna ihtiyaç var',
    timestamp: Date.now() - 300000,
  },
];

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 gap-3">
      <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-zinc-400 text-sm">Harita yükleniyor...</p>
    </div>
  ),
});

export default function Harita() {
  const router = useRouter();
  const [allRequests, setAllRequests] = useState<HelpRequest[]>([]);
  const [filter, setFilter] = useState<'all' | 'need' | 'offer'>('all');
  const [tab, setTab] = useState<'map' | 'list'>('map');
  const [userCenter, setUserCenter] = useState<[number, number]>([41.0082, 28.9784]);
  const [mapKey, setMapKey] = useState(0);

  useEffect(() => {
    // Kullanıcı konumunu al, haritayı oraya odakla
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        setUserCenter([pos.coords.latitude, pos.coords.longitude]);
        setMapKey((k) => k + 1); // haritayı yeniden mount et
      },
      () => {
        // İzin yoksa İstanbul merkezi kullan
      },
      { timeout: 6000, enableHighAccuracy: false }
    );

    const stored = getRequests();
    setAllRequests([...DEMO_HELPERS, ...DEMO_NEEDS, ...stored]);
  }, []);

  const filtered =
    filter === 'all' ? allRequests : allRequests.filter((r) => r.type === filter);

  const needCount = allRequests.filter((r) => r.type === 'need').length;
  const offerCount = allRequests.filter((r) => r.type === 'offer').length;

  return (
    <main className="min-h-screen bg-[#0f0f0f] text-white pb-6 flex flex-col">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 flex items-center gap-3 border-b border-zinc-800 flex-shrink-0">
        <button onClick={() => router.back()} className="text-zinc-400 text-sm">← Geri</button>
        <h1 className="text-xl font-bold flex-1">Canlı Durum Haritası</h1>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-green-400 text-xs">Canlı</span>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-3 px-4 pt-4 mb-3 flex-shrink-0">
        <div className="flex-1 bg-red-950/60 border border-red-800/50 rounded-2xl p-3 text-center">
          <p className="text-2xl font-bold text-red-400">{needCount}</p>
          <p className="text-xs text-red-300">İhtiyaç</p>
        </div>
        <div className="flex-1 bg-green-950/60 border border-green-700/50 rounded-2xl p-3 text-center">
          <p className="text-2xl font-bold text-green-400">{offerCount}</p>
          <p className="text-xs text-green-300">Yardımcı</p>
        </div>
        <div className="flex-1 bg-zinc-800 border border-zinc-700 rounded-2xl p-3 text-center">
          <p className="text-2xl font-bold">{allRequests.length}</p>
          <p className="text-xs text-zinc-400">Toplam</p>
        </div>
      </div>

      {/* Filtre */}
      <div className="flex gap-2 px-4 mb-3 flex-shrink-0">
        {(['all', 'need', 'offer'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
              filter === f
                ? f === 'need' ? 'bg-red-600 text-white'
                  : f === 'offer' ? 'bg-green-700 text-white'
                  : 'bg-zinc-600 text-white'
                : 'bg-zinc-800 text-zinc-400'
            }`}>
            {f === 'all' ? 'Tümü' : f === 'need' ? '🆘 İhtiyaç' : '🙌 Yardım'}
          </button>
        ))}
      </div>

      {/* Harita / Liste tab */}
      <div className="flex gap-2 px-4 mb-3 flex-shrink-0">
        <button onClick={() => setTab('map')}
          className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${tab === 'map' ? 'bg-zinc-600 text-white' : 'bg-zinc-900 text-zinc-500'}`}>
          🗺️ Harita
        </button>
        <button onClick={() => setTab('list')}
          className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${tab === 'list' ? 'bg-zinc-600 text-white' : 'bg-zinc-900 text-zinc-500'}`}>
          📋 Liste
        </button>
      </div>

      {/* HARİTA */}
      {tab === 'map' && (
        <div className="px-4 flex flex-col gap-3 flex-shrink-0">
          {/* Harita kutusu — sabit yükseklik */}
          <div
            key={mapKey}
            style={{
              height: '55vh',
              minHeight: 320,
              borderRadius: 20,
              overflow: 'hidden',
              background: '#1a1a2e',
              border: '1px solid #27272a',
            }}
          >
            <MapView
              requests={filtered}
              center={userCenter}
              zoom={13}
            />
          </div>

          {/* Açıklama */}
          <div className="flex items-center justify-center gap-6">
            <div className="flex items-center gap-2">
              <div style={{
                width: 20, height: 20, borderRadius: '50%',
                background: '#dc2626', border: '2px solid #fca5a5',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9,
              }}>🆘</div>
              <span className="text-xs text-zinc-400">İhtiyaç sahipleri</span>
            </div>
            <div className="flex items-center gap-2">
              <div style={{
                width: 20, height: 20, borderRadius: '50%',
                background: '#16a34a', border: '2px solid #86efac',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9,
              }}>🙌</div>
              <span className="text-xs text-zinc-400">Yardım noktaları</span>
            </div>
          </div>
          <p className="text-center text-zinc-600 text-xs">Simgeye tıkla → iletişim bilgisini gör</p>
        </div>
      )}

      {/* LİSTE */}
      {tab === 'list' && (
        <div className="px-4 flex flex-col gap-2">
          {filtered.map((req) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const reqAny = req as any;
            const displayName = reqAny.name ? `${reqAny.name} ${reqAny.surname}` : null;
            const emojis = req.needs.slice(0, 3).map((id) => NEEDS.find((n) => n.id === id)?.emoji || '').join(' ');
            const labels = req.needs.slice(0, 2).map((id) => NEEDS.find((n) => n.id === id)?.label || id).join(', ');
            const ago = Math.round((Date.now() - req.timestamp) / 60000);
            const isNeed = req.type === 'need';

            return (
              <div key={req.id}
                className={`rounded-2xl border p-4 flex items-start gap-3 ${
                  isNeed ? 'bg-red-950/30 border-red-900/50' : 'bg-green-950/30 border-green-900/50'
                }`}>
                <div className={`w-11 h-11 rounded-full flex items-center justify-center text-xl flex-shrink-0 border-2 ${
                  isNeed ? 'bg-red-900/50 border-red-700' : 'bg-green-900/50 border-green-700'
                }`}>
                  {reqAny.avatar || (isNeed ? '🆘' : '🙌')}
                </div>
                <div className="flex-1 min-w-0">
                  {displayName && <p className="font-semibold text-sm mb-0.5">{displayName}</p>}
                  <p className="text-sm">{emojis} {labels}</p>
                  {req.note && <p className="text-zinc-500 text-xs mt-1 truncate">{req.note}</p>}
                  <p className="text-zinc-600 text-xs mt-1">{ago} dk önce</p>
                </div>
                {req.contact ? (
                  <a href={`tel:${req.contact}`}
                    className={`flex-shrink-0 text-xs font-bold px-3 py-2 rounded-xl ${
                      isNeed ? 'bg-red-700 text-white' : 'bg-green-700 text-white'
                    }`}>
                    📞 Ara
                  </a>
                ) : (
                  <span className="flex-shrink-0 text-xs text-zinc-600 px-2">—</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
