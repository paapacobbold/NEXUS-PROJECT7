import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Image,
  ImageBackground,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
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
import { useAppStore } from '../context/AppStoreContext';
import { brand, InPersonMeetup, liveSession } from '../data/mockData';
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

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.screenContent}>
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
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#6B21A8' }}>▶ Watch Recordings</Text>
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
            <Pressable onPress={() => setSelectedMeetupMap(meetup)}>
              <Text style={[styles.communityName, { color: brand.primary }]}>📍 {meetup.title}</Text>
            </Pressable>
            <Pill label={`${meetup.rsvpCount} Attending`} compact />
          </View>
          <Text style={styles.mutedCopySmall}>Location: {meetup.location}</Text>
          <Text style={styles.sessionTime}>🗓 {meetup.dateTime} · Host: {meetup.organizer}</Text>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
            <Pressable
              onPress={() => setSelectedMeetupMap(meetup)}
              style={{ backgroundColor: '#ECE7E0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <Ionicons name="map-outline" size={14} color={brand.text} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: brand.text }}>View Map Pin</Text>
            </Pressable>

            <Pressable
              onPress={() => toggleRSVPMeetup(meetup.id)}
              style={{ backgroundColor: meetup.rsvpStatus ? '#D9F4DE' : brand.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 }}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: meetup.rsvpStatus ? '#2F8B4E' : '#fff' }}>
                {meetup.rsvpStatus ? '✓ RSVP Confirmed' : 'RSVP (+50 Pts)'}
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
                <Text style={styles.directionsText}>🚶 ~3 min walk from Main Campus Science Complex</Text>
              </View>

              <Text style={{ color: brand.text, fontSize: 13 }}>
                Host: <Text style={{ fontWeight: '800' }}>{selectedMeetupMap.organizer}</Text> · {selectedMeetupMap.rsvpCount} Peer Learners Attending
              </Text>

              <PrimaryButton
                label={selectedMeetupMap.rsvpStatus ? '✓ Going (RSVP Confirmed)' : 'RSVP to Attend (+50 Pts)'}
                onPress={() => {
                  toggleRSVPMeetup(selectedMeetupMap.id);
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
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);

  const handleToggleCamera = async () => {
    if (!isCameraOn && !permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) return;
    }
    setIsCameraOn((prev) => !prev);
  };

  const activeParticipants = [
    { name: liveSession.tutor, role: 'Lead Peer Tutor', avatar: liveSession.image, isMuted: false },
    { name: profile.name + ' (You)', role: 'Student Learner', avatar: profile.avatar, isMuted },
    { name: 'Kofi Mensah', role: 'Student Learner', avatar: 'https://i.pravatar.cc/120?img=12', isMuted: true },
    { name: 'Ama Owusu', role: 'Student Learner', avatar: 'https://i.pravatar.cc/120?img=23', isMuted: false },
    { name: 'Kwame Asante', role: 'Student Learner', avatar: 'https://i.pravatar.cc/120?img=31', isMuted: true },
  ];

  return (
    <SafeAreaView style={styles.darkScreen}>
      <ImageBackground source={{ uri: liveSession.image }} style={styles.sessionLobbyBg} imageStyle={styles.coverImage}>
        <LinearGradient colors={['rgba(7,9,24,0.4)', 'rgba(7,9,24,0.92)']} style={styles.flexFill}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 14 }}>
            <View style={styles.liveBadgeOutline}>
              <View style={styles.liveDot} />
              <Text style={styles.liveBadgeText}>LIVE SESSION</Text>
            </View>

            {isHandRaised ? (
              <View style={styles.handRaisedBadge}>
                <Text style={styles.handRaisedText}>✋ Hand Raised</Text>
              </View>
            ) : null}
          </View>

          <Pressable onPress={() => setShowParticipants(true)} style={styles.sessionLobbyAttendees}>
            {activeParticipants.slice(0, 3).map((p) => (
              <Image key={p.name} source={{ uri: p.avatar }} style={styles.lobbyAvatar} />
            ))}
            <Pill label="+22 more" compact tint="rgba(255,255,255,0.2)" textColor="#fff" />
          </Pressable>

          <View style={styles.sessionLobbyCenter}>
            <Text style={styles.lobbyTitle}>{liveSession.title}</Text>
            <Text style={styles.lobbyMeta}>Lead Tutor: {liveSession.tutor} · 25 participants</Text>
          </View>

          <View style={styles.cameraPreviewWrap}>
            {isCameraOn && permission?.granted ? (
              <CameraView facing="front" style={styles.cameraPreviewImage} />
            ) : isCameraOn ? (
              <Image source={{ uri: profile.avatar }} style={styles.cameraPreviewImage} />
            ) : (
              <View style={styles.cameraOffOverlay}>
                <Ionicons name="videocam-off" size={24} color="rgba(255,255,255,0.5)" />
                <Text style={styles.cameraOffText}>Camera Off</Text>
              </View>
            )}
          </View>

          <View style={styles.sessionControls}>
            <View style={styles.controlItem}>
              <Pressable
                onPress={() => setIsMuted((prev) => !prev)}
                style={[styles.controlCircle, isMuted ? { backgroundColor: '#E45A4F' } : styles.controlCircleActive]}
              >
                <Ionicons name={isMuted ? 'mic-off' : 'mic'} size={20} color="#fff" />
              </Pressable>
              <Text style={styles.controlText}>{isMuted ? 'Muted' : 'Unmute'}</Text>
            </View>

            <View style={styles.controlItem}>
              <Pressable
                onPress={handleToggleCamera}
                style={[styles.controlCircle, isCameraOn ? styles.controlCircleActive : undefined]}
              >
                <Ionicons name={isCameraOn ? 'videocam' : 'videocam-off'} size={20} color="#fff" />
              </Pressable>
              <Text style={styles.controlText}>{isCameraOn ? 'Camera' : 'Cam Off'}</Text>
            </View>

            <View style={styles.controlItem}>
              <Pressable
                onPress={() => setIsHandRaised((prev) => !prev)}
                style={[styles.controlCircle, isHandRaised ? styles.controlCircleHand : undefined]}
              >
                <Ionicons name="hand-left" size={20} color="#fff" />
              </Pressable>
              <Text style={styles.controlText}>{isHandRaised ? 'Lower' : 'Raise'}</Text>
            </View>

            <View style={styles.controlItem}>
              <Pressable onPress={() => setShowParticipants(true)} style={styles.controlCircle}>
                <Ionicons name="people" size={20} color="#fff" />
              </Pressable>
              <Text style={styles.controlText}>Peers (25)</Text>
            </View>

            <View style={styles.controlItem}>
              <Pressable onPress={onLeave} style={[styles.controlCircle, styles.leaveCircle]}>
                <Ionicons name="call" size={20} color="#fff" />
              </Pressable>
              <Text style={styles.controlText}>Leave</Text>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>

      <Modal visible={showParticipants} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Session Attendees (25)</Text>
              <Pressable onPress={() => setShowParticipants(false)}>
                <Ionicons name="close-circle" size={26} color={brand.muted} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {activeParticipants.map((p) => (
                <View key={p.name} style={styles.participantRow}>
                  <Avatar source={p.avatar} size={40} />
                  <View style={styles.flexFill}>
                    <Text style={styles.communityName}>{p.name}</Text>
                    <Text style={styles.participantRole}>{p.role}</Text>
                  </View>
                  <Ionicons
                    name={p.isMuted ? 'mic-off' : 'mic'}
                    size={18}
                    color={p.isMuted ? brand.muted : '#59B980'}
                  />
                </View>
              ))}
            </ScrollView>

            <PrimaryButton label="Close" onPress={() => setShowParticipants(false)} />
          </View>
        </View>
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
