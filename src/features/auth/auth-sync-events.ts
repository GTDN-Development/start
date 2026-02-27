"use client";

const AUTH_SYNC_CHANNEL_NAME = "start-auth-sync";
const AUTH_SYNC_STORAGE_KEY = "start-auth-sync";
const AUTH_SYNC_WINDOW_EVENT = "start-auth-sync";

export type AuthSyncEventType = "auth" | "profile";

type AuthSyncEventPayload = {
  type: AuthSyncEventType;
  at: number;
};

export function notifyAuthSync(eventType: AuthSyncEventType) {
  if (typeof window === "undefined") {
    return;
  }

  const payload = createAuthSyncEventPayload(eventType);
  notifyCurrentTab(payload);
  notifyOtherTabsViaBroadcastChannel(payload);
  notifyOtherTabsViaStorage(payload);
}

export function subscribeToAuthSyncEvents(listener: (eventType: AuthSyncEventType) => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  let channel: BroadcastChannel | null = null;

  function emitFromPayload(value: unknown) {
    const payload = parseAuthSyncEventPayload(value);

    if (!payload) {
      return;
    }

    listener(payload.type);
  }

  function handleWindowEvent(event: Event) {
    const customEvent = event as CustomEvent<AuthSyncEventPayload | undefined>;
    emitFromPayload(customEvent.detail);
  }

  function handleStorageEvent(event: StorageEvent) {
    if (event.key !== AUTH_SYNC_STORAGE_KEY || !event.newValue) {
      return;
    }

    try {
      emitFromPayload(JSON.parse(event.newValue));
    } catch {
      return;
    }
  }

  function handleChannelMessage(event: MessageEvent<unknown>) {
    emitFromPayload(event.data);
  }

  window.addEventListener(AUTH_SYNC_WINDOW_EVENT, handleWindowEvent as EventListener);
  window.addEventListener("storage", handleStorageEvent);

  if (typeof BroadcastChannel !== "undefined") {
    channel = new BroadcastChannel(AUTH_SYNC_CHANNEL_NAME);
    channel.addEventListener("message", handleChannelMessage);
  }

  return () => {
    window.removeEventListener(AUTH_SYNC_WINDOW_EVENT, handleWindowEvent as EventListener);
    window.removeEventListener("storage", handleStorageEvent);

    if (channel) {
      channel.removeEventListener("message", handleChannelMessage);
      channel.close();
    }
  };
}

function createAuthSyncEventPayload(eventType: AuthSyncEventType): AuthSyncEventPayload {
  return {
    type: eventType,
    at: Date.now(),
  };
}

function parseAuthSyncEventPayload(value: unknown): AuthSyncEventPayload | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const type = record.type;

  if (type !== "auth" && type !== "profile") {
    return null;
  }

  return {
    type,
    at: typeof record.at === "number" ? record.at : Date.now(),
  };
}

function notifyCurrentTab(payload: AuthSyncEventPayload) {
  window.dispatchEvent(
    new CustomEvent(AUTH_SYNC_WINDOW_EVENT, {
      detail: payload,
    })
  );
}

function notifyOtherTabsViaBroadcastChannel(payload: AuthSyncEventPayload) {
  if (typeof BroadcastChannel === "undefined") {
    return;
  }

  const channel = new BroadcastChannel(AUTH_SYNC_CHANNEL_NAME);
  channel.postMessage(payload);
  channel.close();
}

function notifyOtherTabsViaStorage(payload: AuthSyncEventPayload) {
  try {
    localStorage.setItem(AUTH_SYNC_STORAGE_KEY, JSON.stringify(payload));
    localStorage.removeItem(AUTH_SYNC_STORAGE_KEY);
  } catch {
    return;
  }
}
