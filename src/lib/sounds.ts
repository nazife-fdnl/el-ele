// Web'de sesler: oyun sesleri public/sounds içindeki küçük dosyalardan,
// düdük ve SOS tonu ise tarayıcının ses motoruyla (Web Audio) üretilir.

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

/** Sürekli bir düdük tonu. Döndürülen fonksiyon tonu durdurur. */
export function startWhistle(): () => void {
  const a = audio();
  if (!a) return () => {};
  const osc = a.createOscillator();
  const lfo = a.createOscillator();
  const lfoGain = a.createGain();
  const gain = a.createGain();
  osc.type = 'sine';
  osc.frequency.value = 3150;
  lfo.frequency.value = 6;
  lfoGain.gain.value = 18;
  lfo.connect(lfoGain).connect(osc.frequency);
  gain.gain.value = 0.0001;
  gain.gain.exponentialRampToValueAtTime(0.6, a.currentTime + 0.02);
  osc.connect(gain).connect(a.destination);
  osc.start();
  lfo.start();
  return () => {
    try {
      gain.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + 0.03);
      osc.stop(a.currentTime + 0.05);
      lfo.stop(a.currentTime + 0.05);
    } catch {
      // zaten durmuş
    }
  };
}

const cache: Record<string, HTMLAudioElement> = {};

/** public/sounds/<ad>.wav dosyasını çalar. loop=true ise durdurma fonksiyonu döner. */
export function playFile(name: string, loop = false): () => void {
  if (typeof window === 'undefined') return () => {};
  const el = cache[name] ?? (cache[name] = new Audio(`/sounds/${name}.wav`));
  el.loop = loop;
  try {
    el.currentTime = 0;
  } catch {
    // yok say
  }
  el.play().catch(() => {});
  return () => {
    el.pause();
  };
}
