import { useState } from 'react';
import { Feather, Ionicons } from '@expo/vector-icons';
import {
  ImageBackground,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';

import { EmptyState, useRefreshControl, useToast } from '@/components/feedback';
import {
  Avatar,
  GhostSmallButton,
  IconButton,
  Pill,
  PrimaryButton,
  PrimarySmallButton,
  Text,
} from '@/components/ui';
import { useAppStore } from '@/context/AppStoreContext';
import { brand, InPersonMeetup, liveSession } from '@/data/mockData';
import { tapMedium } from '@/lib/haptics';
import { styles, useThemeColors } from '@/styles/appStyles';

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
  onOpenLiveSession: (sessionId?: string) => void;
  onOpenRecordings: () => void;
}) {
  const colors = useThemeColors();
  const { sessionsList, meetupsList, toggleRSVPMeetup, selectedFilters } = useAppStore();
  const [selectedMeetupMap, setSelectedMeetupMap] = useState<InPersonMeetup | null>(null);
  const refreshControl = useRefreshControl();
  const toast = useToast();

  // The filters screen collected these and never applied them to anything.
  // Subject chips map onto a session's tag.
  const subjectFilters = selectedFilters.subject;
  const visibleSessions = subjectFilters.length
    ? sessionsList.filter((s) =>
        subjectFilters.some((subject) =>
          (s.tag || '').toLowerCase().includes(subject.toLowerCase())
        )
      )
    : sessionsList;

  /**
   * Opens the meetup location in the device's maps app.
   *
   * An embedded map needs a Google Maps API key on Android; this needs nothing
   * and also covers the SRS's optional "directions" bonus, since the maps app
   * routes from the user's current position.
   */
  const handleOpenInMaps = async (meetup: InPersonMeetup) => {
    const query = encodeURIComponent(meetup.location);
    const url = Platform.select({
      ios: `maps://?q=${query}`,
      android: `geo:0,0?q=${query}`,
      default: `https://www.google.com/maps/search/?api=1&query=${query}`,
    })!;

    try {
      const supported = await Linking.canOpenURL(url);
      await Linking.openURL(
        supported ? url : `https://www.google.com/maps/search/?api=1&query=${query}`
      );
    } catch {
      toast.show('Could not open Maps on this device.', 'error');
    }
  };

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
          <PrimarySmallButton label="Join live now" onPress={() => onOpenLiveSession()} />
          <GhostSmallButton label="+ Schedule Live" onPress={onOpenSchedule} />
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 10, marginVertical: 10 }}>
        <Pressable onPress={onOpenCreateMeetup} style={[styles.flexFill, { backgroundColor: '#EBF7EE', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#CDECD4' }]}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#2F8B4E' }}>+ Campus Meetup</Text>
          <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>In-person peer study</Text>
        </Pressable>
        <Pressable onPress={onOpenRecordings} style={[styles.flexFill, { backgroundColor: '#F5EFFD', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#E3D3FB' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Feather name="play" size={13} color="#6B21A8" />
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#6B21A8' }}>Watch Recordings</Text>
          </View>
          <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>Video modules</Text>
        </Pressable>
      </View>

      <View style={styles.sectionHeadingRow}>
        <Text style={styles.sectionTitle}>Scheduled Live Sessions</Text>
      </View>
      {visibleSessions.length === 0 ? (
        <EmptyState
          icon="funnel-outline"
          title="No sessions match your filters"
          message="Clear a filter or two to see more scheduled sessions."
          compact
        />
      ) : null}
      {visibleSessions.map((session) => (
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
          <Pressable
            onPress={() => handleOpenInMaps(meetup)}
            accessibilityRole="button"
            accessibilityLabel={`Open ${meetup.location} in Maps`}
            style={({ pressed }) => [styles.meetupLocationRow, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name="location-outline" size={14} color={brand.primary} />
            <Text style={[styles.mutedCopySmall, styles.meetupLocationText]}>{meetup.location}</Text>
          </Pressable>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Feather name="calendar" size={13} color={colors.muted} />
            <Text style={styles.sessionTime}>{meetup.dateTime} · Host: {meetup.organizer}</Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
            <Pressable
              onPress={() => setSelectedMeetupMap(meetup)}
              style={{ backgroundColor: '#ECE7E0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <Ionicons name="map-outline" size={14} color={colors.text} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text }}>View Map Pin</Text>
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
                  <Ionicons name="close-circle" size={26} color={colors.muted} />
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

              <Text style={{ color: colors.text, fontSize: 13 }}>
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
