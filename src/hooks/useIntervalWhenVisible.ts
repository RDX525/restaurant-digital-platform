"use client";

import { useEffect, useRef } from "react";

export function useIntervalWhenVisible(callback: () => void, delayMs: number | null) {
  const savedCallback = useRef(callback);
  savedCallback.current = callback;

  useEffect(() => {
    if (delayMs == null) return;

    function runIfVisible() {
      if (document.visibilityState === "hidden") return;
      savedCallback.current();
    }

    function onVisibilityChange() {
      if (document.visibilityState === "visible") {
        savedCallback.current();
      }
    }

    const timer = window.setInterval(runIfVisible, delayMs);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [delayMs]);
}
