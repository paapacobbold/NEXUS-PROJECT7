import { LocalPreviewProvider } from '../lib/video/localPreviewProvider';
import { VideoProvider } from '../lib/video/types';

/**
 * Pins the VideoProvider contract. A real SDK provider must satisfy the same
 * expectations, so this file doubles as the spec for swapping one in.
 */
describe('VideoProvider contract — LocalPreviewProvider', () => {
  let provider: VideoProvider;

  beforeEach(() => {
    provider = new LocalPreviewProvider();
  });

  it('declares that it cannot carry remote media', () => {
    // The lobby keys its "Camera preview only" label off this. A provider that
    // lied here would put the fabricated-call bug straight back.
    expect(provider.supportsRemoteMedia).toBe(false);
  });

  it('starts idle with no participants', () => {
    expect(provider.getState()).toEqual({ status: 'idle', participants: [] });
  });

  it('connects with the local participant only', async () => {
    await provider.join({ sessionId: 's1', displayName: 'Amara' });

    const state = provider.getState();
    expect(state.status).toBe('connected');
    expect(state.participants).toHaveLength(1);
    expect(state.participants[0]).toMatchObject({
      isLocal: true,
      name: 'Amara',
      isMuted: false,
      isCameraOn: true,
    });
  });

  it('honours the requested initial mute and camera state', async () => {
    await provider.join({
      sessionId: 's1',
      displayName: 'Amara',
      startMuted: true,
      startWithCameraOff: true,
    });

    expect(provider.getState().participants[0]).toMatchObject({
      isMuted: true,
      isCameraOn: false,
    });
  });

  it('reflects control changes on the local participant', async () => {
    await provider.join({ sessionId: 's1', displayName: 'Amara' });

    await provider.setMuted(true);
    expect(provider.getState().participants[0].isMuted).toBe(true);

    await provider.setCameraEnabled(false);
    expect(provider.getState().participants[0].isCameraOn).toBe(false);

    await provider.setHandRaised(true);
    expect(provider.getState().participants[0].isHandRaised).toBe(true);
  });

  it('clears participants on leave so the next join starts clean', async () => {
    await provider.join({ sessionId: 's1', displayName: 'Amara' });
    await provider.leave();

    expect(provider.getState().status).toBe('disconnected');
    expect(provider.getState().participants).toEqual([]);
  });

  it('pushes state to subscribers and stops after unsubscribe', async () => {
    const seen: string[] = [];
    const unsubscribe = provider.subscribe((s) => seen.push(s.status));

    // subscribe() emits current state immediately so a screen never renders blank.
    expect(seen).toEqual(['idle']);

    await provider.join({ sessionId: 's1', displayName: 'Amara' });
    expect(seen).toContain('connected');

    unsubscribe();
    const countAfterUnsubscribe = seen.length;
    await provider.leave();
    expect(seen).toHaveLength(countAfterUnsubscribe);
  });
});
