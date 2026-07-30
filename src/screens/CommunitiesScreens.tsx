import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  FlatList,
  Image,
  ImageBackground,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
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
import { useAppStore } from '../context/AppStoreContext';
import { brand, CommunityItem } from '../data/mockData';
import { styles } from '../styles/appStyles';

export function CommunitiesScreen({
  onOpenDetail,
  onOpenCommunity,
  onCreateCommunity,
}: {
  onOpenDetail?: () => void;
  onOpenCommunity?: () => void;
  onCreateCommunity: () => void;
}) {
  const { communitiesList, toggleJoinCommunity } = useAppStore();
  const handleOpen = onOpenDetail || onOpenCommunity || (() => {});

  return (
    <View style={[styles.flexFill, styles.screenContent]}>
      <FlatList
        data={communitiesList}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <View style={styles.screenHeaderRow}>
              <Text style={styles.screenTitle}>Communities</Text>
              <IconButton icon="add" onPress={onCreateCommunity} filled />
            </View>

            <View style={styles.filterPillsRow}>
              <Pill label="All (18)" active />
              <Pill label="Joined (4)" />
              <Pill label="STEM" />
              <Pill label="Humanities" />
            </View>

            <View style={styles.recommendedCard}>
              <View style={styles.recommendedIcon}>
                <Ionicons name="sparkles" size={16} color={brand.primary} />
              </View>
              <View style={styles.flexFill}>
                <Text style={styles.recommendedTitle}>Recommended for you</Text>
                <Text style={styles.mutedCopySmall}>Based on your major in Computer Science</Text>
              </View>
            </View>
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.largeCommunityCard}>
            <Pressable onPress={handleOpen} accessible={true} accessibilityRole="button" accessibilityLabel={`View community ${item.name}`}>
              <Image source={{ uri: item.image }} style={styles.largeCommunityImage} />
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
                  onPress={() => toggleJoinCommunity(item.id)}
                  style={[
                    styles.primarySmallButton,
                    item.joined ? styles.ghostSmallButton : undefined,
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
  const { updateProfile } = useAppStore();
  const [showResources, setShowResources] = useState(false);
  const [downloaded, setDownloaded] = useState<Record<string, boolean>>({});
  const [customResources, setCustomResources] = useState<
    Array<{ id: string; title: string; size: string; category: string }>
  >([]);

  const defaultResources = [
    { id: 'res-1', title: 'Calculus_III_Final_Formula_Sheet.pdf', size: '1.4 MB', category: 'Formula Sheet' },
    { id: 'res-2', title: 'Data_Structures_Tree_Traversal_CheatSheet.pdf', size: '2.1 MB', category: 'Cheat Sheet' },
    { id: 'res-3', title: 'Physics_Midterm_2025_Solved_Exam.pdf', size: '3.8 MB', category: 'Solved Exam' },
    { id: 'res-4', title: 'Organic_Chemistry_Reaction_Mechanisms.pdf', size: '4.2 MB', category: 'Lecture Slides' },
  ];

  const studyResources = [...customResources, ...defaultResources];

  const handleDownload = (id: string) => {
    setDownloaded((prev) => ({ ...prev, [id]: true }));
    updateProfile({ points: 20 });
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const doc = result.assets[0];
        const sizeMb = doc.size ? `${(doc.size / (1024 * 1024)).toFixed(1)} MB` : '1.0 MB';
        const newResource = {
          id: `custom-${Date.now()}`,
          title: doc.name || 'Uploaded_Course_Material.pdf',
          size: sizeMb,
          category: 'Uploaded PDF',
        };
        setCustomResources((prev) => [newResource, ...prev]);
        updateProfile({ points: 50 });
      }
    } catch (err) {
      console.warn('Error picking document:', err);
    }
  };

  return (
    <SafeAreaView style={styles.lightScreen}>
      <View style={styles.flexFill}>
        <ScrollView contentContainerStyle={styles.screenContent}>
          <ImageBackground source={{ uri: community.image }} style={styles.communityHero}>
            <LinearGradient colors={['rgba(7,9,24,0.2)', 'rgba(7,9,24,0.85)']} style={styles.flexFill}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 }}>
                <Pressable onPress={onBack} style={styles.backButton}>
                  <Ionicons name="arrow-back" size={20} color="#fff" />
                </Pressable>
                <Pressable
                  onPress={onJoin}
                  style={[styles.primarySmallButton, community.joined ? styles.ghostSmallButton : undefined]}
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
            <Pressable onPress={() => setShowResources(true)}>
              <Text style={styles.communityTabText}>Resources (4 PDFs)</Text>
            </Pressable>
            <Text style={styles.communityTabText}>Members</Text>
          </View>

          <Pressable onPress={() => setShowResources(true)} style={[styles.sharePrompt, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
            <Ionicons name="document-attach-outline" size={20} color={brand.primary} />
            <Text style={{ fontSize: 13, fontWeight: '700', color: brand.primary }}>📄 Download Study Materials & PDFs (+20 XP)</Text>
          </Pressable>

          {community.postsFeed.map((post) => (
            <View key={post.id} style={styles.postCard}>
              <View style={styles.postHeader}>
                <Avatar source="https://i.pravatar.cc/120?img=12" size={36} />
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
          ))}
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
                <Text style={styles.modalTitle}>Study Materials & PDFs 📄</Text>
                <Text style={styles.mutedCopySmall}>Course formula sheets, slides & solved exams</Text>
              </View>
              <Pressable onPress={() => setShowResources(false)}>
                <Ionicons name="close-circle" size={26} color={brand.muted} />
              </Pressable>
            </View>

            <Pressable
              onPress={handlePickDocument}
              style={{
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
              }}
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
                      onPress={() => handleDownload(res.id)}
                      style={[styles.downloadPill, isDone ? styles.downloadPillDone : undefined]}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '800', color: isDone ? '#137333' : '#fff' }}>
                        {isDone ? '✓ Downloaded' : 'PDF (+20 XP)'}
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
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('Mathematics');
  const [description, setDescription] = useState('');

  const handleCreate = () => {
    if (!name.trim() || !description.trim()) return;
    addCommunity(name.trim(), subject.trim(), description.trim());
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
