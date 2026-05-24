'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen bg-[#0f0f0f] text-white">
      {/* Hero */}
      <div className="flex flex-col items-center pt-10 pb-6 px-6">
        <div className="w-24 h-24 mb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="El Ele" className="w-full h-full rounded-full object-cover" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-center">Depremde El Ele</h1>
        <p className="mt-2 text-gray-400 text-center">
          Birlikte daha güçlüyüz
        </p>
      </div>

      {/* Alert Banner */}
      <div className="mx-4 rounded-2xl bg-red-950/60 border border-red-800/60 px-5 py-4 mb-8">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="font-semibold text-red-300 text-sm">ACİL DURUM AKTİF</p>
            <p className="text-gray-300 text-sm mt-0.5">Önce 112'yi arayın. Bu uygulama ek yardım için.</p>
          </div>
        </div>
      </div>

      {/* Main Buttons */}
      <div className="flex flex-col gap-4 px-4 flex-1">
        <Link href="/ihtiyacim-var" className="block">
          <div className="rounded-3xl bg-red-600 hover:bg-red-500 active:scale-95 transition-all p-8 text-center shadow-xl shadow-red-900/40">
            <div className="text-7xl mb-4">🆘</div>
            <h2 className="text-2xl font-bold mb-1">Yardıma İhtiyacım Var</h2>
            <p className="text-red-200 text-sm">Su, yiyecek, ilaç, kurtarma...</p>
          </div>
        </Link>

        <Link href="/yardim-edebilirim" className="block">
          <div className="rounded-3xl bg-green-700 hover:bg-green-600 active:scale-95 transition-all p-8 text-center shadow-xl shadow-green-900/40">
            <div className="text-7xl mb-4">🙌</div>
            <h2 className="text-2xl font-bold mb-1">Yardım Edebilirim</h2>
            <p className="text-green-200 text-sm">Malzeme, araç, barınak sunuyorum</p>
          </div>
        </Link>

        <Link href="/harita" className="block">
          <div className="rounded-3xl bg-zinc-800 hover:bg-zinc-700 active:scale-95 transition-all p-5 text-center border border-zinc-700">
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl">🗺️</span>
              <span className="text-lg font-semibold">Canlı Haritayı Gör</span>
            </div>
          </div>
        </Link>

        <Link href="/yardimci-paneli" className="block">
          <div className="rounded-3xl bg-zinc-900 hover:bg-zinc-800 active:scale-95 transition-all p-5 text-center border border-zinc-700">
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl">🔔</span>
              <div className="text-left">
                <span className="text-lg font-semibold block">Yardımcı Paneli</span>
                <span className="text-zinc-500 text-xs">Gelen istekleri görüntüle</span>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Footer */}
      <div className="text-center py-6 text-zinc-600 text-xs px-4">
        <p>Konum bilginiz yalnızca eşleştirme için kullanılır</p>
      </div>
    </main>
  );
}
