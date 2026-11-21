'use client';

import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { Back, Page, Title } from '@/components/ui';
import { BAG_ITEMS, getBagChecked, setBagChecked } from '@/lib/canta';

/** Deprem çantası kontrol listesi. İşaretler bu tarayıcıda saklanır. */
export default function Canta() {
  const [checked, setChecked] = useState<string[]>([]);
  useEffect(() => {
    getBagChecked().then(setChecked);
  }, []);

  function toggle(id: string) {
    const next = checked.includes(id) ? checked.filter((x) => x !== id) : [...checked, id];
    setChecked(next);
    setBagChecked(next);
  }

  return (
    <Page>
      <Back />
      <Title sub={`Hazırladıklarını işaretle. ${checked.length} / ${BAG_ITEMS.length} tamam.`}>Deprem Çantası</Title>
      <div className="h-2.5 overflow-hidden rounded-[2px] bg-soft">
        <div className="h-2.5 bg-ok" style={{ width: `${(checked.length / BAG_ITEMS.length) * 100}%` }} />
      </div>
      {BAG_ITEMS.map((it) => {
        const on = checked.includes(it.id);
        return (
          <button
            key={it.id}
            type="button"
            role="checkbox"
            aria-checked={on}
            onClick={() => toggle(it.id)}
            className={`flex items-center gap-4 rounded-[6px] border-2 p-4 text-left ${on ? 'border-ok bg-ok-soft' : 'border-line bg-card'}`}
          >
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[4px] border-2 ${on ? 'border-ok bg-ok text-white' : 'border-muted'}`}>
              {on ? <Check size={20} strokeWidth={3} /> : null}
            </span>
            <span>
              <span className="block text-[17px] font-bold">{it.label}</span>
              <span className="block text-[15px] text-muted">{it.hint}</span>
            </span>
          </button>
        );
      })}
    </Page>
  );
}
