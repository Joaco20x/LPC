"use client";

import { useSyncExternalStore } from "react";

export function useOnlineStatus() {
  return useSyncExternalStore(
    (onChange) => {
      globalThis.addEventListener("online", onChange);
      globalThis.addEventListener("offline", onChange);
      return () => {
        globalThis.removeEventListener("online", onChange);
        globalThis.removeEventListener("offline", onChange);
      };
    },
    () => navigator.onLine,
    () => true,
  );
}
