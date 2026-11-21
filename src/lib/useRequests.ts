'use client';

import { useEffect, useState } from 'react';
import { HelpRequest } from './types';
import { subscribeToRequests } from './store';
import { getBlocked, isRequestHidden } from './moderation';

/** Tüm aktif talepleri canlı olarak dinler; gizlenen/engellenenleri çıkarır. */
export function useRequests() {
  const [all, setAll] = useState<HelpRequest[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [blocked, setBlocked] = useState<Set<string>>(new Set());

  useEffect(() => {
    getBlocked().then(setBlocked);
    return subscribeToRequests((list) => {
      setAll(list);
      setLoaded(true);
    });
  }, []);

  const visible = all.filter((r) => !isRequestHidden(blocked, r));
  return { requests: visible, loaded, refreshBlocked: () => getBlocked().then(setBlocked) };
}
