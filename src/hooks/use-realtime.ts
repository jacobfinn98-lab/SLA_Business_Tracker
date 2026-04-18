"use client";

import { useEffect, useRef } from "react";

type RealtimeHandler = (event: MessageEvent) => void;

export function useRealtime(onEvent: RealtimeHandler) {
  const handlerRef = useRef(onEvent);
  handlerRef.current = onEvent;

  useEffect(() => {
    const url = "/api/stream";
    let source: EventSource;
    let retryTimeout: ReturnType<typeof setTimeout>;

    function connect() {
      source = new EventSource(url);
      source.onmessage = (e) => handlerRef.current(e);
      source.onerror = () => {
        source.close();
        retryTimeout = setTimeout(connect, 3000);
      };
    }

    connect();
    return () => {
      source?.close();
      clearTimeout(retryTimeout);
    };
  }, []);
}
