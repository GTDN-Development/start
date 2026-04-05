"use client";

import { useSyncExternalStore } from "react";

type BrowserPathnameSnapshot = {
  navigationId: number;
  pathname: string | null;
  previousPathname: string | null;
};

type Listener = () => void;

const listeners = new Set<Listener>();

let teardownNavigationSync: (() => void) | null = null;
let hasPendingEmit = false;
const SERVER_BROWSER_PATHNAME_SNAPSHOT: BrowserPathnameSnapshot = {
  navigationId: 0,
  pathname: null,
  previousPathname: null,
};
let snapshot: BrowserPathnameSnapshot = SERVER_BROWSER_PATHNAME_SNAPSHOT;

export function useBrowserPathnameState(): BrowserPathnameSnapshot {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  ensureNavigationSync();

  return function unsubscribe() {
    listeners.delete(listener);

    if (listeners.size === 0 && teardownNavigationSync) {
      teardownNavigationSync();
      teardownNavigationSync = null;
    }
  };
}

function getSnapshot() {
  primeSnapshot();
  return snapshot;
}

function getServerSnapshot(): BrowserPathnameSnapshot {
  return SERVER_BROWSER_PATHNAME_SNAPSHOT;
}

function ensureNavigationSync() {
  if (typeof window === "undefined" || teardownNavigationSync) {
    return;
  }

  primeSnapshot();

  const history = window.history;
  const originalPushState = history.pushState.bind(history);
  const originalReplaceState = history.replaceState.bind(history);

  function handleNavigation() {
    const nextPathname = getCurrentPathname();

    if (nextPathname === null || snapshot.pathname === nextPathname) {
      return;
    }

    snapshot = {
      navigationId: snapshot.navigationId + 1,
      pathname: nextPathname,
      previousPathname: snapshot.pathname,
    };

    emitChange();
  }

  history.pushState = function pushState(...args) {
    const result = originalPushState(...args);
    handleNavigation();
    return result;
  };

  history.replaceState = function replaceState(...args) {
    const result = originalReplaceState(...args);
    handleNavigation();
    return result;
  };

  window.addEventListener("popstate", handleNavigation);

  teardownNavigationSync = function teardown() {
    history.pushState = originalPushState;
    history.replaceState = originalReplaceState;
    window.removeEventListener("popstate", handleNavigation);
  };
}

function primeSnapshot() {
  const pathname = getCurrentPathname();

  if (pathname === null || snapshot.pathname !== null) {
    return;
  }

  snapshot = {
    navigationId: 0,
    pathname,
    previousPathname: null,
  };
}

function getCurrentPathname() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.location.pathname;
}

function emitChange() {
  if (hasPendingEmit) {
    return;
  }

  hasPendingEmit = true;

  queueMicrotask(function flushPathnameChange() {
    hasPendingEmit = false;

    for (const listener of listeners) {
      listener();
    }
  });
}
