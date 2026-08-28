import { useEffect, useRef, useState } from 'react';
import { fetchUserName, parseSsePayload, userNameStreamUrl } from '@/lib/api';

const POLL_MS = 1_000;

export function useUserNameLive(initialName = '') {
  const [userName, setUserName] = useState(initialName);
  const currentRef = useRef(initialName);

  useEffect(() => {
    let source: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;

    const apply = (next: string | null | undefined) => {
      if (!next || next === currentRef.current) return;
      currentRef.current = next;
      setUserName(next);
    };

    const poll = async () => {
      if (cancelled) return;
      try {
        const data = await fetchUserName();
        apply(data.userName);
      } catch {
        /* keep last known value */
      }
    };

    const connect = () => {
      if (cancelled) return;
      source = new EventSource(userNameStreamUrl());

      source.onmessage = (event) => {
        const parsed = parseSsePayload<{ userName: string }>(event.data);
        if (!parsed || !parsed.success || parsed.error || !parsed.data) return;
        apply(parsed.data.userName);
      };

      source.onerror = () => {
        source?.close();
        source = null;
        if (!cancelled) {
          void poll();
          reconnectTimer = setTimeout(connect, 1_000);
        }
      };
    };

    connect();
    void poll();
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

  return userName;
}
