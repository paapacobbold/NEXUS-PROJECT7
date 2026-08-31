import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, Text } from '@/components/ui';

import { LobbyParticipant } from './types';

/** Full-screen roster for a live session: search, host controls, per-peer state. */
export function ParticipantsModal({
  visible,
  participants,
  filtered,
  search,
  onChangeSearch,
  isMutedAll,
  onMuteAll,
  onClose,
}: {
  visible: boolean;
  participants: LobbyParticipant[];
  filtered: LobbyParticipant[];
  search: string;
  onChangeSearch: (value: string) => void;
  isMutedAll: boolean;
  onMuteAll: () => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#111827' }}>
        <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#1F2937', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700' }}>
            Participants ({participants.length})
          </Text>
          <Pressable onPress={onClose}>
            <Ionicons name="close" size={24} color="#9CA3AF" />
          </Pressable>
        </View>

        {/* Roster Controls Bar */}
        <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 10 }}>
          <Pressable
            onPress={onMuteAll}
            style={{
              flex: 1,
              backgroundColor: isMutedAll ? '#EF4444' : '#374151',
              paddingVertical: 10,
              borderRadius: 8,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 13 }}>
              {isMutedAll ? 'Unmute All' : 'Mute All'}
            </Text>
          </Pressable>
          <Pressable
            style={{
              flex: 1,
              backgroundColor: '#3B82F6',
              paddingVertical: 10,
              borderRadius: 8,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 13 }}>Invite Link</Text>
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
          <TextInput
            value={search}
            onChangeText={onChangeSearch}
            placeholder="Search participant..."
            placeholderTextColor="#6B7280"
            style={{
              backgroundColor: '#1F2937',
              color: '#FFFFFF',
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 8,
            }}
          />
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}>
          {filtered.map((p) => (
            <View
              key={p.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: '#1F2937',
              }}
            >
              <Avatar source={p.avatar} size={42} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>{p.name}</Text>
                <Text style={{ color: '#9CA3AF', fontSize: 12 }}>{p.role}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                {p.isHandRaised ? <Ionicons name="hand-left-outline" size={16} color="#F97316" /> : null}
                <Ionicons
                  name={p.isMuted ? 'mic-off' : 'mic'}
                  size={18}
                  color={p.isMuted ? '#EF4444' : '#10B981'}
                />
                <Ionicons
                  name={p.isCameraOn ? 'videocam' : 'videocam-off'}
                  size={18}
                  color={p.isCameraOn ? '#10B981' : '#EF4444'}
                />
              </View>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
