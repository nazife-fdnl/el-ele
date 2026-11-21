'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { Navigation } from 'lucide-react';
import { Back, Button, Page, Title } from '@/components/ui';
import { getBrowserLocation } from '@/lib/location';
import { formatDistance, minutesAgo } from '@/lib/geo';
import {
  PLACE_KIND_EMOJI,
  PLACE_KIND_LABEL,
  Place,
  PlaceKind,
  PlaceReport,
  PlaceStatus,
  STATUS_LABEL,
  fetchNearbyPlaces,
  fetchPlaceReports,
  reportPlaceStatus,
} from '@/lib/places';
import { Coords } from '@/lib/types';

const LeafletMap = dynamic(() => import('@/components/LeafletMap'), { ssr: false });

type Filter = 'hepsi' | PlaceKind;
const FILTERS: Filter[] = ['hepsi', 'market', 'bakkal', 'firin', 'eczane'];
const STATUS_CLS: Record<PlaceStatus, string> = { acik: 'text-ok', kapali: 'text-brand', stok_yok: 'text-amber-600' };
const KIND_COLOR: Record<PlaceKind, string> = { market: '#1D4ED8', bakkal: '#7C3AED', firin: '#B45309', eczane: '#15803D' };

/** Yakındaki market, bakkal, fırın ve eczaneler (Google Haritalar, yedek OpenStreetMap). */
export default function Yakindakiler() {
  const [center, setCenter] = useState<Coords | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [reports, setReports] = useState<Record<string, PlaceReport>>({});
  const [source, setSource] = useState<'google' | 'osm'>('google');
  const [filter, setFilter] = useState<Filter>('hepsi');
  const [state, setState] = useState<'loading' | 'ready' | 'no_location' | 'error'>('loading');
  const [asking, setAsking] = useState<Place | null>(null);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    setState('loading');
    const loc = await getBrowserLocation();
    if (!loc.ok) {
      setState('no_location');
      return;
    }
    setCenter(loc.coords);
    try {
      const { places: list, source: src } = await fetchNearbyPlaces(loc.coords);
      setPlaces(list);
      setSource(src);
      setState('ready');
      fetchPlaceReports(list.map((p) => p.id)).then(setReports).catch(() => {});
    } catch {
      setState('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const shown = useMemo(() => (filter === 'hepsi' ? places : places.filter((p) => p.kind === filter)).slice(0, 40), [places, filter]);
  const points = useMemo(
    () => shown.map((p) => ({ id: p.id, lat: p.lat, lng: p.lng, color: KIND_COLOR[p.kind], text: PLACE_KIND_EMOJI[p.kind], size: 32, title: p.name })),
    [shown]
  );

  async function send(p: Place, s: PlaceStatus) {
    setAsking(null);
    try {
      await reportPlaceStatus(p.id, s);
      setReports((r) => ({ ...r, [p.id]: { status: s, createdAt: Date.now() } }));
      setMsg('Teşekkürler, bildirimin kaydedildi.');
    } catch (err) {
      setMsg(String((err as { message?: string })?.message ?? '').includes('RATE_LIMIT') ? 'Kısa sürede çok fazla bildirim yaptın. Birkaç dakika sonra tekrar dene.' : 'Bildirilemedi, tekrar dene.');
    }
    setTimeout(() => setMsg(''), 3000);
  }

  return (
    <Page>
      <Back />
      <Title sub={`Yakınındaki yerler · Kaynak: ${source === 'google' ? 'Google Haritalar' : 'OpenStreetMap'}`}>Yakındaki Market ve Eczaneler</Title>
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`min-h-11 rounded-[4px] border px-3 text-[15px] font-bold ${filter === f ? 'border-ink bg-ink text-white' : 'border-line bg-card'}`}
          >
            {f === 'hepsi' ? 'Hepsi' : `${PLACE_KIND_EMOJI[f]} ${PLACE_KIND_LABEL[f]}`}
          </button>
        ))}
      </div>

      {state === 'loading' ? <p className="text-muted">Yakındaki yerler aranıyor...</p> : null}
      {state === 'no_location' ? (
        <>
          <p className="text-[16px]">Yakındaki yerleri gösterebilmek için konum izni gerekiyor. Tarayıcının adres çubuğundaki konum iznini açıp tekrar dene.</p>
          <Button onClick={load}>Tekrar dene</Button>
        </>
      ) : null}
      {state === 'error' ? (
        <>
          <p className="text-[16px]">Liste şu an alınamadı. Birkaç saniye sonra tekrar dene.</p>
          <Button onClick={load}>Tekrar dene</Button>
        </>
      ) : null}

      {state === 'ready' && center ? (
        <>
          <LeafletMap points={points} center={center} zoom={15} user={center} className="h-64" />
          {msg ? <p className="rounded-[6px] bg-ok-soft p-3 text-[15px]">{msg}</p> : null}
          {shown.length === 0 ? <p className="text-muted">Yakında bu türde kayıtlı bir yer bulunamadı.</p> : null}
          {shown.map((p) => {
            const r = reports[p.id];
            return (
              <div key={p.id} className="rounded-[6px] border border-line bg-card p-4">
                <div className="flex justify-between gap-2">
                  <p className="text-[17px] font-extrabold">{PLACE_KIND_EMOJI[p.kind]} {p.name}</p>
                  <p className="shrink-0 text-[15px] font-semibold text-muted">{formatDistance(p.distanceKm)}</p>
                </div>
                <p className={`mt-1 text-[15px] font-bold ${r ? STATUS_CLS[r.status] : 'text-muted'}`}>
                  {r ? `${STATUS_LABEL[r.status]} · ${minutesAgo(r.createdAt)} bildirildi` : 'Durumu bilinmiyor'}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}&travelmode=walking`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex min-h-12 items-center justify-center gap-1.5 rounded-[4px] bg-ink font-extrabold text-white"
                  >
                    <Navigation size={16} /> Yol tarifi
                  </a>
                  <button type="button" onClick={() => setAsking(p)} className="min-h-12 rounded-[4px] border border-line font-bold">
                    Durum bildir
                  </button>
                </div>
              </div>
            );
          })}
          <p className="text-[13px] text-muted">
            Yer bilgileri {source === 'google' ? 'Google Haritalar’dan' : 'OpenStreetMap’ten'} alınır; eksik ya da eski olabilir. Afet sonrasında yerlerin açık olup olmadığını kullanıcıların bildirimleri gösterir.
          </p>
        </>
      ) : null}

      {asking ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center" onClick={() => setAsking(null)}>
          <div className="w-full max-w-md rounded-t-[8px] bg-card p-4 sm:rounded-[8px]" onClick={(e) => e.stopPropagation()}>
            <p className="text-lg font-extrabold">{asking.name}</p>
            <p className="text-[15px] text-muted">Bu yer şu an ne durumda?</p>
            <div className="mt-3 flex flex-col gap-2">
              {(['acik', 'stok_yok', 'kapali'] as PlaceStatus[]).map((s) => (
                <Button key={s} variant="outline" onClick={() => send(asking, s)}>{STATUS_LABEL[s]}</Button>
              ))}
              <Button variant="ink" onClick={() => setAsking(null)}>Vazgeç</Button>
            </div>
          </div>
        </div>
      ) : null}
    </Page>
  );
}
