/** In-person meetups and their RSVPs. */
import { getSupabaseClient } from './client';
import { InPersonMeetup } from '@/data/mockData';

export async function getMeetups(): Promise<InPersonMeetup[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  try {
    const { data, error } = await client
      .from('meetups')
      .select('*, organizer:profiles(full_name, avatar_url)')
      .order('scheduled_at', { ascending: true });

    if (error || !data || data.length === 0) return [];

    return data.map((item: any) => ({
      id: item.id,
      title: item.title,
      organizer: item.organizer?.full_name || 'Campus Member',
      location: item.location,
      dateTime: new Date(item.scheduled_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      rsvpCount: 5,
      rsvpStatus: false,
    }));
  } catch (err) {
    console.error('Error fetching meetups:', err);
    return [];
  }
}

export async function getUserMeetupRSVPs(userId: string): Promise<string[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  try {
    const { data, error } = await client
      .from('meetup_rsvps')
      .select('meetup_id')
      .eq('user_id', userId);

    if (error || !data) return [];
    return data.map((item: any) => item.meetup_id);
  } catch (err) {
    console.error('Error fetching meetup RSVPs:', err);
    return [];
  }
}

export async function rsvpMeetupInSupabase(meetupId: string, userId: string, rsvped: boolean) {
  const client = getSupabaseClient();
  if (!client) return { error: new Error('Supabase not configured') };
  if (rsvped) {
    return client.from('meetup_rsvps').insert([{ meetup_id: meetupId, user_id: userId }]);
  } else {
    return client.from('meetup_rsvps').delete().eq('meetup_id', meetupId).eq('user_id', userId);
  }
}

export async function createMeetupInSupabase(title: string, location: string, scheduledAt: string, organizerId?: string) {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: new Error('Supabase not configured') };
  return client.from('meetups').insert([
    {
      title,
      location,
      scheduled_at: scheduledAt,
      organizer_id: organizerId || null,
    },
  ]);
}
