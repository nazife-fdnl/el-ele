'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Flashlight, HandHeart, Map, Siren, Store, Users } from 'lucide-react';
import { Page } from '@/components/ui';
import Whistle from '@/components/Whistle';
import { setAfetModu } from '@/lib/afetModu';

/** Afet modu: deprem anında sadece hayati düğmeler, büyük ve koyu ekranda. */
export default function AfetModu() {
  const router = useRouter();

  async function backToNormal() {
    await setAfetModu(false);
    router.push('/');
  }

  const tile = 'flex min-h-28 flex-col items-center justify-center gap-2 rounded-[6px] border border-night-line bg-night-2 p-3 text-center text-[17px] font-extrabold active:opacity-85';

  return (
    <Page dark>
      <div className="rounded-[6px] border border-red-800 bg-red-950/60 p-3 text-[15px]">
        <b className="text-red-300">HAYATİ TEHLİKE VARSA ÖNCE 112.</b>{' '}
        <span className="text-zinc-300">El Ele resmî bir acil durum hizmeti değildir; ek yardım içindir.</span>
      </div>
      <Link href="/ihtiyacim-var" className="flex min-h-44 flex-col items-center justify-center rounded-[6px] bg-red-600 p-4 text-center active:opacity-90">
        <span className="text-5xl">🆘</span>
        <span className="mt-2 text-[28px] font-extrabold">Yardıma İhtiyacım Var</span>
        <span className="text-[15px] text-red-100">Su, yiyecek, ilaç, kurtarma…</span>
      </Link>
      <Link href="/yardim-edebilirim" className="flex min-h-28 flex-col items-center justify-center rounded-[6px] bg-green-700 p-4 text-center active:opacity-90">
        <span className="text-[24px] font-extrabold">Yardım Edebilirim</span>
        <span className="text-[15px] text-green-100">Malzeme, araç, barınak sunuyorum</span>
      </Link>
      <div className="grid grid-cols-2 gap-2.5">
        <Link href="/acil" className={`${tile} !border-red-800 !bg-red-950/60`}><Siren size={30} className="text-red-300" />Acil Buton</Link>
        <Link href="/fener" className={tile}><Flashlight size={30} />Fener / SOS</Link>
        <Whistle />
        <Link href="/yakindakiler" className={tile}><Store size={30} />Market / Eczane</Link>
        <Link href="/harita" className={tile}><Map size={30} />Canlı Harita</Link>
        <Link href="/yardimci-paneli" className={tile}><Users size={30} />Yardımcı Paneli</Link>
      </div>
      <button type="button" onClick={backToNormal} className="mt-2 flex min-h-13 items-center justify-center gap-2 rounded-[6px] border border-night-line py-3 text-[17px] font-bold text-zinc-300">
        <HandHeart size={20} /> Normal moda dön
      </button>
    </Page>
  );
}
