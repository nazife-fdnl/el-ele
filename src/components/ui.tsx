'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronRight, type LucideIcon } from 'lucide-react';

/** Sayfa gövdesi: ortalanmış, telefona uygun genişlik. tabs=true ise alt menü için boşluk bırakır. */
export function Page({
  children,
  tabs,
  dark,
  className = '',
}: {
  children: React.ReactNode;
  tabs?: boolean;
  dark?: boolean;
  className?: string;
}) {
  return (
    <main className={`flex-1 ${dark ? 'bg-night text-white' : 'bg-paper text-ink'}`}>
      <div className={`mx-auto flex w-full max-w-2xl flex-col gap-3 px-4 pt-4 ${tabs ? 'pb-28' : 'pb-10'} ${className}`}>
        {children}
      </div>
    </main>
  );
}

export function Back({ dark, href }: { dark?: boolean; href?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => (href ? router.push(href) : router.back())}
      className={`flex min-h-11 w-fit items-center gap-1.5 text-base font-semibold ${dark ? 'text-zinc-400' : 'text-muted'}`}
    >
      <ArrowLeft size={20} /> Geri
    </button>
  );
}

export function Title({ children, sub }: { children: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div>
      <h1 className="text-[26px] font-extrabold leading-tight">{children}</h1>
      {sub ? <p className="mt-1 text-[15px] leading-relaxed text-muted">{sub}</p> : null}
    </div>
  );
}

export function Section({ children }: { children: React.ReactNode }) {
  return <p className="mt-2 text-[13px] font-extrabold tracking-wider text-muted">{children}</p>;
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-[6px] border border-line bg-card p-4 ${className}`}>{children}</div>;
}

export function RowLink({
  href,
  Icon,
  title,
  sub,
  children,
}: {
  href: string;
  Icon: LucideIcon;
  title: string;
  sub?: string;
  children?: React.ReactNode;
}) {
  return (
    <Link href={href} className="block rounded-[6px] border border-line bg-card p-4 transition hover:bg-zinc-50 active:opacity-80">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[4px] bg-soft">
          <Icon size={22} />
        </span>
        <span className="flex-1">
          <span className="block text-[17px] font-extrabold">{title}</span>
          {sub ? <span className="mt-0.5 block text-[15px] text-muted">{sub}</span> : null}
        </span>
        <ChevronRight size={22} className="text-muted" />
      </div>
      {children}
    </Link>
  );
}

export function Button({
  children,
  onClick,
  variant = 'ink',
  disabled,
  className = '',
  type = 'button',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'ink' | 'brand' | 'ok' | 'outline' | 'night';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit';
}) {
  const styles: Record<string, string> = {
    ink: 'bg-ink text-white',
    brand: 'bg-brand text-white',
    ok: 'bg-ok text-white',
    outline: 'border border-line bg-card text-ink',
    night: 'border border-night-line bg-night-2 text-white',
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`flex min-h-14 w-full items-center justify-center gap-2 rounded-[6px] px-4 text-[17px] font-extrabold transition active:opacity-85 disabled:opacity-40 ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
