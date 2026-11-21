'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { BellRing, RefreshCw } from 'lucide-react';
import { Page, Title } from '@/components/ui';
import { Quake, fetchRecentQuakes, formatQuakeTime, magColor } from '@/lib/earthquakes';

const LeafletMap = dynamic(() => import('@/components/LeafletMap'), { ssr: false });

/** Son depremler (AFAD, yedek Kandilli): liste ya da harita, 3.0+ filtresi. */
export default function Depremler() {
  const [quakes, setQuakes] = useState<Quake[]>([]);
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading');
  const [mode, setMode] = useState<'liste' | 'harita'>('liste');
  const [only3, setOnly3] = useState(false);

  const load = useCallback(async () => {
    setState('loading');
    try {
      setQuakes(await fetchRecentQuakes());
      setState('ok');
    } catch {
      setState('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const shown = useMemo(() => (only3 ? quakes.filter((q) => q.mag >= 3) : quakes).slice(0, 100), [quakes, only3]);
  const points = useMemo(
    () =>
      shown.map((q) => ({
        id: q.id,
        lat: q.lat,
        lng: q.lng,
        color: magColor(q.mag).bg,
        size: 14 + Math.max(0, q.mag - 1) * 6,
        title: `${q.mag.toFixed(1)} · ${q.place} · ${formatQuakeTime(q.time)}`,
      })),
    [shown]
  );
  const source = quakes[0]?.source ?? 'AFAD';

  const chip = (on: boolean) => `min-h-11 rounded-[4px] border px-4 text-[15px] font-bold ${on ? 'border-ink bg-ink text-white' : 'border-line bg-card'}`;

  return (
    <Page tabs>
      <Title sub={`Kaynak: ${source === 'AFAD' ? 'AFAD (yedek: Kandilli)' : 'Kandilli Rasathanesi'} · son 48 saat`}>Son Depremler</Title>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={chip(mode === 'liste')} onClick={() => setMode('liste')}>Liste</button>
        <button type="button" className={chip(mode === 'harita')} onClick={() => setMode('harita')}>Harita</button>
        <button type="button" className={chip(only3)} onClick={() => setOnly3((v) => !v)}>3.0 ve üstü</button>
        <button type="button" className={`${chip(false)} ml-auto flex items-center gap-1.5`} onClick={load} aria-label="Yenile">
          <RefreshCw size={16} /> Yenile
        </button>
      </div>

      <div className="flex items-center gap-3 rounded-[6px] bg-ink p-4 text-white">
        <BellRing size={24} />
        <p className="flex-1 text-[15px]">
          Deprem bildirimleri El Ele Android uygulamasında. Bildirimler deprem olduktan sonra gelir; erken uyarı değildir.
        </p>
      </div>

      {state === 'loading' ? <p className="text-muted">Yükleniyor...</p> : null}
      {state === 'error' ? <p className="text-brand">Deprem bilgisi alınamadı. “Yenile”ye bas.</p> : null}

      {mode === 'harita' ? (
        <LeafletMap points={points} center={{ lat: 39.0, lng: 35.2 }} zoom={5} className="h-[60vh]" />
      ) : (
        <div className="flex flex-col gap-2.5">
          {shown.map((q) => {
            const c = magColor(q.mag);
            return (
              <div key={q.id} className="flex items-center gap-3.5 rounded-[6px] border border-line bg-card p-3">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[4px] text-[21px] font-extrabold" style={{ background: c.bg, color: c.fg }}>
                  {q.mag.toFixed(1)}
                </span>
                <span>
                  <span className="block text-[16px] font-extrabold">{q.place}</span>
                  <span className="block text-[14px] text-muted">
                    {formatQuakeTime(q.time)}
                    {q.depthKm !== null ? ` · ${q.depthKm} km` : ''}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      )}
    </Page>
  );
}
