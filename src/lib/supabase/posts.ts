/** Community discussion posts and shared resources (SRS 3.3). */
import { getSupabaseClient } from './client';
import { CommunityPost } from '@/data/mockData';

/** Formats a timestamp the way the post feed displays it. */
function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const mins = Math.max(0, Math.round((Date.now() - then) / 60000));
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  return `${Math.round(mins / 1440)}d ago`;
}

export async function getCommunityPosts(communityId: string): Promise<CommunityPost[]> {
  const client = getSupabaseClient();
  if (!client || !communityId) return [];
  try {
    const { data, error } = await client
      .from('posts')
      .select('*, author:profiles(full_name, role)')
      .eq('community_id', communityId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((row: any) => ({
      id: row.id,
      author: row.author?.full_name || 'Member',
      role: row.author?.role || 'Student',
      time: relativeTime(row.created_at),
      title: row.title || '',
      body: row.body || '',
      stats: '',
    }));
  } catch (err) {
    console.warn('Error fetching community posts:', err);
    return [];
  }
}

export async function createCommunityPost(
  communityId: string,
  title: string,
  body: string,
  authorId?: string
) {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: new Error('Supabase not configured') };

  let userId = authorId;
  if (!userId) {
    const { data: userData } = await client.auth.getUser();
    userId = userData?.user?.id;
  }

  return client
    .from('posts')
    .insert([{ community_id: communityId, title, body, author_id: userId || null }])
    .select('*')
    .single();
}

/** Live post feed for a community. Returns an unsubscribe function. */
export function subscribeToCommunityPosts(
  communityId: string,
  onNewPost: (post: CommunityPost, authorId: string | null) => void
) {
  const client = getSupabaseClient();
  if (!client || !communityId) return () => {};

  const channel = client
    .channel(`public:posts:community_id=eq.${communityId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'posts',
        filter: `community_id=eq.${communityId}`,
      },
      (payload: any) => {
        const row = payload.new;
        onNewPost(
          {
            id: row.id || `post-${Date.now()}`,
            author: 'Member',
            role: 'Student',
            time: 'Just now',
            title: row.title || '',
            body: row.body || '',
            stats: '',
          },
          row.author_id || null
        );
      }
    )
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
}

// --- SHARED RESOURCES (SRS 3.3) ---

export async function createResource(resource: {
  community_id?: string;
  uploader_id?: string;
  title: string;
  kind: 'file' | 'link';
  url: string;
  mime_type?: string;
  size_bytes?: number;
}) {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: new Error('Supabase not configured') };
  return client.from('resources').insert([resource]);
}

export async function getCommunityResources(communityId: string): Promise<any[]> {
  const client = getSupabaseClient();
  if (!client || !communityId) return [];
  try {
    const { data, error } = await client
      .from('resources')
      .select('*')
      .eq('community_id', communityId)
      .order('created_at', { ascending: false });
    if (error || !data) return [];
    return data;
  } catch (err) {
    console.warn('Error fetching resources:', err);
    return [];
  }
}
