import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState, SkeletonList } from '../components/States';
import { useToast } from '../components/Toast';
import { Text } from '../components/Typography';
import { Avatar, HeaderBar } from '../components/UIComponents';
import { useAppStore } from '../context/AppStoreContext';
import { brand, CommunityItem } from '../data/mockData';
import { tapLight } from '../lib/haptics';
import {
  CommunityMember,
  getCommunityMembers,
  getOpenReports,
  ModerationReport,
  removeCommunityMember,
  resolveReport,
  setCommunityMemberRole,
} from '../lib/supabase';
import { styles, useThemeColors } from '../styles/appStyles';
import { radius, space, type } from '../styles/tokens';

/* ========================================================================== */
/*  Moderation queue (SRS 3.12)                                               */
/* ========================================================================== */

export function ModerationScreen({ onBack }: { onBack: () => void }) {
  const colors = useThemeColors();
  const toast = useToast();
  const [reports, setReports] = useState<ModerationReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const rows = await getOpenReports();
    setReports(rows);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleResolve = async (report: ModerationReport, status: 'resolved' | 'dismissed') => {
    if (busyId) return;
    setBusyId(report.id);
    try {
      const { error } = await resolveReport(report.id, status);
      if (error) throw error;
      // Drop it locally rather than refetching the whole queue.
      setReports((prev) => prev.filter((r) => r.id !== report.id));
      toast.show(status === 'resolved' ? 'Report resolved' : 'Report dismissed');
    } catch (err: any) {
      toast.show(err?.message || 'Could not update that report.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <SafeAreaView style={[styles.lightScreen, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.screenContent}>
        <HeaderBar title="Moderation" onBack={onBack} />
        <Text style={styles.sectionSubline}>
          Reports from across the platform. Resolving removes an item from the queue; dismissing
          marks it as no action needed.
        </Text>

        {loading ? (
          <SkeletonList count={3} lines={2} />
        ) : reports.length === 0 ? (
          <EmptyState
            icon="shield-checkmark-outline"
            title="Nothing to review"
            message="Reported posts, messages and profiles will appear here."
          />
        ) : (
          reports.map((report) => (
            <View
              key={report.id}
              style={[
                modStyles.card,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={modStyles.row}>
                <View style={modStyles.badge}>
                  <Text style={modStyles.badgeText}>{report.targetType}</Text>
                </View>
                <Text style={[modStyles.date, { color: colors.muted }]}>
                  {new Date(report.createdAt).toLocaleDateString()}
                </Text>
              </View>

              <Text style={[modStyles.reason, { color: colors.text }]}>{report.reason}</Text>
              <Text style={[modStyles.targetId, { color: colors.muted }]} numberOfLines={1}>
                {report.targetId}
              </Text>

              <View style={modStyles.actions}>
                <Pressable
                  onPress={() => handleResolve(report, 'dismissed')}
                  disabled={busyId === report.id}
                  accessibilityRole="button"
                  accessibilityLabel="Dismiss this report"
                  style={({ pressed }) => [
                    modStyles.action,
                    { borderColor: colors.border },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Text style={[modStyles.actionText, { color: colors.muted }]}>Dismiss</Text>
                </Pressable>

                <Pressable
                  onPress={() => handleResolve(report, 'resolved')}
                  disabled={busyId === report.id}
                  accessibilityRole="button"
                  accessibilityLabel="Mark this report resolved"
                  style={({ pressed }) => [
                    modStyles.action,
                    modStyles.actionPrimary,
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <Text style={[modStyles.actionText, { color: '#fff' }]}>Resolve</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ========================================================================== */
/*  Community members (SRS 3.3 — "tutors must manage members")                */
/* ========================================================================== */

export function CommunityMembersScreen({
  community,
  onBack,
}: {
  community: CommunityItem;
  onBack: () => void;
}) {
  const colors = useThemeColors();
  const toast = useToast();
  const { profile } = useAppStore();
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getCommunityMembers(community.id).then((rows) => {
      if (!active) return;
      setMembers(rows);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [community.id]);

  const handleRemove = async (member: CommunityMember) => {
    if (busyId) return;
    setBusyId(member.id);
    try {
      const { error } = await removeCommunityMember(community.id, member.id);
      if (error) throw error;
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
      toast.show(`Removed ${member.name}`, 'info');
    } catch (err: any) {
      // Only the community owner may remove members; the policy enforces it.
      toast.show(err?.message || 'You do not have permission to remove members.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleRole = async (member: CommunityMember) => {
    if (busyId) return;
    const next = member.role === 'moderator' ? 'member' : 'moderator';
    setBusyId(member.id);
    try {
      const { error } = await setCommunityMemberRole(community.id, member.id, next);
      if (error) throw error;
      setMembers((prev) => prev.map((m) => (m.id === member.id ? { ...m, role: next } : m)));
      tapLight();
      toast.show(next === 'moderator' ? `${member.name} is now a moderator` : `${member.name} is now a member`);
    } catch (err: any) {
      toast.show(err?.message || 'You do not have permission to change roles.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <SafeAreaView style={[styles.lightScreen, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.screenContent}>
        <HeaderBar title="Members" onBack={onBack} />
        <Text style={styles.sectionSubline}>{community.name}</Text>

        {loading ? (
          <SkeletonList count={4} lines={1} />
        ) : members.length === 0 ? (
          <EmptyState
            icon="people-outline"
            title="No members yet"
            message="Share this community with your classmates to get started."
          />
        ) : (
          members.map((member) => {
            const isSelf = member.id === profile.id;
            return (
              <View
                key={member.id}
                style={[
                  modStyles.memberRow,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <Avatar source={member.avatar} size={40} />
                <View style={styles.flexFill}>
                  <Text style={[modStyles.memberName, { color: colors.text }]}>
                    {member.name}
                    {isSelf ? ' (You)' : ''}
                  </Text>
                  <Text style={[modStyles.memberMeta, { color: colors.muted }]}>
                    {member.role === 'moderator' ? 'Moderator' : 'Member'} · joined{' '}
                    {new Date(member.joinedAt).toLocaleDateString()}
                  </Text>
                </View>

                {isSelf ? null : (
                  <View style={modStyles.memberActions}>
                    <Pressable
                      onPress={() => handleToggleRole(member)}
                      disabled={busyId === member.id}
                      accessibilityRole="button"
                      accessibilityLabel={
                        member.role === 'moderator'
                          ? `Demote ${member.name} to member`
                          : `Promote ${member.name} to moderator`
                      }
                      style={({ pressed }) => [modStyles.iconAction, pressed && { opacity: 0.6 }]}
                    >
                      <Ionicons
                        name={member.role === 'moderator' ? 'shield' : 'shield-outline'}
                        size={20}
                        color={member.role === 'moderator' ? brand.primary : colors.muted}
                      />
                    </Pressable>

                    <Pressable
                      onPress={() => handleRemove(member)}
                      disabled={busyId === member.id}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${member.name} from this community`}
                      style={({ pressed }) => [modStyles.iconAction, pressed && { opacity: 0.6 }]}
                    >
                      <Ionicons name="person-remove-outline" size={20} color={brand.danger} />
                    </Pressable>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const modStyles = {
  card: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: space.lg,
    gap: space.sm,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge: {
    backgroundColor: '#FDECEA',
    borderRadius: radius.xs,
    paddingHorizontal: space.sm,
    paddingVertical: 3,
  },
  badgeText: { ...type.label, color: '#8C2F27', textTransform: 'uppercase' as const },
  date: { ...type.caption },
  reason: { ...type.bodyStrong },
  targetId: { ...type.caption, fontSize: 11 },
  actions: { flexDirection: 'row', gap: space.sm, marginTop: space.xs },
  action: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingVertical: 11,
  },
  actionPrimary: { backgroundColor: brand.primary, borderColor: brand.primary },
  actionText: { ...type.bodyStrong },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: space.md,
  },
  memberName: { ...type.bodyStrong },
  memberMeta: { ...type.caption },
  memberActions: { flexDirection: 'row', gap: space.xs },
  iconAction: { padding: space.sm },
} as const;
