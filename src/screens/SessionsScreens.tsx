import { Feather, Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  ImageBackground,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { Text } from '../components/Typography';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Avatar,
  GhostSmallButton,
  HeaderBar,
  IconButton,
  LabelledInput,
  Pill,
  PrimaryButton,
  PrimarySmallButton,
} from '../components/UIComponents';
import { useRefreshControl } from '../components/States';
import { useToast } from '../components/Toast';
import { tapMedium } from '../lib/haptics';
import { useAppStore } from '../context/AppStoreContext';
import { brand, DEFAULT_AVATAR, InPersonMeetup, liveSession, UserProfile } from '../data/mockData';
import { fetchAllProfiles, getMessages, sendSupabaseMessage, subscribeToThreadMessages } from '../lib/supabase';
import { styles } from '../styles/appStyles';

export function SessionsScreen({
  onOpenFilters,
  onOpenSchedule,
  onOpenCreateMeetup,
  onOpenLiveSession,
  onOpenRecordings,
}: {
  onOpenFilters: () => void;
  onOpenSchedule: () => void;
  onOpenCreateMeetup: () => void;
  onOpenLiveSession: () => void;
  onOpenRecordings: () => void;
}) {
  const { sessionsList, meetupsList, toggleRSVPMeetup } = useAppStore();
  const [selectedMeetupMap, setSelectedMeetupMap] = useState<InPersonMeetup | null>(null);
  const refreshControl = useRefreshControl();
  const toast = useToast();

  const handleRSVP = (meetup: InPersonMeetup) => {
    tapMedium();
    toggleRSVPMeetup(meetup.id);
    toast.show(
      meetup.rsvpStatus ? `Cancelled RSVP for ${meetup.title}` : `You're going to ${meetup.title}`,
      meetup.rsvpStatus ? 'info' : 'success'
    );
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.screenContent}
      refreshControl={refreshControl}
    >
      <View style={styles.screenHeaderRow}>
        <Text style={styles.screenTitle}>Sessions & Meetups</Text>
        <IconButton icon="options-outline" onPress={onOpenFilters} />
      </View>

      <View style={styles.liveHeroCard}>
        <Text style={styles.liveHeroLabel}>Live session lobby</Text>
        <Text style={styles.liveHeroTitle}>{liveSession.title}</Text>
        <Text style={styles.liveHeroMeta}>25 participants · 120 min</Text>
        <View style={styles.buttonRow}>
          <PrimarySmallButton label="Join live now" onPress={onOpenLiveSession} />
          <GhostSmallButton label="+ Schedule Live" onPress={onOpenSchedule} />
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 10, marginVertical: 10 }}>
        <Pressable onPress={onOpenCreateMeetup} style={[styles.flexFill, { backgroundColor: '#EBF7EE', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#CDECD4' }]}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#2F8B4E' }}>+ Campus Meetup</Text>
          <Text style={{ fontSize: 11, color: brand.muted, marginTop: 2 }}>In-person peer study</Text>
        </Pressable>
        <Pressable onPress={onOpenRecordings} style={[styles.flexFill, { backgroundColor: '#F5EFFD', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#E3D3FB' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Feather name="play" size={13} color="#6B21A8" />
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#6B21A8' }}>Watch Recordings</Text>
          </View>
          <Text style={{ fontSize: 11, color: brand.muted, marginTop: 2 }}>Video modules</Text>
        </Pressable>
      </View>

      <View style={styles.sectionHeadingRow}>
        <Text style={styles.sectionTitle}>Scheduled Live Sessions</Text>
      </View>
      {sessionsList.map((session) => (
        <View key={session.id} style={styles.sessionListCard}>
          <View style={styles.sessionListTop}>
            <Avatar source={session.image} size={42} />
            <View style={styles.flexFill}>
              <Text style={styles.communityName}>{session.title}</Text>
              <Text style={styles.mutedCopySmall}>Tutor: {session.tutor}</Text>
            </View>
            <Pill label={session.tag} compact />
          </View>
          <Text style={styles.sessionTime}>{session.time}</Text>
          <Text style={styles.mutedCopySmall}>{session.participants}</Text>
        </View>
      ))}

      <View style={styles.sectionHeadingRow}>
        <Text style={styles.sectionTitle}>In-Person Campus Meetups</Text>
      </View>
      {meetupsList.map((meetup) => (
        <View key={meetup.id} style={[styles.sessionListCard, { gap: 8 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Pressable onPress={() => setSelectedMeetupMap(meetup)} style={{ flex: 1, flexShrink: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 }}>
                <Feather name="map-pin" size={14} color={brand.primary} />
                <Text numberOfLines={1} style={[styles.communityName, { color: brand.primary, flexShrink: 1 }]}>{meetup.title}</Text>
              </View>
            </Pressable>
            <Pill label={`${meetup.rsvpCount} Attending`} compact />
          </View>
          <Text style={styles.mutedCopySmall}>Location: {meetup.location}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Feather name="calendar" size={13} color={brand.muted} />
            <Text style={styles.sessionTime}>{meetup.dateTime} · Host: {meetup.organizer}</Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
            <Pressable
              onPress={() => setSelectedMeetupMap(meetup)}
              style={{ backgroundColor: '#ECE7E0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <Ionicons name="map-outline" size={14} color={brand.text} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: brand.text }}>View Map Pin</Text>
            </Pressable>

            <Pressable
              onPress={() => handleRSVP(meetup)}
              style={{ backgroundColor: meetup.rsvpStatus ? '#D9F4DE' : brand.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 }}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: meetup.rsvpStatus ? '#2F8B4E' : '#fff' }}>
                {meetup.rsvpStatus ? 'RSVP Confirmed' : 'RSVP (+50 Pts)'}
              </Text>
            </Pressable>
          </View>
        </View>
      ))}

      {/* Campus Location Map & Directions Modal */}
      {selectedMeetupMap ? (
        <Modal visible={Boolean(selectedMeetupMap)} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Campus Venue & Directions</Text>
                  <Text style={styles.mutedCopySmall}>{selectedMeetupMap.title}</Text>
                </View>
                <Pressable onPress={() => setSelectedMeetupMap(null)}>
                  <Ionicons name="close-circle" size={26} color={brand.muted} />
                </Pressable>
              </View>

              {/* Simulated Visual Campus Map Grid Box */}
              <View style={styles.mapPreviewBox}>
                <ImageBackground
                  source={{ uri: 'https://images.unsplash.com/photo-1524813686514-a57563d77965?auto=format&fit=crop&w=800&q=80' }}
                  style={styles.flexFill}
                  imageStyle={{ opacity: 0.75 }}
                >
                  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <View style={styles.mapPinMarker}>
                      <Ionicons name="location" size={24} color="#fff" />
                    </View>
                    <View style={{ backgroundColor: 'rgba(0,0,0,0.75)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 6 }}>
                      <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>{selectedMeetupMap.location}</Text>
                    </View>
                  </View>
                </ImageBackground>
              </View>

              {/* Walking Directions Banner */}
              <View style={styles.directionsCard}>
                <Ionicons name="walk-outline" size={20} color="#1E40AF" />
                <Text style={styles.directionsText}>~3 min walk from Main Campus Science Complex</Text>
              </View>

              <Text style={{ color: brand.text, fontSize: 13 }}>
                Host: <Text style={{ fontWeight: '800' }}>{selectedMeetupMap.organizer}</Text> · {selectedMeetupMap.rsvpCount} Peer Learners Attending
              </Text>

              <PrimaryButton
                label={selectedMeetupMap.rsvpStatus ? 'Going (RSVP Confirmed)' : 'RSVP to Attend (+50 Pts)'}
                onPress={() => {
                  handleRSVP(selectedMeetupMap);
                  setSelectedMeetupMap(null);
                }}
              />
            </View>
          </View>
        </Modal>
      ) : null}
    </ScrollView>
  );
}

export function ScheduleSessionScreen({
  onBack,
  onSubmit,
}: {
  onBack: () => void;
  onSubmit: () => void;
}) {
  const { addSession } = useAppStore();
  const [title, setTitle] = useState('Calculus III: Surface Integrals Review');
  const [tags, setTags] = useState('Mathematics');
  const [time, setTime] = useState('Tomorrow · 3:00 PM');
  const [description, setDescription] = useState(
    'We will cover surface integrals, common pitfalls, and short worked examples.',
  );

  const handleSchedule = () => {
    if (!title.trim()) return;
    addSession(title.trim(), tags.trim() || 'General', time.trim());
    onSubmit();
  };

  return (
    <SafeAreaView style={styles.lightScreen}>
      <ScrollView contentContainerStyle={styles.formScreen}>
        <HeaderBar title="Schedule Session" onBack={onBack} />

        <LabelledInput label="Session Title" value={title} onChangeText={setTitle} placeholder="e.g. Calculus III Review" />
        <LabelledInput label="Subject / Tag" value={tags} onChangeText={setTags} placeholder="e.g. Mathematics" />
        <LabelledInput label="Date & Time" value={time} onChangeText={setTime} placeholder="e.g. Tomorrow · 3:00 PM" />
        <LabelledInput
          label="Description"
          value={description}
          onChangeText={setDescription}
          placeholder="What will this session cover?"
          multiline
        />

        <PrimaryButton label="Schedule & Broadcast (+100 Pts)" onPress={handleSchedule} />
      </ScrollView>
    </SafeAreaView>
  );
}

export function SessionLobbyScreen({ onLeave }: { onLeave: () => void }) {
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

  const sessionThreadId = 'live-session-room';

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

  const handleToggleCamera = async () => {
    if (!isCameraOn && !permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) return;
    }
    setIsCameraOn((prev) => !prev);
  };

  const handleFlipCamera = () => {
    setCameraFacing((prev) => (prev === 'front' ? 'back' : 'front'));
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

  // Build dynamic participants list from active profile and registered Supabase members
  const participantsList = [
    {
      id: 'host',
      name: activeHostName,
      role: 'Host · Lead Tutor',
      avatar: activeHostAvatar,
      isMuted: false,
      isCameraOn: true,
      isHandRaised: false,
    },
    {
      id: profile?.id || 'self',
      name: (profile?.name || 'You') + ' (You)',
      role: 'Co-Host',
      avatar: profile?.avatar || DEFAULT_AVATAR,
      isMuted,
      isCameraOn,
      isHandRaised,
    },
    ...registeredPeers.map((p, idx) => ({
      id: p.id || `peer-${idx}`,
      name: p.name,
      role: p.major ? `${p.major} Student` : 'Peer Learner',
      avatar: p.avatar || DEFAULT_AVATAR,
      isMuted: isMutedAll ? true : idx % 2 === 0,
      isCameraOn: idx % 3 !== 0,
      isHandRaised: idx === 1,
    })),
  ];

  const filteredRoster = participantsList.filter((p) =>
    p.name.toLowerCase().includes(searchRoster.toLowerCase())
  );

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
          <Ionicons name="shield-checkmark" size={14} color="#10B981" />
          <Text style={{ color: '#9CA3AF', fontSize: 11 }}>Zoom Encrypted</Text>
        </View>

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
              {isCameraOn && permission?.granted ? (
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
                  {item.id === (profile?.id || 'self') && isCameraOn && permission?.granted ? (
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

      {/* Zoom Bottom Control Toolbar */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
          alignItems: 'center',
          paddingVertical: 12,
          paddingHorizontal: 8,
          backgroundColor: '#111827',
          borderTopWidth: 1,
          borderTopColor: '#1F2937',
        }}
      >
        {/* Mute Audio Toggle */}
        <Pressable
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          onPress={() => setIsMuted((prev) => !prev)}
          style={({ pressed }) => [{ alignItems: 'center', gap: 4 }, pressed && { opacity: 0.7, transform: [{ scale: 0.92 }] }]}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: isMuted ? '#EF4444' : '#374151',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Ionicons name={isMuted ? 'mic-off' : 'mic'} size={20} color="#FFFFFF" />
          </View>
          <Text style={{ color: '#9CA3AF', fontSize: 10 }}>{isMuted ? 'Unmute' : 'Mute'}</Text>
        </Pressable>

        {/* Video Cam Toggle */}
        <Pressable
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          onPress={handleToggleCamera}
          style={({ pressed }) => [{ alignItems: 'center', gap: 4 }, pressed && { opacity: 0.7, transform: [{ scale: 0.92 }] }]}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: isCameraOn ? '#374151' : '#EF4444',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Ionicons name={isCameraOn ? 'videocam' : 'videocam-off'} size={20} color="#FFFFFF" />
          </View>
          <Text style={{ color: '#9CA3AF', fontSize: 10 }}>{isCameraOn ? 'Stop Video' : 'Start Video'}</Text>
        </Pressable>

        {/* Flip Camera */}
        <Pressable
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          onPress={handleFlipCamera}
          style={({ pressed }) => [{ alignItems: 'center', gap: 4 }, pressed && { opacity: 0.7, transform: [{ scale: 0.92 }] }]}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: '#374151',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Ionicons name="camera-reverse" size={20} color="#FFFFFF" />
          </View>
          <Text style={{ color: '#9CA3AF', fontSize: 10 }}>Flip</Text>
        </Pressable>

        {/* In-Meeting Chat Drawer Toggle */}
        <Pressable
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          onPress={() => setShowInMeetingChat(true)}
          style={({ pressed }) => [{ alignItems: 'center', gap: 4 }, pressed && { opacity: 0.7, transform: [{ scale: 0.92 }] }]}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: '#374151',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Ionicons name="chatbubbles" size={20} color="#FFFFFF" />
          </View>
          <Text style={{ color: '#9CA3AF', fontSize: 10 }}>Chat</Text>
        </Pressable>

        {/* Participants Roster */}
        <Pressable
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          onPress={() => setShowParticipants(true)}
          style={({ pressed }) => [{ alignItems: 'center', gap: 4 }, pressed && { opacity: 0.7, transform: [{ scale: 0.92 }] }]}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: '#374151',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Ionicons name="people" size={20} color="#FFFFFF" />
          </View>
          <Text style={{ color: '#9CA3AF', fontSize: 10 }}>Peers ({participantsList.length})</Text>
        </Pressable>

        {/* Reactions Toggle */}
        <Pressable
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          onPress={() => setShowReactionsBar((prev) => !prev)}
          style={({ pressed }) => [{ alignItems: 'center', gap: 4 }, pressed && { opacity: 0.7, transform: [{ scale: 0.92 }] }]}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: isHandRaised || showReactionsBar ? '#F97316' : '#374151',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Ionicons name="happy" size={20} color="#FFFFFF" />
          </View>
          <Text style={{ color: '#9CA3AF', fontSize: 10 }}>Reactions</Text>
        </Pressable>

        {/* Leave Meeting */}
        <Pressable
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          onPress={onLeave}
          style={({ pressed }) => [{ alignItems: 'center', gap: 4 }, pressed && { opacity: 0.7, transform: [{ scale: 0.92 }] }]}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: '#DC2626',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Ionicons name="call" size={20} color="#FFFFFF" />
          </View>
          <Text style={{ color: '#EF4444', fontSize: 10, fontWeight: '700' }}>End</Text>
        </Pressable>
      </View>

      {/* Zoom In-Meeting Chat Drawer Modal */}
      <Modal visible={showInMeetingChat} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <View style={{ height: '70%', backgroundColor: '#111827', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700' }}>In-Meeting Live Chat</Text>
              <Pressable onPress={() => setShowInMeetingChat(false)}>
                <Ionicons name="close" size={24} color="#9CA3AF" />
              </Pressable>
            </View>

            <ScrollView style={{ flex: 1, marginBottom: 12 }}>
              {chatMessages.length === 0 ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
                  <Ionicons name="chatbox-ellipses-outline" size={36} color="#6B7280" />
                  <Text style={{ color: '#9CA3AF', marginTop: 8, fontSize: 13, textAlign: 'center' }}>
                    No messages yet. Send a live message to everyone in this meeting!
                  </Text>
                </View>
              ) : (
                chatMessages.map((msg) => (
                  <View key={msg.id} style={{ marginBottom: 12, backgroundColor: '#1F2937', padding: 10, borderRadius: 10 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ color: '#38BDF8', fontWeight: '700', fontSize: 13 }}>{msg.sender}</Text>
                      <Text style={{ color: '#6B7280', fontSize: 10 }}>{msg.time}</Text>
                    </View>
                    <Text style={{ color: '#F3F4F6', fontSize: 13 }}>{msg.text}</Text>
                  </View>
                ))
              )}
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <TextInput
                value={draftChat}
                onChangeText={setDraftChat}
                placeholder="Type a message to everyone..."
                placeholderTextColor="#6B7280"
                style={{
                  flex: 1,
                  backgroundColor: '#1F2937',
                  color: '#FFFFFF',
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 12,
                }}
                onSubmitEditing={handleSendInMeetingChat}
              />
              <Pressable
                onPress={handleSendInMeetingChat}
                style={{ backgroundColor: '#3B82F6', padding: 12, borderRadius: 12 }}
              >
                <Ionicons name="send" size={18} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Zoom Participant Roster Modal */}
      <Modal visible={showParticipants} animationType="slide" transparent>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#111827' }}>
          <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#1F2937', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700' }}>
              Participants ({participantsList.length})
            </Text>
            <Pressable onPress={() => setShowParticipants(false)}>
              <Ionicons name="close" size={24} color="#9CA3AF" />
            </Pressable>
          </View>

          {/* Roster Controls Bar */}
          <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 10 }}>
            <Pressable
              onPress={() => setIsMutedAll((prev) => !prev)}
              style={{
                flex: 1,
                backgroundColor: isMutedAll ? '#EF4444' : '#374151',
                paddingVertical: 10,
                borderRadius: 8,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 13 }}>
                {isMutedAll ? 'Unmute All' : 'Mute All'}
              </Text>
            </Pressable>
            <Pressable
              style={{
                flex: 1,
                backgroundColor: '#3B82F6',
                paddingVertical: 10,
                borderRadius: 8,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 13 }}>Invite Link</Text>
            </Pressable>
          </View>

          <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
            <TextInput
              value={searchRoster}
              onChangeText={setSearchRoster}
              placeholder="Search participant..."
              placeholderTextColor="#6B7280"
              style={{
                backgroundColor: '#1F2937',
                color: '#FFFFFF',
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 8,
              }}
            />
          </View>

          <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}>
            {filteredRoster.map((p) => (
              <View
                key={p.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: '#1F2937',
                }}
              >
                <Avatar source={p.avatar} size={42} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>{p.name}</Text>
                  <Text style={{ color: '#9CA3AF', fontSize: 12 }}>{p.role}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  {p.isHandRaised ? <Ionicons name="hand-left-outline" size={16} color="#F97316" /> : null}
                  <Ionicons
                    name={p.isMuted ? 'mic-off' : 'mic'}
                    size={18}
                    color={p.isMuted ? '#EF4444' : '#10B981'}
                  />
                  <Ionicons
                    name={p.isCameraOn ? 'videocam' : 'videocam-off'}
                    size={18}
                    color={p.isCameraOn ? '#10B981' : '#EF4444'}
                  />
                </View>
              </View>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

export function CreateMeetupScreen({
  onBack,
  onCreated,
}: {
  onBack: () => void;
  onCreated: () => void;
}) {
  const { addMeetup } = useAppStore();
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('KNUST Main Library Pod 4');
  const [dateTime, setDateTime] = useState('');

  const campusHotspots = [
    'KNUST Main Library Pod 4',
    'Science Complex Lab 2B',
    'Student Union Lounge',
    'Engineering Quad Bench',
  ];

  const handleCreate = () => {
    if (!title.trim() || !location.trim()) return;
    addMeetup(title.trim(), location.trim(), dateTime.trim() || 'Tomorrow · 4:00 PM');
    onCreated();
  };

  return (
    <SafeAreaView style={styles.lightScreen}>
      <ScrollView contentContainerStyle={styles.formScreen}>
        <HeaderBar title="Schedule Campus Meetup" onBack={onBack} />
        <Text style={styles.sectionHeadline}>In-Person Peer Session</Text>
        <Text style={styles.sectionSubline}>Organize face-to-face study groups or tutoring sessions on campus.</Text>

        <LabelledInput label="Meetup Title" value={title} onChangeText={setTitle} placeholder="e.g. KNUST Math Study Circle" />

        <Text style={styles.inputLabel}>Campus Hotspot Venue</Text>
        <View style={styles.hotspotWrap}>
          {campusHotspots.map((h) => (
            <Pressable
              key={h}
              onPress={() => setLocation(h)}
              style={[styles.hotspotChip, location === h ? styles.hotspotChipActive : undefined]}
            >
              <Text style={[styles.hotspotChipText, location === h ? styles.hotspotChipTextActive : undefined]}>{h}</Text>
            </Pressable>
          ))}
        </View>

        <LabelledInput label="Exact Location Details" value={location} onChangeText={setLocation} placeholder="e.g. Main Library 2nd Floor, Quiet Zone" />
        <LabelledInput label="Date & Time" value={dateTime} onChangeText={setDateTime} placeholder="e.g. Friday · 3:00 PM" />

        <PrimaryButton label="Publish Campus Meetup (+75 Pts)" onPress={handleCreate} />
      </ScrollView>
    </SafeAreaView>
  );
}
