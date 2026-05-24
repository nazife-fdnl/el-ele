'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function Header() {
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState('');

  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 2000);
  }

  return (
    <>
      {/* Sticky header */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-[#0f0f0f]/95 backdrop-blur border-b border-zinc-800">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0">
            <Image src="/logo.png" alt="El Ele" width={36} height={36} className="w-full h-full object-cover" />
          </div>
          <span className="font-bold text-white text-lg">El Ele</span>
        </Link>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-green-700 hover:bg-green-600 active:scale-95 transition-all text-white text-sm font-bold px-4 py-2 rounded-xl"
        >
          💚 Bağışçı Ol
        </button>
      </header>

      {/* Donation Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-md bg-[#141414] rounded-3xl border border-zinc-700 p-6 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                  <Image src="/logo.png" alt="El Ele" width={40} height={40} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h2 className="font-bold text-white text-lg">El Ele&apos;ye Bağış Yap</h2>
                  <p className="text-zinc-400 text-xs">Deprem yardım ağını güçlendir</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="text-zinc-500 text-xl leading-none">✕</button>
            </div>

            {/* Why donate */}
            <div className="bg-green-950/40 border border-green-800/40 rounded-2xl px-4 py-3">
              <p className="text-green-300 text-sm">
                💚 Bağışlarınız; sunucu maliyetleri, SMS bildirimleri ve
                afet ekipmanı desteğine kullanılmaktadır.
              </p>
            </div>

            {/* Bank info */}
            <div className="flex flex-col gap-3">
              <p className="text-zinc-400 text-xs font-bold">BANKA HAVALE / EFT BİLGİLERİ</p>

              {[
                { label: 'Banka', value: 'Ziraat Bankası' },
                { label: 'Hesap Adı', value: 'El Ele Deprem Yardım Ağı' },
                { label: 'IBAN', value: 'TR12 0001 0017 4508 4756 6950 01' },
              ].map(({ label, value }) => (
                <div key={label} className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-zinc-500 text-xs">{label}</p>
                    <p className="text-white font-semibold text-sm mt-0.5 font-mono">{value}</p>
                  </div>
                  <button
                    onClick={() => copy(value, label)}
                    className={`flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                      copied === label
                        ? 'bg-green-700 text-white'
                        : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                    }`}
                  >
                    {copied === label ? '✓ Kopyalandı' : 'Kopyala'}
                  </button>
                </div>
              ))}
            </div>

            {/* Note */}
            <p className="text-zinc-600 text-xs text-center">
              Açıklama kısmına &quot;El Ele Bağış&quot; yazmayı unutmayın
            </p>

            <button
              onClick={() => setShowModal(false)}
              className="w-full py-3 rounded-2xl bg-zinc-800 text-zinc-400 font-semibold text-sm"
            >
              Kapat
            </button>
          </div>
        </div>
      )}
    </>
  );
}
