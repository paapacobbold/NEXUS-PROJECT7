import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui';
import { HIT_SLOP } from '@/styles/tokens';

/**
 * One control in the live-session toolbar: a round icon button with a caption.
 * `tint` colours the circle when the control is active or destructive.
 */
function ControlButton({
  icon,
  label,
  onPress,
  tint = '#374151',
  labelColor = '#9CA3AF',
  labelWeight,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  tint?: string;
  labelColor?: string;
  labelWeight?: '700';
}) {
  return (
    <Pressable
      hitSlop={HIT_SLOP}
      onPress={onPress}
      style={({ pressed }) => [
        { alignItems: 'center', gap: 4 },
        pressed && { opacity: 0.7, transform: [{ scale: 0.92 }] },
      ]}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: tint,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Ionicons name={icon} size={20} color="#FFFFFF" />
      </View>
      <Text style={{ color: labelColor, fontSize: 10, fontWeight: labelWeight }}>{label}</Text>
    </Pressable>
  );
}

/** The bottom toolbar of a live session: mic, camera, chat, roster, reactions, leave. */
export function LobbyControlBar({
  isMuted,
  onToggleMute,
  isCameraOn,
  onToggleCamera,
  onFlipCamera,
  onOpenChat,
  onOpenParticipants,
  participantCount,
  isHandRaised,
  showReactionsBar,
  onToggleReactions,
  onLeave,
}: {
  isMuted: boolean;
  onToggleMute: () => void;
  isCameraOn: boolean;
  onToggleCamera: () => void;
  onFlipCamera: () => void;
  onOpenChat: () => void;
  onOpenParticipants: () => void;
  participantCount: number;
  isHandRaised: boolean;
  showReactionsBar: boolean;
  onToggleReactions: () => void;
  onLeave: () => void;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
        backgroundColor: '#111827',
        borderTopWidth: 1,
        borderTopColor: '#1F2937',
      }}
    >
      <ControlButton
        icon={isMuted ? 'mic-off' : 'mic'}
        label={isMuted ? 'Unmute' : 'Mute'}
        onPress={onToggleMute}
        tint={isMuted ? '#EF4444' : '#374151'}
      />
      <ControlButton
        icon={isCameraOn ? 'videocam' : 'videocam-off'}
        label={isCameraOn ? 'Stop Video' : 'Start Video'}
        onPress={onToggleCamera}
        tint={isCameraOn ? '#374151' : '#EF4444'}
      />
      <ControlButton icon="camera-reverse" label="Flip" onPress={onFlipCamera} />
      <ControlButton icon="chatbubbles" label="Chat" onPress={onOpenChat} />
      <ControlButton
        icon="people"
        label={`Peers (${participantCount})`}
        onPress={onOpenParticipants}
      />
      <ControlButton
        icon="happy"
        label="Reactions"
        onPress={onToggleReactions}
        tint={isHandRaised || showReactionsBar ? '#F97316' : '#374151'}
      />
      <ControlButton
        icon="call"
        label="End"
        onPress={onLeave}
        tint="#DC2626"
        labelColor="#EF4444"
        labelWeight="700"
      />
    </View>
  );
}
