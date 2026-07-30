import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Avatar,
  CircleIconButton,
  IconButton,
  SearchInput,
} from '../components/UIComponents';
import { useAppStore } from '../context/AppStoreContext';
import { brand, MessageItem } from '../data/mockData';
import { getMessages, sendSupabaseMessage, subscribeToThreadMessages } from '../lib/supabase';
import { styles } from '../styles/appStyles';

export function ChatListScreen({ onOpenThread }: { onOpenThread: () => void }) {
  const { threads } = useAppStore();

  return (
    <View style={[styles.flexFill, styles.screenContent]}>
      <View style={styles.screenHeaderRow}>
        <Text style={styles.screenTitle}>Messages</Text>
        <IconButton icon="add" onPress={onOpenThread} filled />
      </View>
      <SearchInput placeholder="Search conversations..." />

      <FlatList
        data={threads}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <Pressable
            onPress={onOpenThread}
            style={styles.threadRow}
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
  const { threads, messagesByThread, sendMessage } = useAppStore();
  const [draft, setDraft] = useState('');
  const [liveMessages, setLiveMessages] = useState<MessageItem[]>(
    messagesByThread[threadId] ?? messagesByThread.default
  );
  const flatListRef = useRef<FlatList<MessageItem>>(null);

  const thread = threads.find((item) => item.id === threadId) ?? threads[0];

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    async function initRealtimeChat() {
      // Load initial messages from Supabase
      const history = await getMessages(threadId);
      if (history && history.length > 0) {
        setLiveMessages(history);
      }

      // Subscribe to Realtime WebSocket updates
      unsubscribe = subscribeToThreadMessages(threadId, (newMsg) => {
        setLiveMessages((prev) => {
          // Avoid duplicate messages if already present
          if (prev.some((m) => m.id === newMsg.id || (m.text === newMsg.text && m.sender === 'me'))) {
            return prev;
          }
          return [...prev, newMsg];
        });
        flatListRef.current?.scrollToEnd({ animated: true });
      });
    }

    initRealtimeChat();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [threadId]);

  const handleSend = async () => {
    if (!draft.trim()) return;

    const textToSend = draft.trim();
    setDraft('');

    // Optimistic local state update
    sendMessage(thread.id, textToSend);
    setLiveMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        sender: 'me',
        text: textToSend,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    flatListRef.current?.scrollToEnd({ animated: true });

    // Persist to Supabase backend asynchronously
    try {
      await sendSupabaseMessage(threadId, textToSend);
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
          <Pressable onPress={onBack} style={styles.backButton} accessible={true} accessibilityRole="button" accessibilityLabel="Go back">
            <Ionicons name="arrow-back" size={20} color={brand.text} />
          </Pressable>
          <Avatar source={thread.avatar} size={38} />
          <View style={styles.flexFill}>
            <Text style={styles.threadName}>{thread.name}</Text>
            <Text style={styles.onlineText}>{thread.online ? 'Live Realtime Online' : 'Away'}</Text>
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
          ListHeaderComponent={<Text style={styles.chatDayMarker}>Today</Text>}
          renderItem={({ item: message }) => (
            <View
              style={[
                styles.messageBubble,
                message.sender === 'me' ? styles.messageBubbleMine : styles.messageBubbleTheirs,
              ]}
              accessible={true}
              accessibilityLabel={`Message from ${message.sender === 'me' ? 'you' : thread.name}: ${message.text} at ${message.time}`}
            >
              <Text
                style={[
                  styles.messageText,
                  message.sender === 'me' ? styles.messageTextMine : undefined,
                ]}
              >
                {message.text}
              </Text>
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
            placeholderTextColor={brand.muted}
            style={styles.composerInput}
            onSubmitEditing={handleSend}
          />
          <CircleIconButton
            icon="send"
            onPress={handleSend}
            filled
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
