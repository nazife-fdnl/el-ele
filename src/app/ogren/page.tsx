'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Backpack, CircleCheck, CirclePlay, Lock, MessageCircle, Star } from 'lucide-react';
import { Page, RowLink, Section, Title } from '@/components/ui';
import { LEVELS, Stars, getStars, isUnlocked, nextLevel } from '@/lib/oyun';

/** Öğren: oyun bölümleri, deprem çantası ve Konuşalım. */
export default function Ogren() {
  const [stars, setStars] = useState<Stars>({});
  useEffect(() => {
    getStars().then(setStars);
  }, []);
  const next = nextLevel(stars);

  return (
    <Page tabs>
      <Title sub="Oynayarak depreme hazırlan. Davranışlar AFAD önerilerine göre.">Öğren</Title>
      <Section>OYUN: DEPREMDE NE YAPARSIN?</Section>
      {LEVELS.map((l) => {
        const got = stars[l.id] ?? 0;
        const open = isUnlocked(l.id, stars);
        const inner = (
          <>
            <span className={`flex h-10 w-10 items-center justify-center rounded-[4px] font-extrabold ${got > 0 ? 'bg-ok text-white' : open ? 'bg-brand text-white' : 'bg-soft text-muted'}`}>
              {l.no}
            </span>
            <span className="flex-1">
              <span className={`block text-[17px] font-extrabold ${open ? '' : 'text-muted'}`}>{l.title}</span>
              <span className="mt-0.5 flex items-center gap-1 text-[14px] text-muted">
                {l.phase}
                {[1, 2, 3].map((i) => (
                  <Star key={i} size={14} className={i <= got ? 'fill-amber-400 text-amber-400' : 'text-line'} />
                ))}
              </span>
            </span>
            {got > 0 ? <CircleCheck className="text-ok" /> : open ? <CirclePlay className="text-brand" /> : <Lock className="text-muted" />}
          </>
        );
        return open ? (
          <Link key={l.id} href={`/oyun?bolum=${l.id}`} className="flex items-center gap-3.5 rounded-[6px] border border-line bg-card p-4 active:opacity-85">
            {inner}
          </Link>
        ) : (
          <div key={l.id} className="flex items-center gap-3.5 rounded-[6px] border border-line bg-paper p-4">{inner}</div>
        );
      })}
      <p className="text-[13px] text-muted">
        {next ? `Sıradaki: ${next.title}. ` : 'Tüm bölümleri bitirdin. '}Deprem başlayınca ekran sallanır; doğru yere hızlı dokun, yıldızları topla.
      </p>
      <Section>DESTEK</Section>
      <RowLink href="/canta" Icon={Backpack} title="Deprem çantası" sub="Çantanda neler olmalı? Kontrol listesi" />
      <RowLink href="/konusalim" Icon={MessageCircle} title="Konuşalım" sub="Deprem sonrası korku ve kaygı için otomatik destek sohbeti" />
    </Page>
  );
}
