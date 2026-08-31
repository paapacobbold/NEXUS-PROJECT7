import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Pressable,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { Text } from './Typography';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TabKey, ThemeMode, useAppStore } from '../context/AppStoreContext';
import { AppImage } from './AppImage';
import { tapLight } from '../lib/haptics';
import { brand } from '../data/mockData';
import { styles, ThemeColors, useThemeColors } from '../styles/appStyles';

const defaultHitSlop = { top: 8, bottom: 8, left: 8, right: 8 };

export function HeaderBar({
  title,
  onBack,
  rightElement,
  light,
}: {
  title: string;
  onBack: () => void;
  rightElement?: React.ReactNode;
  /** Pin to the light pre-auth palette instead of following the app theme. */
  light?: boolean;
}) {
  const colors = useThemeColors();
  const headerText = light ? brand.text : colors.text;
  return (
    <View style={styles.headerBar}>
      <Pressable
        onPress={onBack}
        hitSlop={defaultHitSlop}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7, transform: [{ scale: 0.94 }] }]}
      >
        <Ionicons name="arrow-back" size={20} color={headerText} />
      </Pressable>
      <Text style={[styles.headerTitle, { color: headerText }]}>{title}</Text>
      {rightElement ? <View style={{ marginLeft: 'auto' }}>{rightElement}</View> : null}
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  loading = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  /** Shows a spinner and blocks repeat presses while an async action is in flight. */
  loading?: boolean;
  disabled?: boolean;
}) {
  const blocked = loading || disabled;
  return (
    <Pressable
      onPress={onPress}
      disabled={blocked}
      hitSlop={defaultHitSlop}
      style={({ pressed }) => [
        styles.primaryButton,
        blocked && styles.primaryButtonDisabled,
        pressed && !blocked && { opacity: 0.82, transform: [{ scale: 0.97 }] },
      ]}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: blocked, busy: loading }}
    >
      {loading ? <ActivityIndicator size="small" color="#fff" /> : null}
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

const THEME_OPTIONS: Array<{ key: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { key: 'system', label: 'System', icon: 'phone-portrait-outline' },
  { key: 'light', label: 'Light', icon: 'sunny-outline' },
  { key: 'dark', label: 'Dark', icon: 'moon-outline' },
  { key: 'midnight', label: 'Midnight', icon: 'planet-outline' },
];

/**
 * Appearance control. The theme system supported light/dark/midnight from the
 * start but nothing ever called setTheme, so it was unreachable — this is the
 * entry point.
 */
export function ThemePicker() {
  const { theme, setTheme } = useAppStore();
  const colors = useThemeColors();

  return (
    <View style={styles.themePickerCard}>
      <Text style={styles.themePickerTitle}>Appearance</Text>
      <Text style={styles.themePickerHint}>Choose how NEXUS looks on this device.</Text>
      <View style={styles.themePickerRow} accessibilityRole="radiogroup">
        {THEME_OPTIONS.map((option) => {
          const active = theme === option.key;
          return (
            <Pressable
              key={option.key}
              onPress={() => {
                tapLight();
                setTheme(option.key);
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              accessibilityLabel={option.label + ' appearance'}
              style={({ pressed }) => [
                styles.themeOption,
                {
                  borderColor: active ? colors.tabBarActive : colors.border,
                  backgroundColor: active ? colors.tabBarActive : 'transparent',
                },
                pressed && { opacity: 0.75 },
              ]}
            >
              <Ionicons name={option.icon} size={18} color={active ? '#fff' : colors.muted} />
              <Text style={[styles.themeOptionText, { color: active ? '#fff' : colors.muted }]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
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
  light,
  autoCapitalize,
  autoComplete,
  textContentType,
  returnKeyType,
  onSubmitEditing,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  multiline?: boolean;
  keyboardType?: 'default' | 'email-address';
  /** Pin to the light pre-auth palette instead of following the app theme. */
  light?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: TextInputProps['autoComplete'];
  textContentType?: TextInputProps['textContentType'];
  returnKeyType?: TextInputProps['returnKeyType'];
  onSubmitEditing?: TextInputProps['onSubmitEditing'];
}) {
  const colors = useThemeColors();
  const [revealed, setRevealed] = useState(false);
  const isSecure = Boolean(secureTextEntry);

  const palette = light
    ? { text: brand.text, muted: brand.muted, inputBg: '#ECE7E0', border: brand.border }
    : { text: colors.text, muted: colors.muted, inputBg: colors.inputBg, border: colors.border };

  return (
    <View style={styles.inputGroup}>
      <Text style={[styles.inputLabel, { color: palette.text }]}>{label}</Text>
      <View style={styles.inputWrap}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={palette.muted}
          secureTextEntry={isSecure && !revealed}
          multiline={multiline}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCapitalize === 'none' ? false : undefined}
          autoComplete={autoComplete}
          textContentType={textContentType}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          style={[
            styles.input,
            light ? styles.inputLight : undefined,
            { backgroundColor: palette.inputBg, color: palette.text, borderColor: palette.border },
            multiline ? styles.inputMultiline : undefined,
            isSecure ? styles.inputWithAction : undefined,
          ]}
        />
        {isSecure ? (
          <Pressable
            onPress={() => setRevealed((prev) => !prev)}
            hitSlop={defaultHitSlop}
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
            style={styles.inputAction}
          >
            <Ionicons name={revealed ? 'eye-off-outline' : 'eye-outline'} size={20} color={palette.muted} />
          </Pressable>
        ) : null}
      </View>
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
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  badge?: string;
  filled?: boolean;
  /** Screen-reader name. Falls back to a readable form of the icon name. */
  label?: string;
}) {
  const colors = useThemeColors();
  // Icon-only buttons are invisible to screen readers without this.
  const accessibleName = label ?? icon.replace(/-(outline|sharp)$/, '').replace(/-/g, ' ');
  return (
    <Pressable
      onPress={onPress}
      hitSlop={defaultHitSlop}
      accessibilityRole="button"
      accessibilityLabel={accessibleName}
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
  label,
  disabled = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  filled?: boolean;
  light?: boolean;
  /** Screen-reader name; falls back to a readable form of the icon name. */
  label?: string;
  disabled?: boolean;
}) {
  const colors = useThemeColors();
  const accessibleName = label ?? icon.replace(/-(outline|sharp)$/, '').replace(/-/g, ' ');
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={defaultHitSlop}
      accessibilityRole="button"
      accessibilityLabel={accessibleName}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.circleIconButton,
        disabled && { opacity: 0.55 },
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
    <AppImage source={{ uri: source }} style={{ width: size, height: size, borderRadius: size / 2 }} />
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
      onPress={() => {
        tapLight();
        onPress();
      }}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      hitSlop={defaultHitSlop}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={item.label}
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
