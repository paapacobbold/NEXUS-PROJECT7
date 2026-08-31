/** Device token registration for push delivery (SRS 3.8). */
import { getSupabaseClient } from './client';

/**
 * Persists the Expo push token so a server can actually send to this device.
 * Previously the token was logged to the console and discarded, which is why
 * no remote notification could ever be delivered.
 */
export async function registerDeviceToken(token: string, platform: string) {
  const client = getSupabaseClient();
  if (!client || !token) return;
  try {
    const { data: userData } = await client.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) return;

    await client.from('device_tokens').upsert(
      { token, user_id: userId, platform, updated_at: new Date().toISOString() },
      { onConflict: 'token' }
    );
  } catch (err) {
    console.warn('Device token registration warning:', err);
  }
}
