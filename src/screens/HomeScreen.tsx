import { Feather, Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { Text } from '../components/Typography';
import {
  Avatar,
  IconButton,
  Pill,
  StatCard,
} from '../components/UIComponents';
import { AppImage } from '../components/AppImage';
import { useRefreshControl } from '../components/States';
import { useToast } from '../components/Toast';
import { notifySuccess, tapLight, tapMedium } from '../lib/haptics';
import { useAppStore } from '../context/AppStoreContext';
import { brand } from '../data/mockData';
import { styles, useThemeColors } from '../styles/appStyles';

const hitSlop = { top: 8, bottom: 8, left: 8, right: 8 };

function SectionHeading({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionHeadingRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {actionLabel ? (
        <Pressable hitSlop={hitSlop} onPress={onAction} style={({ pressed }) => [pressed && { opacity: 0.7 }]}>
          <Text style={styles.sectionLink}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function HomeScreen({
  onOpenSearch,
  onOpenNotifications,
  onOpenFilters,
  onOpenProfile,
  onOpenLiveSession,
  onOpenCommunity,
  onOpenLeaderboard,
  onOpenRecordings,
}: {
  onOpenSearch?: () => void;
  onOpenNotifications?: () => void;
  onOpenFilters?: () => void;
  onOpenProfile?: () => void;
  onOpenLiveSession?: (sessionId?: string) => void;
  onOpenCommunity?: (communityId?: string) => void;
  onOpenLeaderboard?: () => void;
  onOpenRecordings?: () => void;
}) {
  const colors = useThemeColors();
  const { profile, updateProfile, communitiesList, sessionsList, meetupsList, toggleRSVPMeetup } = useAppStore();
  const [loggedHours, setLoggedHours] = useState(2.5);
  const toast = useToast();

  const [dailyTasks, setDailyTasks] = useState([
    { id: 'task-1', title: 'Attend 1 Live Peer Session', points: 50, done: true },
    { id: 'task-2', title: 'Stream 1 Recorded Video Lecture', points: 25, done: false },
    { id: 'task-3', title: 'Download 1 PDF Course Guide', points: 20, done: true },
  ]);

  const streakDays = [
    { day: 'Mon', active: true },
    { day: 'Tue', active: true },
    { day: 'Wed', active: true },
    { day: 'Thu', active: true },
    { day: 'Fri', active: true },
    { day: 'Sat', active: false },
    { day: 'Sun', active: false },
  ];

  const handleToggleTask = (taskId: string) => {
    setDailyTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const nextDone = !t.done;
          if (nextDone) {
            notifySuccess();
            toast.show(`+${t.points} XP · ${t.title}`);
            updateProfile({ points: (profile.points || 0) + t.points });
          } else {
            tapLight();
          }
          return { ...t, done: nextDone };
        }
        return t;
      })
    );
  };

  const handleLogStudyTime = () => {
    setLoggedHours((prev) => Math.min(6.0, prev + 0.5));
    updateProfile({ points: (profile.points || 0) + 15 });
  };

  const completedTasksCount = dailyTasks.filter((t) => t.done).length;

  // Derive active live session dynamically from account & store
  const activeLiveSession = sessionsList.find((s) => s.isLive) || {
    id: 'my-live-room',
    title: `${profile.name}'s Virtual Study Room`,
    tutor: profile.name,
    participants: '0 / 20 participants',
    image: profile.avatar,
    isLive: true,
  };

  const joinedCommunities = communitiesList.filter((c) => c.joined);
  const refreshControl = useRefreshControl();

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.screenContent}
      refreshControl={refreshControl}
    >
      {/* Account Greeting Header */}
      <View style={styles.topRow}>
        <View>
          <Text style={styles.mutedCopy}>Good afternoon,</Text>
          <Text style={styles.titleLarge}>{profile.name.split(' ')[0] || 'Learner'}</Text>
        </View>
        <View style={styles.topActionRow}>
          <IconButton icon="search" onPress={onOpenSearch || onOpenFilters || (() => {})} />
          <IconButton icon="notifications-outline" badge="3" onPress={onOpenNotifications || onOpenFilters || (() => {})} />
          <Avatar source={profile.avatar} size={40} onPress={onOpenProfile || (() => {})} />
        </View>
      </View>

      {/* Account Activity Stats Row */}
      <View style={styles.statsRow}>
        <StatCard label="Sessions" value={String(profile.sessions || 0)} />
        <StatCard label="Points" value={String(profile.points || 0)} accent="#E07038" />
        <StatCard label="Streak" value={profile.streak || '1 day'} accent="#59B980" />
      </View>

      {/* Account 7-Day Study Streak Calendar */}
      <View style={styles.streakCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="flame" size={22} color="#E07038" />
            <Text style={{ fontSize: 15, fontWeight: '800', color: colors.text }}>{profile.streak || '5-Day Active Streak'}</Text>
          </View>
          <Pill label={`${loggedHours.toFixed(1)} / 3.0 Hrs Today`} compact tint="#EBF7EE" textColor="#2F8B4E" />
        </View>

        {/* 7-Day Weekday Chips */}
        <View style={styles.streakDaysRow}>
          {streakDays.map((d) => (
            <View key={d.day} style={[styles.streakDayItem, d.active ? styles.streakDayItemActive : undefined]}>
              <Text style={styles.streakDayName}>{d.day}</Text>
              <Ionicons
                name={d.active ? 'checkmark-circle' : 'ellipse-outline'}
                size={16}
                color={d.active ? '#E07038' : colors.muted}
              />
            </View>
          ))}
        </View>

        {/* Log Study Time Action */}
        <Pressable
          hitSlop={hitSlop}
          onPress={handleLogStudyTime}
          style={({ pressed }) => [{ alignSelf: 'flex-end', marginTop: 4 }, pressed && { opacity: 0.7, transform: [{ scale: 0.96 }] }]}
        >
          <Text style={{ fontSize: 12, fontWeight: '800', color: brand.primary }}>+ Log 30 Min Study (+15 XP)</Text>
        </Pressable>
      </View>

      {/* Account Daily Goals Checklist */}
      <View style={{ marginBottom: 12 }}>
        <SectionHeading title={`Daily Study Goals (${completedTasksCount}/${dailyTasks.length})`} />
        {dailyTasks.map((task) => (
          <Pressable
            key={task.id}
            hitSlop={hitSlop}
            onPress={() => handleToggleTask(task.id)}
            style={({ pressed }) => [styles.goalTaskCard, pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }]}
          >
            <View style={styles.goalTaskRow}>
              <Ionicons
                name={task.done ? 'checkbox' : 'square-outline'}
                size={22}
                color={task.done ? brand.primary : colors.muted}
              />
              <Text
                style={{
                  flex: 1,
                  fontSize: 14,
                  fontWeight: '700',
                  color: task.done ? colors.muted : colors.text,
                  textDecorationLine: task.done ? 'line-through' : 'none',
                }}
              >
                {task.title}
              </Text>
              <Pill label={`+${task.points} XP`} compact tint={task.done ? '#E6F4EA' : '#FFF4EB'} textColor={task.done ? '#137333' : '#B16A0E'} />
            </View>
          </Pressable>
        ))}
      </View>

      {/* Gamification & Recorded Quick Links */}
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
        <Pressable
          hitSlop={hitSlop}
          onPress={onOpenLeaderboard}
          style={({ pressed }) => [
            styles.flexFill,
            { backgroundColor: '#FFF4EB', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#FFE4D1' },
            pressed && { opacity: 0.75, transform: [{ scale: 0.96 }] },
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="trophy" size={16} color="#E07038" />
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#B16A0E' }}>Leaderboard</Text>
          </View>
          <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>Rankings & Rewards</Text>
        </Pressable>

        <Pressable
          hitSlop={hitSlop}
          onPress={onOpenRecordings}
          style={({ pressed }) => [
            styles.flexFill,
            { backgroundColor: '#EEF0FD', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#D9DCFA' },
            pressed && { opacity: 0.75, transform: [{ scale: 0.96 }] },
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="videocam" size={16} color={brand.primary} />
            <Text style={{ fontSize: 13, fontWeight: '700', color: brand.primary }}>Recordings</Text>
          </View>
          <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>Peer Video Lectures</Text>
        </Pressable>
      </View>

      {/* Dynamic Account Active Live Session Card */}
      <Pressable
        hitSlop={hitSlop}
        onPress={() => onOpenLiveSession?.()}
        style={({ pressed }) => [styles.liveCard, pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] }]}
      >
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveBadgeText}>LIVE NOW</Text>
        </View>
        <Text style={styles.liveTitle}>{activeLiveSession.title}</Text>
        <Text style={styles.liveMeta}>
          Host: {activeLiveSession.tutor} · {activeLiveSession.participants}
        </Text>
        <View style={styles.inlineButton}>
          <Ionicons name="play" size={14} color="#fff" />
          <Text style={styles.inlineButtonText}>Enter Virtual Lobby</Text>
        </View>
      </Pressable>

      {/* Dynamic Scheduled Live Sessions */}
      <SectionHeading title="Scheduled Live Sessions" actionLabel="See all" onAction={() => onOpenLiveSession?.()} />
      {sessionsList.length === 0 ? (
        <View style={{ backgroundColor: colors.card, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: colors.border, marginBottom: 12 }}>
          <Text style={{ fontSize: 13, color: colors.muted, textAlign: 'center' }}>
            No upcoming live sessions scheduled yet. Tap "+ Schedule Live" in Sessions to create one!
          </Text>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
          {sessionsList.map((session) => (
            <Pressable
              key={session.id}
              hitSlop={hitSlop}
              onPress={() => onOpenLiveSession?.(session.id)}
              style={({ pressed }) => [styles.sessionCard, pressed && { opacity: 0.8, transform: [{ scale: 0.96 }] }]}
            >
              <Avatar source={session.image} size={34} />
              <Text style={styles.sessionTitle}>{session.title}</Text>
              <Text style={styles.sessionTime}>{session.time}</Text>
              <Text style={styles.sessionParticipants}>{session.participants}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* Account Campus Meetups */}
      <SectionHeading title="In-Person Campus Meetups" actionLabel="RSVP" />
      {meetupsList.map((meetup) => (
        <View key={meetup.id} style={[styles.communityRowCard, { flexDirection: 'column', alignItems: 'flex-start', padding: 14, gap: 6 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, flexShrink: 1 }}>
              <Ionicons name="location" size={16} color={brand.primary} />
              <Text numberOfLines={1} style={[styles.communityName, { flexShrink: 1 }]}>{meetup.title}</Text>
            </View>
            <Pill label={`${meetup.rsvpCount} Attending`} compact />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Feather name="map-pin" size={12} color={colors.muted} />
            <Text style={styles.mutedCopySmall}>{meetup.location} · {meetup.dateTime}</Text>
          </View>
          <Pressable
            hitSlop={hitSlop}
            onPress={() => {
              tapMedium();
              toggleRSVPMeetup(meetup.id);
              toast.show(
                meetup.rsvpStatus ? `Cancelled RSVP for ${meetup.title}` : `You're going to ${meetup.title}`,
                meetup.rsvpStatus ? 'info' : 'success'
              );
            }}
            style={({ pressed }) => [
              { marginTop: 6, alignSelf: 'flex-end', backgroundColor: meetup.rsvpStatus ? '#D9F4DE' : brand.primary, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12 },
              pressed && { opacity: 0.75, transform: [{ scale: 0.95 }] },
            ]}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: meetup.rsvpStatus ? '#2F8B4E' : '#fff' }}>
              {meetup.rsvpStatus ? 'Going' : '+ RSVP (+50 Pts)'}
            </Text>
          </Pressable>
        </View>
      ))}

      {/* Account Joined Communities */}
      <SectionHeading title="My Communities" actionLabel="See all" onAction={() => onOpenCommunity?.()} />
      {joinedCommunities.length === 0 ? (
        <View style={{ backgroundColor: colors.card, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: colors.border, marginBottom: 16 }}>
          <Text style={{ fontSize: 13, color: colors.muted, textAlign: 'center' }}>
            You haven't joined any communities yet. Discover groups in the Communities tab!
          </Text>
        </View>
      ) : (
        joinedCommunities.slice(0, 3).map((community) => (
          <Pressable
            key={community.id}
            hitSlop={hitSlop}
            onPress={() => onOpenCommunity?.(community.id)}
            style={({ pressed }) => [styles.communityRowCard, pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }]}
          >
            <AppImage source={{ uri: community.image }} style={styles.communityThumb} />
            <View style={styles.flexFill}>
              <Text style={styles.communityName}>{community.name}</Text>
              <Text style={styles.mutedCopySmall}>{community.members} members · {community.subject}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}
