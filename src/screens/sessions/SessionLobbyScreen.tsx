import { useEffect, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { Image, ImageBackground, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ParticipantVideo } from '@/components/media';
import { useToast } from '@/components/feedback';
import { Pill, Text } from '@/components/ui';
import { useAppStore } from '@/context/AppStoreContext';
import { DEFAULT_AVATAR, liveSession, UserProfile } from '@/data/mockData';
import {
  fetchAllProfiles,
  getMessages,
  sendSupabaseMessage,
  subscribeToThreadMessages,
} from '@/lib/supabase';
import { useVideoRoom } from '@/lib/video';

import { InMeetingChatModal } from './components/InMeetingChatModal';
import { LobbyControlBar } from './components/LobbyControlBar';
import { ParticipantsModal } from './components/ParticipantsModal';

export function SessionLobbyScreen({
  onLeave,
  sessionId,
}: {
  onLeave: () => void;
  /** The session being joined. Falls back to the seeded demo session. */
  sessionId?: string;
}) {
  const { profile } = useAppStore();
  const [permission, requestPermission] = useCameraPermissions();
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [cameraFacing, setCameraFacing] = useState<'front' | 'back'>('front');
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [viewMode, setViewMode] = useState<'speaker' | 'gallery' | 'screenshare'>('speaker');
  const [showParticipants, setShowParticipants] = useState(false);
  const [showInMeetingChat, setShowInMeetingChat] = useState(false);
  const [showReactionsBar, setShowReactionsBar] = useState(false);
  const [searchRoster, setSearchRoster] = useState('');
  const [isMutedAll, setIsMutedAll] = useState(false);
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: string; emoji: string; left: number }[]>([]);
  const [draftChat, setDraftChat] = useState('');
  const [chatMessages, setChatMessages] = useState<{ id: string; sender: string; text: string; time: string }[]>([]);
  const [registeredPeers, setRegisteredPeers] = useState<UserProfile[]>([]);
  const toast = useToast();

  const sessionThreadId = 'live-session-room';

  // All call state comes from the active provider rather than local flags, so
  // swapping in a real SDK needs no changes here.
  // Every lobby used to join the same hard-coded room, so two different
  // sessions would put their participants in one call.
  const activeSessionId = sessionId || liveSession.id;

  const room = useVideoRoom({
    sessionId: activeSessionId,
    displayName: profile?.name || 'You',
    avatar: profile?.avatar,
  });

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    async function initMeetingServices() {
      const activeUserId = profile?.id || profile?.name || 'user-me';

      // 1. Fetch live in-meeting chat history from Supabase
      const history = await getMessages(sessionThreadId, activeUserId);
      if (history && history.length > 0) {
        setChatMessages(
          history.map((m) => ({
            id: m.id,
            sender: m.sender === 'me' ? profile?.name || 'You' : 'Peer Learner',
            text: m.text,
            time: m.time,
          }))
        );
      }

      // 2. Subscribe to real-time WebSocket chat updates
      unsubscribe = subscribeToThreadMessages(
        sessionThreadId,
        (newMsg) => {
          setChatMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id || (m.text === newMsg.text && m.sender === (profile?.name || 'You')))) {
              return prev;
            }
            return [
              ...prev,
              {
                id: newMsg.id,
                sender: newMsg.sender === 'me' ? profile?.name || 'You' : 'Peer Learner',
                text: newMsg.text,
                time: newMsg.time,
              },
            ];
          });
        },
        activeUserId
      );

      // 3. Fetch live registered profiles for Zoom roster & video grid
      const peers = await fetchAllProfiles(profile?.id);
      if (peers) {
        setRegisteredPeers(peers);
      }
    }

    initMeetingServices();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [profile?.id, profile?.name]);

  // Mirror control changes into the provider so a real SDK publishes/unpublishes.
  useEffect(() => {
    room.setMuted(isMuted);
  }, [isMuted]);

  useEffect(() => {
    room.setCameraEnabled(isCameraOn);
  }, [isCameraOn]);

  useEffect(() => {
    room.setHandRaised(isHandRaised);
  }, [isHandRaised]);

  const handleToggleCamera = async () => {
    if (!isCameraOn && !permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) return;
    }
    setIsCameraOn((prev) => !prev);
  };

  const handleFlipCamera = () => {
    setCameraFacing((prev) => (prev === 'front' ? 'back' : 'front'));
    // Without this the provider keeps publishing the original camera, so the
    // button only flipped the preview and never the outgoing track.
    room.switchCamera();
  };

  const triggerReaction = (emoji: string) => {
    const id = `emoji-${Date.now()}-${Math.random()}`;
    const left = Math.floor(Math.random() * 60) + 20; // 20% to 80% horizontal offset
    setFloatingEmojis((prev) => [...prev, { id, emoji, left }]);

    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((e) => e.id !== id));
    }, 2400);
  };

  const handleSendInMeetingChat = async () => {
    if (!draftChat.trim()) return;
    const textToSend = draftChat.trim();
    setDraftChat('');

    const newMsg = {
      id: `chat-${Date.now()}`,
      sender: profile?.name || 'You',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setChatMessages((prev) => [...prev, newMsg]);

    try {
      await sendSupabaseMessage(sessionThreadId, textToSend, profile?.id);
    } catch (err) {
      console.warn('In-meeting chat send error:', err);
    }
  };

  const activeHostName = liveSession.tutor && liveSession.tutor !== 'Priya Sharma' ? liveSession.tutor : (profile?.name || 'Lead Peer Tutor');
  const activeHostAvatar = profile?.avatar || DEFAULT_AVATAR;
  const activeSessionTitle = liveSession.title || (profile?.name ? profile.name + "'s Live Study Session" : 'Live Peer Session');

  // The roster reflects who the provider reports as connected. It used to be
  // assembled from every registered profile with alternating mute/camera flags,
  // which showed people who were not in the call and states that were invented.
  const participantsList = useMemo(
    () => [
      {
        id: 'self',
        name: (profile?.name || 'You') + ' (You)',
        role: 'You',
        avatar: profile?.avatar || DEFAULT_AVATAR,
        isMuted,
        isCameraOn,
        isHandRaised,
      },
      ...room.remotes.map((p) => ({
        id: p.id,
        name: p.name,
        role: 'Participant',
        avatar: p.avatar || DEFAULT_AVATAR,
        isMuted: p.isMuted,
        isCameraOn: p.isCameraOn,
        isHandRaised: p.isHandRaised,
      })),
    ],
    [profile?.name, profile?.avatar, isMuted, isCameraOn, isHandRaised, room.remotes],
  );

  const filteredRoster = useMemo(() => {
    const needle = searchRoster.toLowerCase();
    if (!needle) return participantsList;
    return participantsList.filter((p) => p.name.toLowerCase().includes(needle));
  }, [participantsList, searchRoster]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0B0F19' }}>
      {/* Zoom Top Control Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 10,
          backgroundColor: '#111827',
          borderBottomWidth: 1,
          borderBottomColor: '#1F2937',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' }} />
          <Text style={{ color: '#EF4444', fontSize: 11, fontWeight: '800' }}>● REC 00:42:15</Text>
          <View style={{ width: 1, height: 12, backgroundColor: '#374151', marginHorizontal: 4 }} />
          <Ionicons
            name={room.supportsRemoteMedia ? 'shield-checkmark' : 'eye-outline'}
            size={14}
            color={room.supportsRemoteMedia ? '#10B981' : '#F59E0B'}
          />
          <Text style={{ color: '#9CA3AF', fontSize: 11 }}>
            {room.supportsRemoteMedia ? 'Encrypted' : 'Camera preview only'}
          </Text>
        </View>

        {room.status === 'failed' && room.error ? (
        <View style={{ backgroundColor: '#7F1D1D', paddingHorizontal: 16, paddingVertical: 8 }}>
          <Text style={{ color: '#FECACA', fontSize: 12 }}>{room.error}</Text>
        </View>
      ) : null}

      {/* View Mode Switcher */}
        <View style={{ flexDirection: 'row', backgroundColor: '#1F2937', borderRadius: 8, padding: 2 }}>
          <Pressable
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={() => setViewMode('speaker')}
            style={({ pressed }) => [
              {
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 6,
                backgroundColor: viewMode === 'speaker' ? '#3B82F6' : 'transparent',
              },
              pressed && { opacity: 0.8, transform: [{ scale: 0.94 }] },
            ]}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '600' }}>Speaker</Text>
          </Pressable>
          <Pressable
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={() => setViewMode('gallery')}
            style={({ pressed }) => [
              {
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 6,
                backgroundColor: viewMode === 'gallery' ? '#3B82F6' : 'transparent',
              },
              pressed && { opacity: 0.8, transform: [{ scale: 0.94 }] },
            ]}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '600' }}>Gallery</Text>
          </Pressable>
          <Pressable
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={() => setViewMode('screenshare')}
            style={({ pressed }) => [
              {
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 6,
                backgroundColor: viewMode === 'screenshare' ? '#3B82F6' : 'transparent',
              },
              pressed && { opacity: 0.8, transform: [{ scale: 0.94 }] },
            ]}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '600' }}>Share</Text>
          </Pressable>
        </View>
      </View>

      {/* Main Video Meeting Stage */}
      <View style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {/* Animated Floating Emoji Reactions Layer */}
        {floatingEmojis.map((item) => (
          <View
            key={item.id}
            style={{
              position: 'absolute',
              bottom: 120,
              left: `${item.left}%`,
              zIndex: 99,
              backgroundColor: 'rgba(0,0,0,0.6)',
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 20,
            }}
          >
            <Text style={{ fontSize: 28 }}>{item.emoji}</Text>
          </View>
        ))}

        {viewMode === 'speaker' ? (
          /* SPEAKER VIEW */
          <ImageBackground source={{ uri: activeHostAvatar }} style={{ flex: 1, justifyContent: 'space-between' }}>
            <LinearGradient colors={['rgba(11,15,25,0.3)', 'rgba(11,15,25,0.85)']} style={{ flex: 1, padding: 16 }}>
              {/* Speaker Header Info */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ backgroundColor: 'rgba(0,0,0,0.65)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}>
                  <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14 }}>{activeSessionTitle}</Text>
                  <Text style={{ color: '#9CA3AF', fontSize: 11 }}>Speaker: {activeHostName}</Text>
                </View>

                {isHandRaised ? (
                  <View style={{ backgroundColor: '#F97316', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="hand-left-outline" size={14} color="#FFFFFF" />
                      <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 12 }}>Hand Raised</Text>
                    </View>
                  </View>
                ) : null}
              </View>

              {/* Active Speaker Spotlight Indicator */}
              <View
                style={{
                  marginTop: 'auto',
                  alignSelf: 'flex-start',
                  backgroundColor: 'rgba(16,185,129,0.2)',
                  borderColor: '#10B981',
                  borderWidth: 1.5,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Ionicons name="mic" size={14} color="#10B981" />
                <Text style={{ color: '#10B981', fontWeight: '700', fontSize: 12 }}>Active Speaker: {activeHostName}</Text>
              </View>
            </LinearGradient>

            {/* Local PiP User Camera View */}
            <View
              style={{
                position: 'absolute',
                bottom: 20,
                right: 16,
                width: 120,
                height: 160,
                borderRadius: 12,
                overflow: 'hidden',
                borderWidth: 2,
                borderColor: '#3B82F6',
                backgroundColor: '#1F2937',
              }}
            >
              {room.supportsRemoteMedia && room.local ? (
                <ParticipantVideo participant={room.local} mirror={cameraFacing === 'front'} />
              ) : isCameraOn && permission?.granted ? (
                <CameraView facing={cameraFacing} style={{ width: '100%', height: '100%' }} />
              ) : isCameraOn ? (
                <Image source={{ uri: profile.avatar }} style={{ width: '100%', height: '100%' }} />
              ) : (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111827' }}>
                  <Ionicons name="videocam-off" size={24} color="#6B7280" />
                  <Text style={{ color: '#9CA3AF', fontSize: 10, marginTop: 4 }}>Camera Off</Text>
                </View>
              )}

              <Pressable
                onPress={handleFlipCamera}
                style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  padding: 5,
                  borderRadius: 12,
                }}
              >
                <Ionicons name="camera-reverse-outline" size={14} color="#FFFFFF" />
              </Pressable>
              <View
                style={{
                  position: 'absolute',
                  bottom: 6,
                  left: 6,
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 4,
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 9, fontWeight: '700' }}>You</Text>
              </View>
            </View>
          </ImageBackground>
        ) : viewMode === 'gallery' ? (
          /* GALLERY GRID VIEW (2x3 Grid) */
          <ScrollView contentContainerStyle={{ padding: 12, gap: 10 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' }}>
              {participantsList.map((item) => (
                <View
                  key={item.id}
                  style={{
                    width: '48.5%',
                    height: 145,
                    borderRadius: 12,
                    overflow: 'hidden',
                    backgroundColor: '#1F2937',
                    borderWidth: item.name.includes(activeHostName) ? 2 : 1,
                    borderColor: item.name.includes(activeHostName) ? '#10B981' : '#374151',
                    position: 'relative',
                  }}
                >
                  {room.supportsRemoteMedia ? (
                    <ParticipantVideo
                      participant={
                        item.id === 'self'
                          ? room.local ?? {
                              id: 'self',
                              name: item.name,
                              avatar: item.avatar,
                              isLocal: true,
                              isMuted: item.isMuted,
                              isCameraOn: item.isCameraOn,
                              isSpeaking: false,
                              isHandRaised: item.isHandRaised,
                            }
                          : room.remotes.find((p) => p.id === item.id) ?? {
                              id: item.id,
                              name: item.name,
                              avatar: item.avatar,
                              isLocal: false,
                              isMuted: item.isMuted,
                              isCameraOn: item.isCameraOn,
                              isSpeaking: false,
                              isHandRaised: item.isHandRaised,
                            }
                      }
                      mirror={item.id === 'self' && cameraFacing === 'front'}
                    />
                  ) : item.id === (profile?.id || 'self') && isCameraOn && permission?.granted ? (
                    <CameraView facing={cameraFacing} style={{ width: '100%', height: '100%' }} />
                  ) : (
                    <Image source={{ uri: item.avatar }} style={{ width: '100%', height: '100%' }} />
                  )}

                  {/* Tile Footer Badge */}
                  <View
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      backgroundColor: 'rgba(0,0,0,0.7)',
                      paddingHorizontal: 8,
                      paddingVertical: 5,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Text numberOfLines={1} style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '600', flex: 1 }}>
                      {item.name}
                    </Text>
                    <Ionicons
                      name={item.isMuted ? 'mic-off' : 'mic'}
                      size={13}
                      color={item.isMuted ? '#EF4444' : '#10B981'}
                    />
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        ) : (
          /* SCREEN SHARE PRESENTATION VIEW */
          <View style={{ flex: 1, backgroundColor: '#0F172A', padding: 16 }}>
            <View
              style={{
                flex: 1,
                backgroundColor: '#1E293B',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: '#334155',
                padding: 16,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Ionicons name="desktop-outline" size={24} color="#38BDF8" />
                <Text style={{ color: '#38BDF8', fontWeight: '700', fontSize: 14 }}>
                  {activeHostName} is sharing screen: Live_Interactive_Deck.pdf
                </Text>
              </View>

              <View
                style={{
                  width: '100%',
                  height: 180,
                  backgroundColor: '#0F172A',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#334155',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: 12,
                }}
              >
                <Text style={{ color: '#F8FAFC', fontSize: 16, fontWeight: '800', textAlign: 'center' }}>
                  ∬_S (∇ × F) · dS = ∮_C F · dr
                </Text>
                <Text style={{ color: '#94A3B8', fontSize: 12, marginTop: 8, textAlign: 'center' }}>
                  Live Presentation & Collaborative Whiteboard Deck
                </Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                <Pill label="Slide 4 / 18" compact tint="rgba(56,189,248,0.2)" textColor="#38BDF8" />
                <Pill label="Annotating Live" compact tint="rgba(16,185,129,0.2)" textColor="#10B981" />
              </View>
            </View>

            {/* Inset Speaker PiP */}
            <View
              style={{
                position: 'absolute',
                top: 24,
                right: 24,
                width: 90,
                height: 110,
                borderRadius: 10,
                overflow: 'hidden',
                borderWidth: 2,
                borderColor: '#38BDF8',
              }}
            >
              <Image source={{ uri: activeHostAvatar }} style={{ width: '100%', height: '100%' }} />
            </View>
          </View>
        )}
      </View>

      {/* Floating Emoji Reactions Bar */}
      {showReactionsBar ? (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            backgroundColor: '#1F2937',
            paddingVertical: 10,
            paddingHorizontal: 16,
            borderTopWidth: 1,
            borderTopColor: '#374151',
          }}
        >
          {['👏', '👍', '🔥', '❤️', '🎉', '💡', '🙌'].map((emoji) => (
            <Pressable
              key={emoji}
              onPress={() => triggerReaction(emoji)}
              style={{
                padding: 8,
                backgroundColor: '#374151',
                borderRadius: 20,
              }}
            >
              <Text style={{ fontSize: 20 }}>{emoji}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <LobbyControlBar
        isMuted={isMuted}
        onToggleMute={() => setIsMuted((prev) => !prev)}
        isCameraOn={isCameraOn}
        onToggleCamera={handleToggleCamera}
        onFlipCamera={handleFlipCamera}
        onOpenChat={() => setShowInMeetingChat(true)}
        onOpenParticipants={() => setShowParticipants(true)}
        participantCount={participantsList.length}
        isHandRaised={isHandRaised}
        showReactionsBar={showReactionsBar}
        onToggleReactions={() => setShowReactionsBar((prev) => !prev)}
        onLeave={onLeave}
      />

      <InMeetingChatModal
        visible={showInMeetingChat}
        messages={chatMessages}
        draft={draftChat}
        onChangeDraft={setDraftChat}
        onSend={handleSendInMeetingChat}
        onClose={() => setShowInMeetingChat(false)}
      />

      <ParticipantsModal
        visible={showParticipants}
        participants={participantsList}
        filtered={filteredRoster}
        search={searchRoster}
        onChangeSearch={setSearchRoster}
        isMutedAll={isMutedAll}
        onMuteAll={() =>
          toast.show(
            'Muting everyone needs host controls on the server — not deployed yet.',
            'info'
          )
        }
        onClose={() => setShowParticipants(false)}
      />
    </SafeAreaView>
  );
}
