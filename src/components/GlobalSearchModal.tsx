import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AppRoute, useAppStore } from '../context/AppStoreContext';
import { brand, sampleLeaderboard, sampleRecordings } from '../data/mockData';
import { styles } from '../styles/appStyles';
import { Avatar, Pill } from './UIComponents';

export type SearchEntity = 'All' | 'Communities' | 'Sessions' | 'Lectures' | 'Meetups' | 'Tutors';

export function GlobalSearchModal({
  visible,
  onClose,
  onNavigate,
}: {
  visible: boolean;
  onClose: () => void;
  onNavigate: (route: AppRoute) => void;
}) {
  const { communitiesList, sessionsList, meetupsList } = useAppStore();
  const [query, setQuery] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<SearchEntity>('All');

  if (!visible) return null;

  const entityFilters: SearchEntity[] = ['All', 'Communities', 'Sessions', 'Lectures', 'Meetups', 'Tutors'];

  // 1. Filter Communities
  const matchedCommunities = (selectedEntity === 'All' || selectedEntity === 'Communities')
    ? communitiesList.filter((c) =>
        !query.trim() || c.name.toLowerCase().includes(query.toLowerCase()) || c.subject.toLowerCase().includes(query.toLowerCase())
      ).map((c) => ({
        id: `comm-${c.id}`,
        title: c.name,
        subtitle: `Community · ${c.subject}`,
        type: 'Communities' as const,
        image: c.image,
        route: 'main-communities' as AppRoute,
      }))
    : [];

  // 2. Filter Live Sessions
  const matchedSessions = (selectedEntity === 'All' || selectedEntity === 'Sessions')
    ? sessionsList.filter((s) =>
        !query.trim() || s.title.toLowerCase().includes(query.toLowerCase()) || s.tutor.toLowerCase().includes(query.toLowerCase())
      ).map((s) => ({
        id: `sess-${s.id}`,
        title: s.title,
        subtitle: `Live Session · Tutor: ${s.tutor}`,
        type: 'Sessions' as const,
        image: s.image,
        route: 'main-sessions' as AppRoute,
      }))
    : [];

  // 3. Filter Recorded Lectures
  const matchedLectures = (selectedEntity === 'All' || selectedEntity === 'Lectures')
    ? sampleRecordings.filter((r) =>
        !query.trim() || r.title.toLowerCase().includes(query.toLowerCase()) || r.category.toLowerCase().includes(query.toLowerCase())
      ).map((r) => ({
        id: `rec-${r.id}`,
        title: r.title,
        subtitle: `Video Lecture · ${r.category} (${r.duration})`,
        type: 'Lectures' as const,
        image: r.thumbnail,
        route: 'recordings' as AppRoute,
      }))
    : [];

  // 4. Filter Meetups
  const matchedMeetups = (selectedEntity === 'All' || selectedEntity === 'Meetups')
    ? meetupsList.filter((m) =>
        !query.trim() || m.title.toLowerCase().includes(query.toLowerCase()) || m.location.toLowerCase().includes(query.toLowerCase())
      ).map((m) => ({
        id: `meet-${m.id}`,
        title: m.title,
        subtitle: `Campus Meetup · ${m.location}`,
        type: 'Meetups' as const,
        image: 'https://images.unsplash.com/photo-1524813686514-a57563d77965?auto=format&fit=crop&w=400&q=80',
        route: 'main-sessions' as AppRoute,
      }))
    : [];

  // 5. Filter Tutors
  const matchedTutors = (selectedEntity === 'All' || selectedEntity === 'Tutors')
    ? sampleLeaderboard.filter((t) =>
        !query.trim() || t.name.toLowerCase().includes(query.toLowerCase()) || t.role.toLowerCase().includes(query.toLowerCase())
      ).map((t) => ({
        id: `tutor-${t.name}`,
        title: t.name,
        subtitle: `Peer Tutor · ${t.role}`,
        type: 'Tutors' as const,
        image: t.avatar,
        route: 'main-profile' as AppRoute,
      }))
    : [];

  const allResults = [
    ...matchedCommunities,
    ...matchedSessions,
    ...matchedLectures,
    ...matchedMeetups,
    ...matchedTutors,
  ];

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.globalSearchBackdrop}>
        <View style={styles.globalSearchCard}>
          {/* Top Query Input Row */}
          <View style={styles.globalSearchInputRow}>
            <Ionicons name="search-outline" size={20} color={brand.muted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Instant search across NEXUS..."
              placeholderTextColor={brand.muted}
              style={styles.globalSearchInput}
              autoFocus
            />
            {query ? (
              <Pressable onPress={() => setQuery('')}>
                <Ionicons name="close-circle" size={20} color={brand.muted} />
              </Pressable>
            ) : null}
          </View>

          {/* Entity Category Filter Pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {entityFilters.map((entity) => (
              <Pressable
                key={entity}
                onPress={() => setSelectedEntity(entity)}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`Filter search results by ${entity}`}
              >
                <Pill label={entity} active={selectedEntity === entity} compact />
              </Pressable>
            ))}
          </ScrollView>

          {/* Results List */}
          <Text style={styles.mutedCopySmall}>Found {allResults.length} campus results</Text>
          {allResults.length === 0 ? (
            <View style={{ paddingVertical: 30, alignItems: 'center' }}>
              <Ionicons name="search-outline" size={32} color={brand.muted} />
              <Text style={[styles.mutedCopy, { marginTop: 8 }]}>No matching campus resources found.</Text>
            </View>
          ) : (
            <FlatList
              data={allResults}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: 380 }}
              initialNumToRender={8}
              maxToRenderPerBatch={10}
              windowSize={5}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    onClose();
                    onNavigate(item.route);
                  }}
                  style={styles.searchResultRow}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.title}, ${item.subtitle}`}
                >
                  <Avatar source={item.image} size={42} />
                  <View style={styles.flexFill}>
                    <Text style={styles.communityName} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.mutedCopySmall} numberOfLines={1}>{item.subtitle}</Text>
                  </View>
                  <View style={styles.entityBadge}>
                    <Text style={styles.entityBadgeText}>{item.type}</Text>
                  </View>
                </Pressable>
              )}
            />
          )}

          <Pressable onPress={onClose} style={[styles.primaryButton, { backgroundColor: '#ECE7E0', marginTop: 6 }]}>
            <Text style={[styles.primaryButtonText, { color: brand.text }]}>Close Search</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
