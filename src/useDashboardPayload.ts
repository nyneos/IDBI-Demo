import { useEffect, useRef, useState } from 'react';
import type { LoginPayload } from '@/loginPayload';
import { fetchLoginPayload, parseSsePayload, userNameStreamUrl } from '@/lib/api';

const POLL_MS = 5_000;

function samePayload(a: LoginPayload | null, b: LoginPayload | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.userName === b.userName && a.message === b.message && a.sentAt === b.sentAt;
}

export function useDashboardPayload(initial: LoginPayload) {
  const [payload, setPayload] = useState(initial);
  const currentRef = useRef(initial);
  const sseOkRef = useRef(false);

  useEffect(() => {
    currentRef.current = initial;
    setPayload((prev) => (samePayload(prev, initial) ? prev : initial));
  }, [initial]);

  useEffect(() => {
    let source: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;

    const apply = (next: LoginPayload | null | undefined) => {
      if (!next?.userName || samePayload(next, currentRef.current)) return;
      currentRef.current = next;
      setPayload(next);
    };

    const poll = async () => {
      if (cancelled || sseOkRef.current) return;
      try {
        apply(await fetchLoginPayload());
      } catch {
        /* keep last known payload */
      }
    };

    const connect = () => {
      if (cancelled) return;
      source = new EventSource(userNameStreamUrl());

      source.onopen = () => {
        sseOkRef.current = true;
      };

      source.onmessage = (event) => {
        sseOkRef.current = true;
        const parsed = parseSsePayload<LoginPayload>(event.data);
        if (!parsed || !parsed.success || parsed.error) return;
        apply(parsed.data);
      };

      source.onerror = () => {
        sseOkRef.current = false;
        source?.close();
        source = null;
        if (!cancelled) {
          void poll();
          reconnectTimer = setTimeout(connect, 3_000);
        }
      };
    };

    connect();
    pollTimer = setInterval(() => {
      void poll();
    }, POLL_MS);

    return () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (pollTimer) clearInterval(pollTimer);
      source?.close();
    };
  }, []);

  return payload;
}
