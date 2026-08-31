/** Scheduled study sessions. */
import { getSupabaseClient } from './client';
import { SessionItem } from '@/data/mockData';

export async function getSessions(): Promise<SessionItem[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  try {
    const { data, error } = await client
      .from('sessions')
      .select(`
        *,
        tutor:profiles(full_name, avatar_url)
      `)
      .order('scheduled_at', { ascending: true });

    if (error || !data || data.length === 0) return [];

    return data.map((item: any) => ({
      id: item.id,
      title: item.title,
      tutor: item.tutor?.full_name || 'Tutor',
      time: new Date(item.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      participants: `0/${item.max_participants || 20}`,
      tag: item.tag || 'General',
      image: item.tutor?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      isLive: item.is_live ?? false,
    }));
  } catch (err) {
    console.error('Error fetching sessions:', err);
    return [];
  }
}

export async function createSession(sessionData: {
  title: string;
  tutor_id: string;
  community_id?: string;
  tag: string;
  scheduled_at: string;
  duration_minutes: number;
  max_participants: number;
}) {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: new Error('Supabase not configured') };
  return client.from('sessions').insert([sessionData]);
}
