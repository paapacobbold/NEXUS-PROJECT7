import { createClient } from '@supabase/supabase-js';
import { CommunityItem, SessionItem, UserProfile, MessageItem, InPersonMeetup } from '../data/mockData';

const rawUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').trim();
const supabaseAnonKey = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '').trim();

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export const hasSupabaseEnv = Boolean(supabaseUrl && supabaseAnonKey);

// --- AUTH SERVICES ---

export async function signUpWithEmail(email: string, password: string, fullName: string) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  const res = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName }
    }
  });

  if (res.data?.user) {
    try {
      await supabase.from('profiles').upsert([
        {
          id: res.data.user.id,
          full_name: fullName,
          email: email,
          university: 'KNUST',
          major: 'Computer Science',
          year: '1st Year',
          bio: 'Member of NEXUS Learning Commons.',
          points: 100,
        }
      ]);
    } catch (err) {
      console.warn('Profile upsert warning:', err);
    }
  }

  return res;
}

export async function signInWithEmail(email: string, password: string) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOutUser() {
  if (!supabase) return { error: null };
  return supabase.auth.signOut();
}

export async function getCurrentSession() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

// --- PROFILE SERVICES ---

export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      // Fall back to Auth metadata
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user && userData.user.id === userId) {
        const u = userData.user;
        const name = u.user_metadata?.full_name || u.email?.split('@')[0] || 'User';
        return {
          name,
          email: u.email || '',
          university: 'KNUST',
          major: 'Computer Science',
          year: '1st Year',
          bio: 'Member of NEXUS Learning Commons.',
          skills: ['Peer Tutoring', 'Group Learning'],
          rating: '5.0',
          points: 100,
          sessions: 0,
          communities: 1,
          streak: '1 day',
          avatar: `https://i.pravatar.cc/120?u=${encodeURIComponent(u.email || name)}`,
        };
      }
      return null;
    }

    return {
      name: data.full_name || 'User',
      email: data.email || '',
      university: data.university || 'KNUST',
      major: data.major || 'Computer Science',
      year: data.year || '1st Year',
      bio: data.bio || '',
      skills: Array.isArray(data.skills) ? data.skills : ['Peer Tutoring', 'Group Learning'],
      rating: data.rating ? String(data.rating) : '5.0',
      points: data.points ?? 100,
      sessions: data.sessions_count ?? 0,
      communities: data.communities_count ?? 1,
      streak: data.streak || '1 day',
      avatar: data.avatar_url || `https://i.pravatar.cc/120?u=${encodeURIComponent(data.email || data.full_name || 'user')}`,
    };
  } catch (err) {
    console.error('Error fetching profile:', err);
    return null;
  }
}

export async function updateUserProfile(userId: string, updates: Partial<{
  full_name: string;
  university: string;
  major: string;
  year: string;
  bio: string;
  skills: string[];
}>) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  return supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);
}

// --- COMMUNITY SERVICES ---

export async function getCommunities(): Promise<CommunityItem[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
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

export async function joinCommunity(communityId: string, userId: string) {
  if (!supabase) return { error: new Error('Supabase not configured') };
  return supabase
    .from('community_members')
    .insert([{ community_id: communityId, user_id: userId }]);
}

export async function leaveCommunity(communityId: string, userId: string) {
  if (!supabase) return { error: new Error('Supabase not configured') };
  return supabase
    .from('community_members')
    .delete()
    .eq('community_id', communityId)
    .eq('user_id', userId);
}

// --- SESSION SERVICES ---

export async function getSessions(): Promise<SessionItem[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select(`
        *,
        tutor:profiles!sessions_tutor_id_fkey(full_name, avatar_url)
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
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  return supabase.from('sessions').insert([sessionData]);
}

// --- MESSAGING & REALTIME SERVICES ---

export async function getMessages(threadId: string): Promise<MessageItem[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });

    if (error || !data) return [];

    return data.map((msg: any) => ({
      id: msg.id,
      sender: 'them',
      text: msg.content,
      time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }));
  } catch (err) {
    console.error('Error fetching messages:', err);
    return [];
  }
}

export async function sendSupabaseMessage(threadId: string, text: string, senderId?: string) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  return supabase.from('messages').insert([
    { thread_id: threadId, content: text, sender_id: senderId || null, created_at: new Date().toISOString() }
  ]);
}

export function subscribeToThreadMessages(
  threadId: string,
  onNewMessage: (msg: MessageItem) => void
) {
  if (!supabase) return () => {};

  const channel = supabase
    .channel(`public:messages:thread_id=eq.${threadId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `thread_id=eq.${threadId}`,
      },
      (payload) => {
        const newMsg = payload.new;
        onNewMessage({
          id: newMsg.id || `msg-${Date.now()}`,
          sender: 'them',
          text: newMsg.content || newMsg.body || '',
          time: new Date(newMsg.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// --- MEETUP & COMMUNITY SERVICES ---

export async function getMeetups(): Promise<InPersonMeetup[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('meetups')
      .select('*')
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

export async function rsvpMeetupInSupabase(meetupId: string, userId: string, rsvped: boolean) {
  if (!supabase) return { error: new Error('Supabase not configured') };
  if (rsvped) {
    return supabase.from('meetup_rsvps').insert([{ meetup_id: meetupId, user_id: userId }]);
  } else {
    return supabase.from('meetup_rsvps').delete().eq('meetup_id', meetupId).eq('user_id', userId);
  }
}

export async function createMeetupInSupabase(title: string, location: string, scheduledAt: string, organizerId?: string) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  return supabase.from('meetups').insert([
    {
      title,
      location,
      scheduled_at: scheduledAt,
      organizer_id: organizerId || null,
    },
  ]);
}

export async function createCommunityInSupabase(name: string, subject: string, description: string, creatorId?: string) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  return supabase.from('communities').insert([
    {
      name,
      subject,
      description,
      created_by: creatorId || null,
    },
  ]);
}

