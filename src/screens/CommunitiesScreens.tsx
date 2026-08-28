import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  ImageBackground,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { Text } from '../components/Typography';
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
import { AppImage } from '../components/AppImage';
import {
  awardPoints,
  createCommunityPost,
  createResource,
  getCommunityPosts,
  subscribeToCommunityPosts,
} from '../lib/supabase';
import { uploadFile } from '../lib/uploads';
import { EmptyState, SkeletonList, useRefreshControl } from '../components/States';
import { useToast } from '../components/Toast';
import { tapMedium } from '../lib/haptics';
import { useAppStore } from '../context/AppStoreContext';
import { brand, CommunityItem, DEFAULT_AVATAR } from '../data/mockData';
import { styles } from '../styles/appStyles';

const defaultHitSlop = { top: 8, bottom: 8, left: 8, right: 8 };

export function CommunitiesScreen({
  onOpenDetail,
  onOpenCommunity,
  onCreateCommunity,
}: {
  onOpenDetail?: () => void;
  onOpenCommunity?: () => void;
  onCreateCommunity: () => void;
}) {
  const { communitiesList, toggleJoinCommunity, isLoadingData } = useAppStore();
  const refreshControl = useRefreshControl();
  const toast = useToast();

  const handleToggleJoin = (id: string, name: string, joined: boolean) => {
    tapMedium();
    toggleJoinCommunity(id);
    toast.show(joined ? `Left ${name}` : `Joined ${name}`, joined ? 'info' : 'success');
  };
  const [activeFilter, setActiveFilter] = useState<'all' | 'joined' | 'stem' | 'humanities'>('all');
  const handleOpen = onOpenDetail || onOpenCommunity || (() => {});

  const joinedCount = communitiesList.filter((c) => c.joined).length;

  const filteredCommunities = communitiesList.filter((item) => {
    if (activeFilter === 'joined') return item.joined;
    if (activeFilter === 'stem') {
      const s = (item.subject || '').toLowerCase() + ' ' + (item.name || '').toLowerCase();
      return (
        s.includes('math') ||
        s.includes('physics') ||
        s.includes('computer') ||
        s.includes('stem') ||
        s.includes('engineering') ||
        s.includes('algo') ||
        s.includes('science')
      );
    }
    if (activeFilter === 'humanities') {
      const s = (item.subject || '').toLowerCase() + ' ' + (item.name || '').toLowerCase();
      return (
        s.includes('literature') ||
        s.includes('history') ||
        s.includes('philosophy') ||
        s.includes('arts') ||
        s.includes('humanities') ||
        s.includes('language') ||
        s.includes('writing')
      );
    }
    return true;
  });

  return (
    <View style={[styles.flexFill, styles.screenContent]}>
      <FlatList
        data={filteredCommunities}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
        ItemSeparatorComponent={() => <View style={styles.listSeparator} />}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <View style={styles.screenHeaderRow}>
              <Text style={styles.screenTitle}>Communities</Text>
              <IconButton icon="add" onPress={onCreateCommunity} filled />
            </View>

            <View style={styles.filterPillsRow}>
              <Pill
                label={`All (${communitiesList.length})`}
                active={activeFilter === 'all'}
                onPress={() => setActiveFilter('all')}
              />
              <Pill
                label={`Joined (${joinedCount})`}
                active={activeFilter === 'joined'}
                onPress={() => setActiveFilter('joined')}
              />
              <Pill
                label="STEM"
                active={activeFilter === 'stem'}
                onPress={() => setActiveFilter('stem')}
              />
              <Pill
                label="Humanities"
                active={activeFilter === 'humanities'}
                onPress={() => setActiveFilter('humanities')}
              />
            </View>

            <View style={styles.recommendedCard}>
              <View style={styles.recommendedIcon}>
                <Ionicons name="sparkles" size={16} color={brand.primary} />
              </View>
              <View style={styles.flexFill}>
                <Text style={styles.recommendedTitle}>Recommended for you</Text>
                <Text style={styles.mutedCopySmall}>Based on active university learning groups</Text>
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          isLoadingData ? (
            <SkeletonList count={4} />
          ) : (
            <EmptyState
              icon="people-outline"
              title={`No ${activeFilter} communities yet`}
              message="Try a different filter, or start one for your course and invite your classmates."
              actionLabel="Create a community"
              onAction={onCreateCommunity}
            />
          )
        }
        renderItem={({ item }) => (
          <View style={styles.largeCommunityCard}>
            <Pressable
              hitSlop={defaultHitSlop}
              onPress={handleOpen}
              style={({ pressed }) => [pressed && { opacity: 0.82, transform: [{ scale: 0.98 }] }]}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`View community ${item.name}`}
            >
              <AppImage source={{ uri: item.image }} style={styles.largeCommunityImage} />
            </Pressable>
            <View style={styles.cardBody}>
              <View style={styles.cardTitleRow}>
                <View style={styles.flexFill}>
                  <Text style={styles.communityName}>{item.name}</Text>
                  <Text style={styles.mutedCopySmall}>
                    {item.members} members · {item.posts} posts this week
                  </Text>
                </View>
                <Pressable
                  hitSlop={defaultHitSlop}
                  onPress={() => handleToggleJoin(item.id, item.name, Boolean(item.joined))}
                  style={({ pressed }) => [
                    styles.primarySmallButton,
                    item.joined ? styles.ghostSmallButton : undefined,
                    pressed && { opacity: 0.75, transform: [{ scale: 0.95 }] },
                  ]}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={item.joined ? `Leave ${item.name}` : `Join ${item.name}`}
                >
                  <Text
                    style={[
                      styles.primarySmallText,
                      item.joined ? styles.ghostSmallText : undefined,
                    ]}
                  >
                    {item.joined ? 'Joined' : 'Join'}
                  </Text>
                </Pressable>
              </View>
              <Text style={styles.mutedCopySmall}>{item.description}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

export function CommunityDetailScreen({
  community,
  onBack,
  onJoin,
  onOpenChat,
  onScheduleSession,
}: {
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

      unsubscribe = subscribeToCommunityPosts(community.id, (incoming) => {
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
  }, [community.id]);

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
      await awardPoints(30, 'post_created', data?.id);
      updateProfile({ points: (profile.points || 0) + 30 });
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

      await awardPoints(50, 'resource_shared');
      updateProfile({ points: (profile.points || 0) + 50 });
      toast.show(`Shared ${doc.name || 'the file'} with the community`);
    } catch (err: any) {
      toast.show(err?.message || 'Upload failed. Check your connection and try again.', 'error');
    } finally {
      setUploadingResource(false);
    }
  };

  return (
    <SafeAreaView style={styles.lightScreen}>
      <View style={styles.flexFill}>
        <ScrollView contentContainerStyle={styles.screenContent}>
          <ImageBackground source={{ uri: community.image }} style={styles.communityHero}>
            <LinearGradient colors={['rgba(7,9,24,0.2)', 'rgba(7,9,24,0.85)']} style={styles.flexFill}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 }}>
                <Pressable hitSlop={defaultHitSlop} onPress={onBack} style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7 }]}>
                  <Ionicons name="arrow-back" size={20} color="#fff" />
                </Pressable>
                <Pressable
                  hitSlop={defaultHitSlop}
                  onPress={onJoin}
                  style={({ pressed }) => [
                    styles.primarySmallButton,
                    community.joined ? styles.ghostSmallButton : undefined,
                    pressed && { opacity: 0.75, transform: [{ scale: 0.95 }] },
                  ]}
                >
                  <Text style={[styles.primarySmallText, community.joined ? styles.ghostSmallText : undefined]}>
                    {community.joined ? 'Joined' : 'Join'}
                  </Text>
                </Pressable>
              </View>
              <Text style={styles.communityHeroTitle}>{community.name}</Text>
              <Text style={styles.communityHeroMeta}>
                {community.members} members · {community.posts} posts
              </Text>
            </LinearGradient>
          </ImageBackground>

          <View style={styles.communityTabRow}>
            <Text style={[styles.communityTabText, styles.communityTabTextActive]}>Posts</Text>
            <Pressable hitSlop={defaultHitSlop} onPress={() => setShowResources(true)}>
              <Text style={styles.communityTabText}>Resources ({studyResources.length} PDFs)</Text>
            </Pressable>
            <Text style={styles.communityTabText}>Members</Text>
          </View>

          {/* Create New Community Post Box */}
          <View style={{ backgroundColor: '#FFFFFF', padding: 14, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 12 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: brand.text, marginBottom: 8 }}>
              + Start a Discussion / Ask Question (+30 XP)
            </Text>
            <TextInput
              value={postTitle}
              onChangeText={setPostTitle}
              placeholder="Question or topic title..."
              placeholderTextColor={brand.muted}
              style={{ backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, color: brand.text, marginBottom: 8 }}
            />
            <TextInput
              value={postBody}
              onChangeText={setPostBody}
              placeholder="Share details, problem sets, or study notes..."
              placeholderTextColor={brand.muted}
              multiline
              style={{ backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, color: brand.text, height: 60, textAlignVertical: 'top', marginBottom: 10 }}
            />
            <Pressable
              hitSlop={defaultHitSlop}
              onPress={handleCreatePost}
              style={({ pressed }) => [
                { backgroundColor: brand.primary, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
                pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
              ]}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 }}>Post to Group</Text>
            </Pressable>
          </View>

          <Pressable hitSlop={defaultHitSlop} onPress={() => setShowResources(true)} style={({ pressed }) => [[styles.sharePrompt, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }], pressed && { opacity: 0.8 }]}>
            <Ionicons name="document-attach-outline" size={20} color={brand.primary} />
            <Text style={{ fontSize: 13, fontWeight: '700', color: brand.primary }}>Download Study Materials & PDFs (+20 XP)</Text>
          </Pressable>

          {postsFeedList.length === 0 ? (
            <View style={{ backgroundColor: '#FFFFFF', padding: 24, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', marginTop: 12 }}>
              <Ionicons name="chatbubbles-outline" size={36} color={brand.muted} />
              <Text style={{ fontSize: 15, fontWeight: '700', color: brand.text, marginTop: 8, textAlign: 'center' }}>
                No Community Posts Yet
              </Text>
              <Text style={{ fontSize: 13, color: brand.muted, marginTop: 4, textAlign: 'center' }}>
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
                </View>
                <Text style={styles.postTitle}>{post.title}</Text>
                <Text style={styles.postBody}>{post.body}</Text>
                <Text style={styles.mutedCopySmall}>{post.stats}</Text>
              </View>
            ))
          )}
        </ScrollView>

        <View style={styles.stickyBottomActions}>
          {onOpenChat ? <PrimarySmallButton label="Open Chat" onPress={onOpenChat} /> : null}
          {onScheduleSession ? <GhostSmallButton label="Schedule Session" onPress={onScheduleSession} /> : null}
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
              <Pressable hitSlop={defaultHitSlop} onPress={() => setShowResources(false)}>
                <Ionicons name="close-circle" size={26} color={brand.muted} />
              </Pressable>
            </View>

            <Pressable
              hitSlop={defaultHitSlop}
              onPress={handlePickDocument}
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
                      hitSlop={defaultHitSlop}
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
    </SafeAreaView>
  );
}

export function CreateCommunityScreen({
  onBack,
  onCreated,
}: {
  onBack: () => void;
  onCreated: () => void;
}) {
  const { addCommunity } = useAppStore();
  const toast = useToast();
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('Mathematics');
  const [description, setDescription] = useState('');

  const handleCreate = () => {
    if (!name.trim() || !description.trim()) return;
    addCommunity(name.trim(), subject.trim(), description.trim());
    toast.show(`${name.trim()} created`);
    onCreated();
  };

  return (
    <SafeAreaView style={styles.lightScreen}>
      <ScrollView contentContainerStyle={styles.formScreen}>
        <HeaderBar title="Create Community" onBack={onBack} />
        <Text style={styles.sectionHeadline}>Start a Learning Group</Text>
        <Text style={styles.sectionSubline}>Create a dedicated space for peer collaboration.</Text>

        <LabelledInput label="Community Name" value={name} onChangeText={setName} placeholder="e.g. KNUST Computer Science 2026" />
        <LabelledInput label="Subject / Field" value={subject} onChangeText={setSubject} placeholder="e.g. Computer Science" />
        <LabelledInput label="Description" value={description} onChangeText={setDescription} placeholder="What will this group focus on?" multiline />

        <PrimaryButton label="Create & Broadcast (+100 Pts)" onPress={handleCreate} />
      </ScrollView>
    </SafeAreaView>
  );
}
