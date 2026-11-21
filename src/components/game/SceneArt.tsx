// Oyun sahnelerinin çizimleri (uygulamadaki SceneArt'ın web hali): resim
// dosyası yok, basit şekiller. "broken" true olunca tehlike canlanır.
import { Flame, Megaphone, Shirt } from 'lucide-react';
import type { ObjKind, SceneKind } from '@/lib/oyun';

const C = { wood: '#8B5E3C', woodDark: '#6B4A2E', glass: '#BFE3F5', frame: '#7A5A3C', skin: '#F1C27D', shirt: '#1D4ED8', pants: '#1F2937' };

export function Backdrop({ scene }: { scene: SceneKind }) {
  if (scene === 'sokak') {
    return (
      <div className="absolute inset-0 flex flex-col">
        <div className="flex-1" style={{ background: '#CFE3F3' }} />
        <div style={{ height: '6%', background: '#D1D5DB' }} />
        <div style={{ height: '10%', background: '#6B7280' }} />
      </div>
    );
  }
  if (scene === 'enkaz') {
    const blocks = [
      { l: '-6%', t: '-4%', w: '46%', h: '16%', r: -8 },
      { l: '50%', t: '-6%', w: '60%', h: '18%', r: 6 },
      { l: '-10%', t: '36%', w: '22%', h: '20%', r: 12 },
      { l: '86%', t: '30%', w: '24%', h: '26%', r: -10 },
      { l: '-4%', t: '86%', w: '110%', h: '20%', r: 0 },
    ];
    return (
      <div className="absolute inset-0" style={{ background: '#24211E' }}>
        {blocks.map((b, i) => (
          <div key={i} className="absolute" style={{ left: b.l, top: b.t, width: b.w, height: b.h, background: i % 2 ? '#57534E' : '#78716C', transform: `rotate(${b.r}deg)` }} />
        ))}
      </div>
    );
  }
  const wall = scene === 'yatak' ? '#2E3650' : scene === 'mutfak' ? '#E3ECEF' : '#ECE6DC';
  const floor = scene === 'yatak' ? '#4A3B30' : scene === 'mutfak' ? '#A3A9B3' : '#B98C5C';
  return (
    <div className="absolute inset-0 flex flex-col">
      <div className="flex-1" style={{ background: wall }} />
      <div style={{ height: 6, background: scene === 'yatak' ? '#1F2433' : '#8C6A45' }} />
      <div style={{ height: '16%', background: floor }} />
    </div>
  );
}

const fallT = 'transform 0.65s cubic-bezier(.55,0,1,.45)';

export function SceneObject({ kind, w, h, shaking, broken, night }: { kind: ObjKind; w: number; h: number; shaking: boolean; broken: boolean; night?: boolean }) {
  switch (kind) {
    case 'table':
      return (
        <div style={{ width: w, height: h }} className="flex flex-col">
          <div style={{ height: h * 0.16, background: C.wood, borderRadius: 2 }} />
          <div className="flex flex-1 justify-between" style={{ padding: `0 ${w * 0.06}px` }}>
            <div style={{ width: Math.max(6, w * 0.07), background: C.woodDark }} />
            <div style={{ width: Math.max(6, w * 0.07), background: C.woodDark }} />
          </div>
        </div>
      );
    case 'window':
      return (
        <div className="relative" style={{ width: w, height: h, border: `5px solid ${C.frame}`, background: night ? '#1E2A44' : C.glass }}>
          {night ? <div className="absolute rounded-full" style={{ right: '18%', top: '16%', width: 18, height: 18, background: '#F5F0D0' }} /> : null}
          <div className="absolute inset-y-0" style={{ left: '48%', width: 4, background: C.frame }} />
          <div className="absolute inset-x-0" style={{ top: '48%', height: 4, background: C.frame }} />
          <div className="absolute inset-0" style={{ opacity: broken ? 1 : 0, transition: 'opacity .4s' }}>
            {[
              ['20%', '30%', 35, '60%'],
              ['10%', '60%', -25, '70%'],
              ['40%', '20%', 80, '50%'],
              ['30%', '50%', 15, '45%'],
            ].map(([l, t, r, wd], i) => (
              <div key={i} className="absolute" style={{ left: l as string, top: t as string, width: wd as string, height: 2, background: '#fff', transform: `rotate(${r}deg)` }} />
            ))}
          </div>
        </div>
      );
    case 'shelf':
    case 'wardrobe':
      return (
        <div style={{ transformOrigin: 'bottom left', transform: broken ? 'rotate(-78deg)' : 'none', transition: fallT }}>
          <div
            className={shaking && !broken ? 'wobble' : ''}
            style={{ width: w, height: h, background: kind === 'shelf' ? C.wood : '#7B5A40', border: `2px solid ${C.woodDark}`, transformOrigin: 'bottom center', display: 'flex', flexDirection: kind === 'shelf' ? 'column' : 'row' }}
          >
            {kind === 'shelf'
              ? [0, 1, 2, 3].map((i) => (
                  <div key={i} className="flex flex-1 items-end gap-0.5 px-1" style={{ borderBottom: `3px solid ${C.woodDark}` }}>
                    {['#C2410C', '#1D4ED8', '#15803D', '#CA8A04', '#7C3AED'].slice(0, 3 + (i % 3)).map((col, j) => (
                      <div key={j} style={{ width: Math.max(4, w * 0.12), height: '70%', background: col }} />
                    ))}
                  </div>
                ))
              : (
                <>
                  <div className="flex-1" style={{ borderRight: `2px solid ${C.woodDark}` }} />
                  <div className="flex-1" />
                </>
              )}
          </div>
        </div>
      );
    case 'door':
      return (
        <div className="relative" style={{ width: w, height: h, background: night ? '#5A4030' : '#7A5230', border: '3px solid #5A3C22' }}>
          <div className="absolute" style={{ inset: '14%', border: '2px solid #5A3C22' }} />
          <div className="absolute rounded-full" style={{ right: 6, top: '50%', width: 7, height: 7, background: '#E5C07B' }} />
        </div>
      );
    case 'bed':
      return (
        <div className="relative flex flex-col justify-end" style={{ width: w, height: h }}>
          <div className="absolute bottom-0 left-0" style={{ width: 8, height: h, background: '#5B4332' }} />
          <div className="ml-1.5 flex" style={{ height: h * 0.5, background: '#F3F4F6' }}>
            <div className="m-1 rounded" style={{ width: w * 0.2, background: '#fff' }} />
            <div className="flex-1" style={{ background: '#4F6D9A' }} />
          </div>
          <div style={{ height: h * 0.18, background: '#5B4332' }} />
        </div>
      );
    case 'building':
      return (
        <div className="relative" style={{ width: w, height: h, background: '#A8A29E', border: '2px solid #78716C' }}>
          {[0, 1, 2, 3].map((r) => (
            <div key={r} className="flex justify-around" style={{ marginTop: h * 0.05 }}>
              {[0, 1].map((c) => (
                <div key={c} style={{ width: w * 0.28, height: h * 0.11, background: '#BFE3F5', border: '2px solid #57534E' }} />
              ))}
            </div>
          ))}
          <div className="absolute" style={{ left: -4, right: -4, top: h * 0.33, height: 5, background: '#57534E' }} />
          <div className="absolute" style={{ left: -4, right: -4, top: h * 0.53, height: 5, background: '#57534E' }} />
          <div className="absolute bottom-0" style={{ left: '35%', width: '30%', height: '16%', background: '#44403C' }} />
          {[0.2, 0.55, 0.75].map((l, i) => (
            <div
              key={i}
              className="absolute"
              style={{ left: w * l, top: h * 0.1, width: 10, height: 8, background: '#57534E', opacity: broken ? 1 : 0, transform: broken ? `translateY(${h * 0.75}px) rotate(${i * 40}deg)` : 'none', transition: 'transform .65s ease-in, opacity .1s' }}
            />
          ))}
        </div>
      );
    case 'pole':
      return (
        <div style={{ width: w, height: h, transformOrigin: 'bottom center', transform: broken ? 'rotate(22deg)' : 'none', transition: fallT }}>
          <div className={`flex h-full flex-col items-center ${shaking && !broken ? 'wobble' : ''}`} style={{ transformOrigin: 'bottom center' }}>
            <div style={{ width: w * 1.6, height: 5, background: '#374151', marginTop: h * 0.06 }} />
            <div className="flex-1" style={{ width: Math.max(6, w * 0.22), background: '#4B5563' }} />
          </div>
        </div>
      );
    case 'park':
      return (
        <div className="relative flex flex-col justify-end" style={{ width: w, height: h }}>
          <div className="rounded" style={{ height: h * 0.55, background: '#86C77A' }} />
          <div className="absolute flex flex-col items-center" style={{ right: w * 0.08, bottom: h * 0.42 }}>
            <div className="rounded-full" style={{ width: h * 0.5, height: h * 0.5, background: '#3F8F4A' }} />
            <div style={{ width: 6, height: h * 0.18, background: '#6B4A2E' }} />
          </div>
        </div>
      );
    case 'stove':
      return (
        <div className="grid grid-cols-2 place-items-center gap-1.5 p-1.5" style={{ width: w, height: h, background: '#F9FAFB', border: '2px solid #9CA3AF' }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-full" style={{ width: w * 0.3, height: w * 0.3, border: '3px solid #1F2937' }} />
          ))}
        </div>
      );
    case 'valve':
      return (
        <div className="relative flex flex-col items-center" style={{ width: w, height: h }}>
          <div className="flex-1" style={{ width: 8, background: '#CA8A04' }} />
          <div className="absolute rounded-sm" style={{ top: '40%', width: w * 0.9, height: 8, background: '#DC2626' }} />
        </div>
      );
    case 'switch':
      return (
        <div className="flex items-center justify-center" style={{ width: w, height: h, background: '#fff', border: '2px solid #9CA3AF' }}>
          <div className="rounded-sm" style={{ width: '30%', height: '50%', background: '#D1D5DB' }} />
        </div>
      );
    case 'pipe':
      return <div className="rounded" style={{ width: w, height: h, background: '#9CA3AF', border: '2px solid #4B5563' }} />;
    case 'match':
      return <div className="flex items-center justify-center" style={{ width: w, height: h }}><Flame size={Math.min(w, h) * 0.8} color="#F97316" /></div>;
    case 'cloth':
      return <div className="flex items-center justify-center" style={{ width: w, height: h }}><Shirt size={Math.min(w, h) * 0.8} color="#E5E7EB" /></div>;
    case 'shout':
      return <div className="flex items-center justify-center" style={{ width: w, height: h }}><Megaphone size={Math.min(w, h) * 0.8} color="#E5E7EB" /></div>;
    case 'whistle':
      return (
        <div className="flex items-center justify-center" style={{ width: w, height: h }}>
          <div className="rounded-full" style={{ width: Math.min(w, h) * 0.55, height: Math.min(w, h) * 0.55, background: '#FACC15', border: '3px solid #A16207' }} />
        </div>
      );
    default:
      return null;
  }
}

export type Pose = 'stand' | 'crouch' | 'lying' | 'hurt';

export function Character({ pose }: { pose: Pose }) {
  const rotate = pose === 'lying' ? -90 : pose === 'hurt' ? 75 : 0;
  const squash = pose === 'crouch' ? 0.62 : 1;
  return (
    <div className="flex flex-col items-center justify-end" style={{ width: 30, height: 62 }}>
      <div className="relative flex flex-col items-center" style={{ transformOrigin: 'bottom center', transform: `rotate(${rotate}deg) scaleY(${squash})`, transition: 'transform .35s' }}>
        <div className="rounded-full" style={{ width: 16, height: 16, background: C.skin }} />
        {pose === 'crouch' ? <div className="absolute rounded-sm" style={{ top: -2, width: 22, height: 8, background: C.shirt }} /> : null}
        <div className="rounded-sm" style={{ width: 22, height: 24, background: C.shirt, marginTop: 1 }} />
        <div className="flex gap-[3px]">
          <div style={{ width: 8, height: 20, background: C.pants }} />
          <div style={{ width: 8, height: 20, background: C.pants }} />
        </div>
      </div>
    </div>
  );
}

export function SpotLabel({ text, dark, spot, W, H }: { text: string; dark?: boolean; spot: { x: number; y: number; w: number; h: number; labelAbove?: boolean }; W: number; H: number }) {
  const LW = 104;
  const cx = (spot.x + spot.w / 2) * W;
  const left = Math.min(Math.max(cx - LW / 2, 4), W - LW - 4);
  const below = (spot.y + spot.h) * H + 4;
  const above = Math.max(spot.y * H - 26, 4);
  const top = spot.labelAbove || below + 34 > H ? above : below;
  return (
    <div className="pointer-events-none absolute flex justify-center" style={{ left, top, width: LW }}>
      <span className="rounded-[3px] px-1.5 py-0.5 text-center text-xs font-extrabold" style={{ background: dark ? 'rgba(0,0,0,.65)' : 'rgba(255,255,255,.95)', color: dark ? '#fff' : '#111827' }}>
        {text}
      </span>
    </div>
  );
}
