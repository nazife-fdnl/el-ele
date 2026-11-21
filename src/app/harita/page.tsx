'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { X } from 'lucide-react';
import { Back, Page, Title } from '@/components/ui';
import RequestCard from '@/components/RequestCard';
import { useRequests } from '@/lib/useRequests';
import { needEmoji } from '@/lib/needs';
import { calcDistanceKm } from '@/lib/geo';
import { getLocationIfGranted } from '@/lib/location';
import { Coords } from '@/lib/types';

const LeafletMap = dynamic(() => import('@/components/LeafletMap'), { ssr: false });

type Filter = 'hepsi' | 'need' | 'offer';

/** Canlı harita: yardım talepleri (kırmızı) ve yardım teklifleri (yeşil). */
export default function Harita() {
  const { requests, loaded, refreshBlocked } = useRequests();
  const [filter, setFilter] = useState<Filter>('hepsi');
  const [mode, setMode] = useState<'harita' | 'liste'>('harita');
  const [selected, setSelected] = useState<string | null>(null);
  const [me, setMe] = useState<Coords | null>(null);

  useEffect(() => {
    getLocationIfGranted().then(setMe);
  }, []);

  const shown = useMemo(() => requests.filter((r) => filter === 'hepsi' || r.type === filter), [requests, filter]);
  const points = useMemo(
    () =>
      shown.map((r) => ({
        id: r.id,
        lat: r.location.lat,
        lng: r.location.lng,
        color: r.type === 'need' ? (r.urgency === 'kritik' ? '#991B1B' : '#D32F2F') : '#15803D',
        text: r.needs[0] ? needEmoji(r.needs[0]) : '',
        size: r.urgency === 'kritik' ? 38 : 32,
      })),
    [shown]
  );
  const sel = shown.find((r) => r.id === selected) ?? null;
  const dist = (lat: number, lng: number) => (me ? calcDistanceKm(me.lat, me.lng, lat, lng) : null);

  return (
    <Page>
      <Back />
      <Title sub={loaded ? `${requests.filter((r) => r.type === 'need').length} yardım talebi · ${requests.filter((r) => r.type === 'offer').length} yardım teklifi` : 'Yükleniyor...'}>
        Canlı Harita
      </Title>
      <div className="flex flex-wrap gap-2">
        {([
          ['hepsi', 'Hepsi'],
          ['need', 'Yardım bekleyenler'],
          ['offer', 'Yardım edenler'],
        ] as [Filter, string][]).map(([k, l]) => (
          <button
            key={k}
            type="button"
            onClick={() => setFilter(k)}
            className={`min-h-11 rounded-[4px] border px-3 text-[15px] font-bold ${filter === k ? 'border-ink bg-ink text-white' : 'border-line bg-card'}`}
          >
            {l}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setMode(mode === 'harita' ? 'liste' : 'harita')}
          className="ml-auto min-h-11 rounded-[4px] border border-line bg-card px-3 text-[15px] font-bold"
        >
          {mode === 'harita' ? 'Liste' : 'Harita'}
        </button>
      </div>

      {mode === 'harita' ? (
        <div className="relative">
          <LeafletMap points={points} center={me ?? { lat: 39.0, lng: 35.2 }} zoom={me ? 12 : 6} user={me} onSelect={setSelected} className="h-[62vh]" />
          {sel ? (
            <div className="absolute inset-x-2 bottom-2 z-[500]">
              <div className="relative">
                <button type="button" onClick={() => setSelected(null)} aria-label="Kapat" className="absolute right-2 top-2 z-10 rounded-[4px] bg-soft p-1">
                  <X size={18} />
                </button>
                <RequestCard req={sel} distanceKm={dist(sel.location.lat, sel.location.lng)} onHidden={() => { setSelected(null); refreshBlocked(); }} />
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {shown.length === 0 ? <p className="text-muted">Şu an gösterilecek kayıt yok.</p> : null}
          {shown.map((r) => (
            <RequestCard key={r.id} req={r} distanceKm={dist(r.location.lat, r.location.lng)} onHidden={refreshBlocked} />
          ))}
        </div>
      )}
    </Page>
  );
}
