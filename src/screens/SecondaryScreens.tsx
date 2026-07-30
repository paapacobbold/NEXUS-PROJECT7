import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Image,
  ImageBackground,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Avatar,
  HeaderBar,
  Pill,
  PrimaryButton,
} from '../components/UIComponents';
import { FilterKey, useAppStore } from '../context/AppStoreContext';
import { brand, filterSections, RecordedLecture, sampleLeaderboard, sampleRecordings } from '../data/mockData';
import { styles } from '../styles/appStyles';

function toTitleCase(value: string) {
  return value.replace(/([A-Z])/g, ' $1').replace(/^./, (char) => char.toUpperCase());
}

function getLevelTier(points: number) {
  if (points >= 1000) return { title: 'Level 5: Campus Legend', currentXp: points, nextXp: 1500, percent: 100 };
  if (points >= 750) return { title: 'Level 4: Scholar', currentXp: points, nextXp: 1000, percent: Math.min(100, Math.round(((points - 750) / 250) * 100)) };
  if (points >= 500) return { title: 'Level 3: Master Peer', currentXp: points, nextXp: 750, percent: Math.min(100, Math.round(((points - 500) / 250) * 100)) };
  if (points >= 250) return { title: 'Level 2: Study Mentor', currentXp: points, nextXp: 500, percent: Math.min(100, Math.round(((points - 250) / 250) * 100)) };
  return { title: 'Level 1: Academic Novice', currentXp: points, nextXp: 250, percent: Math.min(100, Math.round((points / 250) * 100)) };
}

export function LeaderboardScreen({ onBack }: { onBack: () => void }) {
  const { profile, updateProfile } = useAppStore();
  const [showPerkStore, setShowPerkStore] = useState(false);
  const [claimedVoucher, setClaimedVoucher] = useState<{ title: string; code: string } | null>(null);

  const levelInfo = getLevelTier(profile.points);

  const perkStoreItems = [
    { id: 'coffee', title: 'Campus Library Coffee Voucher', cost: 150, icon: 'cafe-outline', desc: '1 Free hot coffee at KNUST Main Library Cafe' },
    { id: 'priority', title: 'Priority Tutoring Pass', cost: 300, icon: 'star-outline', desc: 'Jump the queue for 1-on-1 peer tutoring sessions' },
    { id: 'featured', title: 'Featured Post Badge', cost: 450, icon: 'megaphone-outline', desc: 'Pin your study group post to the community top feed for 7 days' },
    { id: 'leader', title: 'Certified Peer Leader Badge', cost: 600, icon: 'medal-outline', desc: 'Unlock gold verified peer badge on your profile' },
  ];

  const handleRedeemPerk = (perk: typeof perkStoreItems[0]) => {
    if (profile.points < perk.cost) return;

    const voucherCode = `NEXUS-${perk.id.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Deduct points balance
    updateProfile({ points: Math.max(0, profile.points - perk.cost) });
    setClaimedVoucher({ title: perk.title, code: voucherCode });
  };

  return (
    <SafeAreaView style={styles.lightScreen}>
      <ScrollView contentContainerStyle={styles.screenContent}>
        <HeaderBar title="Leaderboard & XP Rewards" onBack={onBack} />

        {/* User XP Rank & Level Progress Card */}
        <View style={styles.recommendedCard}>
          <Ionicons name="trophy" size={32} color="#E07038" />
          <View style={styles.flexFill}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.recommendedTitle}>{profile.name} (You)</Text>
              <View style={styles.levelBadgeChip}>
                <Text style={styles.levelBadgeText}>{levelInfo.title}</Text>
              </View>
            </View>

            {/* Level XP Progress Bar */}
            <View style={styles.levelProgressTrack}>
              <View style={[styles.levelProgressFill, { width: `${levelInfo.percent}%` }]} />
            </View>

            <Text style={styles.mutedCopySmall}>
              {profile.points} XP · {levelInfo.nextXp - profile.points} XP to next level tier
            </Text>
          </View>
        </View>

        {/* Perk Store Quick Banner */}
        <Pressable
          onPress={() => setShowPerkStore(true)}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: brand.primary, padding: 16, borderRadius: 18 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Ionicons name="gift-outline" size={24} color="#fff" />
            <View>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>Campus Perk Store</Text>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>Redeem points for coffee, passes & badges</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#fff" />
        </Pressable>

        <Text style={styles.sectionTitle}>Top Campus Tutors & Peers</Text>
        {sampleLeaderboard.map((item) => (
          <View key={item.name} style={[styles.threadRow, { backgroundColor: '#fff', padding: 14, borderRadius: 16, marginBottom: 8 }]}>
            <Text style={{ fontSize: 16, fontWeight: '800', width: 28, color: item.rank === 1 ? '#E07038' : brand.text }}>#{item.rank}</Text>
            <Avatar source={item.avatar} size={40} />
            <View style={styles.flexFill}>
              <Text style={styles.threadName}>{item.name}</Text>
              <Text style={styles.mutedCopySmall}>{item.role}</Text>
            </View>
            <Pill label={`${item.points} pts`} tint="#E6F4EA" textColor="#137333" />
          </View>
        ))}
      </ScrollView>

      {/* Campus Perk Store Modal */}
      <Modal visible={showPerkStore} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Campus Perk Store 🎁</Text>
                <Text style={styles.mutedCopySmall}>Available Balance: {profile.points} XP Points</Text>
              </View>
              <Pressable onPress={() => { setShowPerkStore(false); setClaimedVoucher(null); }}>
                <Ionicons name="close-circle" size={26} color={brand.muted} />
              </Pressable>
            </View>

            {claimedVoucher ? (
              <View style={{ gap: 12, alignItems: 'center', paddingVertical: 10 }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: '#137333' }}>🎉 Perk Claimed Successfully!</Text>
                <Text style={[styles.mutedCopy, { textAlign: 'center' }]}>{claimedVoucher.title}</Text>

                <View style={styles.voucherCodeBox}>
                  <Text style={{ fontSize: 11, color: brand.muted, marginBottom: 4 }}>YOUR VOUCHER CLAIM CODE</Text>
                  <Text style={styles.voucherCodeText}>{claimedVoucher.code}</Text>
                </View>

                <Text style={styles.mutedCopySmall}>Show this claim code at campus library or tutoring desk.</Text>
                <PrimaryButton label="Claim Another Perk" onPress={() => setClaimedVoucher(null)} />
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {perkStoreItems.map((perk) => {
                  const canAfford = profile.points >= perk.cost;
                  return (
                    <View key={perk.id} style={styles.perkCard}>
                      <View style={styles.perkIconWrap}>
                        <Ionicons name={perk.icon as any} size={22} color={brand.primary} />
                      </View>

                      <View style={styles.flexFill}>
                        <Text style={styles.communityName}>{perk.title}</Text>
                        <Text style={styles.mutedCopySmall}>{perk.desc}</Text>
                        <View style={{ marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <View style={styles.perkCostBadge}>
                            <Text style={styles.perkCostText}>{perk.cost} XP Points</Text>
                          </View>
                        </View>
                      </View>

                      <Pressable
                        onPress={() => handleRedeemPerk(perk)}
                        style={{
                          backgroundColor: canAfford ? brand.primary : '#E2DFD7',
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 12,
                        }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: '800', color: canAfford ? '#fff' : brand.muted }}>
                          {canAfford ? 'Redeem' : 'Need XP'}
                        </Text>
                      </Pressable>
                    </View>
                  );
                })}
              </ScrollView>
            )}

            <PrimaryButton label="Close Perk Store" onPress={() => { setShowPerkStore(false); setClaimedVoucher(null); }} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

export function RecordingsScreen({ onBack }: { onBack: () => void }) {
  const { updateProfile } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedVideo, setSelectedVideo] = useState<RecordedLecture | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState<'1.0x' | '1.25x' | '1.5x' | '2.0x'>('1.0x');
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({
    'rec-1': 1420,
    'rec-2': 980,
    'rec-3': 2100,
  });

  const categories = ['All', 'Mathematics', 'Computer Science', 'Physics'];

  const filteredRecordings = sampleRecordings.filter((rec) => {
    const matchesCategory = selectedCategory === 'All' || rec.category.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchesSearch = !searchQuery.trim() || rec.title.toLowerCase().includes(searchQuery.toLowerCase()) || rec.tutor.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleOpenLecture = (rec: RecordedLecture) => {
    setSelectedVideo(rec);
    setIsPlaying(true);
    setViewCounts((prev) => ({
      ...prev,
      [rec.id]: (prev[rec.id] || rec.views) + 1,
    }));
    updateProfile({ points: 25 });
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
        <HeaderBar title="Recorded Peer Lectures" onBack={onBack} />
        <Text style={styles.sectionSubline}>Stream or download recorded peer sessions and study guides.</Text>

        <View style={styles.inputGroup}>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search lectures by topic or tutor..."
            placeholderTextColor={brand.muted}
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
              <Image source={{ uri: rec.thumbnail }} style={{ width: '100%', height: 140, borderRadius: 16 }} />
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
                <ImageBackground source={{ uri: selectedVideo.thumbnail }} style={styles.flexFill} imageStyle={{ opacity: 0.8 }}>
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

export function FiltersScreen({
  onBack,
  onApply,
}: {
  onBack: () => void;
  onApply: () => void;
}) {
  const { selectedFilters, toggleFilter, resetFilters } = useAppStore();

  return (
    <SafeAreaView style={styles.lightScreen}>
      <ScrollView contentContainerStyle={styles.formScreen}>
        <View style={styles.screenHeaderRow}>
          <Pressable onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color={brand.text} />
          </Pressable>
          <Text style={styles.screenTitle}>Filters</Text>
          <Pressable onPress={resetFilters}>
            <Text style={styles.helperLink}>Reset</Text>
          </Pressable>
        </View>

        {(Object.keys(filterSections) as FilterKey[]).map((section) => (
          <View key={section} style={styles.filterSection}>
            <Text style={styles.filterTitle}>{toTitleCase(section)}</Text>
            <View style={styles.filterWrap}>
              {filterSections[section].map((option) => (
                <Pressable
                  key={option}
                  onPress={() => toggleFilter(section, option)}
                  style={[
                    styles.filterChip,
                    selectedFilters[section].includes(option) ? styles.filterChipActive : undefined,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedFilters[section].includes(option) ? styles.filterChipTextActive : undefined,
                    ]}
                  >
                    {option}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ))}

        <PrimaryButton label="Apply Filters" onPress={onApply} />
      </ScrollView>
    </SafeAreaView>
  );
}
