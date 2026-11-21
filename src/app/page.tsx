'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Backpack, ChevronRight, Gamepad2, HandHeart, Lightbulb, TriangleAlert } from 'lucide-react';
import { Page, RowLink, Section } from '@/components/ui';
import { Quake, fetchRecentQuakes, findMajorNearby, formatQuakeTime, magColor } from '@/lib/earthquakes';
import { getLocationIfGranted } from '@/lib/location';
import { isAfetModu, markAutoOpened, setAfetModu, wasAutoOpenedFor } from '@/lib/afetModu';
import { BAG_ITEMS, getBagChecked } from '@/lib/canta';
import { getStars, nextLevel } from '@/lib/oyun';
import { tipOfToday } from '@/lib/tips';
import { calcDistanceKm } from '@/lib/geo';
import { Coords } from '@/lib/types';

/** Normal mod ana sayfa (uygulamadaki ile aynı). */
export default function Home() {
  const router = useRouter();
  const [latest, setLatest] = useState<Quake | null>(null);
  const [qs, setQs] = useState<'loading' | 'ok' | 'error'>('loading');
  const [me, setMe] = useState<Coords | null>(null);
  const [bag, setBag] = useState(0);
  const [next, setNext] = useState<string | null>(null);
  const [tip, setTip] = useState('');

  useEffect(() => {
    let alive = true;
    setTip(tipOfToday());
    (async () => {
      if (await isAfetModu()) {
        router.replace('/afet-modu');
        return;
      }
      getBagChecked().then((c) => alive && setBag(c.length));
      getStars().then((s) => {
        const n = nextLevel(s);
        if (alive) setNext(n ? n.title : null);
      });
      const loc = await getLocationIfGranted();
      if (alive) setMe(loc);
      try {
        const quakes = await fetchRecentQuakes();
        if (!alive) return;
        setLatest(quakes[0] ?? null);
        setQs('ok');
        const major = findMajorNearby(quakes, loc, null);
        if (major && !(await wasAutoOpenedFor(major.id))) {
          await markAutoOpened(major.id);
          await setAfetModu(true);
          router.replace('/afet-modu');
        }
      } catch {
        if (alive) setQs('error');
      }
    })();
    return () => {
      alive = false;
    };
  }, [router]);

  async function openAfet() {
    await setAfetModu(true);
    router.push('/afet-modu');
  }

  const mc = latest ? magColor(latest.mag) : null;
  const km = latest && me ? calcDistanceKm(me.lat, me.lng, latest.lat, latest.lng) : null;

  return (
    <Page tabs>
      <button type="button" onClick={openAfet} className="flex items-center gap-3 rounded-[6px] bg-brand p-4 text-left text-white active:opacity-90">
        <TriangleAlert size={30} />
        <span className="flex-1">
          <span className="block text-[17px] font-extrabold">Yardıma mı ihtiyacın var?</span>
          <span className="block text-[15px]">Afet modunu aç: yardım iste, fener, düdük ve acil buton tek ekranda.</span>
        </span>
        <ChevronRight size={26} />
      </button>

      <Section>SON DEPREM</Section>
      <Link href="/depremler" className="block rounded-[6px] border border-line bg-card p-4 active:opacity-85">
        {latest && mc ? (
          <div className="flex items-center gap-3.5">
            <span className="flex h-16 w-16 items-center justify-center rounded-[4px] text-[26px] font-extrabold" style={{ background: mc.bg, color: mc.fg }}>
              {latest.mag.toFixed(1)}
            </span>
            <span className="flex-1">
              <span className="block text-[17px] font-extrabold">{latest.place}</span>
              <span className="block text-[15px] text-muted">
                {formatQuakeTime(latest.time)}
                {latest.depthKm !== null ? ` · ${latest.depthKm} km derinlik` : ''}
              </span>
              {km !== null ? <span className="block text-[15px] text-muted">Sana uzaklığı {Math.round(km)} km</span> : null}
            </span>
          </div>
        ) : (
          <p className="text-muted">{qs === 'loading' ? 'Yükleniyor...' : 'Deprem bilgisi şu an alınamıyor.'}</p>
        )}
        <div className="mt-3 flex justify-between border-t border-soft pt-2.5 text-sm">
          <span className="text-muted">Kaynak: {latest?.source ?? 'AFAD'}</span>
          <span className="font-extrabold text-brand">Tüm depremler</span>
        </div>
      </Link>

      <Section>YARDIMLAŞMA</Section>
      <div className="grid grid-cols-2 gap-2.5">
        <Link href="/ihtiyacim-var" className="rounded-[6px] bg-brand p-4 text-white active:opacity-90">
          <span className="block text-[17px] font-extrabold">Yardıma İhtiyacım Var</span>
          <span className="mt-1 block text-sm">Su, yiyecek, ilaç, kurtarma…</span>
        </Link>
        <Link href="/yardim-edebilirim" className="rounded-[6px] bg-ok p-4 text-white active:opacity-90">
          <span className="block text-[17px] font-extrabold">Yardım Edebilirim</span>
          <span className="mt-1 block text-sm">Malzeme, araç, barınak</span>
        </Link>
      </div>
      <RowLink href="/harita" Icon={HandHeart} title="Canlı harita ve yardımcı paneli" sub="Yakınındaki talepleri gör" />

      <Section>HAZIRLIK</Section>
      <RowLink href="/canta" Icon={Backpack} title="Deprem çantası" sub={`${bag} / ${BAG_ITEMS.length} hazır`}>
        <div className="mt-3 h-2 overflow-hidden rounded-[2px] bg-soft">
          <div className="h-2 bg-ok" style={{ width: `${(bag / BAG_ITEMS.length) * 100}%` }} />
        </div>
      </RowLink>
      <RowLink href="/oyun" Icon={Gamepad2} title="Depremde Ne Yaparsın?" sub={next ? `Sıradaki bölüm: ${next}` : 'Tüm bölümler tamamlandı, yıldızları topla'} />

      <div className="mt-2 rounded-[4px] border-l-4 border-ink bg-card p-4">
        <p className="flex items-center gap-2 text-[15px] font-extrabold"><Lightbulb size={18} /> Günün ipucu</p>
        <p className="mt-1.5 text-[16px] leading-relaxed">{tip}</p>
      </div>
    </Page>
  );
}
