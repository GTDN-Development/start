import {
  getSessionSnapshot,
  isSessionRefetchAllowed,
  refreshSession,
  setSessionState,
} from "@/features/auth/auth-client-store";

type SyncSignal = "session-changed" | "signed-out";

let syncChannel: BroadcastChannel | null = null;
let syncInitialized = false;

export function ensureSessionSyncInitialized() {
  if (syncInitialized || typeof window === "undefined") {
    return;
  }

  syncInitialized = true;

  initSessionSync();
  initVisibilityRefresh();
  initWindowFocusRefresh();
  initOnlineRecovery();
}

export function broadcastSessionChanged() {
  syncChannel?.postMessage("session-changed" satisfies SyncSignal);
}

export function broadcastSignedOut() {
  syncChannel?.postMessage("signed-out" satisfies SyncSignal);
}

function initSessionSync() {
  if (typeof BroadcastChannel === "undefined") {
    return;
  }

  syncChannel?.close();
  syncChannel = new BroadcastChannel("auth-sync");
  syncChannel.onmessage = handleSyncMessage;
}

function handleSyncMessage(event: MessageEvent) {
  const signal = event.data;

  if (!isSyncSignal(signal)) {
    return;
  }

  if (signal === "signed-out") {
    setSessionState({
      status: "unauthenticated",
      session: null,
    });
    return;
  }

  if (!isOnline() || !isSessionRefetchAllowed()) {
    return;
  }

  void refreshSession();
}

function isSyncSignal(value: unknown): value is SyncSignal {
  return value === "session-changed" || value === "signed-out";
}

function initVisibilityRefresh() {
  if (typeof document === "undefined") {
    return;
  }

  document.addEventListener("visibilitychange", handleVisibilityChange);
}

function handleVisibilityChange() {
  if (document.visibilityState !== "visible") {
    return;
  }

  if (getSessionSnapshot().status !== "authenticated") {
    return;
  }

  if (!isOnline() || !isSessionRefetchAllowed()) {
    return;
  }

  void refreshSession();
}

function initWindowFocusRefresh() {
  if (typeof window === "undefined") {
    return;
  }

  window.addEventListener("focus", handleWindowFocus);
}

function handleWindowFocus() {
  if (getSessionSnapshot().status !== "authenticated") {
    return;
  }

  if (!isOnline() || !isSessionRefetchAllowed()) {
    return;
  }

  void refreshSession();
}

function initOnlineRecovery() {
  if (typeof window === "undefined") {
    return;
  }

  window.addEventListener("online", handleOnlineRecovery);
}

function handleOnlineRecovery() {
  if (getSessionSnapshot().status !== "authenticated") {
    return;
  }

  if (!isSessionRefetchAllowed()) {
    return;
  }

  void refreshSession();
}

function isOnline() {
  return typeof navigator === "undefined" || navigator.onLine;
}
