'use client';

import { NEEDS } from '@/lib/needs';
import { NeedCategory } from '@/lib/types';

/** İhtiyaç / yardım türü seçimi (uygulamadaki ızgaranın aynısı). */
export default function NeedGrid({
  selected,
  onToggle,
  offer,
}: {
  selected: NeedCategory[];
  onToggle: (id: NeedCategory) => void;
  offer?: boolean;
}) {
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {NEEDS.map((n) => {
        const on = selected.includes(n.id);
        const label = offer ? n.offerLabel || n.label : n.label;
        return (
          <button
            key={n.id}
            type="button"
            onClick={() => onToggle(n.id)}
            aria-pressed={on}
            className={`flex aspect-square flex-col items-center justify-center gap-1.5 rounded-[6px] border-2 p-2 text-center transition active:scale-95 ${
              on ? (offer ? 'border-ok bg-ok-soft' : 'border-brand bg-brand-soft') : 'border-line bg-card'
            }`}
          >
            <span className="text-3xl">{n.emoji}</span>
            <span className="text-[14px] font-bold leading-tight">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
