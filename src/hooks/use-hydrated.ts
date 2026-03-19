"use client";

import { useSyncExternalStore } from "react";

// Hydration guard for client-only UI that would otherwise render a different
// server snapshot than the browser can determine after hydration.
// This is not a direct replacement for a generic isMounted hook.
export function useHydrated() {
  return useSyncExternalStore(
    subscribeToHydrationSnapshot,
    getHydratedSnapshot,
    getServerHydratedSnapshot
  );
}

function subscribeToHydrationSnapshot() {
  return function unsubscribeHydrationSnapshot() {};
}

function getHydratedSnapshot() {
  return true;
}

function getServerHydratedSnapshot() {
  return false;
}
