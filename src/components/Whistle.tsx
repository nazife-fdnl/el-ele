'use client';

import { useEffect, useRef, useState } from 'react';
import { Megaphone, VolumeX } from 'lucide-react';
import { startWhistle } from '@/lib/sounds';

/** Düdük: dokununca yüksek, kesintisiz bir düdük sesi çalar; tekrar dokununca durur. */
export default function Whistle() {
  const [on, setOn] = useState(false);
  const stop = useRef<(() => void) | null>(null);
  useEffect(() => () => stop.current?.(), []);
  return (
    <button
      type="button"
      onClick={() => {
        if (on) {
          stop.current?.();
          stop.current = null;
          setOn(false);
        } else {
          stop.current = startWhistle();
          setOn(true);
        }
      }}
      className={`flex min-h-28 flex-col items-center justify-center gap-2 rounded-[6px] border p-3 text-center text-[17px] font-extrabold active:opacity-85 ${
        on ? 'border-orange-500 bg-orange-900 text-orange-100' : 'border-night-line bg-night-2'
      }`}
    >
      {on ? <VolumeX size={30} /> : <Megaphone size={30} />}
      {on ? 'Düdüğü durdur' : 'Düdük'}
    </button>
  );
}
