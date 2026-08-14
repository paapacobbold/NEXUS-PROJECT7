import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Animated,
  Image,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TabKey, useAppStore } from '../context/AppStoreContext';
import { brand } from '../data/mockData';
import { styles, ThemeColors, useThemeColors } from '../styles/appStyles';

const defaultHitSlop = { top: 8, bottom: 8, left: 8, right: 8 };

export function HeaderBar({
  title,
  onBack,
  rightElement,
}: {
  title: string;
  onBack: () => void;
  rightElement?: React.ReactNode;
}) {
  const colors = useThemeColors();
  return (
    <View style={styles.headerBar}>
      <Pressable
        onPress={onBack}
        hitSlop={defaultHitSlop}
        style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7, transform: [{ scale: 0.94 }] }]}
      >
        <Ionicons name="arrow-back" size={20} color={colors.text} />
      </Pressable>
      <Text style={[styles.headerTitle, { color: colors.text }]}>{title}</Text>
      {rightElement ? <View style={{ marginLeft: 'auto' }}>{rightElement}</View> : null}
    </View>
  );
}

export function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={defaultHitSlop}
      style={({ pressed }) => [styles.primaryButton, pressed && { opacity: 0.82, transform: [{ scale: 0.97 }] }]}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

export function OutlineButton({ label, onPress }: { label: string; onPress: () => void }) {
  const colors = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={defaultHitSlop}
      style={({ pressed }) => [styles.outlineButton, { borderColor: colors.border }, pressed && { opacity: 0.75, transform: [{ scale: 0.97 }] }]}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={[styles.outlineButtonText, { color: colors.text }]}>{label}</Text>
    </Pressable>
  );
}

export function PrimarySmallButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={defaultHitSlop}
      style={({ pressed }) => [styles.primarySmallButton, pressed && { opacity: 0.8, transform: [{ scale: 0.95 }] }]}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={styles.primarySmallText}>{label}</Text>
    </Pressable>
  );
}

export function GhostSmallButton({ label, onPress }: { label: string; onPress: () => void }) {
  const colors = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={defaultHitSlop}
      style={({ pressed }) => [styles.ghostSmallButton, pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] }]}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={[styles.ghostSmallText, { color: colors.muted }]}>{label}</Text>
    </Pressable>
  );
}

export function LabelledInput({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  multiline,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  multiline?: boolean;
  keyboardType?: 'default' | 'email-address';
}) {
  const colors = useThemeColors();
  return (
    <View style={styles.inputGroup}>
      <Text style={[styles.inputLabel, { color: colors.text }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        keyboardType={keyboardType}
        style={[
          styles.input,
          { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border },
          multiline ? styles.inputMultiline : undefined,
        ]}
      />
    </View>
  );
}

export function SearchInput({
  placeholder,
  value,
  onChangeText,
}: {
  placeholder: string;
  value?: string;
  onChangeText?: (text: string) => void;
}) {
  const colors = useThemeColors();
  return (
    <View style={[styles.searchBar, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
      <Ionicons name="search-outline" size={18} color={colors.muted} />
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        value={value}
        onChangeText={onChangeText}
        style={{ flex: 1, fontSize: 14, color: colors.text, marginLeft: 8 }}
      />
    </View>
  );
}

export function Pill({
  label,
  active,
  tint,
  textColor,
  compact,
  onPress,
}: {
  label: string;
  active?: boolean;
  tint?: string;
  textColor?: string;
  compact?: boolean;
  onPress?: () => void;
}) {
  const colors = useThemeColors();
  const content = (
    <View
      style={[
        styles.pill,
        { backgroundColor: colors.inputBg },
        active ? styles.pillActive : undefined,
        tint ? { backgroundColor: tint } : undefined,
        compact ? styles.pillCompact : undefined,
      ]}
    >
      <Text style={[styles.pillText, { color: colors.text }, active ? styles.pillTextActive : undefined, textColor ? { color: textColor } : undefined]}>
        {label}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <Pressable hitSlop={defaultHitSlop} onPress={onPress} style={({ pressed }) => [pressed && { opacity: 0.75, transform: [{ scale: 0.96 }] }]}>
        {content}
      </Pressable>
    );
  }

  return content;
}

export function StatCard({
  label,
  value,
  accent,
  onPress,
}: {
  label: string;
  value: string;
  accent?: string;
  onPress?: () => void;
}) {
  const colors = useThemeColors();
  const content = (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.statValue, { color: accent || colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.muted }]}>{label}</Text>
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [{ flex: 1 }, pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] }]}>
        {content}
      </Pressable>
    );
  }

  return content;
}

export function IconButton({
  icon,
  onPress,
  badge,
  filled,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  badge?: string;
  filled?: boolean;
}) {
  const colors = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={defaultHitSlop}
      style={({ pressed }) => [
        styles.iconButton,
        { backgroundColor: colors.card, borderColor: colors.border },
        filled ? styles.iconButtonFilled : undefined,
        pressed && { opacity: 0.75, transform: [{ scale: 0.93 }] },
      ]}
    >
      <Ionicons name={icon} size={18} color={filled ? '#fff' : colors.text} />
      {badge ? (
        <View style={styles.iconBadge}>
          <Text style={styles.iconBadgeText}>{badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export function CircleIconButton({
  icon,
  onPress,
  filled,
  light,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  filled?: boolean;
  light?: boolean;
}) {
  const colors = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={defaultHitSlop}
      style={({ pressed }) => [
        styles.circleIconButton,
        { backgroundColor: colors.inputBg },
        filled ? styles.circleIconFilled : undefined,
        light ? styles.circleIconLight : undefined,
        pressed && { opacity: 0.75, transform: [{ scale: 0.93 }] },
      ]}
    >
      <Ionicons name={icon} size={18} color={filled ? '#fff' : light ? colors.text : '#fff'} />
    </Pressable>
  );
}

export function Avatar({
  source,
  size,
  onPress,
}: {
  source: string;
  size: number;
  onPress?: () => void;
}) {
  const isImageUri =
    typeof source === 'string' &&
    (source.startsWith('http://') ||
      source.startsWith('https://') ||
      source.startsWith('file:') ||
      source.startsWith('content:') ||
      source.startsWith('ph:') ||
      source.startsWith('blob:') ||
      source.startsWith('data:'));

  const content = isImageUri ? (
    <Image source={{ uri: source }} style={{ width: size, height: size, borderRadius: size / 2 }} />
  ) : (
    <View
      style={[
        styles.textAvatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      <Text style={styles.textAvatarLabel}>{source}</Text>
    </View>
  );

  if (onPress) {
    return (
      <Pressable hitSlop={defaultHitSlop} onPress={onPress} style={({ pressed }) => [pressed && { opacity: 0.8, transform: [{ scale: 0.95 }] }]}>
        {content}
      </Pressable>
    );
  }
  return content;
}

export function ActionRow({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  const colors = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={defaultHitSlop}
      style={({ pressed }) => [styles.actionRow, { borderBottomColor: colors.border }, pressed && { opacity: 0.75, backgroundColor: colors.inputBg }]}
    >
      <View style={[styles.actionIconWrap, { backgroundColor: colors.inputBg }]}>
        <Ionicons name={icon} size={18} color={colors.text} />
      </View>
      <Text style={[styles.actionLabel, { color: colors.text }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
  );
}

function TabBarItem({
  item,
  active,
  onPress,
  colors,
}: {
  item: { key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap; activeIcon: keyof typeof Ionicons.glyphMap };
  active: boolean;
  onPress: () => void;
  colors: ThemeColors;
}) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.88,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      hitSlop={defaultHitSlop}
      style={styles.tabItem}
    >
      <Animated.View style={{ alignItems: 'center', transform: [{ scale: scaleAnim }] }}>
        <Ionicons
          name={active ? item.activeIcon : item.icon}
          size={20}
          color={active ? colors.tabBarActive : colors.tabBarInactive}
        />
        <Text style={[styles.tabLabel, { color: active ? colors.tabBarActive : colors.tabBarInactive }]}>{item.label}</Text>
      </Animated.View>
    </Pressable>
  );
}

export function TabBar({
  activeTab,
  onChange,
}: {
  activeTab: TabKey;
  onChange: (tab: TabKey) => void;
}) {
  const colors = useThemeColors();
  const items: Array<{
    key: TabKey;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    activeIcon: keyof typeof Ionicons.glyphMap;
  }> = [
    { key: 'home', label: 'Home', icon: 'home-outline', activeIcon: 'home' },
    { key: 'communities', label: 'Communities', icon: 'people-outline', activeIcon: 'people' },
    { key: 'sessions', label: 'Sessions', icon: 'videocam-outline', activeIcon: 'videocam' },
    { key: 'chat', label: 'Chat', icon: 'chatbubble-outline', activeIcon: 'chatbubble' },
    { key: 'profile', label: 'Profile', icon: 'person-outline', activeIcon: 'person' },
  ];

  return (
    <View style={[styles.tabBar, { backgroundColor: colors.tabBarBg, borderTopColor: colors.border }]}>
      {items.map((item) => (
        <TabBarItem
          key={item.key}
          item={item}
          active={item.key === activeTab}
          onPress={() => onChange(item.key)}
          colors={colors}
        />
      ))}
    </View>
  );
}

export function MainShell({
  activeTab,
  onTabChange,
  children,
}: {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  children: React.ReactNode;
}) {
  const colors = useThemeColors();

  return (
    <SafeAreaView style={[styles.mainShell, { backgroundColor: colors.bg }]}>
      <View style={styles.flexFill}>{children}</View>
      <TabBar activeTab={activeTab} onChange={onTabChange} />
    </SafeAreaView>
  );
}
