import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HeaderBar, LabelledInput, PrimaryButton, Text } from '@/components/ui';
import { useAppStore } from '@/context/AppStoreContext';
import { styles } from '@/styles/appStyles';

export function CreateMeetupScreen({
  onBack,
  onCreated,
}: {
  onBack: () => void;
  onCreated: () => void;
}) {
  const { addMeetup } = useAppStore();
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('KNUST Main Library Pod 4');
  const [dateTime, setDateTime] = useState('');

  const campusHotspots = [
    'KNUST Main Library Pod 4',
    'Science Complex Lab 2B',
    'Student Union Lounge',
    'Engineering Quad Bench',
  ];

  const handleCreate = () => {
    if (!title.trim() || !location.trim()) return;
    addMeetup(title.trim(), location.trim(), dateTime.trim() || 'Tomorrow · 4:00 PM');
    onCreated();
  };

  return (
    <SafeAreaView style={styles.lightScreen}>
      <ScrollView contentContainerStyle={styles.formScreen}>
        <HeaderBar title="Schedule Campus Meetup" onBack={onBack} />
        <Text style={styles.sectionHeadline}>In-Person Peer Session</Text>
        <Text style={styles.sectionSubline}>Organize face-to-face study groups or tutoring sessions on campus.</Text>

        <LabelledInput label="Meetup Title" value={title} onChangeText={setTitle} placeholder="e.g. KNUST Math Study Circle" />

        <Text style={styles.inputLabel}>Campus Hotspot Venue</Text>
        <View style={styles.hotspotWrap}>
          {campusHotspots.map((h) => (
            <Pressable
              key={h}
              onPress={() => setLocation(h)}
              style={[styles.hotspotChip, location === h ? styles.hotspotChipActive : undefined]}
            >
              <Text style={[styles.hotspotChipText, location === h ? styles.hotspotChipTextActive : undefined]}>{h}</Text>
            </Pressable>
          ))}
        </View>

        <LabelledInput label="Exact Location Details" value={location} onChangeText={setLocation} placeholder="e.g. Main Library 2nd Floor, Quiet Zone" />
        <LabelledInput label="Date & Time" value={dateTime} onChangeText={setDateTime} placeholder="e.g. Friday · 3:00 PM" />

        <PrimaryButton label="Publish Campus Meetup (+75 Pts)" onPress={handleCreate} />
      </ScrollView>
    </SafeAreaView>
  );
}
