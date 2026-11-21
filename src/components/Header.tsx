'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { isDarkRoute } from './routes';

/** Üst çubuk. Normal modda açık, afet modu ve acil ekranlarında koyu. */
export default function Header() {
  const dark = isDarkRoute(usePathname());
  return (
    <header
      className={`sticky top-0 z-40 border-b ${
        dark ? 'bg-night border-night-line text-white' : 'bg-card border-line text-ink'
      }`}
    >
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="El Ele" width={32} height={32} className="rounded-[6px]" />
          <span className="text-lg font-extrabold">El Ele</span>
        </Link>
        <a
          href="tel:112"
          className={`rounded-[6px] border px-3 py-1.5 text-sm font-bold ${
            dark ? 'border-red-400 text-red-300' : 'border-brand text-brand'
          }`}
        >
          Acil: 112
        </a>
      </div>
    </header>
  );
}
