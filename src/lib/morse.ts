// Mors kodu yardımcıları: fenerin SOS modunda yanıp sönme düzenini üretir.
// Standart oranlar: nokta = 1 birim, çizgi = 3 birim, işaretler arası 1,
// harfler arası 3, tekrarlar arası 7 birim karanlık.

/** Bir birimin süresi. Kamera flaşı her telefonda anında açılıp kapanmadığı
 * için biraz yavaş tutuyoruz; sinyal yine de net okunur. */
export const MORSE_UNIT_MS = 300;

export type Pulse = { on: boolean; units: number };

const CODE: Record<string, string> = {
  S: '...',
  O: '---',
  H: '....',
  E: '.',
  L: '.-..',
  P: '.--.',
};

export function buildPattern(word: string): Pulse[] {
  const out: Pulse[] = [];
  const letters = word.toUpperCase().split('').filter((ch) => CODE[ch]);
  letters.forEach((ch, li) => {
    const code = CODE[ch];
    code.split('').forEach((sym, si) => {
      out.push({ on: true, units: sym === '.' ? 1 : 3 });
      if (si < code.length - 1) out.push({ on: false, units: 1 });
    });
    if (li < letters.length - 1) out.push({ on: false, units: 3 });
  });
  out.push({ on: false, units: 7 });
  return out;
}

export const SOS_PATTERN = buildPattern('SOS');
