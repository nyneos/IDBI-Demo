import { useEffect, useRef, useState } from 'react';
import { parseSsePayload, userNameStreamUrl } from '@/lib/api';

export function useUserNameStream(initialName: string) {
  const [userName, setUserName] = useState(initialName);
  const currentRef = useRef(initialName);

  useEffect(() => {
    currentRef.current = initialName;
    setUserName((prev) => (prev === initialName ? prev : initialName));
  }, [initialName]);

  useEffect(() => {
    let source: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const connect = () => {
      if (cancelled) return;
      source = new EventSource(userNameStreamUrl());

      source.onmessage = (event) => {
        const payload = parseSsePayload<{ userName: string }>(event.data);
        if (!payload || !payload.success || payload.error) return;

        const next = payload.data?.userName;
        if (!next || next === currentRef.current) return;

        currentRef.current = next;
        setUserName(next);
      };

      source.onerror = () => {
        source?.close();
        if (!cancelled) {
          reconnectTimer = setTimeout(connect, 3000);
        }
      };
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      source?.close();
    };
  }, []);

  return userName;
}
