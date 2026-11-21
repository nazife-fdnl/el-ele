'use client';

import { useMemo, useState } from 'react';
import { LoaderCircle, MapPin } from 'lucide-react';
import { getBrowserLocation } from '@/lib/location';
import { PROVINCES } from '@/lib/provinces';
import { provinceCenter } from '@/lib/provinceCoords';
import { Coords } from '@/lib/types';
import { Button } from './ui';

/**
 * Konum adımı: önce tarayıcıdan GPS konumu istenir. İzin verilmezse ya da
 * alınamazsa kullanıcı ilini seçer ve ilin merkezi yaklaşık konum olur.
 * Konum IP adresinden ASLA tahmin edilmez.
 */
export default function LocationPicker({ onLocation, offer }: { onLocation: (c: Coords) => void; offer?: boolean }) {
  const [state, setState] = useState<'idle' | 'loading' | 'failed'>('idle');
  const [query, setQuery] = useState('');
  const list = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('tr');
    return q ? PROVINCES.filter((p) => p.toLocaleLowerCase('tr').includes(q)) : PROVINCES;
  }, [query]);

  async function useGps() {
    setState('loading');
    const r = await getBrowserLocation();
    if (r.ok) onLocation(r.coords);
    else setState('failed');
  }

  return (
    <div className="flex flex-col gap-3">
      <Button variant={offer ? 'ok' : 'brand'} onClick={useGps} disabled={state === 'loading'}>
        {state === 'loading' ? <LoaderCircle className="animate-spin" size={22} /> : <MapPin size={22} />}
        {state === 'loading' ? 'Konum alınıyor...' : 'Konumumu kullan'}
      </Button>
      {state === 'failed' ? (
        <p className="rounded-[6px] bg-brand-soft p-3 text-[15px] text-ink">
          Konum alınamadı ya da izin verilmedi. Aşağıdan bulunduğun ili seçebilirsin; ilin merkezi yaklaşık konum olarak kullanılır.
        </p>
      ) : null}
      <p className="mt-1 text-[15px] font-bold">ya da ilini seç</p>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="İl ara... (örn. Hatay)"
        className="min-h-12 rounded-[6px] border border-line bg-card px-3 text-[17px] outline-none focus:border-ink"
      />
      <div className="max-h-64 overflow-y-auto rounded-[6px] border border-line bg-card">
        {list.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => {
              const c = provinceCenter(p);
              if (c) onLocation(c);
            }}
            className="block w-full border-b border-soft px-4 py-3 text-left text-[17px] last:border-b-0 hover:bg-paper"
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}
