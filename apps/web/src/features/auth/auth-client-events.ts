"use client";

export type AuthClientEvent = "auth-changed" | "signed-out";

const AUTH_CLIENT_EVENT_CHANNEL_NAME = "auth-sync";

export function emitAuthChanged() {
  emitAuthClientEvent("auth-changed");
}

export function emitSignedOut() {
  emitAuthClientEvent("signed-out");
}

export function subscribeToAuthClientEvents(listener: (event: AuthClientEvent) => void) {
  if (typeof BroadcastChannel === "undefined") {
    return function unsubscribeAuthClientEvents() {
      return undefined;
    };
  }

  const channel = new BroadcastChannel(AUTH_CLIENT_EVENT_CHANNEL_NAME);

  channel.onmessage = function handleAuthClientEvent(event: MessageEvent) {
    if (!isAuthClientEvent(event.data)) {
      return;
    }

    listener(event.data);
  };

  return function unsubscribeAuthClientEvents() {
    channel.close();
  };
}

function emitAuthClientEvent(event: AuthClientEvent) {
  if (typeof BroadcastChannel === "undefined") {
    return;
  }

  const channel = new BroadcastChannel(AUTH_CLIENT_EVENT_CHANNEL_NAME);

  channel.postMessage(event);
  channel.close();
}

function isAuthClientEvent(value: unknown): value is AuthClientEvent {
  return value === "auth-changed" || value === "signed-out";
}
