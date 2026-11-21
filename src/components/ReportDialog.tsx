'use client';

import { useState } from 'react';
import { HelpRequest } from '@/lib/types';
import { REPORT_REASONS, addBlocked, reportRequest, requestHideKey } from '@/lib/moderation';
import { Button } from './ui';

/** "Bildir / Gizle" penceresi: ilanı şikâyet et, kendinden gizle ya da sahibini engelle. */
export default function ReportDialog({
  req,
  onClose,
  onHidden,
}: {
  req: HelpRequest;
  onClose: () => void;
  onHidden?: () => void;
}) {
  const [done, setDone] = useState('');

  async function report(reason: string) {
    const ok = await reportRequest(req.id, req.deviceId, reason);
    await addBlocked(requestHideKey(req.id));
    setDone(ok ? 'Bildirimin alındı, en geç 24 saat içinde incelenecek. Bu ilan sana artık gösterilmeyecek.' : 'Bildirim gönderilemedi ama ilan senden gizlendi.');
    onHidden?.();
  }

  async function hide() {
    await addBlocked(requestHideKey(req.id));
    onHidden?.();
    onClose();
  }

  async function block() {
    if (req.deviceId) await addBlocked(req.deviceId);
    await addBlocked(requestHideKey(req.id));
    onHidden?.();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-t-[8px] bg-card p-4 text-ink sm:rounded-[8px]" onClick={(e) => e.stopPropagation()}>
        <p className="text-lg font-extrabold">Bu ilanla ilgili bir sorun mu var?</p>
        {done ? (
          <>
            <p className="mt-2 text-[15px]">{done}</p>
            <Button className="mt-4" onClick={onClose}>Tamam</Button>
          </>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            <p className="text-sm font-bold text-muted">Şikâyet et</p>
            {REPORT_REASONS.map((r) => (
              <button key={r} type="button" onClick={() => report(r)} className="rounded-[6px] border border-line px-4 py-3 text-left text-[15px] font-semibold hover:bg-paper">
                {r}
              </button>
            ))}
            <p className="mt-2 text-sm font-bold text-muted">Ya da</p>
            <button type="button" onClick={hide} className="rounded-[6px] border border-line px-4 py-3 text-left text-[15px] font-semibold hover:bg-paper">
              Bu ilanı benden gizle
            </button>
            {req.deviceId ? (
              <button type="button" onClick={block} className="rounded-[6px] border border-line px-4 py-3 text-left text-[15px] font-semibold text-brand hover:bg-paper">
                Bu kişiyi engelle
              </button>
            ) : null}
            <Button variant="outline" className="mt-2" onClick={onClose}>Vazgeç</Button>
          </div>
        )}
      </div>
    </div>
  );
}
