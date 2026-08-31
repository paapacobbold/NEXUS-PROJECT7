/** Uploaded lecture recordings (SRS 3.5b). */
import { getSupabaseClient } from './client';

export async function getRecordings(): Promise<any[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  try {
    const { data, error } = await client
      .from('recordings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data;
  } catch (err) {
    console.error('Error fetching recordings:', err);
    return [];
  }
}

export async function createRecordingInSupabase(recording: {
  title: string;
  tutor_name: string;
  category: string;
  duration: string;
  thumbnail_url?: string;
  video_url?: string;
}) {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: new Error('Supabase not configured') };
  return client.from('recordings').insert([recording]).select('*').single();
}
