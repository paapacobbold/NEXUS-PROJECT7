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
import { styles } from '../styles/appStyles';

export function HeaderBar({
  title,
  onBack,
  rightElement,
}: {
  title: string;
  onBack: () => void;
  rightElement?: React.ReactNode;
}) {
  return (
    <View style={styles.headerBar}>
      <Pressable onPress={onBack} style={styles.backButton}>
        <Ionicons name="arrow-back" size={20} color={brand.text} />
      </Pressable>
      <Text style={styles.headerTitle}>{title}</Text>
      {rightElement ? <View style={{ marginLeft: 'auto' }}>{rightElement}</View> : null}
    </View>
  );
}

export function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.primaryButton}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

export function OutlineButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.outlineButton}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={styles.outlineButtonText}>{label}</Text>
    </Pressable>
  );
}

export function PrimarySmallButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.primarySmallButton}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={styles.primarySmallText}>{label}</Text>
    </Pressable>
  );
}

export function GhostSmallButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.ghostSmallButton}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={styles.ghostSmallText}>{label}</Text>
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
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={brand.muted}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        keyboardType={keyboardType}
        style={[styles.input, multiline ? styles.inputMultiline : undefined]}
      />
    </View>
  );
}

export function SearchInput({ placeholder }: { placeholder: string }) {
  return (
    <View style={styles.searchBar}>
      <Ionicons name="search-outline" size={18} color={brand.muted} />
      <Text style={styles.searchPlaceholder}>{placeholder}</Text>
    </View>
  );
}

export function Pill({
  label,
  active,
  tint,
  textColor,
  compact,
}: {
  label: string;
  active?: boolean;
  tint?: string;
  textColor?: string;
  compact?: boolean;
}) {
  return (
    <View
      style={[
        styles.pill,
        active ? styles.pillActive : undefined,
        tint ? { backgroundColor: tint } : undefined,
        compact ? styles.pillCompact : undefined,
      ]}
    >
      <Text style={[styles.pillText, active ? styles.pillTextActive : undefined, textColor ? { color: textColor } : undefined]}>
        {label}
      </Text>
    </View>
  );
}

export function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, accent ? { color: accent } : undefined]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
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
  return (
    <Pressable onPress={onPress} style={[styles.iconButton, filled ? styles.iconButtonFilled : undefined]}>
      <Ionicons name={icon} size={18} color={filled ? '#fff' : brand.text} />
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
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.circleIconButton,
        filled ? styles.circleIconFilled : undefined,
        light ? styles.circleIconLight : undefined,
      ]}
    >
      <Ionicons name={icon} size={18} color={filled ? '#fff' : light ? brand.text : '#fff'} />
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
  const content = source.startsWith('http') ? (
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
    return <Pressable onPress={onPress}>{content}</Pressable>;
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
  return (
    <Pressable onPress={onPress} style={styles.actionRow}>
      <View style={styles.actionIconWrap}>
        <Ionicons name={icon} size={18} color={brand.text} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={brand.muted} />
    </Pressable>
  );
}

function TabBarItem({
  item,
  active,
  onPress,
}: {
  item: { key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap; activeIcon: keyof typeof Ionicons.glyphMap };
  active: boolean;
  onPress: () => void;
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
      style={styles.tabItem}
    >
      <Animated.View style={{ alignItems: 'center', transform: [{ scale: scaleAnim }] }}>
        <Ionicons
          name={active ? item.activeIcon : item.icon}
          size={20}
          color={active ? brand.primary : brand.muted}
        />
        <Text style={[styles.tabLabel, active ? styles.tabLabelActive : undefined]}>{item.label}</Text>
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
    <View style={styles.tabBar}>
      {items.map((item) => (
        <TabBarItem
          key={item.key}
          item={item}
          active={item.key === activeTab}
          onPress={() => onChange(item.key)}
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
  const { theme } = useAppStore();
  const bg = theme === 'midnight' ? '#0A0D1A' : theme === 'dark' ? '#141622' : '#FAF8F5';

  return (
    <SafeAreaView style={[styles.mainShell, { backgroundColor: bg }]}>
      <View style={styles.flexFill}>{children}</View>
      <TabBar activeTab={activeTab} onChange={onTabChange} />
    </SafeAreaView>
  );
}
