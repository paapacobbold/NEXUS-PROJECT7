/** Community listing, membership and creation. */
import { getSupabaseClient } from './client';
import { CommunityItem } from '@/data/mockData';

export async function getCommunities(): Promise<CommunityItem[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  try {
    const { data, error } = await client
      .from('communities')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) return [];

    return data.map((item: any) => ({
      id: item.id,
      name: item.name,
      subject: item.subject,
      members: 120, // Default active dynamic count
      posts: 15,
      description: item.description || '',
      image: item.image_url || 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=1200&q=80',
      joined: false,
      postsFeed: [],
    }));
  } catch (err) {
    console.error('Error fetching communities:', err);
    return [];
  }
}

export async function getUserJoinedCommunities(userId: string): Promise<string[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  try {
    const { data, error } = await client
      .from('community_members')
      .select('community_id')
      .eq('user_id', userId);

    if (error || !data) return [];
    return data.map((item: any) => item.community_id);
  } catch (err) {
    console.error('Error fetching user joined communities:', err);
    return [];
  }
}

export async function joinCommunity(communityId: string, userId: string) {
  const client = getSupabaseClient();
  if (!client) return { error: new Error('Supabase not configured') };
  return client
    .from('community_members')
    .insert([{ community_id: communityId, user_id: userId }]);
}

export async function leaveCommunity(communityId: string, userId: string) {
  const client = getSupabaseClient();
  if (!client) return { error: new Error('Supabase not configured') };
  return client
    .from('community_members')
    .delete()
    .eq('community_id', communityId)
    .eq('user_id', userId);
}

export async function createCommunityInSupabase(name: string, subject: string, description: string, creatorId?: string) {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: new Error('Supabase not configured') };
  return client.from('communities').insert([
    {
      name,
      subject,
      description,
      created_by: creatorId || null,
    },
  ]);
}
