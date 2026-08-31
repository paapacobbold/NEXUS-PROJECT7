/** Chat threads, messages and realtime subscriptions. */
import { getSupabaseClient } from './client';
import {
  DEFAULT_AVATAR,
  MessageItem,
  ThreadPreview,
  UserProfile,
} from '@/data/mockData';

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
      attachmentPath: msg.attachment_path || undefined,
      attachmentName: msg.attachment_name || undefined,
      attachmentType: msg.attachment_type || undefined,
    }));
  } catch (err) {
    console.error('Error fetching messages:', err);
    return [];
  }
}

export type MessageAttachment = {
  path: string;
  name: string;
  mimeType?: string;
};

export async function sendSupabaseMessage(
  threadId: string,
  text: string,
  senderId?: string,
  attachment?: MessageAttachment
) {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: new Error('Supabase not configured') };
  let activeSenderId = senderId;
  if (!activeSenderId) {
    const { data: userData } = await client.auth.getUser();
    activeSenderId = userData?.user?.id;
  }
  return client.from('messages').insert([
    {
      thread_id: threadId,
      content: text,
      sender_id: activeSenderId || null,
      created_at: new Date().toISOString(),
      attachment_path: attachment?.path ?? null,
      attachment_name: attachment?.name ?? null,
      attachment_type: attachment?.mimeType ?? null,
    },
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
          // Without these an attachment sent by someone else arrives live as a
          // blank bubble — the file is only visible after a reload.
          attachmentPath: newMsg.attachment_path || undefined,
          attachmentName: newMsg.attachment_name || undefined,
          attachmentType: newMsg.attachment_type || undefined,
        });
      }
    )
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
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

  /** A thread row as the chat list renders it. Only id, preview and time vary. */
  const preview = (id: string, previewText: string, time: string) => ({
    id,
    name: recipientUser.name,
    preview: previewText,
    time,
    avatar: recipientUser.avatar,
    online: true,
  });

  if (!client || !recipientId) {
    return preview(
      `thread-${recipientUser.name.toLowerCase().replace(/\s+/g, '-')}`,
      'Tap to send a live message...',
      'Just now',
    );
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
        return preview(common[0].thread_id, 'Tap to view live messages...', 'Active');
      }
    }

    // Create new direct thread
    const res = await createChatThread([currentUserId, recipientId], recipientUser.name, false);
    if (res.data) {
      return preview(res.data.id, 'New conversation started', 'Just now');
    }
  } catch (err) {
    console.error('Error resolving direct thread:', err);
  }

  return preview(`thread-${recipientId}`, 'Tap to send a live message...', 'Just now');
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

    // Each thread needs its counterpart profile and its last message. Awaiting
    // those inside a loop made the chat list cost two serial round trips per
    // thread, so a ten-thread list waited on twenty. They are independent per
    // thread, so fan them out and await once.
    const threads = parts.map((item: any) => item.chat_threads).filter(Boolean);

    const threadPreviewsList = await Promise.all(
      threads.map(async (threadObj: any) => {
        const [{ data: otherParts }, { data: lastMsgs }] = await Promise.all([
          client
            .from('chat_participants')
            .select('user_id, profiles(*)')
            .eq('thread_id', threadObj.id)
            .neq('user_id', userId),
          client
            .from('messages')
            .select('*')
            .eq('thread_id', threadObj.id)
            .order('created_at', { ascending: false })
            .limit(1),
        ]);

        const otherUser = otherParts && otherParts.length > 0 ? (otherParts[0].profiles as any) : null;
        const lastMsg = lastMsgs && lastMsgs.length > 0 ? lastMsgs[0] : null;

        return {
          id: threadObj.id,
          name: otherUser?.full_name || threadObj.title || 'Chat',
          preview: lastMsg?.content || 'No messages yet',
          time: lastMsg?.created_at
            ? new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'Now',
          avatar: otherUser?.avatar_url || DEFAULT_AVATAR,
          online: true,
          isGroup: threadObj.is_group ?? false,
        } satisfies ThreadPreview;
      }),
    );

    return threadPreviewsList;
  } catch (err) {
    console.error('Error fetching user threads:', err);
    return [];
  }
}
