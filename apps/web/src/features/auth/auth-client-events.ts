"use client";

const AUTH_CLIENT_EVENT_CHANNEL_NAME = "auth-sync";
const SIGNED_OUT_EVENT = "signed-out";

export function emitSignedOut() {
  if (typeof BroadcastChannel === "undefined") {
    return;
  }

  const channel = new BroadcastChannel(AUTH_CLIENT_EVENT_CHANNEL_NAME);

  channel.postMessage(SIGNED_OUT_EVENT);
  channel.close();
}

export function subscribeToAuthClientEvents(listener: () => void) {
  if (typeof BroadcastChannel === "undefined") {
    return function unsubscribeAuthClientEvents() {
      return undefined;
    };
  }

  const channel = new BroadcastChannel(AUTH_CLIENT_EVENT_CHANNEL_NAME);

  channel.onmessage = function handleAuthClientEvent(event: MessageEvent) {
    if (event.data !== SIGNED_OUT_EVENT) {
      return;
    }

    listener();
  };

  return function unsubscribeAuthClientEvents() {
    channel.close();
  };
}
