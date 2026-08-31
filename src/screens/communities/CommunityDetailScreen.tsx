import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import {
  ImageBackground,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ReportSheet } from '@/components/overlays';
import { SkeletonList, useToast } from '@/components/feedback';
import {
  Avatar,
  GhostSmallButton,
  Pill,
  PrimaryButton,
  PrimarySmallButton,
  Text,
} from '@/components/ui';
import { useAppStore } from '@/context/AppStoreContext';
import { brand, CommunityItem, DEFAULT_AVATAR } from '@/data/mockData';
import { tapMedium } from '@/lib/haptics';
import {
  awardPoints,
  createCommunityPost,
  createResource,
  getCommunityPosts,
  subscribeToCommunityPosts,
} from '@/lib/supabase';
import { uploadFile } from '@/lib/uploads';
import { styles, useThemeColors } from '@/styles/appStyles';
import { HIT_SLOP } from '@/styles/tokens';

export function CommunityDetailScreen({
  community,
  onBack,
  onJoin,
  onOpenChat,
  onScheduleSession,
  onOpenMembers,
}: {
  onOpenMembers?: () => void;
  community: CommunityItem;
  onBack: () => void;
  onJoin?: () => void;
  onOpenChat?: () => void;
  onScheduleSession?: () => void;
}) {
  const { profile, updateProfile } = useAppStore();
  const [showResources, setShowResources] = useState(false);
  const [downloaded, setDownloaded] = useState<Record<string, boolean>>({});
  const [customResources, setCustomResources] = useState<
    Array<{ id: string; title: string; size: string; category: string }>
  >([]);

  const toast = useToast();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const [postTitle, setPostTitle] = useState('');
  const [postBody, setPostBody] = useState('');
  const [postsFeedList, setPostsFeedList] = useState(
    (community.postsFeed || []).map((p) => ({
      ...p,
      authorAvatar: DEFAULT_AVATAR,
    }))
  );
  const [postsLoading, setPostsLoading] = useState(true);
  const [uploadingResource, setUploadingResource] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ id: string; label: string } | null>(null);
  const [postSubmitting, setPostSubmitting] = useState(false);

  // Posts used to live only in this component's state, so every discussion was
  // lost the moment you navigated away. Read them from the database and
  // subscribe so other members' posts arrive without a refresh.
  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;

    async function loadPosts() {
      const rows = await getCommunityPosts(community.id);
      if (!active) return;
      if (rows.length > 0) {
        setPostsFeedList(rows.map((p) => ({ ...p, authorAvatar: DEFAULT_AVATAR })));
      }
      setPostsLoading(false);

      unsubscribe = subscribeToCommunityPosts(community.id, (incoming, authorId) => {
        if (authorId && authorId === profile.id) return;
        setPostsFeedList((prev) =>
          prev.some((p) => p.id === incoming.id)
            ? prev
            : [{ ...incoming, authorAvatar: DEFAULT_AVATAR }, ...prev]
        );
      });
    }

    loadPosts();
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [community.id, profile.id]);

  const defaultResources = [
    { id: 'res-1', title: 'Calculus_III_Final_Formula_Sheet.pdf', size: '1.4 MB', category: 'Formula Sheet' },
    { id: 'res-2', title: 'Data_Structures_Tree_Traversal_CheatSheet.pdf', size: '2.1 MB', category: 'Cheat Sheet' },
    { id: 'res-3', title: 'Physics_Midterm_2025_Solved_Exam.pdf', size: '3.8 MB', category: 'Solved Exam' },
    { id: 'res-4', title: 'Organic_Chemistry_Reaction_Mechanisms.pdf', size: '4.2 MB', category: 'Lecture Slides' },
  ];

  const studyResources = [...customResources, ...defaultResources];

  const handleDownload = (id: string) => {
    setDownloaded((prev) => ({ ...prev, [id]: true }));
    updateProfile({ points: (profile.points || 0) + 20 });
  };

  const handleCreatePost = async () => {
    if (!postTitle.trim() || !postBody.trim() || postSubmitting) return;
    setPostSubmitting(true);

    const title = postTitle.trim();
    const body = postBody.trim();

    // Show it immediately, then reconcile with the saved row.
    const optimisticId = `pending-${Date.now()}`;
    const optimistic = {
      id: optimisticId,
      author: profile.name || 'Student Learner',
      authorAvatar: profile.avatar || DEFAULT_AVATAR,
      role: 'Student',
      time: 'Just now',
      title,
      body,
      stats: '0 replies',
    };
    setPostsFeedList((prev) => [optimistic, ...prev]);
    setPostTitle('');
    setPostBody('');

    try {
      const { data, error } = await createCommunityPost(community.id, title, body, profile.id);
      if (error) throw error;

      if (data?.id) {
        setPostsFeedList((prev) =>
          prev.map((p) => (p.id === optimisticId ? { ...p, id: data.id } : p))
        );
      }
      const earned = await awardPoints('post_created', data?.id);
      if (earned > 0) updateProfile({ points: (profile.points || 0) + earned });
      tapMedium();
    } catch (err: any) {
      // Roll the optimistic post back so the feed never shows a post that
      // was not saved.
      setPostsFeedList((prev) => prev.filter((p) => p.id !== optimisticId));
      setPostTitle(title);
      setPostBody(body);
      toast.show(err?.message || 'Could not publish your post. Try again.', 'error');
    } finally {
      setPostSubmitting(false);
    }
  };

  const handlePickDocument = async () => {
    if (uploadingResource) return;
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.length) return;

      const doc = result.assets[0];
      setUploadingResource(true);

      // The picker only gives a local file:// URI — previously that was all the
      // app kept, so the "shared" resource existed on one device and nowhere
      // else. Push the bytes to Storage and record the object path.
      const { path } = await uploadFile({
        bucket: 'resources',
        userId: profile.id || '',
        uri: doc.uri,
        fileName: doc.name || undefined,
        contentType: doc.mimeType || 'application/pdf',
      });

      const { error } = await createResource({
        community_id: community.id,
        uploader_id: profile.id,
        title: doc.name || 'Course material',
        kind: 'file',
        url: path,
        mime_type: doc.mimeType || 'application/pdf',
        size_bytes: doc.size ?? undefined,
      });
      if (error) throw error;

      const sizeMb = doc.size ? `${(doc.size / (1024 * 1024)).toFixed(1)} MB` : '1.0 MB';
      setCustomResources((prev) => [
        { id: path, title: doc.name || 'Course material', size: sizeMb, category: 'Uploaded PDF' },
        ...prev,
      ]);

      const earned = await awardPoints('resource_shared');
      if (earned > 0) updateProfile({ points: (profile.points || 0) + earned });
      toast.show(`Shared ${doc.name || 'the file'} with the community`);
    } catch (err: any) {
      toast.show(err?.message || 'Upload failed. Check your connection and try again.', 'error');
    } finally {
      setUploadingResource(false);
    }
  };

  return (
    <View style={[styles.flexFill, { backgroundColor: colors.bg }]}>
      <StatusBar style="light" />
      <View style={styles.flexFill}>
        <ScrollView
          contentContainerStyle={[styles.screenContent, { paddingBottom: insets.bottom + 96 }]}
          showsVerticalScrollIndicator={false}
        >
          <ImageBackground
            source={{ uri: community.image }}
            style={[styles.communityHero, styles.communityHeroBleed]}
          >
            <LinearGradient
              colors={['rgba(7,9,24,0.55)', 'rgba(7,9,24,0.15)', 'rgba(7,9,24,0.9)']}
              locations={[0, 0.4, 1]}
              style={styles.flexFill}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingHorizontal: 20,
                  paddingTop: insets.top + 10,
                }}
              >
                <Pressable
                  hitSlop={HIT_SLOP}
                  onPress={onBack}
                  accessibilityRole="button"
                  accessibilityLabel="Go back"
                  style={({ pressed }) => [styles.heroIconButton, pressed && { opacity: 0.7 }]}
                >
                  <Ionicons name="arrow-back" size={20} color="#fff" />
                </Pressable>
                <Text
                  style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}
                  numberOfLines={1}
                >
                  {community.name}
                </Text>
              </View>
              <View style={styles.communityHeroBody}>
                <Text style={styles.communityHeroTitle}>{community.name}</Text>
                <Text style={styles.communityHeroMeta}>
                  {community.subject} · {community.members} members · {community.posts} posts
                </Text>
              </View>
            </LinearGradient>
          </ImageBackground>

          <View style={styles.communityTabRow}>
            <Text style={[styles.communityTabText, styles.communityTabTextActive]}>Posts</Text>
            <Pressable
              hitSlop={HIT_SLOP}
              onPress={() => setShowResources(true)}
              accessibilityRole="button"
              accessibilityLabel={`Resources, ${studyResources.length} files`}
            >
              <Text style={styles.communityTabText}>Resources ({studyResources.length})</Text>
            </Pressable>
            <Pressable
              hitSlop={HIT_SLOP}
              onPress={() => onOpenMembers?.()}
              disabled={!onOpenMembers}
              accessibilityRole="button"
              accessibilityLabel="View members"
            >
              <Text style={styles.communityTabText}>Members</Text>
            </Pressable>
          </View>

          {/* Create New Community Post Box */}
          {!community.joined ? (
            <View style={styles.communityPanel}>
              <Text style={styles.communityPanelHint}>
                Join this community to start a discussion or ask a question.
              </Text>
            </View>
          ) : (
          <View style={styles.communityPanel}>
            <Text style={styles.communityPanelTitle}>Start a discussion (+30 XP)</Text>
            <TextInput
              value={postTitle}
              onChangeText={setPostTitle}
              placeholder="Question or topic title..."
              placeholderTextColor={colors.muted}
              style={{ backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, color: colors.text, marginBottom: 8 }}
            />
            <TextInput
              value={postBody}
              onChangeText={setPostBody}
              placeholder="Share details, problem sets, or study notes..."
              placeholderTextColor={colors.muted}
              multiline
              style={{ backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, color: colors.text, height: 60, textAlignVertical: 'top', marginBottom: 10 }}
            />
            <Pressable
              hitSlop={HIT_SLOP}
              onPress={handleCreatePost}
              style={({ pressed }) => [
                { backgroundColor: brand.primary, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
                pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
              ]}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 }}>
                {postSubmitting ? 'Posting...' : 'Post to Group'}
              </Text>
            </Pressable>
          </View>
          )}

          <Pressable hitSlop={HIT_SLOP} onPress={() => setShowResources(true)} style={({ pressed }) => [[styles.sharePrompt, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }], pressed && { opacity: 0.8 }]}>
            <Ionicons name="document-attach-outline" size={20} color={brand.primary} />
            <Text style={{ fontSize: 13, fontWeight: '700', color: brand.primary }}>Download Study Materials & PDFs (+20 XP)</Text>
          </Pressable>

          {postsLoading ? (
            <SkeletonList count={2} lines={3} />
          ) : postsFeedList.length === 0 ? (
            <View style={{ backgroundColor: colors.card, padding: 24, borderRadius: 16, borderWidth: 1, borderColor: colors.border, alignItems: 'center', marginTop: 12 }}>
              <Ionicons name="chatbubbles-outline" size={36} color={colors.muted} />
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, marginTop: 8, textAlign: 'center' }}>
                No Community Posts Yet
              </Text>
              <Text style={{ fontSize: 13, color: colors.muted, marginTop: 4, textAlign: 'center' }}>
                Be the first to start a topic or ask a question using the form above!
              </Text>
            </View>
          ) : (
            postsFeedList.map((post) => (
              <View key={post.id} style={styles.postCard}>
                <View style={styles.postHeader}>
                  <Avatar source={post.authorAvatar || DEFAULT_AVATAR} size={36} />
                  <View style={styles.flexFill}>
                    <View style={styles.threadTop}>
                      <Text style={styles.threadName}>{post.author}</Text>
                      {post.role ? <Pill label={post.role} tint="#FFF0D6" textColor="#B16A0E" compact /> : null}
                    </View>
                    <Text style={styles.threadTime}>{post.time}</Text>
                  </View>
                  <Pressable
                    hitSlop={HIT_SLOP}
                    onPress={() => setReportTarget({ id: post.id, label: post.title || post.body })}
                    accessibilityRole="button"
                    accessibilityLabel={`Report post by ${post.author}`}
                    style={({ pressed }) => [pressed && { opacity: 0.6 }]}
                  >
                    <Ionicons name="ellipsis-horizontal" size={18} color={colors.muted} />
                  </Pressable>
                </View>
                <Text style={styles.postTitle}>{post.title}</Text>
                <Text style={styles.postBody}>{post.body}</Text>
                <Text style={styles.mutedCopySmall}>{post.stats}</Text>
              </View>
            ))
          )}
        </ScrollView>

        <View style={[styles.stickyBottomActions, { paddingBottom: insets.bottom + 14 }]}>
          {onOpenChat ? <PrimarySmallButton label="Open Chat" onPress={onOpenChat} /> : null}
          {onScheduleSession ? (
            <GhostSmallButton label="Schedule Session" onPress={onScheduleSession} />
          ) : null}
        </View>
      </View>

      {/* Study Materials PDF Drawer Modal */}
      <Modal visible={showResources} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Study Materials & PDFs</Text>
                <Text style={styles.mutedCopySmall}>Course formula sheets, slides & solved exams</Text>
              </View>
              <Pressable hitSlop={HIT_SLOP} onPress={() => setShowResources(false)}>
                <Ionicons name="close-circle" size={26} color={colors.muted} />
              </Pressable>
            </View>

            <Pressable
              hitSlop={HIT_SLOP}
              onPress={handlePickDocument}
              disabled={uploadingResource}
              style={({ pressed }) => [
                {
                  backgroundColor: '#EFF6FF',
                  borderColor: '#93C5FD',
                  borderWidth: 1.5,
                  borderStyle: 'dashed',
                  borderRadius: 14,
                  padding: 12,
                  marginVertical: 10,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 8,
                },
                pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
              ]}
            >
              <Ionicons name="cloud-upload-outline" size={20} color={brand.primary} />
              <Text style={{ fontSize: 13, fontWeight: '700', color: brand.primary }}>
                + Select & Upload Local Course PDF (+50 XP)
              </Text>
            </Pressable>

            <ScrollView showsVerticalScrollIndicator={false}>
              {studyResources.map((res) => {
                const isDone = downloaded[res.id];
                return (
                  <View key={res.id} style={styles.resourceFileRow}>
                    <View style={styles.pdfIconWrap}>
                      <Ionicons name="document-text" size={24} color="#E53E3E" />
                    </View>

                    <View style={styles.flexFill}>
                      <Text style={styles.communityName} numberOfLines={1}>{res.title}</Text>
                      <Text style={styles.fileSizeText}>{res.category} · {res.size}</Text>
                    </View>

                    <Pressable
                      hitSlop={HIT_SLOP}
                      onPress={() => handleDownload(res.id)}
                      style={({ pressed }) => [
                        styles.downloadPill,
                        isDone ? styles.downloadPillDone : undefined,
                        pressed && { opacity: 0.75, transform: [{ scale: 0.95 }] },
                      ]}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '800', color: isDone ? '#137333' : '#fff' }}>
                        {isDone ? 'Downloaded' : 'PDF (+20 XP)'}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </ScrollView>

            <PrimaryButton label="Close Resource Drawer" onPress={() => setShowResources(false)} />
          </View>
        </View>
      </Modal>
      <ReportSheet
        visible={Boolean(reportTarget)}
        onClose={() => setReportTarget(null)}
        targetType="post"
        targetId={reportTarget?.id ?? ''}
        targetLabel={reportTarget?.label}
      />
    </View>
  );
}
