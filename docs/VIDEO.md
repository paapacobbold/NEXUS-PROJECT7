# Live video integration (SRS 3.5)

## Where things stand

The app ships with `LocalPreviewProvider` — it manages one participant (you),
shows your own camera, and carries no audio or video between devices. It reports
`supportsRemoteMedia: false`, and the session lobby uses that flag to label
itself "Camera preview only" rather than implying a call is connected.

Everything the lobby needs goes through `VideoProvider` in
[`src/lib/video/types.ts`](../src/lib/video/types.ts). The screen imports no SDK,
so swapping providers touches one file.

## Integrating a real provider

1. Install the SDK and its Expo config plugin.
2. Implement `VideoProvider` in `src/lib/video/<name>Provider.ts`.
3. Change one line in [`src/lib/video/index.ts`](../src/lib/video/index.ts):

   ```ts
   const activeProvider: VideoProvider = new LiveKitProvider();
   ```

4. Render remote tracks. `VideoParticipant.track` is deliberately `unknown` —
   cast it to the SDK's track type inside a provider-specific view component and
   use that in the lobby's participant grid.
5. Rebuild the development build. **Every option below needs native code, so
   none of them run in Expo Go.**

`useVideoRoom` records attendance on join, so progress tracking (SRS 3.9) keeps
working regardless of which provider is active.

## Choosing a provider

| | Expo support | Free tier | Notes |
|---|---|---|---|
| **LiveKit** | Official config plugin | Generous cloud tier; self-hostable | Open source. Best Expo story of the three. |
| **Agora** | Community plugin | 10,000 min/month | Mature, widely used; minute-based pricing after that. |
| **Zoom Video SDK** | No official plugin | 10,000 min/month | Named in the SRS. Heaviest native setup on Expo. |

The SRS names Zoom as an example ("e.g. Zoom SDK") and the PRD explicitly allows
alternatives evaluated on cost and mobile SDK quality — so picking another
provider is within scope. Record the decision and the reasoning in the report.

## What a provider must handle

- **Token minting happens server-side.** Never ship an API secret in the app;
  add a Supabase Edge Function that issues a room token for the signed-in user.
- **Permissions.** Camera and microphone are already declared in `app.json`.
- **Reconnection.** Emit `reconnecting` and then `connected` or `failed`; the
  lobby surfaces `status` and `error` directly.
- **Cleanup.** `leave()` must release the camera, or the next join opens a black
  tile.
