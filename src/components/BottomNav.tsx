'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, BookOpen, House, Info, Toolbox } from 'lucide-react';
import { isTabRoute } from './routes';

const ITEMS = [
  { href: '/', label: 'Ana Sayfa', Icon: House },
  { href: '/depremler', label: 'Depremler', Icon: Activity },
  { href: '/ogren', label: 'Öğren', Icon: BookOpen },
  { href: '/araclar', label: 'Araçlar', Icon: Toolbox },
  { href: '/hakkinda', label: 'Hakkında', Icon: Info },
];

/** Normal moddaki alt menü (uygulamadaki sekmelerin aynısı). */
export default function BottomNav() {
  const path = usePathname();
  if (!isTabRoute(path)) return null;
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card">
      <div className="mx-auto grid max-w-2xl grid-cols-5">
        {ITEMS.map(({ href, label, Icon }) => {
          const on = path === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 py-2.5 text-xs ${on ? 'font-extrabold text-brand' : 'font-semibold text-ink'}`}
            >
              <Icon size={22} strokeWidth={on ? 2.4 : 2} />
              <span className="whitespace-nowrap">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
