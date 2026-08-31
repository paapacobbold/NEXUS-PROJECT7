import { useState } from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HeaderBar, LabelledInput, PrimaryButton } from '@/components/ui';
import { useAppStore } from '@/context/AppStoreContext';
import { styles } from '@/styles/appStyles';

export function ScheduleSessionScreen({
  onBack,
  onSubmit,
}: {
  onBack: () => void;
  onSubmit: () => void;
}) {
  const { addSession } = useAppStore();
  const [title, setTitle] = useState('Calculus III: Surface Integrals Review');
  const [tags, setTags] = useState('Mathematics');
  const [time, setTime] = useState('Tomorrow · 3:00 PM');
  const [description, setDescription] = useState(
    'We will cover surface integrals, common pitfalls, and short worked examples.',
  );

  const handleSchedule = () => {
    if (!title.trim()) return;
    addSession(title.trim(), tags.trim() || 'General', time.trim());
    onSubmit();
  };

  return (
    <SafeAreaView style={styles.lightScreen}>
      <ScrollView contentContainerStyle={styles.formScreen}>
        <HeaderBar title="Schedule Session" onBack={onBack} />

        <LabelledInput label="Session Title" value={title} onChangeText={setTitle} placeholder="e.g. Calculus III Review" />
        <LabelledInput label="Subject / Tag" value={tags} onChangeText={setTags} placeholder="e.g. Mathematics" />
        <LabelledInput label="Date & Time" value={time} onChangeText={setTime} placeholder="e.g. Tomorrow · 3:00 PM" />
        <LabelledInput
          label="Description"
          value={description}
          onChangeText={setDescription}
          placeholder="What will this session cover?"
          multiline
        />

        <PrimaryButton label="Schedule & Broadcast (+100 Pts)" onPress={handleSchedule} />
      </ScrollView>
    </SafeAreaView>
  );
}
