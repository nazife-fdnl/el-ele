'use client';

import { useEffect, useRef, useState } from 'react';
import { Phone, Send } from 'lucide-react';
import { Back } from '@/components/ui';
import { STARTERS, Topic, botReply } from '@/lib/destekBot';

interface Msg {
  role: 'user' | 'bot';
  content: string;
}

const WELCOME =
  'Merhaba, ben El Ele’nin otomatik yardımcısıyım. Deprem sonrası korku, uyuyamama ya da yalnızlık hissediyorsan buraya yazabilirsin. Şu an nasıl hissediyorsun?';

/** "Konuşalım": otomatik yanıtlayan destek sohbeti. Yapay zekâ yok; mesajlar tarayıcıdan çıkmaz. */
export default function Konusalim() {
  const [messages, setMessages] = useState<Msg[]>([{ role: 'bot', content: WELCOME }]);
  const [suggestions, setSuggestions] = useState<string[]>(STARTERS);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [crisis, setCrisis] = useState(false);
  const seen = useRef<Partial<Record<Topic, number>>>({});
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, typing]);

  function send(textArg?: string) {
    const text = (textArg ?? input).trim();
    if (!text || typing) return;
    setMessages((m) => [...m, { role: 'user', content: text.slice(0, 1000) }]);
    setInput('');
    setSuggestions([]);
    setTyping(true);
    const reply = botReply(text, seen.current);
    seen.current[reply.topic] = (seen.current[reply.topic] ?? 0) + 1;
    if (reply.crisis) setCrisis(true);
    setTimeout(() => {
      setMessages((m) => [...m, { role: 'bot', content: reply.text }]);
      setSuggestions(reply.suggestions);
      setTyping(false);
    }, 700);
  }

  return (
    <main className="flex flex-1 flex-col bg-paper">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col">
        <div className="flex items-center gap-4 px-4 pt-3">
          <Back />
          <h1 className="text-xl font-extrabold">Konuşalım</h1>
        </div>
        <div className={`mx-4 mt-2 rounded-[6px] p-3 ${crisis ? 'bg-brand text-white' : 'bg-soft'}`}>
          <p className="text-[15px] font-bold">
            {crisis ? 'Şu an tehlikedeysen ya da kendine zarar vermeyi düşünüyorsan yalnız değilsin. Hemen ara:' : 'Acil bir durumda:'}
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <a href="tel:112" className={`flex min-h-11 items-center justify-center gap-1.5 rounded-[4px] font-extrabold ${crisis ? 'bg-white text-brand' : 'bg-card'}`}><Phone size={16} /> 112</a>
            <a href="tel:183" className={`flex min-h-11 items-center justify-center gap-1.5 rounded-[4px] font-extrabold ${crisis ? 'bg-white text-brand' : 'bg-card'}`}><Phone size={16} /> ALO 183</a>
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto px-4 py-4">
          <p className="text-center text-[13px] text-muted">
            Otomatik yardımcı: hazır cevaplar verir, gerçek bir kişi ya da doktor değildir. Yazdıkların hiçbir yere gönderilmez ve saklanmaz.
          </p>
          {messages.map((m, i) => (
            <div key={i} className={`max-w-[85%] rounded-[6px] p-3 text-[17px] leading-relaxed ${m.role === 'user' ? 'self-end bg-ink text-white' : 'self-start border border-line bg-card'}`}>
              {m.content}
            </div>
          ))}
          {typing ? <div className="self-start rounded-[6px] border border-line bg-card p-3 text-[15px] italic text-muted">yazıyor…</div> : null}
          {!typing && suggestions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button key={s} type="button" onClick={() => send(s)} className="min-h-11 rounded-[4px] border border-line bg-card px-3 text-[15px] font-bold">
                  {s}
                </button>
              ))}
            </div>
          ) : null}
          <div ref={end} />
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="sticky bottom-0 flex gap-2 border-t border-line bg-card p-3"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={1000}
            placeholder="Duygularını yaz..."
            aria-label="Mesajın"
            className="min-h-12 flex-1 rounded-[4px] border border-line bg-paper px-3 text-[17px] outline-none focus:border-ink"
          />
          <button type="submit" disabled={!input.trim() || typing} className="flex min-h-12 items-center gap-1.5 rounded-[4px] bg-brand px-4 font-extrabold text-white disabled:opacity-40">
            <Send size={18} /> Gönder
          </button>
        </form>
      </div>
    </main>
  );
}
