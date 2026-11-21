'use client';

import { useEffect, useRef, useState } from 'react';
import { Back, Page } from '@/components/ui';
import { MORSE_UNIT_MS, SOS_PATTERN } from '@/lib/morse';
import { startWhistle } from '@/lib/sounds';

type Mode = 'steady' | 'sos';

// Telefonun flaşı: sadece bazı Android tarayıcılar (Chrome) izin veriyor.
// Desteklenmezse ekran ışığı kullanılır.
async function openTorch(): Promise<MediaStreamTrack | null> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    const track = stream.getVideoTracks()[0];
    const caps = (track.getCapabilities?.() ?? {}) as { torch?: boolean };
    if (!caps.torch) {
      track.stop();
      return null;
    }
    return track;
  } catch {
    return null;
  }
}

function setTorch(track: MediaStreamTrack | null, on: boolean) {
  if (!track) return;
  track.applyConstraints({ advanced: [{ torch: on } as MediaTrackConstraintSet] }).catch(() => {});
}

/** Fener: ekran ışığı (ve destekleyen telefonlarda flaş) ile sürekli ışık ya da SOS (··· −−− ···). */
export default function Fener() {
  const [mode, setMode] = useState<Mode>('sos');
  const [running, setRunning] = useState(false);
  const [lit, setLit] = useState(false);
  const [sound, setSound] = useState(false);
  const [torchState, setTorchState] = useState<'unknown' | 'on' | 'none'>('unknown');
  const torch = useRef<MediaStreamTrack | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stopSound = useRef<(() => void) | null>(null);
  const wake = useRef<{ release: () => Promise<void> } | null>(null);

  // Yanıp sönme döngüsü
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (!running) {
      setLit(false);
      return;
    }
    if (mode === 'steady') {
      setLit(true);
      return;
    }
    let i = 0;
    const step = () => {
      const p = SOS_PATTERN[i];
      setLit(p.on);
      i = (i + 1) % SOS_PATTERN.length;
      timer.current = setTimeout(step, p.units * MORSE_UNIT_MS);
    };
    step();
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [running, mode]);

  // Flaş ve ses ışıkla birlikte
  useEffect(() => {
    setTorch(torch.current, running && lit);
    if (running && lit && sound) {
      if (!stopSound.current) stopSound.current = startWhistle();
    } else {
      stopSound.current?.();
      stopSound.current = null;
    }
  }, [lit, running, sound]);

  useEffect(
    () => () => {
      stopSound.current?.();
      torch.current?.stop();
      wake.current?.release().catch(() => {});
    },
    []
  );

  async function start() {
    setRunning(true);
    try {
      wake.current = await (navigator as unknown as { wakeLock?: { request: (t: string) => Promise<{ release: () => Promise<void> }> } }).wakeLock?.request('screen') ?? null;
    } catch {
      // ekranı açık tutamasak da devam
    }
    if (torchState === 'unknown') {
      torch.current = await openTorch();
      setTorchState(torch.current ? 'on' : 'none');
    }
  }

  function stop() {
    setRunning(false);
    wake.current?.release().catch(() => {});
    wake.current = null;
  }

  const seg = (on: boolean) => `min-h-13 flex-1 rounded-[4px] py-3 text-[17px] font-bold ${on ? 'bg-white text-night' : 'text-zinc-400'}`;

  return (
    <Page dark>
      <Back dark />
      <h1 className="text-[26px] font-extrabold">Fener</h1>
      <div className="flex gap-1 rounded-[6px] border border-night-line bg-night-2 p-1">
        <button type="button" className={seg(mode === 'steady')} onClick={() => setMode('steady')}>Sürekli yak</button>
        <button type="button" className={seg(mode === 'sos')} onClick={() => setMode('sos')}>SOS sinyali</button>
      </div>
      <div className="flex flex-col items-center gap-5 py-6">
        <button
          type="button"
          onClick={running ? stop : start}
          className={`flex h-56 w-56 flex-col items-center justify-center rounded-full border-8 text-white ${running ? 'border-red-200 bg-red-600' : 'border-night-line bg-night-2'}`}
        >
          <span className="text-5xl font-black tracking-widest">{mode === 'sos' ? 'SOS' : 'IŞIK'}</span>
          <span className="mt-1 text-[15px] font-semibold text-zinc-300">{running ? 'Durdurmak için dokun' : 'Başlatmak için dokun'}</span>
        </button>
        <p className="max-w-xs text-center text-[15px] text-zinc-400">
          {mode === 'sos' ? '··· −−− ··· tekrar tekrar yanıp söner. Kurtarma ekipleri bu sinyali tanır.' : 'Ekran tam parlaklıkta beyaz yanar. Pil tüketimini artırır.'}
        </p>
      </div>
      <label className="flex items-center justify-between gap-3 rounded-[6px] border border-night-line bg-night-2 p-4">
        <span>
          <span className="block text-[17px] font-bold">Düdük sesiyle birlikte</span>
          <span className="block text-[13px] text-zinc-400">Işıkla aynı anda yüksek düdük sesi çalar</span>
        </span>
        <input type="checkbox" checked={sound} onChange={(e) => setSound(e.target.checked)} className="h-6 w-6" />
      </label>
      <p className="text-[13px] text-zinc-500">
        {torchState === 'on'
          ? 'Telefonunun flaşı da kullanılıyor.'
          : 'Web sitesinde ekran ışığı kullanılır; çoğu telefonda tarayıcı flaşa erişemez. Gerçek fener için El Ele uygulamasını kullan.'}
      </p>

      {running ? (
        <button
          type="button"
          onClick={stop}
          aria-label="Işığı kapat"
          className="fixed inset-0 z-[60] flex items-end justify-center pb-16 text-lg font-bold"
          style={{ background: lit ? '#FFFFFF' : '#000000', color: lit ? '#000' : '#71717A' }}
        >
          Kapatmak için dokun
        </button>
      ) : null}
    </Page>
  );
}
