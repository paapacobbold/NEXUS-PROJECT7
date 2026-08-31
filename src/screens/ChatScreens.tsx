import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  TextInput,
  View,
} from 'react-native';
import { Text } from '../components/Typography';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Avatar,
  CircleIconButton,
  IconButton,
  SearchInput,
} from '../components/UIComponents';
import * as DocumentPicker from 'expo-document-picker';
import { Linking } from 'react-native';
import { EmptyState, useRefreshControl } from '../components/States';
import { useToast } from '../components/Toast';
import { tapMedium } from '../lib/haptics';
import { uploadFile, urlFor } from '../lib/uploads';
import { useAppStore } from '../context/AppStoreContext';
import { brand, MessageItem, ThreadPreview, UserProfile } from '../data/mockData';
import {
  fetchAllProfiles,
  getMessages,
  getOrCreateDirectThread,
  getUserThreads,
  sendSupabaseMessage,
  subscribeToThreadMessages,
} from '../lib/supabase';
import { styles, useThemeColors } from '../styles/appStyles';

const hitSlop = { top: 8, bottom: 8, left: 8, right: 8 };

export function ChatListScreen({
  onOpenThread,
  onSelectThread,
}: {
  onOpenThread: (threadId?: string) => void;
  onSelectThread?: (threadId: string) => void;
}) {
  const colors = useThemeColors();
  const { threads, profile } = useAppStore();
  const refreshControl = useRefreshControl();
  const [liveThreads, setLiveThreads] = useState<ThreadPreview[]>(threads);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [userList, setUserList] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadThreads = async () => {
    if (profile?.id) {
      const supThreads = await getUserThreads(profile.id);
      if (supThreads && supThreads.length > 0) {
        setLiveThreads(supThreads);
      }
    }
  };

  useEffect(() => {
    setLiveThreads(threads);
    loadThreads();
  }, [threads, profile.id]);

  const handleOpenNewChatModal = async () => {
    setShowNewChatModal(true);
    setLoadingUsers(true);
    const users = await fetchAllProfiles(profile.id);
    setUserList(users);
    setLoadingUsers(false);
  };

  const handleSelectUserToChat = async (user: UserProfile) => {
    setShowNewChatModal(false);
    const targetThread = await getOrCreateDirectThread(profile.id || 'user-1', user);
    setLiveThreads((prev) => {
      if (prev.some((t) => t.id === targetThread.id)) return prev;
      return [targetThread, ...prev];
    });
    if (onSelectThread) {
      onSelectThread(targetThread.id);
    } else {
      onOpenThread(targetThread.id);
    }
  };

  const filteredUsers = userList.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.major.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.university.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayThreads = liveThreads.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={[styles.flexFill, styles.screenContent]}>
      <View style={styles.screenHeaderRow}>
        <Text style={styles.screenTitle}>Messages</Text>
        <IconButton icon="add" onPress={handleOpenNewChatModal} filled />
      </View>
      <SearchInput
        placeholder="Search conversations..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {displayThreads.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: '#EEF2FF',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <Ionicons name="chatbubbles-outline" size={32} color={brand.primary} />
          </View>
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: 8 }}>
            No Conversations Yet
          </Text>
          <Text style={{ fontSize: 14, color: colors.muted, textAlign: 'center', marginBottom: 20 }}>
            Start a live real-time chat with another registered student or tutor!
          </Text>
          <Pressable
            hitSlop={hitSlop}
            onPress={handleOpenNewChatModal}
            style={({ pressed }) => [
              {
                backgroundColor: brand.primary,
                paddingHorizontal: 20,
                paddingVertical: 12,
                borderRadius: 12,
              },
              pressed && { opacity: 0.8, transform: [{ scale: 0.96 }] },
            ]}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 15 }}>+ Start New Live Chat</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={displayThreads}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
          ListEmptyComponent={
            <EmptyState
              icon="chatbubbles-outline"
              title="No conversations yet"
              message="Start a chat with a peer or tutor and it will show up here."
            />
          }
          renderItem={({ item }) => (
            <Pressable
              hitSlop={hitSlop}
              onPress={() => {
                if (onSelectThread) {
                  onSelectThread(item.id);
                } else {
                  onOpenThread(item.id);
                }
              }}
              style={({ pressed }) => [styles.threadRow, pressed && { opacity: 0.75, backgroundColor: '#F4F2EE' }]}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`Chat thread with ${item.name}, ${item.preview}`}
            >
              <Avatar source={item.avatar} size={44} />
              <View style={styles.flexFill}>
                <View style={styles.threadTop}>
                  <Text style={styles.threadName}>{item.name}</Text>
                  <Text style={styles.threadTime}>{item.time}</Text>
                </View>
                <Text numberOfLines={1} style={styles.threadPreview}>
                  {item.preview}
                </Text>
              </View>
              {item.unread ? (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{item.unread}</Text>
                </View>
              ) : null}
            </Pressable>
          )}
        />
      )}

      {/* New Chat Modal */}
      <Modal visible={showNewChatModal} animationType="slide" transparent={false}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.card }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 20,
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderBottomColor: brand.border,
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>New Live Chat</Text>
            <Pressable hitSlop={hitSlop} onPress={() => setShowNewChatModal(false)} style={({ pressed }) => [{ padding: 4 }, pressed && { opacity: 0.6 }]}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          <View style={{ paddingHorizontal: 20, paddingVertical: 12 }}>
            <SearchInput
              placeholder="Search registered members..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {loadingUsers ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color={brand.primary} />
              <Text style={{ marginTop: 12, color: colors.muted }}>Loading registered members...</Text>
            </View>
          ) : filteredUsers.length === 0 ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
              <Ionicons name="people-outline" size={48} color={colors.muted} />
              <Text style={{ marginTop: 12, fontSize: 16, color: colors.muted, textAlign: 'center' }}>
                No other registered users found. Sign up a second account to test live messaging!
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredUsers}
              keyExtractor={(item) => item.id || item.email}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
              renderItem={({ item }) => (
                <Pressable
                  hitSlop={hitSlop}
                  onPress={() => handleSelectUserToChat(item)}
                  style={({ pressed }) => [
                    {
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 12,
                      borderBottomWidth: 1,
                      borderBottomColor: brand.border,
                    },
                    pressed && { opacity: 0.7, backgroundColor: '#F8F9FA' },
                  ]}
                >
                  <Avatar source={item.avatar} size={48} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>{item.name}</Text>
                    <Text style={{ fontSize: 13, color: colors.muted }}>
                      {item.major} · {item.university}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.muted} />
                </Pressable>
              )}
            />
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
}

export function PrivateChatScreen({
  onBack,
  threadId,
}: {
  onBack: () => void;
  threadId: string;
}) {
  const { threads, messagesByThread, sendMessage, profile } = useAppStore();
  const [draft, setDraft] = useState('');
  const [attaching, setAttaching] = useState(false);
  const colors = useThemeColors();
  const toast = useToast();
  const [liveMessages, setLiveMessages] = useState<MessageItem[]>(
    messagesByThread[threadId] || []
  );
  const flatListRef = useRef<FlatList<MessageItem>>(null);

  const activeThread = threads.find((item) => item.id === threadId) || {
    id: threadId,
    name: 'Live Chat',
    preview: '',
    time: 'Now',
    avatar: 'https://i.pravatar.cc/120?u=chat',
    online: true,
  };

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    async function initRealtimeChat() {
      const activeUserId = profile?.id || 'user-me';

      // Fetch message history from Supabase
      const history = await getMessages(threadId, activeUserId);
      if (history && history.length > 0) {
        setLiveMessages(history);
      }

      // Subscribe to live WebSocket messages for threadId
      unsubscribe = subscribeToThreadMessages(
        threadId,
        (newMsg) => {
          setLiveMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id || (m.text === newMsg.text && m.sender === 'me'))) {
              return prev;
            }
            return [...prev, newMsg];
          });
          flatListRef.current?.scrollToEnd({ animated: true });
        },
        activeUserId
      );
    }

    initRealtimeChat();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [threadId, profile.id]);

  /**
   * Attaches a file to the conversation (SRS 3.7 — "file and link sharing").
   *
   * The picked file is uploaded first: a local file:// URI would only resolve
   * on the sender's device, so the recipient would see a dead link.
   */
  const handleAttach = async () => {
    if (attaching) return;
    try {
      const picked = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
      if (picked.canceled || !picked.assets?.length) return;

      const file = picked.assets[0];
      setAttaching(true);

      const { path } = await uploadFile({
        bucket: 'resources',
        userId: profile.id || '',
        uri: file.uri,
        fileName: file.name || undefined,
        contentType: file.mimeType || undefined,
      });

      const { error } = await sendSupabaseMessage(threadId, '', profile?.id, {
        path,
        name: file.name || 'Attachment',
        mimeType: file.mimeType || undefined,
      });
      if (error) throw error;

      setLiveMessages((prev: MessageItem[]) => [
        ...prev,
        {
          id: `att-${Date.now()}`,
          sender: 'me',
          text: '',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          attachmentPath: path,
          attachmentName: file.name || 'Attachment',
          attachmentType: file.mimeType || undefined,
        },
      ]);
      flatListRef.current?.scrollToEnd({ animated: true });
      tapMedium();
    } catch (err: any) {
      toast.show(err?.message || 'Could not send that file. Try again.', 'error');
    } finally {
      setAttaching(false);
    }
  };

  /** Attachments live in a private bucket, so open them through a signed URL. */
  const handleOpenAttachment = async (path: string) => {
    try {
      const signed = await urlFor('resources', path);
      await Linking.openURL(signed);
    } catch {
      toast.show('Could not open that attachment.', 'error');
    }
  };

  const handleSend = async () => {
    if (!draft.trim()) return;

    const textToSend = draft.trim();
    setDraft('');

    // Optimistic UI addition
    const newMsg: MessageItem = {
      id: `msg-${Date.now()}`,
      sender: 'me',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    sendMessage(activeThread.id, textToSend);
    setLiveMessages((prev) => [...prev, newMsg]);

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 50);

    // Send to Supabase live channel
    try {
      await sendSupabaseMessage(threadId, textToSend, profile?.id);
    } catch (err) {
      console.warn('Realtime message send error:', err);
    }
  };

  return (
    <SafeAreaView style={styles.lightScreen}>
      <KeyboardAvoidingView
        style={styles.flexFill}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.chatHeader}>
          <Pressable
            onPress={onBack}
            hitSlop={hitSlop}
            style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7 }]}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </Pressable>
          <Avatar source={activeThread.avatar} size={38} />
          <View style={styles.flexFill}>
            <Text style={styles.threadName}>{activeThread.name}</Text>
            <Text style={styles.onlineText}>Live Realtime Online</Text>
          </View>
          <CircleIconButton icon="information-circle-outline" onPress={onBack} />
        </View>

        <FlatList
          ref={flatListRef}
          data={liveMessages}
          keyExtractor={(item) => item.id}
          style={styles.flexFill}
          contentContainerStyle={styles.chatMessages}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListHeaderComponent={<Text style={styles.chatDayMarker}>Live Chat Session</Text>}
          renderItem={({ item: message }) => (
            <View
              style={[
                styles.messageBubble,
                message.sender === 'me' ? styles.messageBubbleMine : styles.messageBubbleTheirs,
              ]}
              accessible={true}
              accessibilityLabel={`Message: ${message.text} at ${message.time}`}
            >
              {message.attachmentPath ? (
                <Pressable
                  onPress={() => handleOpenAttachment(message.attachmentPath!)}
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${message.attachmentName || 'attachment'}`}
                  style={({ pressed }) => [styles.attachmentRow, pressed && { opacity: 0.7 }]}
                >
                  <Ionicons
                    name="document-attach"
                    size={18}
                    color={message.sender === 'me' ? '#fff' : brand.primary}
                  />
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.messageText,
                      styles.attachmentName,
                      message.sender === 'me' ? styles.messageTextMine : undefined,
                    ]}
                  >
                    {message.attachmentName || 'Attachment'}
                  </Text>
                </Pressable>
              ) : null}
              {message.text ? (
                <Text
                  style={[
                    styles.messageText,
                    message.sender === 'me' ? styles.messageTextMine : undefined,
                  ]}
                >
                  {message.text}
                </Text>
              ) : null}
              <Text
                style={[
                  styles.messageTime,
                  message.sender === 'me' ? styles.messageTimeMine : undefined,
                ]}
              >
                {message.time}
              </Text>
            </View>
          )}
        />

        <View style={styles.chatComposer}>
          <CircleIconButton icon="attach" onPress={onBack} light />
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Type a message..."
            placeholderTextColor={colors.muted}
            style={styles.composerInput}
            onSubmitEditing={handleSend}
          />
          <CircleIconButton
            icon={attaching ? 'hourglass-outline' : 'attach'}
            onPress={handleAttach}
            disabled={attaching}
            label={attaching ? 'Uploading attachment' : 'Attach a file'}
          />
          <CircleIconButton icon="send" onPress={handleSend} filled label="Send message" />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
