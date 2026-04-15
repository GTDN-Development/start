import { beforeEach, describe, expect, it, vi } from "vitest";
import { emitAuthChanged, emitSignedOut, subscribeToAuthClientEvents } from "./auth-client-events";

describe("auth-client-events", function describeAuthClientEvents() {
  beforeEach(function resetAuthClientEventsTestState() {
    MockBroadcastChannel.instances = [];
    vi.stubGlobal("BroadcastChannel", MockBroadcastChannel);
  });

  it("broadcasts auth-changed and signed-out events", function testBroadcastEvents() {
    emitAuthChanged();
    emitSignedOut();

    expect(MockBroadcastChannel.instances).toHaveLength(2);
    expect(MockBroadcastChannel.instances[0]?.postMessage).toHaveBeenCalledWith("auth-changed");
    expect(MockBroadcastChannel.instances[1]?.postMessage).toHaveBeenCalledWith("signed-out");
  });

  it("subscribes to recognized auth events only", function testSubscription() {
    const listener = vi.fn();
    const unsubscribe = subscribeToAuthClientEvents(listener);
    const channel = MockBroadcastChannel.instances[0];

    if (!channel) {
      throw new Error("Expected auth event channel to be created.");
    }

    channel.dispatchMessage("auth-changed");
    channel.dispatchMessage("signed-out");
    channel.dispatchMessage("unknown");

    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenNthCalledWith(1, "auth-changed");
    expect(listener).toHaveBeenNthCalledWith(2, "signed-out");

    unsubscribe();
    expect(channel.close).toHaveBeenCalledTimes(1);
  });
});

class MockBroadcastChannel {
  static instances: MockBroadcastChannel[] = [];

  name: string;
  onmessage: ((event: MessageEvent) => void) | null = null;
  postMessage = vi.fn();
  close = vi.fn();

  constructor(name: string) {
    this.name = name;
    MockBroadcastChannel.instances.push(this);
  }

  dispatchMessage(data: unknown) {
    this.onmessage?.({ data } as MessageEvent);
  }
}
