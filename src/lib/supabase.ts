import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';
import { CommunityItem, CommunityPost, SessionItem, UserProfile, MessageItem, InPersonMeetup, ThreadPreview, DEFAULT_AVATAR } from '../data/mockData';

let _clientInstance: any = null;

export function isSupabaseKeyValid(key: string): boolean {
  if (!key || typeof key !== 'string') return false;
  const trimmed = key.trim();
  if (
    !trimmed ||
    trimmed === 'your-anon-key' ||
    trimmed === 'YOUR_SUPABASE_ANON_KEY'
  ) {
    return false;
  }
  return true;
}

export function getSupabaseClient() {
  const rawUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
  const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').trim();
  const supabaseAnonKey = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '').trim();

  if (!supabaseUrl || !isSupabaseKeyValid(supabaseAnonKey)) {
    return null;
  }

  if (!_clientInstance) {
    // React Native has no localStorage, so without an explicit adapter
    // supabase-js cannot persist the session and every relaunch starts signed
    // out. AsyncStorage is what makes "stay logged in" work at all.
    _clientInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        persistSession: true,
        autoRefreshToken: true,
        // Sessions never arrive via a URL fragment on native.
        detectSessionInUrl: false,
      },
    });
    startAutoRefreshBridge();
  }
  return _clientInstance;
}

let _autoRefreshBridged = false;

/**
 * Supabase's recommended React Native pattern: only refresh tokens while the
 * app is foregrounded, so a backgrounded app does not burn timers or race the
 * OS suspending it mid-request.
 */
function startAutoRefreshBridge() {
  if (_autoRefreshBridged || Platform.OS === 'web') return;
  _autoRefreshBridged = true;

  AppState.addEventListener('change', (status) => {
    if (!_clientInstance) return;
    if (status === 'active') {
      _clientInstance.auth.startAutoRefresh();
    } else {
      _clientInstance.auth.stopAutoRefresh();
    }
  });
}

export const supabase = getSupabaseClient();
export const hasSupabaseEnv = Boolean(
  (process.env.EXPO_PUBLIC_SUPABASE_URL || '').trim() &&
  isSupabaseKeyValid((process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '').trim())
);

// --- AUTH SERVICES ---

export async function signUpWithEmail(email: string, password: string, fullName: string) {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: new Error('Supabase not configured') };
  const res = await client.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName }
    }
  });

  if (res.data?.user) {
    try {
      await client.from('profiles').upsert([
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
  const client = getSupabaseClient();
  if (!client) return { data: null, error: new Error('Supabase not configured') };
  return client.auth.signInWithPassword({ email, password });
}

export async function signOutUser() {
  const client = getSupabaseClient();
  if (!client) return { error: null };
  return client.auth.signOut();
}

export async function getCurrentSession() {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data } = await client.auth.getSession();
  return data.session;
}

// --- PROFILE SERVICES ---

export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      // Fall back to Auth metadata
      const { data: userData } = await client.auth.getUser();
      if (userData?.user && userData.user.id === userId) {
        const u = userData.user;
        const name = u.user_metadata?.full_name || u.email?.split('@')[0] || 'User';
        return {
          id: userId,
          name,
          email: u.email || '',
          university: 'KNUST',
          major: 'Computer Science',
          year: '1st Year',
          bio: 'Member of NEXUS Learning Commons.',
          skills: ['Peer Tutoring', 'Group Learning'],
          interests: [],
          skillLevel: 'Beginner',
          rating: '5.0',
          points: 100,
          sessions: 0,
          communities: 1,
          streak: '1 day',
          avatar: u.user_metadata?.avatar_url || DEFAULT_AVATAR,
        };
      }
      return null;
    }

    return {
      id: userId,
      name: data.full_name || 'User',
      email: data.email || '',
      university: data.university || 'KNUST',
      major: data.major || 'Computer Science',
      year: data.year || '1st Year',
      bio: data.bio || '',
      skills: Array.isArray(data.skills) ? data.skills : ['Peer Tutoring', 'Group Learning'],
      interests: Array.isArray(data.interests) ? data.interests : [],
      skillLevel: data.skill_level || 'Beginner',
      rating: data.rating ? String(data.rating) : '5.0',
      points: data.points ?? 100,
      sessions: data.sessions_count ?? 0,
      communities: data.communities_count ?? 1,
      streak: data.streak || '1 day',
      avatar: data.avatar_url || DEFAULT_AVATAR,
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
  avatar_url: string;
  skills: string[];
  interests: string[];
  skill_level: string;
}>) {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: new Error('Supabase not configured') };
  return client
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);
}


// --- COMMUNITY POSTS & DISCUSSIONS (SRS 3.3) ---

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

// --- PUSH DELIVERY (SRS 3.8) ---

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

// --- PROGRESS TRACKING (SRS 3.9) ---

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Records that the user joined a session. Safe to call more than once.
 *
 * sessions.id is a UUID, so a seeded mock id like 'live-1' would be rejected by
 * Postgres and the write would fail silently — guard rather than round-trip.
 */
export async function recordSessionAttendance(sessionId: string) {
  const client = getSupabaseClient();
  if (!client || !sessionId) return;
  if (!UUID_RE.test(sessionId)) {
    console.warn('Skipping attendance for non-persisted session:', sessionId);
    return;
  }
  try {
    const { data: userData } = await client.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) return;

    await client.from('session_attendance').upsert(
      { session_id: sessionId, user_id: userId, joined_at: new Date().toISOString() },
      { onConflict: 'session_id,user_id' }
    );
  } catch (err) {
    console.warn('Attendance record warning:', err);
  }
}

// --- GAMIFICATION (SRS 3.10) ---

export type PointsReason =
  | 'session_attended'
  | 'post_created'
  | 'comment_created'
  | 'resource_shared'
  | 'daily_task'
  | 'meetup_attended';

/**
 * Awards points for an action.
 *
 * The amount is decided by the award_points() database function, not passed
 * from here — a client that could write the ledger directly could award itself
 * any number of points and top the leaderboard.
 *
 * Returns the points actually granted, or 0 if the call did not go through.
 */
export async function awardPoints(reason: PointsReason, refId?: string): Promise<number> {
  const client = getSupabaseClient();
  if (!client) return 0;
  try {
    const { data, error } = await client.rpc('award_points', {
      p_reason: reason,
      p_ref: refId || null,
    });
    if (error) throw error;
    return typeof data === 'number' ? data : 0;
  } catch (err) {
    console.warn('Points award warning:', err);
    return 0;
  }
}

export type LeaderboardRow = {
  id: string;
  name: string;
  avatar: string;
  university: string;
  points: number;
  sessions: number;
};

/** Reads the aggregated leaderboard view rather than the mock array. */
export async function getLeaderboard(limit = 20): Promise<LeaderboardRow[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  try {
    const { data, error } = await client
      .from('leaderboard')
      .select('*')
      .order('total_points', { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data.map((row: any) => ({
      id: row.id,
      name: row.full_name || 'Student',
      avatar: row.avatar_url || DEFAULT_AVATAR,
      university: row.university || 'KNUST',
      points: row.total_points ?? 0,
      sessions: row.sessions_attended ?? 0,
    }));
  } catch (err) {
    console.warn('Error fetching leaderboard:', err);
    return [];
  }
}

// --- COMMUNITY SERVICES ---

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

// --- SESSION SERVICES ---

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

// --- MESSAGING & REALTIME SERVICES ---

export async function getMessages(threadId: string, currentUserId?: string): Promise<MessageItem[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  try {
    let activeUserId = currentUserId;
    if (!activeUserId) {
      const { data: userData } = await client.auth.getUser();
      activeUserId = userData?.user?.id;
    }

    const { data, error } = await client
      .from('messages')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });

    if (error || !data) return [];

    return data.map((msg: any) => ({
      id: msg.id,
      sender: activeUserId && msg.sender_id === activeUserId ? 'me' : 'them',
      text: msg.content,
      time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }));
  } catch (err) {
    console.error('Error fetching messages:', err);
    return [];
  }
}

export async function sendSupabaseMessage(threadId: string, text: string, senderId?: string) {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: new Error('Supabase not configured') };
  let activeSenderId = senderId;
  if (!activeSenderId) {
    const { data: userData } = await client.auth.getUser();
    activeSenderId = userData?.user?.id;
  }
  return client.from('messages').insert([
    { thread_id: threadId, content: text, sender_id: activeSenderId || null, created_at: new Date().toISOString() }
  ]);
}

export function subscribeToThreadMessages(
  threadId: string,
  onNewMessage: (msg: MessageItem) => void,
  currentUserId?: string
) {
  const client = getSupabaseClient();
  if (!client) return () => {};

  const channel = client
    .channel(`public:messages:thread_id=eq.${threadId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `thread_id=eq.${threadId}`,
      },
      (payload: any) => {
        const newMsg = payload.new;
        const isMe = Boolean(currentUserId && newMsg.sender_id === currentUserId);
        onNewMessage({
          id: newMsg.id || `msg-${Date.now()}`,
          sender: isMe ? 'me' : 'them',
          text: newMsg.content || newMsg.body || '',
          time: new Date(newMsg.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
      }
    )
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
}

export async function fetchAllProfiles(currentUserId?: string): Promise<UserProfile[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  try {
    let query = client.from('profiles').select('*');
    if (currentUserId) {
      query = query.neq('id', currentUserId);
    }
    const { data, error } = await query;
    if (error || !data) return [];
    return data.map((d: any) => ({
      id: d.id,
      name: d.full_name || 'User',
      email: d.email || '',
      university: d.university || 'KNUST',
      major: d.major || 'Computer Science',
      year: d.year || '1st Year',
      bio: d.bio || '',
      skills: Array.isArray(d.skills) ? d.skills : [],
      interests: Array.isArray(d.interests) ? d.interests : [],
      skillLevel: d.skill_level || 'Beginner',
      rating: d.rating ? String(d.rating) : '5.0',
      points: d.points ?? 100,
      sessions: d.sessions_count ?? 0,
      communities: d.communities_count ?? 1,
      streak: d.streak || '1 day',
      avatar: d.avatar_url || DEFAULT_AVATAR,
    }));
  } catch (err) {
    console.error('Error fetching registered profiles:', err);
    return [];
  }
}

export async function createChatThread(participantIds: string[], title?: string, isGroup: boolean = false) {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: new Error('Supabase not configured') };
  try {
    const { data: thread, error: threadErr } = await client
      .from('chat_threads')
      .insert([{ title, is_group: isGroup }])
      .select('*')
      .single();

    if (threadErr || !thread) return { data: null, error: threadErr };

    const participants = participantIds.map((userId) => ({
      thread_id: thread.id,
      user_id: userId,
    }));

    const { error: partErr } = await client.from('chat_participants').insert(participants);
    if (partErr) return { data: null, error: partErr };

    return { data: thread, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

export async function getOrCreateDirectThread(currentUserId: string, recipientUser: UserProfile) {
  const client = getSupabaseClient();
  const recipientId = recipientUser.id;

  if (!client || !recipientId) {
    const fallbackId = `thread-${recipientUser.name.toLowerCase().replace(/\s+/g, '-')}`;
    return {
      id: fallbackId,
      name: recipientUser.name,
      preview: 'Tap to send a live message...',
      time: 'Just now',
      avatar: recipientUser.avatar,
      online: true,
    };
  }

  try {
    // Check existing threads shared between currentUserId and recipientId
    const { data: myThreads } = await client
      .from('chat_participants')
      .select('thread_id')
      .eq('user_id', currentUserId);

    if (myThreads && myThreads.length > 0) {
      const myThreadIds = myThreads.map((t: any) => t.thread_id);
      const { data: common } = await client
        .from('chat_participants')
        .select('thread_id')
        .eq('user_id', recipientId)
        .in('thread_id', myThreadIds);

      if (common && common.length > 0) {
        const threadId = common[0].thread_id;
        return {
          id: threadId,
          name: recipientUser.name,
          preview: 'Tap to view live messages...',
          time: 'Active',
          avatar: recipientUser.avatar,
          online: true,
        };
      }
    }

    // Create new direct thread
    const res = await createChatThread([currentUserId, recipientId], recipientUser.name, false);
    if (res.data) {
      return {
        id: res.data.id,
        name: recipientUser.name,
        preview: 'New conversation started',
        time: 'Just now',
        avatar: recipientUser.avatar,
        online: true,
      };
    }
  } catch (err) {
    console.error('Error resolving direct thread:', err);
  }

  const fallbackId = `thread-${recipientId}`;
  return {
    id: fallbackId,
    name: recipientUser.name,
    preview: 'Tap to send a live message...',
    time: 'Just now',
    avatar: recipientUser.avatar,
    online: true,
  };
}

export async function getUserThreads(userId: string): Promise<ThreadPreview[]> {
  const client = getSupabaseClient();
  if (!client || !userId) return [];
  try {
    const { data: parts, error } = await client
      .from('chat_participants')
      .select('thread_id, chat_threads(*)')
      .eq('user_id', userId);

    if (error || !parts) return [];

    const threadPreviewsList: ThreadPreview[] = [];

    for (const item of parts) {
      const threadObj = item.chat_threads;
      if (!threadObj) continue;

      // Find other participant profile
      const { data: otherParts } = await client
        .from('chat_participants')
        .select('user_id, profiles(*)')
        .eq('thread_id', threadObj.id)
        .neq('user_id', userId);

      const otherUser = otherParts && otherParts.length > 0 ? (otherParts[0].profiles as any) : null;

      // Fetch last message for thread preview
      const { data: lastMsgs } = await client
        .from('messages')
        .select('*')
        .eq('thread_id', threadObj.id)
        .order('created_at', { ascending: false })
        .limit(1);

      const lastMsg = lastMsgs && lastMsgs.length > 0 ? lastMsgs[0] : null;

      threadPreviewsList.push({
        id: threadObj.id,
        name: otherUser?.full_name || threadObj.title || 'Chat',
        preview: lastMsg?.content || 'No messages yet',
        time: lastMsg?.created_at
          ? new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : 'Now',
        avatar: otherUser?.avatar_url || DEFAULT_AVATAR,
        online: true,
        isGroup: threadObj.is_group ?? false,
      });
    }

    return threadPreviewsList;
  } catch (err) {
    console.error('Error fetching user threads:', err);
    return [];
  }
}

// --- MEETUP & RECORDINGS SERVICES ---

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

