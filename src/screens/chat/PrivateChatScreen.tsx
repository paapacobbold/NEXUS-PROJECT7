import { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import {
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useToast } from '@/components/feedback';
import { Avatar, CircleIconButton, Text } from '@/components/ui';
import { useAppStore } from '@/context/AppStoreContext';
import { brand, MessageItem } from '@/data/mockData';
import { tapMedium } from '@/lib/haptics';
import {
  getMessages,
  sendSupabaseMessage,
  subscribeToThreadMessages,
} from '@/lib/supabase';
import { uploadFile, urlFor } from '@/lib/uploads';
import { styles, useThemeColors } from '@/styles/appStyles';
import { HIT_SLOP } from '@/styles/tokens';

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
            hitSlop={HIT_SLOP}
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
