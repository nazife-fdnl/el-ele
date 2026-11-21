'use client';

import { useState } from 'react';
import { Flag, LoaderCircle, Phone } from 'lucide-react';
import { needEmoji, needLabel } from '@/lib/needs';
import { HelpRequest } from '@/lib/types';
import { formatDistance, minutesAgo } from '@/lib/geo';
import { revealContact } from '@/lib/store';
import ReportDialog from './ReportDialog';

const URGENCY: Record<string, { label: string; cls: string }> = {
  kritik: { label: 'KRİTİK', cls: 'bg-brand text-white' },
  yuksek: { label: 'YÜKSEK', cls: 'bg-orange-500 text-white' },
  normal: { label: 'NORMAL', cls: 'bg-soft text-ink' },
  dusuk: { label: 'DÜŞÜK', cls: 'bg-soft text-muted' },
};

/** Bir yardım talebi ya da yardım teklifi kartı: ihtiyaçlar, not, mesafe, Ara ve Bildir. */
export default function RequestCard({
  req,
  distanceKm,
  onHidden,
}: {
  req: HelpRequest;
  distanceKm?: number | null;
  onHidden?: () => void;
}) {
  const [calling, setCalling] = useState(false);
  const [error, setError] = useState('');
  const [reporting, setReporting] = useState(false);
  const isNeed = req.type === 'need';
  const u = URGENCY[req.urgency ?? 'normal'] ?? URGENCY.normal;

  async function call() {
    setCalling(true);
    setError('');
    const phone = await revealContact(req.id);
    setCalling(false);
    if (phone) window.location.href = `tel:${phone}`;
    else setError('Telefon numarası alınamadı, birazdan tekrar dene.');
  }

  return (
    <div className={`rounded-[6px] border bg-card p-4 ${isNeed ? 'border-l-4 border-line border-l-brand' : 'border-l-4 border-line border-l-ok'}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[17px] font-extrabold">
          {req.needs.map((n) => `${needEmoji(n)} ${needLabel(n)}`).join(' · ') || (isNeed ? 'Yardım talebi' : 'Yardım teklifi')}
        </p>
        {isNeed ? <span className={`shrink-0 rounded-[4px] px-2 py-0.5 text-xs font-extrabold ${u.cls}`}>{u.label}</span> : null}
      </div>
      <p className="mt-1 text-sm text-muted">
        {isNeed ? 'Yardıma ihtiyacı var' : 'Yardım edebilir'} · {minutesAgo(req.createdAt)}
        {distanceKm != null ? ` · ${formatDistance(distanceKm)}` : ''}
      </p>
      {req.aiSummary ? <p className="mt-2 text-[15px] italic text-muted">Değerlendirme: {req.aiSummary}</p> : null}
      {req.note ? <p className="mt-2 whitespace-pre-line text-[15px]">{req.note}</p> : null}
      {req.bloodType ? (
        <p className="mt-2 text-[15px]">
          <b>Kan grubu:</b> {req.bloodType}
          {req.allergies ? ` · Alerji: ${req.allergies}` : ''}
        </p>
      ) : null}
      <div className="mt-3 flex gap-2">
        {req.hasContact ? (
          <button
            type="button"
            onClick={call}
            disabled={calling}
            className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-[6px] bg-ink font-extrabold text-white disabled:opacity-50"
          >
            {calling ? <LoaderCircle className="animate-spin" size={18} /> : <Phone size={18} />} Ara
          </button>
        ) : (
          <p className="flex-1 self-center text-sm text-muted">Telefon numarası paylaşılmamış</p>
        )}
        <button
          type="button"
          onClick={() => setReporting(true)}
          className="flex min-h-12 items-center gap-1.5 rounded-[6px] border border-line px-3 text-sm font-bold text-muted"
        >
          <Flag size={16} /> Bildir / Gizle
        </button>
      </div>
      {error ? <p className="mt-2 text-sm text-brand">{error}</p> : null}
      {reporting ? <ReportDialog req={req} onClose={() => setReporting(false)} onHidden={onHidden} /> : null}
    </div>
  );
}
