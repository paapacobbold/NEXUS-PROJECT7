import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  TextInput,
  View,
} from 'react-native';
import { Text } from '../components/Typography';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppImage } from '../components/AppImage';
import { getIsAdmin, getMyProgress, ProgressSummary } from '../lib/supabase';
import { uploadFile } from '../lib/uploads';
import { useToast } from '../components/Toast';
import { notifyError } from '../lib/haptics';
import {
  ActionRow,
  ThemePicker,
  HeaderBar,
  LabelledInput,
  Pill,
  PrimaryButton,
  StatCard,
} from '../components/UIComponents';
import { useAppStore } from '../context/AppStoreContext';
import { brand, DEFAULT_AVATAR, NotificationPrefs, profileBadges, UserProfile } from '../data/mockData';
import { updateUserProfile } from '../lib/supabase';
import { styles, useThemeColors } from '../styles/appStyles';

export function ProfileScreen({
  onEditProfile,
  onChangePassword,
  onNotificationPreferences,
  onOpenModeration,
  onSignOut,
}: {
  onEditProfile: () => void;
  onChangePassword: () => void;
  onNotificationPreferences: () => void;
  onOpenModeration?: () => void;
  onSignOut?: () => void;
}) {
  const colors = useThemeColors();
  const { profile, updateProfile } = useAppStore();

  // Sessions and points used to be static values on the profile row. Read the
  // real totals from attendance and the points ledger instead, falling back to
  // the stored values until they load.
  const [progress, setProgress] = useState<ProgressSummary | null>(null);
  // The moderation queue is only offered to admins — a non-admin opening it
  // would see an empty list, because RLS returns only their own reports.
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let active = true;
    getIsAdmin().then((value) => {
      if (active) setIsAdmin(value);
    });
    return () => {
      active = false;
    };
  }, [profile.id]);

  useEffect(() => {
    let active = true;
    getMyProgress().then((summary) => {
      if (active) setProgress(summary);
    });
    return () => {
      active = false;
    };
  }, [profile.id]);
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
    updateProfile({ points: (profile.points || 0) + 10 });
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
    updateProfile({ rating: String(avg), points: (profile.points || 0) + 15 });

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
          <AppImage source={{ uri: profile.avatar }} style={styles.profileAvatar} />
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
                {profile.points >= 1000 ? 'Level 5: Campus Legend' : profile.points >= 750 ? 'Level 4: Scholar' : profile.points >= 500 ? 'Level 3: Master Peer' : profile.points >= 250 ? 'Level 2: Study Mentor' : 'Level 1: Academic Novice'}
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
          <StatCard
            label="Sessions"
            value={String(progress?.sessionsAttended ?? profile.sessions)}
          />
          <StatCard label="Communities" value={String(profile.communities)} />
          <StatCard label="Points" value={String(progress?.pointsEarned ?? profile.points)} />
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
              <Text style={{ fontWeight: '800', fontSize: 13, color: colors.text }}>{rev.author}</Text>
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
            <Text style={{ fontSize: 13, color: colors.text, marginTop: 2 }}>{rev.comment}</Text>
          </View>
        ))}

        <ThemePicker />

        <ActionRow label="Account Settings" onPress={onEditProfile} icon="settings-outline" />
        <ActionRow label="Privacy & Security" onPress={onChangePassword} icon="shield-checkmark-outline" />
        <ActionRow
          label="Notification Preferences"
          onPress={onNotificationPreferences}
          icon="notifications-outline"
        />

        {isAdmin && onOpenModeration ? (
          <ActionRow
            label="Moderation Queue"
            onPress={onOpenModeration}
            icon="shield-checkmark-outline"
          />
        ) : null}

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
                <Ionicons name="close-circle" size={26} color={colors.muted} />
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
                    color={star <= newRating ? '#E3A322' : colors.muted}
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
  const colors = useThemeColors();
  const { profile, updateProfile } = useAppStore();
  const toast = useToast();
  const [localProfile, setLocalProfile] = useState(profile);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [loadingPic, setLoadingPic] = useState(false);

  const updateField = (key: keyof UserProfile, value: any) => {
    setLocalProfile((prev) => ({ ...prev, [key]: value }));
  };

  const handlePickProfilePicture = async () => {
    try {
      setLoadingPic(true);
      const permResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permResult.granted === false) {
        notifyError();
        toast.show('Photo library access is needed to change your picture.', 'error');
        setLoadingPic(false);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedUri = result.assets[0].uri;

        // Show the local file straight away, then swap in the hosted URL. The
        // local file:// URI is device-only, so persisting it produced a broken
        // avatar everywhere else.
        updateField('avatar', selectedUri);
        setShowAvatarModal(false);

        const { url } = await uploadFile({
          bucket: 'avatars',
          userId: profile.id || '',
          uri: selectedUri,
          contentType: 'image/jpeg',
          fileName: 'avatar.jpg',
        });
        updateField('avatar', url);
        toast.show('Profile picture updated');
      }
    } catch (err) {
      toast.show(
        err instanceof Error ? err.message : 'Could not update your picture. Try again.',
        'error'
      );
    } finally {
      setLoadingPic(false);
    }
  };

  const handleSaveProfile = async () => {
    updateProfile(localProfile);

    if (profile?.id) {
      try {
        await updateUserProfile(profile.id, {
          full_name: localProfile.name,
          university: localProfile.university,
          major: localProfile.major,
          year: localProfile.year,
          bio: localProfile.bio,
          avatar_url: localProfile.avatar,
        });
      } catch (err) {
        console.warn('Sync profile update error:', err);
      }
    }

    onSave();
  };

  return (
    <SafeAreaView style={styles.lightScreen}>
      <ScrollView contentContainerStyle={styles.formScreen}>
        <View style={styles.screenHeaderRow}>
          <Pressable onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </Pressable>
          <Text style={styles.screenTitle}>Edit Profile</Text>
          <Pressable onPress={handleSaveProfile} style={styles.saveChip}>
            <Text style={styles.saveChipText}>Save</Text>
          </Pressable>
        </View>

        {/* Profile Avatar Display with Camera Badge */}
        <View style={{ alignItems: 'center', marginVertical: 12 }}>
          <Pressable
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={() => setShowAvatarModal(true)}
            style={({ pressed }) => [styles.editAvatarWrap, pressed && { opacity: 0.8, transform: [{ scale: 0.96 }] }]}
          >
            <AppImage source={{ uri: localProfile.avatar }} style={styles.editAvatar} />
            <View style={styles.editAvatarBadge}>
              <Ionicons name="camera-outline" size={18} color="#fff" />
            </View>
          </Pressable>
          <Pressable hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} onPress={() => setShowAvatarModal(true)}>
            <Text style={{ marginTop: 8, fontSize: 13, fontWeight: '700', color: brand.primary }}>
              Change Profile Picture
            </Text>
          </Pressable>
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

        <PrimaryButton label="Save Profile Changes" onPress={handleSaveProfile} />
      </ScrollView>

      {/* Change Profile Picture Modal */}
      <Modal visible={showAvatarModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Profile Picture</Text>
              <Pressable onPress={() => setShowAvatarModal(false)}>
                <Ionicons name="close-circle" size={26} color={colors.muted} />
              </Pressable>
            </View>

            <Text style={styles.mutedCopySmall}>Choose how you want to update your profile photo:</Text>

            {/* Option 1: Pick from Device Photos */}
            <Pressable
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={handlePickProfilePicture}
              style={({ pressed }) => [
                {
                  backgroundColor: brand.primary,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  marginVertical: 8,
                },
                pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
              ]}
            >
              <Ionicons name="images-outline" size={20} color="#FFFFFF" />
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14 }}>
                {loadingPic ? 'Opening Gallery...' : 'Choose Photo from Device Gallery'}
              </Text>
            </Pressable>

            {/* Option 2: Default Facebook Silhouette */}
            <Pressable
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={() => {
                updateField('avatar', DEFAULT_AVATAR);
                setShowAvatarModal(false);
              }}
              style={({ pressed }) => [
                {
                  backgroundColor: '#F3F4F6',
                  borderWidth: 1,
                  borderColor: '#D1D5DB',
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  marginBottom: 12,
                },
                pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
              ]}
            >
              <Ionicons name="person-circle-outline" size={20} color={colors.text} />
              <Text style={{ color: colors.text, fontWeight: '700', fontSize: 14 }}>
                Use Facebook Default Silhouette
              </Text>
            </Pressable>

            {/* Option 3: Custom Photo URL Input */}
            <LabelledInput
              label="Or Paste Custom Image URL"
              value={localProfile.avatar}
              onChangeText={(val) => updateField('avatar', val)}
              placeholder="https://example.com/my-photo.jpg"
            />

            <PrimaryButton label="Done" onPress={() => setShowAvatarModal(false)} />
          </View>
        </View>
      </Modal>
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();

  // The button used to call onBack() and nothing else — the screen collected
  // three passwords and discarded them.
  const handleUpdatePassword = async () => {
    if (!currentPass || !newPass || !confirmPass) {
      setError('Fill in all three fields.');
      return;
    }
    if (newPass.length < 8) {
      setError('Your new password must be at least 8 characters.');
      return;
    }
    if (newPass !== confirmPass) {
      setError('The new passwords do not match.');
      return;
    }
    if (newPass === currentPass) {
      setError('Your new password must be different from the current one.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const { changePassword } = await import('../lib/supabase');
      const { error: changeError } = await changePassword(currentPass, newPass);
      if (changeError) {
        setError(changeError.message);
        notifyError();
        return;
      }
      toast.show('Password updated');
      onSaved?.();
      onBack();
    } catch (err: any) {
      setError(err?.message || 'Could not update your password. Try again.');
      notifyError();
    } finally {
      setSaving(false);
    }
  };

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
          autoCapitalize="none"
          autoComplete="current-password"
          textContentType="password"
          light
        />
        <LabelledInput
          label="New Password"
          value={newPass}
          onChangeText={setNewPass}
          placeholder="At least 8 characters"
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          light
        />
        <LabelledInput
          label="Confirm New Password"
          value={confirmPass}
          onChangeText={setConfirmPass}
          placeholder="Re-enter new password"
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="go"
          light
        />

        {error ? (
          <View style={styles.authErrorBox}>
            <Ionicons name="alert-circle" size={18} color="#8C2F27" />
            <Text style={styles.authErrorText}>{error}</Text>
          </View>
        ) : null}

        <PrimaryButton
          label={saving ? 'Updating...' : 'Update Password'}
          onPress={handleUpdatePassword}
          loading={saving}
        />
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
