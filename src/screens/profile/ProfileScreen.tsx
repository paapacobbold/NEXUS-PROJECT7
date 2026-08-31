import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, View } from 'react-native';

import { AppImage } from '@/components/media';
import {
  ActionRow,
  LabelledInput,
  Pill,
  PrimaryButton,
  StatCard,
  Text,
  ThemePicker,
} from '@/components/ui';
import { useAppStore } from '@/context/AppStoreContext';
import { brand } from '@/data/mockData';
import { getIsAdmin, getMyProgress, ProgressSummary } from '@/lib/supabase';
import { styles, useThemeColors } from '@/styles/appStyles';

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
