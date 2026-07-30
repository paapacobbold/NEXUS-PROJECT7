import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import {
  Avatar,
  IconButton,
  Pill,
  StatCard,
} from '../components/UIComponents';
import { useAppStore } from '../context/AppStoreContext';
import { brand, liveSession } from '../data/mockData';
import { styles } from '../styles/appStyles';

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
        <Pressable onPress={onAction}>
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
  onOpenLiveSession?: () => void;
  onOpenCommunity?: () => void;
  onOpenLeaderboard?: () => void;
  onOpenRecordings?: () => void;
}) {
  const { profile, updateProfile, communitiesList, sessionsList, meetupsList, toggleRSVPMeetup } = useAppStore();
  const [loggedHours, setLoggedHours] = useState(2.5);

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
            updateProfile({ points: t.points });
          }
          return { ...t, done: nextDone };
        }
        return t;
      })
    );
  };

  const handleLogStudyTime = () => {
    setLoggedHours((prev) => Math.min(6.0, prev + 0.5));
    updateProfile({ points: 15 });
  };

  const completedTasksCount = dailyTasks.filter((t) => t.done).length;

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.screenContent}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.mutedCopy}>Good afternoon,</Text>
          <Text style={styles.titleLarge}>{profile.name.split(' ')[0]} 👋</Text>
        </View>
        <View style={styles.topActionRow}>
          <IconButton icon="search" onPress={onOpenSearch || onOpenFilters || (() => {})} />
          <IconButton icon="notifications-outline" badge="3" onPress={onOpenNotifications || onOpenFilters || (() => {})} />
          <Avatar source={profile.avatar} size={40} onPress={onOpenProfile || (() => {})} />
        </View>
      </View>

      <View style={styles.statsRow}>
        <StatCard label="Sessions" value={String(profile.sessions)} />
        <StatCard label="Points" value={String(profile.points)} accent="#E07038" />
        <StatCard label="Streak" value={profile.streak} accent="#59B980" />
      </View>

      {/* 7-Day Study Streak Calendar & Goal Tracker */}
      <View style={styles.streakCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="flame" size={22} color="#E07038" />
            <Text style={{ fontSize: 15, fontWeight: '800', color: brand.text }}>🔥 5-Day Active Streak</Text>
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
                color={d.active ? '#E07038' : brand.muted}
              />
            </View>
          ))}
        </View>

        {/* Log Study Time Action */}
        <Pressable onPress={handleLogStudyTime} style={{ alignSelf: 'flex-end', marginTop: 4 }}>
          <Text style={{ fontSize: 12, fontWeight: '800', color: brand.primary }}>+ Log 30 Min Study (+15 XP)</Text>
        </Pressable>
      </View>

      {/* Daily Study Goals Checklist */}
      <View style={{ marginBottom: 12 }}>
        <SectionHeading title={`Daily Study Goals (${completedTasksCount}/${dailyTasks.length})`} />
        {dailyTasks.map((task) => (
          <Pressable
            key={task.id}
            onPress={() => handleToggleTask(task.id)}
            style={styles.goalTaskCard}
          >
            <View style={styles.goalTaskRow}>
              <Ionicons
                name={task.done ? 'checkbox' : 'square-outline'}
                size={22}
                color={task.done ? brand.primary : brand.muted}
              />
              <Text
                style={{
                  flex: 1,
                  fontSize: 14,
                  fontWeight: '700',
                  color: task.done ? brand.muted : brand.text,
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
        <Pressable onPress={onOpenLeaderboard} style={[styles.flexFill, { backgroundColor: '#FFF4EB', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#FFE4D1' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="trophy" size={16} color="#E07038" />
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#B16A0E' }}>Leaderboard</Text>
          </View>
          <Text style={{ fontSize: 11, color: brand.muted, marginTop: 2 }}>Rankings & Rewards</Text>
        </Pressable>

        <Pressable onPress={onOpenRecordings} style={[styles.flexFill, { backgroundColor: '#EEF0FD', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#D9DCFA' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="videocam" size={16} color={brand.primary} />
            <Text style={{ fontSize: 13, fontWeight: '700', color: brand.primary }}>Recordings</Text>
          </View>
          <Text style={{ fontSize: 11, color: brand.muted, marginTop: 2 }}>Peer Video Lectures</Text>
        </Pressable>
      </View>

      <Pressable onPress={onOpenLiveSession} style={styles.liveCard}>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveBadgeText}>LIVE NOW</Text>
        </View>
        <Text style={styles.liveTitle}>{liveSession.title}</Text>
        <Text style={styles.liveMeta}>
          with {liveSession.tutor} · {liveSession.participants}
        </Text>
        <View style={styles.inlineButton}>
          <Ionicons name="play" size={14} color="#fff" />
          <Text style={styles.inlineButtonText}>Join Session</Text>
        </View>
      </Pressable>

      <SectionHeading title="Upcoming Sessions" actionLabel="See all" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
        {sessionsList.map((session) => (
          <View key={session.id} style={styles.sessionCard}>
            <Avatar source={session.image} size={34} />
            <Text style={styles.sessionTitle}>{session.title}</Text>
            <Text style={styles.sessionTime}>{session.time}</Text>
            <Text style={styles.sessionParticipants}>{session.participants}</Text>
          </View>
        ))}
      </ScrollView>

      <SectionHeading title="In-Person Campus Meetups" actionLabel="RSVP" />
      {meetupsList.map((meetup) => (
        <View key={meetup.id} style={[styles.communityRowCard, { flexDirection: 'column', alignItems: 'flex-start', padding: 14, gap: 6 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="location" size={16} color={brand.primary} />
              <Text style={styles.communityName}>{meetup.title}</Text>
            </View>
            <Pill label={`${meetup.rsvpCount} Attending`} compact />
          </View>
          <Text style={styles.mutedCopySmall}>📍 {meetup.location} · {meetup.dateTime}</Text>
          <Pressable
            onPress={() => toggleRSVPMeetup(meetup.id)}
            style={{ marginTop: 6, alignSelf: 'flex-end', backgroundColor: meetup.rsvpStatus ? '#D9F4DE' : brand.primary, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12 }}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: meetup.rsvpStatus ? '#2F8B4E' : '#fff' }}>
              {meetup.rsvpStatus ? '✓ Going' : '+ RSVP (+50 Pts)'}
            </Text>
          </Pressable>
        </View>
      ))}

      <SectionHeading title="My Communities" actionLabel="See all" />
      {communitiesList.slice(0, 3).map((community) => (
        <Pressable key={community.id} onPress={onOpenCommunity} style={styles.communityRowCard}>
          <Image source={{ uri: community.image }} style={styles.communityThumb} />
          <View style={styles.flexFill}>
            <Text style={styles.communityName}>{community.name}</Text>
            <Text style={styles.mutedCopySmall}>{community.members} members · {community.subject}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={brand.muted} />
        </Pressable>
      ))}
    </ScrollView>
  );
}
