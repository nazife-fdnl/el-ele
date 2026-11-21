'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import * as Icons from 'lucide-react';
import { Check, CircleAlert, CircleCheck, CirclePlay, Heart, Lock, ShieldCheck, Star, Volume2, VolumeX } from 'lucide-react';
import { Back, Button, Page, Section, Title } from '@/components/ui';
import { Backdrop, Character, Pose, SceneObject, SpotLabel } from '@/components/game/SceneArt';
import { CollectLevel, LEVELS, Level, ReachLevel, SequenceLevel, Spot, Stars, getStars, isUnlocked, saveStars } from '@/lib/oyun';
import { playFile } from '@/lib/sounds';
import AsyncStorage from '@/lib/asyncStorage';

const CHOOSE_MS = 5000;
const HOLD_MS = 3000;
const HOLD_GRACE_MS = 2500;
const MUTE_KEY = 'elele_oyun_ses_kapali';

interface Outcome {
  won: boolean;
  stars: number;
  text: string;
}

// ------------------------------------------------------------- sesler
function useSfx() {
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(false);
  const stopQuake = useRef<(() => void) | null>(null);
  useEffect(() => {
    AsyncStorage.getItem(MUTE_KEY).then((v) => {
      mutedRef.current = v === '1';
      setMuted(v === '1');
    });
    return () => stopQuake.current?.();
  }, []);
  const play = (n: string) => {
    if (!mutedRef.current) playFile(n);
  };
  return {
    muted,
    toggle: () => {
      mutedRef.current = !mutedRef.current;
      setMuted(mutedRef.current);
      if (mutedRef.current) stopQuake.current?.();
      AsyncStorage.setItem(MUTE_KEY, mutedRef.current ? '1' : '0');
    },
    quakeStart: () => {
      if (!mutedRef.current) stopQuake.current = playFile('deprem', true);
      navigator.vibrate?.(Array.from({ length: 20 }, (_, i) => (i % 2 ? 60 : 200)));
    },
    quakeStop: () => {
      stopQuake.current?.();
      stopQuake.current = null;
      navigator.vibrate?.(0);
    },
    beep: () => play('bip'),
    success: () => play('basari'),
    fail: () => play('uyari'),
  };
}
type Sfx = ReturnType<typeof useSfx>;

function useSceneSize() {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ W: number; H: number } | null>(null);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => {
      const W = Math.round(e.contentRect.width);
      setSize((s) => (s && s.W === W ? s : { W, H: Math.round(W * 1.05) }));
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return { ref, size };
}

function Intro({ text, onStart }: { text: string; onStart: () => void }) {
  return (
    <div className="absolute inset-0 z-20 flex items-center bg-ink/55 p-4">
      <div className="flex w-full flex-col gap-4 rounded-[6px] bg-card p-4">
        <p className="text-[17px] leading-relaxed">{text}</p>
        <Button variant="brand" onClick={onStart}>Başla</Button>
      </div>
    </div>
  );
}

// ------------------------------------------------------------- ulaş bölümü
function ReachGame({ level, onFinish, sfx }: { level: ReachLevel; onFinish: (o: Outcome) => void; sfx: Sfx }) {
  const { ref, size } = useSceneSize();
  const [phase, setPhase] = useState<'intro' | 'count' | 'shake' | 'moving' | 'hold' | 'done'>('intro');
  const [count, setCount] = useState(3);
  const [pose, setPose] = useState<Pose>(level.start.lying ? 'lying' : 'stand');
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: level.start.x, y: level.start.y });
  const [broken, setBroken] = useState<string | null>(null);
  const [chooseRun, setChooseRun] = useState(false);
  const [holding, setHolding] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const t0 = useRef(0);
  const reaction = useRef(0);
  const done = useRef(false);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const holdStarted = useRef(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const later = (fn: () => void, ms: number) => timers.current.push(setTimeout(fn, ms));
  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      sfx.quakeStop();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  function end(o: Outcome) {
    if (done.current) return;
    done.current = true;
    timers.current.forEach(clearTimeout);
    if (holdTimer.current) clearTimeout(holdTimer.current);
    sfx.quakeStop();
    setPhase('done');
    setTimeout(() => onFinish(o), 700);
  }

  function begin() {
    setPhase('count');
    setCount(3);
    sfx.beep();
    later(() => { setCount(2); sfx.beep(); }, 800);
    later(() => { setCount(1); sfx.beep(); }, 1600);
    later(() => {
      setCount(0);
      setPhase('shake');
      t0.current = Date.now();
      sfx.quakeStart();
      requestAnimationFrame(() => setChooseRun(true));
      later(() => {
        if (phaseRef.current === 'shake') {
          setPose('hurt');
          end({ won: false, stars: 0, text: 'Donup kaldın ve sarsıntıda düştün! Deprem başlar başlamaz hemen güvenli bir yere geçmelisin.' });
        }
      }, CHOOSE_MS);
    }, 2400);
  }

  function choose(s: Spot) {
    if (phase !== 'shake') return;
    reaction.current = (Date.now() - t0.current) / 1000;
    setPhase('moving');
    const isBed = !!level.start.lying && s.kind === 'bed';
    if (!isBed) {
      if (pose === 'lying') setPose('stand');
      setPos({ x: s.x + s.w / 2, y: Math.min(Math.max(s.y + s.h, 0.62), 0.95) });
    }
    later(() => {
      if (s.safe) {
        setPose(isBed ? 'lying' : 'crouch');
        setPhase('hold');
        later(() => {
          if (!holdStarted.current) end({ won: false, stars: 0, text: level.holdFail });
        }, HOLD_GRACE_MS);
      } else {
        setBroken(s.id);
        later(() => setPose('hurt'), 350);
        end({ won: false, stars: 0, text: s.fail ?? 'Bu güvenli bir yer değildi.' });
      }
    }, isBed ? 150 : 560);
  }

  function holdIn() {
    if (phase !== 'hold' || done.current) return;
    holdStarted.current = true;
    setHolding(true);
    navigator.vibrate?.(40);
    holdTimer.current = setTimeout(() => {
      const r = reaction.current;
      end({ won: true, stars: r < 1.6 ? 3 : r < 3 ? 2 : 1, text: `${level.success} Tepki süren: ${r.toFixed(1).replace('.', ',')} saniye.` });
    }, HOLD_MS);
  }

  function holdOut() {
    if (phase !== 'hold' || done.current) return;
    if (holdTimer.current) clearTimeout(holdTimer.current);
    setHolding(false);
    end({ won: false, stars: 0, text: level.holdFail });
  }

  const night = level.scene === 'yatak';
  const shaking = phase === 'shake' || phase === 'moving' || phase === 'hold';

  return (
    <div className="flex flex-col gap-3">
      <div className="min-h-12">
        {phase === 'shake' ? (
          <>
            <p className="text-[17px] font-extrabold text-brand">DEPREM! Güvenli yere dokun</p>
            <div className="mt-1.5 h-2 overflow-hidden rounded-[2px] bg-soft">
              <div className="h-2 bg-brand" style={{ width: chooseRun ? '0%' : '100%', transition: chooseRun ? `width ${CHOOSE_MS}ms linear` : 'none' }} />
            </div>
          </>
        ) : phase === 'hold' ? (
          <p className="text-[17px] font-extrabold text-brand">Sarsıntı sürüyor! Aşağıdaki düğmeye basılı tut</p>
        ) : (
          <p className="text-[17px] font-bold">{phase === 'count' ? 'Hazır ol...' : 'Doğru yeri seç'}</p>
        )}
      </div>
      <div ref={ref} className="relative overflow-hidden rounded-[6px] border border-line" style={{ height: size?.H ?? 360 }}>
        {size ? (
          <div className={`absolute inset-0 ${shaking ? 'quake' : ''}`}>
            <Backdrop scene={level.scene} />
            {level.spots.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => choose(s)}
                disabled={phase !== 'shake'}
                aria-label={s.label}
                className="absolute"
                style={{ left: s.x * size.W, top: s.y * size.H, width: s.w * size.W }}
              >
                <SceneObject kind={s.kind} w={s.w * size.W} h={s.h * size.H} shaking={shaking} broken={broken === s.id} night={night} />
              </button>
            ))}
            <div className="pointer-events-none absolute left-0 top-0" style={{ transform: `translate(${pos.x * size.W - 15}px, ${pos.y * size.H - 62}px)`, transition: 'transform .55s ease-out' }}>
              <Character pose={pose} />
            </div>
            {phase === 'shake' ? level.spots.map((s) => <SpotLabel key={`l-${s.id}`} text={s.label} dark={night} spot={s} W={size.W} H={size.H} />) : null}
            {phase === 'count' ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/25 text-6xl font-black text-white">
                {count > 0 ? count : 'DEPREM!'}
              </div>
            ) : null}
          </div>
        ) : null}
        {phase === 'intro' ? <Intro text={level.intro} onStart={begin} /> : null}
      </div>
      {phase === 'hold' ? (
        <button
          type="button"
          onPointerDown={holdIn}
          onPointerUp={holdOut}
          onPointerLeave={() => holding && holdOut()}
          onContextMenu={(e) => e.preventDefault()}
          className="relative flex min-h-24 select-none flex-col items-center justify-center overflow-hidden rounded-[6px] bg-ink text-white"
        >
          <span className="absolute inset-y-0 left-0 bg-ok" style={{ width: holding ? '100%' : '0%', transition: holding ? `width ${HOLD_MS}ms linear` : 'none' }} />
          <span className="relative text-[26px] font-black tracking-wide">{level.holdLabel}</span>
          <span className="relative text-[13px] text-zinc-200">Sarsıntı bitene kadar basılı tut</span>
        </button>
      ) : null}
    </div>
  );
}

// ------------------------------------------------------------- sıra bölümü
function SequenceGame({ level, onFinish, sfx }: { level: SequenceLevel; onFinish: (o: Outcome) => void; sfx: Sfx }) {
  const { ref, size } = useSceneSize();
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState<string[]>([]);
  const [over, setOver] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const dark = level.scene === 'enkaz';

  function tap(s: Spot) {
    if (!started || over || done.includes(s.id)) return;
    if (s.fail) {
      setOver(true);
      setFlash(s.kind === 'match' || s.kind === 'switch' ? '#F97316' : '#78716C');
      setTimeout(() => onFinish({ won: false, stars: 0, text: s.fail ?? '' }), 650);
      return;
    }
    if (level.finals.includes(s.id)) {
      const perfect = level.steps.slice(0, -1).every((x) => done.includes(x));
      setDone((d) => [...d, s.id]);
      setOver(true);
      setFlash(dark ? '#FDE68A' : '#86EFAC');
      setTimeout(() => onFinish({ won: true, stars: perfect ? 3 : 2, text: perfect ? level.success : level.earlyNote }), 650);
      return;
    }
    if (level.steps.includes(s.id)) {
      setDone((d) => [...d, s.id]);
      sfx.beep();
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="min-h-12 text-[17px] font-bold">
        {done.length === 0 ? 'Ne yaparsın? Bir hamle seç.' : `Güzel! Sıradaki hamle? (${done.length} / ${level.steps.length})`}
      </p>
      <div ref={ref} className="relative overflow-hidden rounded-[6px] border border-line" style={{ height: size?.H ?? 360 }}>
        {size ? (
          <>
            <Backdrop scene={level.scene} />
            {level.spots.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => tap(s)}
                disabled={!started || over}
                aria-label={s.label}
                className="absolute"
                style={{ left: s.x * size.W, top: s.y * size.H, width: s.w * size.W, opacity: done.includes(s.id) ? 0.55 : 1 }}
              >
                <SceneObject kind={s.kind} w={s.w * size.W} h={s.h * size.H} shaking={false} broken={false} />
                {done.includes(s.id) ? (
                  <span className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-ok text-white"><Check size={18} strokeWidth={3} /></span>
                ) : null}
              </button>
            ))}
            {started ? level.spots.map((s) => <SpotLabel key={`l-${s.id}`} text={s.label} dark={dark} spot={s} W={size.W} H={size.H} />) : null}
            {dark ? (
              <div className="pointer-events-none absolute" style={{ left: size.W * 0.42, top: size.H * 0.36 }}>
                <Character pose="crouch" />
              </div>
            ) : null}
            <div className="pointer-events-none absolute inset-0" style={{ background: flash ?? 'transparent', opacity: flash ? 0.7 : 0, transition: 'opacity .3s' }} />
          </>
        ) : null}
        {!started ? <Intro text={level.intro} onStart={() => setStarted(true)} /> : null}
      </div>
      {started && !over ? <p className="text-center text-[13px] text-muted">İpucu yok, kendin bul! Yanlış hamle bölümü bitirir.</p> : null}
    </div>
  );
}

// ------------------------------------------------------------- çanta bölümü
function CollectGame({ level, onFinish, sfx }: { level: CollectLevel; onFinish: (o: Outcome) => void; sfx: Sfx }) {
  const items = useMemo(() => [...level.items].sort(() => Math.random() - 0.5), [level]);
  const goodCount = level.items.filter((i) => i.good).length;
  const [started, setStarted] = useState(false);
  const [packed, setPacked] = useState<string[]>([]);
  const [hearts, setHearts] = useState(3);
  const [toast, setToast] = useState<string | null>(null);
  const [over, setOver] = useState(false);
  const [bump, setBump] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  function begin() {
    setStarted(true);
    timer.current = setTimeout(() => {
      setOver(true);
      onFinish({ won: false, stars: 0, text: 'Süre doldu! Deprem ne zaman olacağını haber vermez; çantanı önceden hazırla.' });
    }, level.seconds * 1000);
  }

  function pick(id: string) {
    if (!started || over || packed.includes(id)) return;
    const it = level.items.find((i) => i.id === id)!;
    if (it.good) {
      const next = [...packed, id];
      setPacked(next);
      setBump((b) => b + 1);
      sfx.beep();
      if (next.length === goodCount) {
        if (timer.current) clearTimeout(timer.current);
        setOver(true);
        setTimeout(() => onFinish({ won: true, stars: hearts, text: level.success }), 400);
      }
    } else {
      const left = hearts - 1;
      setHearts(left);
      setToast(it.why);
      navigator.vibrate?.(120);
      setTimeout(() => setToast(null), 2200);
      if (left > 0) sfx.fail();
      if (left <= 0) {
        if (timer.current) clearTimeout(timer.current);
        setOver(true);
        setTimeout(() => onFinish({ won: false, stars: 0, text: 'Çantana gereksiz şeyler koydun ve çok ağırlaştı. Sadece gerçekten işe yarayacakları seç.' }), 600);
      }
    }
  }

  return (
    <div className="relative flex flex-col gap-3">
      <div className="flex items-center gap-3.5">
        <div key={bump} className="pop flex h-20 w-20 flex-col items-center justify-center rounded-[6px] bg-amber-700 text-white">
          <Icons.Backpack size={36} />
          <span className="text-sm font-extrabold">{packed.length} / {goodCount}</span>
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex gap-0.5">
            {[0, 1, 2].map((i) => <Heart key={i} size={24} className={i < hearts ? 'fill-brand text-brand' : 'text-brand'} />)}
          </div>
          <div className="h-2 overflow-hidden rounded-[2px] bg-soft">
            <div className="h-2 bg-brand" style={{ width: started ? '0%' : '100%', transition: started ? `width ${level.seconds}s linear` : 'none' }} />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {items.map((it) => {
          const done = packed.includes(it.id);
          const Ico = ((Icons as unknown as Record<string, Icons.LucideIcon>)[it.icon] ?? Icons.Package) as Icons.LucideIcon;
          return (
            <button
              key={it.id}
              type="button"
              onClick={() => pick(it.id)}
              disabled={!started || over || done}
              className={`flex aspect-square flex-col items-center justify-center gap-1.5 rounded-[6px] border p-1 text-center ${done ? 'border-ok bg-ok-soft' : 'border-line bg-card'}`}
            >
              {done ? <Check size={32} className="text-ok" /> : <Ico size={32} />}
              <span className="text-[13px] font-bold">{it.label}</span>
            </button>
          );
        })}
      </div>
      {toast ? <p className="rounded-[6px] bg-ink p-3 text-[15px] text-white">{toast}</p> : null}
      {!started ? <Intro text={level.intro} onStart={begin} /> : null}
    </div>
  );
}

// ------------------------------------------------------------- bir bölüm
function Game({ level, onWin }: { level: Level; onWin: (n: number) => void }) {
  const router = useRouter();
  const sfx = useSfx();
  const [round, setRound] = useState(0);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const next = LEVELS.find((l) => l.no === level.no + 1);

  const finish = useCallback(
    (o: Outcome) => {
      setOutcome(o);
      sfx.quakeStop();
      if (o.won) {
        sfx.success();
        onWin(o.stars);
      } else sfx.fail();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onWin]
  );

  return (
    <Page>
      <div className="flex items-center gap-2">
        <Back href="/oyun" />
        <p className="flex-1 truncate text-[17px] font-extrabold">{level.no}. {level.title}</p>
        <span className="rounded-[4px] border border-brand px-1.5 py-0.5 text-xs font-extrabold text-brand">{level.phase.toLocaleUpperCase('tr-TR')}</span>
        <button type="button" onClick={sfx.toggle} aria-label={sfx.muted ? 'Sesi aç' : 'Sesi kapat'} className="p-2">
          {sfx.muted ? <VolumeX size={22} /> : <Volume2 size={22} />}
        </button>
      </div>
      {level.type === 'reach' ? <ReachGame key={round} level={level} onFinish={finish} sfx={sfx} /> : null}
      {level.type === 'sequence' ? <SequenceGame key={round} level={level} onFinish={finish} sfx={sfx} /> : null}
      {level.type === 'collect' ? <CollectGame key={round} level={level} onFinish={finish} sfx={sfx} /> : null}

      {outcome ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-t-[8px] bg-card p-4">
            <div className="flex items-center gap-2.5">
              {outcome.won ? <ShieldCheck size={34} className="text-ok" /> : <CircleAlert size={34} className="text-brand" />}
              <p className={`text-2xl font-black ${outcome.won ? 'text-ok' : 'text-brand'}`}>{outcome.won ? 'Güvendesin!' : 'Dikkat!'}</p>
              {outcome.won ? (
                <span className="ml-auto flex">
                  {[1, 2, 3].map((i) => <Star key={i} size={26} className={i <= outcome.stars ? 'fill-amber-400 text-amber-400' : 'text-amber-400'} />)}
                </span>
              ) : null}
            </div>
            <p className="mt-3 text-[17px] leading-relaxed">{outcome.text}</p>
            <div className="mt-3 border-l-4 border-ok bg-paper p-3">
              <p className="text-[13px] font-extrabold text-ok">Doğrusu</p>
              <p className="mt-1 text-[15px] leading-relaxed">{level.lesson}</p>
            </div>
            <div className="mt-3 flex flex-col gap-2">
              {outcome.won && next ? <Button variant="brand" onClick={() => router.replace(`/oyun?bolum=${next.id}`)}>Sonraki bölüm: {next.title}</Button> : null}
              <Button onClick={() => { setOutcome(null); setRound((r) => r + 1); }}>{outcome.won ? 'Tekrar oyna' : 'Tekrar dene'}</Button>
              <Button variant="outline" onClick={() => router.replace('/oyun')}>Tüm bölümler</Button>
            </div>
          </div>
        </div>
      ) : null}
    </Page>
  );
}

// ------------------------------------------------------------- bölüm listesi
function Oyun() {
  const params = useSearchParams();
  const [stars, setStars] = useState<Stars>({});
  useEffect(() => {
    getStars().then(setStars);
  }, [params]);
  const level = LEVELS.find((l) => l.id === params.get('bolum'));
  const onWin = useCallback(async (n: number) => {
    if (level) setStars(await saveStars(level.id, n));
  }, [level]);

  if (level) return <Game key={level.id} level={level} onWin={onWin} />;

  return (
    <Page>
      <Back />
      <Title sub="Deprem öncesi, anı ve sonrası için 6 bölüm. Her bölümde doğru hamleyi yap, yıldızları topla.">Depremde Ne Yaparsın?</Title>
      {(['Önce', 'Anında', 'Sonra'] as const).map((phase) => (
        <div key={phase} className="flex flex-col gap-2">
          <Section>{phase === 'Önce' ? 'DEPREMDEN ÖNCE' : phase === 'Anında' ? 'DEPREM ANINDA' : 'DEPREMDEN SONRA'}</Section>
          {LEVELS.filter((l) => l.phase === phase).map((l) => {
            const got = stars[l.id] ?? 0;
            const open = isUnlocked(l.id, stars);
            const inner = (
              <>
                <span className={`flex h-10 w-10 items-center justify-center rounded-[4px] font-extrabold ${got > 0 ? 'bg-ok text-white' : open ? 'bg-brand text-white' : 'bg-soft text-muted'}`}>{l.no}</span>
                <span className="flex-1">
                  <span className={`block text-[17px] font-extrabold ${open ? '' : 'text-muted'}`}>{l.title}</span>
                  <span className="mt-0.5 flex gap-0.5">
                    {[1, 2, 3].map((i) => <Star key={i} size={16} className={i <= got ? 'fill-amber-400 text-amber-400' : 'text-line'} />)}
                  </span>
                </span>
                {got > 0 ? <CircleCheck className="text-ok" /> : open ? <CirclePlay className="text-brand" /> : <Lock className="text-muted" />}
              </>
            );
            return open ? (
              <Link key={l.id} href={`/oyun?bolum=${l.id}`} className="flex items-center gap-3.5 rounded-[6px] border border-line bg-card p-4 active:opacity-85">{inner}</Link>
            ) : (
              <div key={l.id} className="flex items-center gap-3.5 rounded-[6px] border border-line bg-paper p-4">{inner}</div>
            );
          })}
        </div>
      ))}
    </Page>
  );
}

export default function OyunPage() {
  return (
    <Suspense fallback={null}>
      <Oyun />
    </Suspense>
  );
}
