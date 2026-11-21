import Link from 'next/link';
import { Backpack, Bell, Flashlight, Gamepad2, Map, MessageCircle, Siren, Store, type LucideIcon } from 'lucide-react';
import { Page, Section, Title } from '@/components/ui';

const EMERGENCY: { Icon: LucideIcon; name: string; sub: string; href: string; danger?: boolean }[] = [
  { Icon: Siren, name: 'Acil buton', sub: 'Yakınlarına konum + 112', href: '/acil', danger: true },
  { Icon: Flashlight, name: 'Fener / SOS', sub: 'Ekran ışığı ve düdük', href: '/fener' },
  { Icon: Store, name: 'Yakındakiler', sub: 'Market, bakkal, eczane', href: '/yakindakiler' },
  { Icon: Map, name: 'Canlı harita', sub: 'Yardım talepleri', href: '/harita' },
];
const MORE: { Icon: LucideIcon; name: string; sub: string; href: string }[] = [
  { Icon: Bell, name: 'Yardımcı paneli', sub: 'Gelen istekler', href: '/yardimci-paneli' },
  { Icon: Backpack, name: 'Deprem çantası', sub: 'Kontrol listesi', href: '/canta' },
  { Icon: Gamepad2, name: 'Deprem oyunu', sub: 'Önce · anında · sonra', href: '/oyun' },
  { Icon: MessageCircle, name: 'Konuşalım', sub: 'Destek sohbeti', href: '/konusalim' },
];

function Grid({ items }: { items: { Icon: LucideIcon; name: string; sub: string; href: string; danger?: boolean }[] }) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {items.map(({ Icon, name, sub, href, danger }) => (
        <Link
          key={name}
          href={href}
          className={`flex min-h-31 flex-col gap-1.5 rounded-[6px] border p-4 active:opacity-85 ${danger ? 'border-brand bg-brand text-white' : 'border-line bg-card'}`}
        >
          <Icon size={30} />
          <span className="mt-1 text-[17px] font-extrabold">{name}</span>
          <span className={`text-[14px] ${danger ? 'text-white' : 'text-muted'}`}>{sub}</span>
        </Link>
      ))}
    </div>
  );
}

/** Araçlar: tüm araçlara tek yerden ulaşım. */
export default function Araclar() {
  return (
    <Page tabs>
      <Title>Araçlar</Title>
      <Section>ACİL DURUM</Section>
      <Grid items={EMERGENCY} />
      <Section>YARDIMLAŞMA VE HAZIRLIK</Section>
      <Grid items={MORE} />
    </Page>
  );
}
