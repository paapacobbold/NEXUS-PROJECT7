import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActionRow,
  HeaderBar,
  LabelledInput,
  Pill,
  PrimaryButton,
  StatCard,
} from '../components/UIComponents';
import { useAppStore } from '../context/AppStoreContext';
import { brand, NotificationPrefs, profileBadges, UserProfile } from '../data/mockData';
import { styles } from '../styles/appStyles';

export function ProfileScreen({
  onEditProfile,
  onChangePassword,
  onNotificationPreferences,
  onSignOut,
}: {
  onEditProfile: () => void;
  onChangePassword: () => void;
  onNotificationPreferences: () => void;
  onSignOut?: () => void;
}) {
  const { profile, updateProfile, theme, setTheme } = useAppStore();
  const [endorsements, setEndorsements] = useState<Record<string, number>>({
    'Calculus III': 18,
    'Data Structures': 24,
    'Mentorship': 12,
    'Linear Algebra': 15,
  });

  const [reviews, setReviews] = useState([
    { id: 'rev-1', author: 'Ama Owusu', rating: 5, comment: 'Seyram explained Surface Integrals so clearly! Best tutor on campus.', date: '2 days ago' },
    { id: 'rev-2', author: 'Kofi Mensah', rating: 5, comment: 'Punctual, super patient, and provided awesome practice problem sheets.', date: '1 week ago' },
  ]);

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');

  const handleEndorseSkill = (skill: string) => {
    setEndorsements((prev) => ({
      ...prev,
      [skill]: (prev[skill] || 0) + 1,
    }));
    updateProfile({ points: 10 });
  };

  const handleAddReview = () => {
    if (!newComment.trim()) return;

    const newRev = {
      id: `rev-${Date.now()}`,
      author: 'You (Peer Reviewer)',
      rating: newRating,
      comment: newComment.trim(),
      date: 'Just now',
    };

    const updatedReviews = [newRev, ...reviews];
    setReviews(updatedReviews);

    // Calculate new average rating
    const avg = (updatedReviews.reduce((sum, r) => sum + r.rating, 0) / updatedReviews.length).toFixed(1);
    updateProfile({ rating: String(avg), points: 15 });

    setNewComment('');
    setShowReviewModal(false);
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.profileScrollContent}>
      <View style={styles.profileHero}>
        <Pressable onPress={onEditProfile} style={styles.floatingEditButton}>
          <Ionicons name="pencil" size={18} color="#fff" />
        </Pressable>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.profileTopRow}>
          <Image source={{ uri: profile.avatar }} style={styles.profileAvatar} />
          <View style={styles.onlineDot} />
        </View>

        <View style={styles.profileHeadingRow}>
          <View style={styles.flexFill}>
            <Text style={styles.profileName}>{profile.name}</Text>
            <Text style={styles.mutedCopySmall}>
              {profile.major} · {profile.year}
            </Text>
            <Text style={styles.mutedCopySmall}>{profile.university}</Text>

            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#137333" />
              <Text style={styles.verifiedText}>Verified Peer Tutor</Text>
            </View>

            <View style={[styles.levelBadgeChip, { marginTop: 6 }]}>
              <Text style={styles.levelBadgeText}>
                {profile.points >= 1000 ? 'Level 5: Campus Legend 🏆' : profile.points >= 750 ? 'Level 4: Scholar 🎓' : profile.points >= 500 ? 'Level 3: Master Peer ⭐' : profile.points >= 250 ? 'Level 2: Study Mentor ⚡' : 'Level 1: Academic Novice 📘'}
              </Text>
            </View>
          </View>
          <View style={styles.ratingPill}>
            <Ionicons name="star" size={12} color="#E3A322" />
            <Text style={styles.ratingText}>{profile.rating}</Text>
          </View>
        </View>

        <Text style={styles.profileBio}>{profile.bio}</Text>

        <View style={styles.statsRow}>
          <StatCard label="Sessions" value={String(profile.sessions)} />
          <StatCard label="Communities" value={String(profile.communities)} />
          <StatCard label="Points" value={String(profile.points)} />
        </View>

        {/* Skills & Interactive Endorsements */}
        <Text style={styles.subsectionTitle}>Endorsed Skills</Text>
        <View style={{ gap: 8, marginVertical: 6 }}>
          {profile.skills.map((skill) => (
            <View key={skill} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Pill label={skill} compact />
              <Pressable
                onPress={() => handleEndorseSkill(skill)}
                style={styles.endorseChip}
              >
                <Ionicons name="thumbs-up-outline" size={14} color={brand.primary} />
                <Text style={styles.endorseCount}>+1 Endorse ({endorsements[skill] || 12})</Text>
              </Pressable>
            </View>
          ))}
        </View>

        {/* Student Star Reviews Feed */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
          <Text style={styles.subsectionTitle}>Peer Tutor Reviews ({reviews.length})</Text>
          <Pressable onPress={() => setShowReviewModal(true)}>
            <Text style={{ color: brand.primary, fontWeight: '700', fontSize: 12 }}>+ Write Review</Text>
          </Pressable>
        </View>

        {reviews.map((rev) => (
          <View key={rev.id} style={styles.reviewCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontWeight: '800', fontSize: 13, color: brand.text }}>{rev.author}</Text>
              <Text style={styles.mutedCopySmall}>{rev.date}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 2 }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name="star"
                  size={12}
                  color={star <= rev.rating ? '#E3A322' : '#E2DFD7'}
                />
              ))}
            </View>
            <Text style={{ fontSize: 13, color: brand.text, marginTop: 2 }}>{rev.comment}</Text>
          </View>
        ))}

        <Text style={styles.subsectionTitle}>Earned Badges</Text>
        <View style={styles.badgesRow}>
          {profileBadges.map((badge) => (
            <View key={badge.id} style={styles.badgeCard}>
              <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
              <Text style={styles.badgeLabel}>{badge.label}</Text>
            </View>
          ))}
        </View>

        {/* Appearance & Theme Customization */}
        <Text style={styles.subsectionTitle}>App Theme Mode</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginVertical: 6 }}>
          {[
            { id: 'light', label: '☀️ Light', bg: '#F4F2EE', text: brand.text },
            { id: 'dark', label: '🌙 Dark', bg: '#1E202C', text: '#fff' },
            { id: 'midnight', label: '🌌 Midnight', bg: '#0A0D1A', text: '#F59E0B' },
          ].map((t) => (
            <Pressable
              key={t.id}
              onPress={() => setTheme(t.id as any)}
              style={[
                styles.flexFill,
                {
                  backgroundColor: t.bg,
                  paddingVertical: 10,
                  borderRadius: 14,
                  alignItems: 'center',
                  borderWidth: theme === t.id ? 2 : 1,
                  borderColor: theme === t.id ? brand.primary : brand.border,
                },
              ]}
            >
              <Text style={{ fontWeight: '800', fontSize: 13, color: t.text }}>{t.label}</Text>
            </Pressable>
          ))}
        </View>

        <ActionRow label="Account Settings" onPress={onEditProfile} icon="settings-outline" />
        <ActionRow label="Privacy & Security" onPress={onChangePassword} icon="shield-checkmark-outline" />
        <ActionRow
          label="Notification Preferences"
          onPress={onNotificationPreferences}
          icon="notifications-outline"
        />

        <Pressable onPress={onSignOut} style={styles.signOutButton}>
          <Ionicons name="log-out-outline" size={18} color={brand.danger} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
      </View>

      {/* Write Student Review Modal */}
      <Modal visible={showReviewModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Write Tutor Review ⭐</Text>
              <Pressable onPress={() => setShowReviewModal(false)}>
                <Ionicons name="close-circle" size={26} color={brand.muted} />
              </Pressable>
            </View>

            <Text style={styles.mutedCopySmall}>Rate your tutoring experience with {profile.name}</Text>

            {/* Interactive Star Picker */}
            <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'center', marginVertical: 10 }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable key={star} onPress={() => setNewRating(star)}>
                  <Ionicons
                    name={star <= newRating ? 'star' : 'star-outline'}
                    size={36}
                    color={star <= newRating ? '#E3A322' : brand.muted}
                  />
                </Pressable>
              ))}
            </View>

            <LabelledInput
              label="Review Feedback"
              value={newComment}
              onChangeText={setNewComment}
              placeholder="How was the tutoring session? Was the explanation clear?"
              multiline
            />

            <PrimaryButton label="Submit Review (+15 Pts)" onPress={handleAddReview} />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

export function EditProfileScreen({
  onBack,
  onSave,
}: {
  onBack: () => void;
  onSave: () => void;
}) {
  const { profile, updateProfile } = useAppStore();
  const [localProfile, setLocalProfile] = useState(profile);

  const updateField = (key: keyof UserProfile, value: string) => {
    setLocalProfile((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <SafeAreaView style={styles.lightScreen}>
      <ScrollView contentContainerStyle={styles.formScreen}>
        <View style={styles.screenHeaderRow}>
          <Pressable onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color={brand.text} />
          </Pressable>
          <Text style={styles.screenTitle}>Edit Profile</Text>
          <Pressable
            onPress={() => {
              updateProfile(localProfile);
              onSave();
            }}
            style={styles.saveChip}
          >
            <Text style={styles.saveChipText}>Save</Text>
          </Pressable>
        </View>

        <View style={styles.editAvatarWrap}>
          <Image source={{ uri: localProfile.avatar }} style={styles.editAvatar} />
          <View style={styles.editAvatarBadge}>
            <Ionicons name="camera-outline" size={16} color="#fff" />
          </View>
        </View>

        <LabelledInput
          label="Full Name"
          value={localProfile.name}
          onChangeText={(val) => updateField('name', val)}
          placeholder="Enter full name"
        />
        <LabelledInput
          label="University"
          value={localProfile.university}
          onChangeText={(val) => updateField('university', val)}
          placeholder="Enter university"
        />
        <LabelledInput
          label="Major / Field of Study"
          value={localProfile.major}
          onChangeText={(val) => updateField('major', val)}
          placeholder="Enter major"
        />
        <LabelledInput
          label="Year"
          value={localProfile.year}
          onChangeText={(val) => updateField('year', val)}
          placeholder="e.g. Senior · 4th Year"
        />
        <LabelledInput
          label="Bio"
          value={localProfile.bio}
          onChangeText={(val) => updateField('bio', val)}
          placeholder="Write a brief bio"
          multiline
        />

        <PrimaryButton
          label="Save Profile Changes"
          onPress={() => {
            updateProfile(localProfile);
            onSave();
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

export function ChangePasswordScreen({
  onBack,
  onSaved,
}: {
  onBack: () => void;
  onSaved?: () => void;
}) {
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  return (
    <SafeAreaView style={styles.lightScreen}>
      <ScrollView contentContainerStyle={styles.formScreen}>
        <HeaderBar title="Change Password" onBack={onBack} />
        <Text style={styles.sectionSubline}>Keep your NEXUS account secure with a strong password.</Text>

        <LabelledInput
          label="Current Password"
          value={currentPass}
          onChangeText={setCurrentPass}
          placeholder="Enter current password"
          secureTextEntry
        />
        <LabelledInput
          label="New Password"
          value={newPass}
          onChangeText={setNewPass}
          placeholder="Enter new password"
          secureTextEntry
        />
        <LabelledInput
          label="Confirm New Password"
          value={confirmPass}
          onChangeText={setConfirmPass}
          placeholder="Re-enter new password"
          secureTextEntry
        />

        <PrimaryButton label="Update Password" onPress={onBack} />
      </ScrollView>
    </SafeAreaView>
  );
}

export function NotificationPreferencesScreen({
  onBack,
  onSaved,
}: {
  onBack: () => void;
  onSaved?: () => void;
}) {
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    sessionReminders: true,
    communityPosts: true,
    meetupUpdates: true,
    directMessages: true,
    badgesAndPoints: true,
    weeklyDigest: false,
    promotions: false,
  });

  const toggle = (key: keyof NotificationPrefs) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <SafeAreaView style={styles.lightScreen}>
      <ScrollView contentContainerStyle={styles.formScreen}>
        <HeaderBar title="Notification Preferences" onBack={onBack} />
        <Text style={styles.sectionSubline}>Choose what updates you want to receive on mobile.</Text>

        <View style={styles.settingsCard}>
          <View style={[styles.preferenceRow, styles.preferenceRowBorder]}>
            <View style={styles.flexFill}>
              <Text style={styles.preferenceLabel}>New Session Broadcasts</Text>
              <Text style={styles.mutedCopySmall}>Get alerted when tutors launch live study sessions</Text>
            </View>
            <Switch
              value={prefs.sessionReminders}
              onValueChange={() => toggle('sessionReminders')}
              trackColor={{ true: brand.primary }}
            />
          </View>

          <View style={[styles.preferenceRow, styles.preferenceRowBorder]}>
            <View style={styles.flexFill}>
              <Text style={styles.preferenceLabel}>Direct Messages</Text>
              <Text style={styles.mutedCopySmall}>Alerts for chat messages from peers and tutors</Text>
            </View>
            <Switch
              value={prefs.directMessages}
              onValueChange={() => toggle('directMessages')}
              trackColor={{ true: brand.primary }}
            />
          </View>

          <View style={[styles.preferenceRow, styles.preferenceRowBorder]}>
            <View style={styles.flexFill}>
              <Text style={styles.preferenceLabel}>Community Post Replies</Text>
              <Text style={styles.mutedCopySmall}>Notifications when someone replies to your question</Text>
            </View>
            <Switch
              value={prefs.communityPosts}
              onValueChange={() => toggle('communityPosts')}
              trackColor={{ true: brand.primary }}
            />
          </View>

          <View style={styles.preferenceRow}>
            <View style={styles.flexFill}>
              <Text style={styles.preferenceLabel}>Weekly Study Digest</Text>
              <Text style={styles.mutedCopySmall}>Summary of your weekly learning hours and points</Text>
            </View>
            <Switch
              value={prefs.weeklyDigest}
              onValueChange={() => toggle('weeklyDigest')}
              trackColor={{ true: brand.primary }}
            />
          </View>
        </View>

        <PrimaryButton label="Save Preferences" onPress={onBack} />
      </ScrollView>
    </SafeAreaView>
  );
}
