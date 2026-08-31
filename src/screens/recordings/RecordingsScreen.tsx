import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useVideoPlayer, VideoView } from 'expo-video';
import {
  ImageBackground,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppImage } from '@/components/media';
import { useToast } from '@/components/feedback';
import { HeaderBar, IconButton, Pill, PrimaryButton, Text } from '@/components/ui';
import { useAppStore } from '@/context/AppStoreContext';
import { brand, RecordedLecture, sampleRecordings } from '@/data/mockData';
import { awardPoints, createRecordingInSupabase } from '@/lib/supabase';
import { uploadFile, urlFor } from '@/lib/uploads';
import { styles, useThemeColors } from '@/styles/appStyles';

/**
 * Streams an uploaded recording (SRS 3.5b). Recordings live in a private
 * bucket, so the caller passes a signed URL rather than a storage path.
 */
function LecturePlayer({ url, playing }: { url: string; playing: boolean }) {
  const player = useVideoPlayer(url, (p) => {
    p.loop = false;
  });

  useEffect(() => {
    if (playing) {
      player.play();
    } else {
      player.pause();
    }
  }, [playing, player]);

  return (
    <VideoView
      player={player}
      style={StyleSheet.absoluteFill}
      contentFit="contain"
      nativeControls={false}
    />
  );
}

export function RecordingsScreen({ onBack }: { onBack: () => void }) {
  const colors = useThemeColors();
  const { profile, updateProfile } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedVideo, setSelectedVideo] = useState<RecordedLecture | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState<'1.0x' | '1.25x' | '1.5x' | '2.0x'>('1.0x');
  const [liveRecordings, setLiveRecordings] = useState<RecordedLecture[]>(sampleRecordings);
  const toast = useToast();
  const [uploading, setUploading] = useState(false);
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({
    'rec-1': 1420,
    'rec-2': 980,
    'rec-3': 2100,
    'rec-4': 760,
  });

  const categories = ['All', 'Mathematics', 'Computer Science', 'Physics', 'Chemistry'];

  useEffect(() => {
    async function loadLiveRecordings() {
      try {
        const { getRecordings } = await import('../../lib/supabase');
        const dbRecordings = await getRecordings();
        if (dbRecordings && dbRecordings.length > 0) {
          const mapped: RecordedLecture[] = dbRecordings.map((r: any) => ({
            id: r.id,
            title: r.title,
            tutor: r.tutor_name || 'Campus Tutor',
            category: r.category,
            duration: r.duration,
            views: r.views || 100,
            thumbnail: r.thumbnail_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
            videoPath: r.video_url || undefined,
          }));
          setLiveRecordings(mapped);
        }
      } catch (err) {
        console.warn('Recordings load error:', err);
      }
    }
    loadLiveRecordings();
  }, []);

  const handleUploadRecording = async () => {
    if (uploading) return;
    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: 'video/*',
        copyToCacheDirectory: true,
      });
      if (picked.canceled || !picked.assets?.length) return;

      const file = picked.assets[0];
      setUploading(true);

      const { path } = await uploadFile({
        bucket: 'recordings',
        userId: profile.id || '',
        uri: file.uri,
        fileName: file.name || undefined,
        contentType: file.mimeType || 'video/mp4',
      });

      const title = (file.name || 'Recorded session').replace(/\.[^.]+$/, '');
      const { data, error } = await createRecordingInSupabase({
        title,
        tutor_name: profile.name || 'Tutor',
        category: selectedCategory === 'All' ? 'Computer Science' : selectedCategory,
        duration: '—',
        video_url: path,
      });
      if (error) throw error;

      setLiveRecordings((prev) => [
        {
          id: data?.id || path,
          title,
          tutor: profile.name || 'Tutor',
          category: selectedCategory === 'All' ? 'Computer Science' : selectedCategory,
          duration: '—',
          views: 0,
          thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
          videoPath: path,
        },
        ...prev,
      ]);

      const earned = await awardPoints('resource_shared');
      if (earned > 0) updateProfile({ points: (profile.points || 0) + earned });
      toast.show(`Published "${title}"`);
    } catch (err: any) {
      toast.show(err?.message || 'Upload failed. Check your connection and try again.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const filteredRecordings = liveRecordings.filter((rec) => {
    const matchesCategory = selectedCategory === 'All' || rec.category.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchesSearch = !searchQuery.trim() || rec.title.toLowerCase().includes(searchQuery.toLowerCase()) || rec.tutor.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleOpenLecture = async (rec: RecordedLecture) => {
    setSelectedVideo(rec);
    setIsPlaying(true);

    // Recordings live in a private bucket, so playback needs a signed URL.
    if (rec.videoPath && !rec.videoUrl) {
      try {
        const signed = await urlFor('recordings', rec.videoPath);
        setSelectedVideo((current) =>
          current && current.id === rec.id ? { ...current, videoUrl: signed } : current
        );
      } catch {
        toast.show('Could not open this recording. Try again.', 'error');
      }
    }
    setViewCounts((prev) => ({
      ...prev,
      [rec.id]: (prev[rec.id] || rec.views) + 1,
    }));
    updateProfile({ points: (profile.points || 0) + 25 });
  };

  const sampleChapters = [
    { title: '1. Introduction & Problem Scope', time: '00:00' },
    { title: '2. Step-by-Step Proof & Walkthrough', time: '12:35' },
    { title: '3. Common Exam Pitfalls & Mistakes', time: '28:10' },
    { title: '4. Summary & Q&A Highlights', time: '41:15' },
  ];

  return (
    <SafeAreaView style={styles.lightScreen}>
      <ScrollView contentContainerStyle={styles.screenContent}>
        <HeaderBar
          title="Recorded Peer Lectures"
          onBack={onBack}
          rightElement={
            <IconButton
              icon={uploading ? "hourglass-outline" : "cloud-upload-outline"}
              label="Upload a recording"
              onPress={handleUploadRecording}
              filled
            />
          }
        />
        <Text style={styles.sectionSubline}>Stream or download recorded peer sessions and study guides.</Text>

        <View style={styles.inputGroup}>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search lectures by topic or tutor..."
            placeholderTextColor={colors.muted}
            style={styles.input}
          />
        </View>

        <View style={styles.filterPillsRow}>
          {categories.map((cat) => (
            <Pressable key={cat} onPress={() => setSelectedCategory(cat)}>
              <Pill label={cat} active={selectedCategory === cat} />
            </Pressable>
          ))}
        </View>

        {filteredRecordings.map((rec) => (
          <View key={rec.id} style={[styles.largeCommunityCard, { marginBottom: 14 }]}>
            <Pressable onPress={() => handleOpenLecture(rec)}>
              <AppImage source={{ uri: rec.thumbnail }} style={{ width: '100%', height: 140, borderRadius: 16 }} />
              <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.25)' }}>
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="play" size={22} color="#fff" />
                </View>
              </View>
            </Pressable>
            <View style={styles.cardBody}>
              <Pill label={rec.category} compact />
              <Text style={[styles.communityName, { marginTop: 4 }]}>{rec.title}</Text>
              <Text style={styles.mutedCopySmall}>Tutor: {rec.tutor} · {rec.duration} · {viewCounts[rec.id] || rec.views} views</Text>
              <Pressable style={[styles.primarySmallButton, { marginTop: 8 }]} onPress={() => handleOpenLecture(rec)}>
                <Ionicons name="play" size={14} color="#fff" />
                <Text style={styles.primarySmallText}> Stream Lecture (+25 Pts)</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>

      {selectedVideo ? (
        <Modal visible={Boolean(selectedVideo)} transparent animationType="slide">
          <View style={styles.videoModalBackdrop}>
            <View style={styles.videoPlayerCard}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: '#fff', flex: 1 }]} numberOfLines={1}>{selectedVideo.title}</Text>
                <Pressable onPress={() => setSelectedVideo(null)}>
                  <Ionicons name="close-circle" size={26} color="rgba(255,255,255,0.7)" />
                </Pressable>
              </View>

              <View style={styles.videoPlayerScreen}>
                {selectedVideo.videoUrl ? (
                  <LecturePlayer url={selectedVideo.videoUrl} playing={isPlaying} />
                ) : null}
                <ImageBackground
                  source={{ uri: selectedVideo.thumbnail }}
                  style={[styles.flexFill, selectedVideo.videoUrl ? { opacity: 0 } : undefined]}
                  imageStyle={{ opacity: 0.8 }}
                >
                  <View style={styles.videoPlayOverlay}>
                    <Pressable
                      onPress={() => setIsPlaying((prev) => !prev)}
                      style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: brand.primary, alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Ionicons name={isPlaying ? 'pause' : 'play'} size={28} color="#fff" />
                    </Pressable>
                  </View>

                  <View style={{ paddingHorizontal: 12, paddingBottom: 10 }}>
                    <View style={styles.videoProgressBarWrap}>
                      <View style={[styles.videoProgressBarFill, { width: '42%' }]} />
                    </View>
                    <View style={styles.videoControlsRow}>
                      <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11 }}>18:45 / {selectedVideo.duration}</Text>

                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        {(['1.0x', '1.25x', '1.5x', '2.0x'] as const).map((s) => (
                          <Pressable
                            key={s}
                            onPress={() => setSpeed(s)}
                            style={[styles.speedPill, speed === s ? styles.speedPillActive : undefined]}
                          >
                            <Text style={[styles.speedPillText, speed === s ? styles.speedPillTextActive : undefined]}>{s}</Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  </View>
                </ImageBackground>
              </View>

              <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>
                Tutor: <Text style={{ fontWeight: '800', color: '#fff' }}>{selectedVideo.tutor}</Text> · {viewCounts[selectedVideo.id] || selectedVideo.views} views
              </Text>

              <Text style={{ fontSize: 14, fontWeight: '800', color: '#fff', marginTop: 4 }}>Chapter Bookmarks</Text>
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 140 }}>
                {sampleChapters.map((ch) => (
                  <View key={ch.title} style={styles.chapterItem}>
                    <Text style={styles.chapterTimeText}>{ch.time}</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, flex: 1 }}>{ch.title}</Text>
                    <Ionicons name="play-circle-outline" size={18} color="rgba(255,255,255,0.6)" />
                  </View>
                ))}
              </ScrollView>

              <PrimaryButton label="Close Player" onPress={() => setSelectedVideo(null)} />
            </View>
          </View>
        </Modal>
      ) : null}
    </SafeAreaView>
  );
}
