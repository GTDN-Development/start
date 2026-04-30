import { beforeEach, describe, expect, it, vi } from "vitest";
import { emitSignedOut, subscribeToAuthClientEvents } from "./auth-client-events";

describe("auth-client-events", function describeAuthClientEvents() {
  beforeEach(function resetAuthClientEventsTestState() {
    MockBroadcastChannel.instances = [];
    vi.stubGlobal("BroadcastChannel", MockBroadcastChannel);
  });

  it("broadcasts signed-out events", function testBroadcastEvents() {
    emitSignedOut();

    expect(MockBroadcastChannel.instances).toHaveLength(1);
    expect(MockBroadcastChannel.instances[0]?.postMessage).toHaveBeenCalledWith("signed-out");
  });

  it("subscribes to signed-out events only", function testSubscription() {
    const listener = vi.fn();
    const unsubscribe = subscribeToAuthClientEvents(listener);
    const channel = MockBroadcastChannel.instances[0];

    if (!channel) {
      throw new Error("Expected auth event channel to be created.");
    }

    channel.dispatchMessage("signed-out");
    channel.dispatchMessage("unknown");

    expect(listener).toHaveBeenCalledTimes(1);

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
