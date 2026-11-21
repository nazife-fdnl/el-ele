'use client';

import { useEffect, useMemo, useState } from 'react';
import { Back, Card, Page, Title } from '@/components/ui';
import RequestCard from '@/components/RequestCard';
import { useRequests } from '@/lib/useRequests';
import { calcDistanceKm } from '@/lib/geo';
import { getLocationIfGranted } from '@/lib/location';
import { Coords } from '@/lib/types';

const ORDER: Record<string, number> = { kritik: 0, yuksek: 1, normal: 2, dusuk: 3 };

/** Yardımcı paneli: yardım bekleyenler, önce en acil, sonra en yakın. */
export default function YardimciPaneli() {
  const { requests, loaded, refreshBlocked } = useRequests();
  const [me, setMe] = useState<Coords | null>(null);

  useEffect(() => {
    getLocationIfGranted().then(setMe);
  }, []);

  const list = useMemo(() => {
    return requests
      .filter((r) => r.type === 'need')
      .map((r) => ({ r, km: me ? calcDistanceKm(me.lat, me.lng, r.location.lat, r.location.lng) : null }))
      .sort((a, b) => {
        const u = (ORDER[a.r.urgency ?? 'normal'] ?? 2) - (ORDER[b.r.urgency ?? 'normal'] ?? 2);
        if (u !== 0) return u;
        if (a.km != null && b.km != null) return a.km - b.km;
        return b.r.createdAt - a.r.createdAt;
      });
  }, [requests, me]);

  return (
    <Page>
      <Back />
      <Title sub="Önce en acil talepler, sonra sana en yakın olanlar. Liste kendiliğinden güncellenir.">Yardımcı Paneli</Title>
      {!loaded ? <p className="text-muted">Yükleniyor...</p> : null}
      {loaded && list.length === 0 ? (
        <Card><p className="text-muted">Şu an açık bir yardım talebi yok.</p></Card>
      ) : null}
      {list.map(({ r, km }) => (
        <RequestCard key={r.id} req={r} distanceKm={km} onHidden={refreshBlocked} />
      ))}
    </Page>
  );
}
