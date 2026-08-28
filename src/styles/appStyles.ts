import { ColorSchemeName, Platform, StyleSheet, useColorScheme } from 'react-native';
import { ThemeMode, useAppStore } from '../context/AppStoreContext';
import { brand } from '../data/mockData';
import { radius, shadowSm, space, type } from './tokens';

export interface ThemeColors {
  isDark: boolean;
  bg: string;
  card: string;
  cardElevated: string;
  text: string;
  subtext: string;
  muted: string;
  border: string;
  inputBg: string;
  tabBarBg: string;
  tabBarActive: string;
  tabBarInactive: string;
  statusBarStyle: 'light' | 'dark';
}

export function getThemeColors(
  themeMode: ThemeMode,
  systemColorScheme?: ColorSchemeName
): ThemeColors {
  const effectiveMode =
    themeMode === 'system'
      ? systemColorScheme === 'dark'
        ? 'dark'
        : 'light'
      : themeMode;

  if (effectiveMode === 'midnight') {
    return {
      isDark: true,
      bg: '#050712',
      card: '#0D1126',
      cardElevated: '#141A38',
      text: '#F8FAFC',
      subtext: '#CBD5E1',
      muted: '#64748B',
      border: '#1E293B',
      inputBg: '#0F142E',
      tabBarBg: '#080B1C',
      tabBarActive: brand.primary,
      tabBarInactive: '#64748B',
      statusBarStyle: 'light',
    };
  }

  if (effectiveMode === 'dark') {
    return {
      isDark: true,
      bg: '#0F172A',
      card: '#1E293B',
      cardElevated: '#334155',
      text: '#F8FAFC',
      subtext: '#E2E8F0',
      muted: '#94A3B8',
      border: '#334155',
      inputBg: '#1E293B',
      tabBarBg: '#0F172A',
      tabBarActive: brand.primary,
      tabBarInactive: '#94A3B8',
      statusBarStyle: 'light',
    };
  }

  // Default light mode
  return {
    isDark: false,
    bg: '#F8FAFC',
    card: '#FFFFFF',
    cardElevated: '#FFFFFF',
    text: '#0F172A',
    subtext: '#475569',
    muted: '#64748B',
    border: '#E2E8F0',
    inputBg: '#F1F5F9',
    tabBarBg: '#FFFFFF',
    tabBarActive: brand.primary,
    tabBarInactive: '#64748B',
    statusBarStyle: 'dark',
  };
}

export function useThemeColors(): ThemeColors {
  const systemColorScheme = useColorScheme();
  try {
    const store = useAppStore();
    return getThemeColors(store.theme, systemColorScheme);
  } catch {
    return getThemeColors('light', systemColorScheme);
  }
}

export const nowTime = () =>
  new Date().toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });

export const shadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  android: {
    elevation: 3,
  },
  default: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
});

/**
 * The stylesheet is built per theme rather than once at module load, so every
 * screen picks up light / dark / midnight without touching its own code.
 *
 * `styles` below is a proxy onto the currently-active build. App.tsx calls
 * applyThemeStyles() during render, before any descendant reads a style, and a
 * theme change re-renders the whole tree — so reads always see the right build.
 */
function buildStyles(c: ThemeColors) {
  return StyleSheet.create({
    appShell: {
      flex: 1,
      backgroundColor: c.bg,
    },
    splashRippleOne: {
      position: 'absolute',
      width: 220,
      height: 220,
      borderRadius: 110,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.09)',
    },
    splashRippleTwo: {
      position: 'absolute',
      width: 300,
      height: 300,
      borderRadius: 150,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.08)',
    },
    splashRippleThree: {
      position: 'absolute',
      width: 380,
      height: 380,
      borderRadius: 190,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.07)',
    },
    logoTile: {
      width: 72,
      height: 72,
      borderRadius: 20,
      backgroundColor: '#fff',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 18,
    },
    logoLetter: {
      fontSize: 34,
      fontWeight: '800',
      color: brand.primary,
    },
    splashBrand: {
      color: '#fff',
      fontSize: 34,
      fontWeight: '800',
    },
    splashTagline: {
      color: 'rgba(255,255,255,0.82)',
      marginTop: 8,
      fontSize: 15,
    },
    lightScreen: {
      flex: 1,
      backgroundColor: c.bg,
    },
    darkScreen: {
      flex: 1,
      backgroundColor: '#0A0B13',
    },
    flexFill: {
      flex: 1,
    },
    onboardingHeroLayer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      overflow: 'hidden',
    },
    onboardingHeroImage: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
    },
    coverImage: {
      resizeMode: 'cover',
    },
    onboardingTopBar: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'flex-end',
      paddingHorizontal: 18,
    },
    skipPill: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: 'rgba(44,44,44,0.28)',
    },
    skipText: {
      color: '#fff',
      fontWeight: '700',
    },
    onboardingFade: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: 210,
    },
    onboardingBody: {
      flex: 1,
      paddingHorizontal: 22,
      paddingTop: 6,
      gap: 12,
    },
    dotRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#D7D1C8',
    },
    dotActive: {
      width: 22,
      backgroundColor: brand.primary,
    },
    heroTitle: {
      fontSize: 34,
      lineHeight: 38,
      fontWeight: '800',
      color: brand.text,
    },
    heroText: {
      fontSize: 16,
      lineHeight: 25,
      color: c.muted,
    },
    bottomButtonWrap: {
      paddingHorizontal: 22,
      paddingVertical: 22,
    },
    welcomeHero: {
      flex: 1,
    },
    welcomeHeroImage: {
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
    },
    welcomeOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      padding: 24,
    },
    welcomeTitle: {
      color: '#fff',
      fontSize: 38,
      lineHeight: 44,
      fontWeight: '800',
    },
    welcomeText: {
      color: 'rgba(255,255,255,0.9)',
      fontSize: 16,
      lineHeight: 24,
      maxWidth: 320,
    },
    authActions: {
      paddingHorizontal: 22,
      paddingTop: 22,
      gap: 14,
    },
    termsText: {
      paddingHorizontal: 22,
      paddingVertical: 18,
      textAlign: 'center',
      color: c.muted,
      fontSize: 12,
    },
    primaryButton: {
      backgroundColor: brand.primary,
      borderRadius: 18,
      paddingVertical: 18,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
    },
    primaryButtonDisabled: {
      opacity: 0.55,
    },
    primaryButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '800',
    },
    outlineButton: {
      borderWidth: 1.5,
      borderColor: brand.primary,
      borderRadius: 18,
      paddingVertical: 18,
      alignItems: 'center',
      backgroundColor: 'transparent',
    },
    outlineButtonText: {
      color: brand.primary,
      fontSize: 16,
      fontWeight: '800',
    },
    formScreen: {
      paddingHorizontal: 20,
      paddingTop: 14,
      paddingBottom: 36,
      gap: 14,
    },
    headerBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 8,
    },
    backButton: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.inputBg,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: '800',
      color: c.text,
    },
    sectionHeadline: {
      fontSize: 34,
      fontWeight: '800',
      color: c.text,
      marginTop: 4,
    },
    sectionSubline: {
      color: c.muted,
      fontSize: 15,
      marginBottom: 6,
    },
    segmentedRow: {
      flexDirection: 'row',
      backgroundColor: '#EAE5DE',
      borderRadius: 16,
      padding: 4,
      marginBottom: 4,
    },
    segment: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: 'center',
    },
    segmentActive: {
      backgroundColor: brand.primary,
    },
    segmentText: {
      color: c.muted,
      fontWeight: '700',
    },
    segmentTextActive: {
      color: '#fff',
    },
    inputGroup: {
      gap: 8,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '700',
      color: c.text,
    },
    input: {
      backgroundColor: c.inputBg,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 16,
      fontSize: 15,
      color: c.text,
    },
    inputMultiline: {
      minHeight: 116,
      textAlignVertical: 'top',
    },
    helperCenterText: {
      color: brand.muted,
      textAlign: 'center',
      fontSize: 14,
      marginTop: 6,
    },
    helperLink: {
      color: brand.primary,
      fontWeight: '800',
    },

    /* ---------- Auth flow (splash / onboarding / welcome / signup / signin) ----------
       These screens are full-bleed: the root View carries no safe-area padding so
       background art runs under the status bar and the bottom nav bar. Insets are
       applied to the content instead, via useSafeAreaInsets(). */
    authScreen: {
      flex: 1,
      backgroundColor: brand.secondary,
    },
    authScreenDark: {
      flex: 1,
      backgroundColor: '#070918',
    },
    splashRoot: {
      flex: 1,
      backgroundColor: brand.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    splashHint: {
      position: 'absolute',
      alignSelf: 'center',
      color: 'rgba(255,255,255,0.70)',
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 0.4,
    },
    onboardingCopy: {
      color: '#5A5A66',
      fontSize: 16,
      lineHeight: 24,
    },
    onboardingChrome: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: 22,
      gap: 20,
    },
    onboardingCtaButton: {
      height: 58,
      borderRadius: 18,
      backgroundColor: brand.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    onboardingCtaLayer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
    welcomeActions: {
      marginTop: 'auto',
      paddingHorizontal: 24,
      gap: 12,
    },
    welcomeTagline: {
      color: 'rgba(255,255,255,0.86)',
      fontSize: 16,
      lineHeight: 24,
    },
    welcomeButtons: {
      marginTop: 10,
      gap: 12,
    },
    welcomeTerms: {
      color: 'rgba(255,255,255,0.6)',
      fontSize: 12,
      lineHeight: 17,
      textAlign: 'center',
      marginTop: 2,
    },
    outlineButtonOnDark: {
      borderWidth: 1.5,
      borderColor: 'rgba(255,255,255,0.55)',
      backgroundColor: 'rgba(255,255,255,0.10)',
      borderRadius: 18,
      paddingVertical: 18,
      alignItems: 'center',
    },
    outlineButtonTextOnDark: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '800',
    },
    authErrorBox: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      backgroundColor: '#FDECEA',
      borderColor: '#F5C6C2',
      borderWidth: 1,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    authErrorText: {
      flex: 1,
      color: '#8C2F27',
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '600',
    },
    verifyCard: {
      backgroundColor: '#EFF6FF',
      borderColor: '#BFDBFE',
      borderWidth: 1,
      padding: 18,
      borderRadius: 18,
      gap: 10,
      marginVertical: 10,
    },
    verifyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    verifyTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: brand.text,
      flex: 1,
    },
    verifyBody: {
      fontSize: 13,
      color: brand.text,
      lineHeight: 19,
    },
    inputWrap: {
      justifyContent: 'center',
    },
    inputLight: {
      borderWidth: 1,
    },
    inputWithAction: {
      paddingRight: 52,
    },
    inputAction: {
      position: 'absolute',
      right: 14,
      height: 32,
      width: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    mainShell: {
      flex: 1,
    },
    screenContent: {
      paddingHorizontal: 20,
      paddingTop: 14,
      paddingBottom: 24,
      gap: 18,
    },
    topRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
    },
    mutedCopy: {
      color: c.muted,
      fontSize: 14,
    },
    mutedCopySmall: {
      color: c.muted,
      fontSize: 12,
      lineHeight: 18,
    },
    titleLarge: {
      fontSize: 34,
      fontWeight: '800',
      color: c.text,
    },
    topActionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    iconButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.inputBg,
    },
    iconButtonFilled: {
      backgroundColor: brand.primary,
    },
    iconBadge: {
      position: 'absolute',
      top: 4,
      right: 4,
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: brand.danger,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 3,
    },
    iconBadgeText: {
      color: '#fff',
      fontSize: 9,
      fontWeight: '800',
    },
    statsRow: {
      flexDirection: 'row',
      gap: 10,
    },
    statCard: {
      flex: 1,
      backgroundColor: c.inputBg,
      borderRadius: 18,
      paddingVertical: 16,
      alignItems: 'center',
      ...shadow,
      ...shadowSm,
    },
    statValue: {
      fontSize: 22,
      fontWeight: '800',
      color: brand.primary,
    },
    statLabel: {
      color: c.muted,
      fontSize: 12,
      marginTop: 4,
    },
    liveCard: {
      backgroundColor: brand.primary,
      borderRadius: 22,
      padding: 18,
      gap: 10,
      ...shadow,
      ...shadowSm,
    },
    liveBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 999,
      backgroundColor: 'rgba(255,255,255,0.16)',
    },
    liveDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#FF655E',
    },
    liveBadgeText: {
      color: '#fff',
      fontSize: 11,
      fontWeight: '800',
    },
    liveTitle: {
      color: '#fff',
      fontSize: 24,
      fontWeight: '800',
    },
    liveMeta: {
      color: 'rgba(255,255,255,0.82)',
      fontSize: 14,
    },
    inlineButton: {
      marginTop: 4,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      alignSelf: 'flex-start',
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 999,
      backgroundColor: 'rgba(255,255,255,0.16)',
    },
    inlineButtonText: {
      color: '#fff',
      fontWeight: '700',
    },
    sectionHeadingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: c.text,
    },
    sectionLink: {
      fontSize: 13,
      color: brand.primary,
      fontWeight: '800',
    },
    horizontalList: {
      gap: 12,
    },
    sessionCard: {
      width: 220,
      backgroundColor: c.card,
      borderRadius: 18,
      padding: 16,
      gap: 10,
      borderWidth: 1,
      borderColor: c.border,
      ...shadow,
      ...shadowSm,
    },
    sessionTitle: {
      fontSize: 16,
      lineHeight: 22,
      fontWeight: '800',
      color: c.text,
    },
    sessionTime: {
      color: c.muted,
      fontSize: 13,
    },
    sessionParticipants: {
      color: c.muted,
      fontSize: 12,
    },
    communityRowCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 14,
      borderRadius: 18,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      ...shadowSm,
    },
    communityThumb: {
      width: 54,
      height: 54,
      borderRadius: 14,
    },
    communityName: {
      fontSize: 16,
      fontWeight: '800',
      color: c.text,
    },
    screenHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    screenTitle: {
      fontSize: 28,
      fontWeight: '800',
      color: c.text,
      flex: 1,
    },
    searchBar: {
      backgroundColor: c.inputBg,
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    searchPlaceholder: {
      color: c.muted,
      fontSize: 14,
    },
    filterPillsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    pill: {
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 999,
      backgroundColor: '#E8E4DE',
      alignSelf: 'flex-start',
    },
    pillActive: {
      backgroundColor: brand.primary,
    },
    pillText: {
      fontSize: 12,
      fontWeight: '700',
      color: c.muted,
    },
    pillTextActive: {
      color: '#fff',
    },
    pillCompact: {
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    recommendedCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: '#E8E6F6',
      borderRadius: 18,
      padding: 14,
      ...shadowSm,
    },
    recommendedIcon: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: '#D8D3FF',
      alignItems: 'center',
      justifyContent: 'center',
    },
    recommendedTitle: {
      color: brand.primary,
      fontWeight: '800',
      fontSize: 14,
    },
    largeCommunityCard: {
      overflow: 'hidden',
      borderRadius: 20,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      ...shadowSm,
    },
    largeCommunityImage: {
      width: '100%',
      height: 126,
    },
    cardBody: {
      padding: 14,
      gap: 10,
    },
    cardTitleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 10,
    },
    communityDescription: {
      color: c.muted,
      fontSize: 13,
      lineHeight: 20,
    },
    liveHeroCard: {
      backgroundColor: brand.primary,
      borderRadius: 22,
      padding: 18,
      gap: 8,
      ...shadowSm,
    },
    liveHeroLabel: {
      color: 'rgba(255,255,255,0.75)',
      fontSize: 12,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    liveHeroTitle: {
      color: '#fff',
      fontSize: 24,
      fontWeight: '800',
    },
    liveHeroMeta: {
      color: 'rgba(255,255,255,0.82)',
      fontSize: 14,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 8,
    },
    primarySmallButton: {
      flex: 1,
      backgroundColor: '#fff',
      paddingVertical: 12,
      borderRadius: 16,
      alignItems: 'center',
    },
    primarySmallText: {
      color: brand.primary,
      fontWeight: '800',
    },
    ghostSmallButton: {
      flex: 1,
      borderWidth: 1,
      borderColor: '#D4D4FF',
      paddingVertical: 12,
      borderRadius: 16,
      alignItems: 'center',
    },
    ghostSmallText: {
      color: '#fff',
      fontWeight: '800',
    },
    filterSummaryCard: {
      borderRadius: 18,
      backgroundColor: c.card,
      padding: 16,
      borderWidth: 1,
      borderColor: c.border,
      ...shadowSm,
    },
    filterSummaryTitle: {
      color: c.text,
      fontWeight: '800',
      marginBottom: 8,
    },
    filterSummaryText: {
      color: c.muted,
      lineHeight: 20,
    },
    sessionListCard: {
      backgroundColor: c.card,
      borderRadius: 18,
      padding: 16,
      borderWidth: 1,
      borderColor: c.border,
      gap: 8,
      ...shadowSm,
    },
    sessionListTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    threadRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: '#ECE7E0',
    },
    threadTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 10,
    },
    threadName: {
      fontSize: 15,
      fontWeight: '800',
      color: c.text,
    },
    threadTime: {
      color: c.muted,
      fontSize: 12,
    },
    threadPreview: {
      color: c.muted,
      fontSize: 13,
      marginTop: 4,
    },
    unreadBadge: {
      minWidth: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: '#D46937',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 6,
    },
    unreadText: {
      color: '#fff',
      fontWeight: '800',
      fontSize: 11,
    },
    profileScrollContent: {
      paddingBottom: 28,
    },
    profileHero: {
      height: 160,
      backgroundColor: brand.primary,
    },
    floatingEditButton: {
      position: 'absolute',
      right: 20,
      top: 20,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.22)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    profileCard: {
      marginTop: -34,
      backgroundColor: c.bg,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: 20,
      paddingTop: 20,
      gap: 16,
      ...shadowSm,
    },
    profileTopRow: {
      width: 74,
      height: 74,
    },
    profileAvatar: {
      width: 74,
      height: 74,
      borderRadius: 37,
      borderWidth: 3,
      borderColor: '#fff',
    },
    onlineDot: {
      position: 'absolute',
      bottom: 2,
      right: 2,
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: '#59B980',
      borderWidth: 2,
      borderColor: '#fff',
    },
    profileHeadingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    ratingPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: '#FFF8E7',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 12,
    },
    ratingText: {
      fontSize: 12,
      fontWeight: '800',
      color: '#B16A0E',
    },
    profileBio: {
      color: c.text,
      fontSize: 14,
      lineHeight: 22,
    },
    subsectionTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: c.text,
      marginTop: 6,
    },
    skillWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    badgesRow: {
      flexDirection: 'row',
      gap: 12,
    },
    badgeCard: {
      flex: 1,
      backgroundColor: c.card,
      borderRadius: 16,
      paddingVertical: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.border,
      gap: 4,
      ...shadowSm,
    },
    badgeEmoji: {
      fontSize: 22,
    },
    badgeLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: c.text,
    },
    signOutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 14,
      borderRadius: 16,
      backgroundColor: '#FDF2F1',
      marginTop: 8,
    },
    signOutText: {
      color: brand.danger,
      fontWeight: '800',
      fontSize: 15,
    },
    profileName: {
      fontSize: 26,
      fontWeight: '800',
      color: c.text,
    },
    profileMajor: {
      color: c.muted,
      fontSize: 14,
      marginTop: 2,
    },
    actionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: brand.border,
    },
    actionIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: c.inputBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionLabel: {
      flex: 1,
      fontSize: 15,
      fontWeight: '700',
      color: c.text,
    },
    circleIconButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.2)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    circleIconFilled: {
      backgroundColor: brand.primary,
    },
    circleIconLight: {
      backgroundColor: c.inputBg,
    },
    fieldShell: {
      gap: 6,
    },
    filterSection: {
      gap: 10,
      marginBottom: 8,
    },
    filterTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: c.text,
    },
    filterWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    filterChip: {
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 14,
      backgroundColor: c.inputBg,
    },
    filterChipActive: {
      backgroundColor: brand.primary,
    },
    filterChipText: {
      fontSize: 13,
      fontWeight: '700',
      color: c.muted,
    },
    filterChipTextActive: {
      color: '#fff',
    },
    communityDetailContent: {
      paddingBottom: 80,
    },
    communityHero: {
      height: 200,
      justifyContent: 'flex-end',
    },
    communityHeroOverlay: {
      padding: 18,
      gap: 4,
    },
    communityHeroActions: {
      position: 'absolute',
      top: 14,
      left: 14,
      right: 14,
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    communityHeroTitle: {
      color: '#fff',
      fontSize: 28,
      fontWeight: '800',
    },
    communityHeroMeta: {
      color: 'rgba(255,255,255,0.85)',
      fontSize: 13,
    },
    communityTabRow: {
      flexDirection: 'row',
      gap: 20,
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: brand.border,
      backgroundColor: c.card,
    },
    communityTabText: {
      fontSize: 14,
      fontWeight: '700',
      color: c.muted,
    },
    communityTabTextActive: {
      color: brand.primary,
      borderBottomWidth: 2,
      borderBottomColor: brand.primary,
    },
    sharePrompt: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 14,
      marginHorizontal: 20,
      marginTop: 14,
      backgroundColor: c.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.border,
    },
    shareAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: brand.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    shareAvatarText: {
      color: '#fff',
      fontWeight: '800',
      fontSize: 14,
    },
    postCard: {
      backgroundColor: c.card,
      borderRadius: 18,
      padding: 16,
      marginHorizontal: 20,
      marginTop: 12,
      gap: 8,
      borderWidth: 1,
      borderColor: c.border,
    },
    postHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    postTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: c.text,
    },
    postBody: {
      color: c.text,
      fontSize: 14,
      lineHeight: 20,
    },
    stickyBottomActions: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      gap: 10,
      paddingHorizontal: 20,
      paddingVertical: 14,
      backgroundColor: 'rgba(255,255,255,0.94)',
      borderTopWidth: 1,
      borderTopColor: brand.border,
    },
    chatHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: brand.border,
      backgroundColor: c.card,
    },
    onlineText: {
      color: '#59B980',
      fontSize: 12,
      fontWeight: '700',
    },
    chatMessages: {
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 10,
    },
    chatDayMarker: {
      textAlign: 'center',
      color: c.muted,
      fontSize: 12,
      marginVertical: 8,
    },
    messageBubble: {
      maxWidth: '78%',
      borderRadius: 18,
      paddingHorizontal: 14,
      paddingVertical: 12,
      gap: 6,
    },
    messageBubbleMine: {
      alignSelf: 'flex-end',
      backgroundColor: brand.primary,
    },
    messageBubbleTheirs: {
      alignSelf: 'flex-start',
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
    },
    messageText: {
      fontSize: 14,
      lineHeight: 20,
      color: c.text,
    },
    messageTextMine: {
      color: '#fff',
    },
    messageTime: {
      fontSize: 11,
      color: c.muted,
      alignSelf: 'flex-end',
    },
    messageTimeMine: {
      color: 'rgba(255,255,255,0.7)',
    },
    chatComposer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: brand.border,
      backgroundColor: c.bg,
    },
    composerInput: {
      flex: 1,
      backgroundColor: c.card,
      borderRadius: 18,
      paddingHorizontal: 16,
      paddingVertical: 14,
      color: c.text,
    },
    sessionLobbyBg: {
      flex: 1,
    },
    sessionLobbyAttendees: {
      alignItems: 'flex-end',
      gap: 10,
      paddingTop: 20,
      paddingRight: 16,
    },
    lobbyAvatar: {
      width: 54,
      height: 54,
      borderRadius: 18,
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.15)',
    },
    sessionLobbyCenter: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 30,
      gap: 14,
    },
    liveBadgeOutline: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.22)',
      backgroundColor: 'rgba(122,34,34,0.28)',
    },
    lobbyTitle: {
      color: '#fff',
      fontSize: 34,
      lineHeight: 40,
      textAlign: 'center',
      fontWeight: '800',
    },
    lobbyMeta: {
      color: 'rgba(255,255,255,0.78)',
    },
    sessionControls: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingHorizontal: 12,
      paddingBottom: 28,
    },
    controlItem: {
      alignItems: 'center',
      gap: 8,
    },
    controlCircle: {
      width: 54,
      height: 54,
      borderRadius: 27,
      backgroundColor: 'rgba(255,255,255,0.14)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    leaveCircle: {
      backgroundColor: '#D8473C',
    },
    controlText: {
      color: '#fff',
      fontSize: 12,
    },
    saveChip: {
      backgroundColor: brand.primary,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 999,
    },
    saveChipText: {
      color: '#fff',
      fontWeight: '800',
    },
    editAvatarWrap: {
      alignItems: 'center',
      marginBottom: 8,
    },
    editAvatar: {
      width: 86,
      height: 86,
      borderRadius: 43,
    },
    editAvatarBadge: {
      position: 'absolute',
      right: '35%',
      bottom: 0,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: brand.primary,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: brand.secondary,
    },
    settingsSectionTitle: {
      fontSize: 12,
      fontWeight: '800',
      color: c.muted,
      marginTop: 8,
      marginBottom: 6,
    },
    settingsCard: {
      backgroundColor: c.card,
      borderRadius: 18,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.border,
    },
    preferenceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    preferenceRowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: brand.border,
    },
    preferenceLabel: {
      color: c.text,
      fontWeight: '800',
      marginBottom: 4,
    },
    textAvatar: {
      backgroundColor: '#D67234',
      alignItems: 'center',
      justifyContent: 'center',
    },
    textAvatarLabel: {
      color: '#fff',
      fontWeight: '800',
      fontSize: 14,
    },
    tabBar: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingTop: 12,
      paddingBottom: 18,
      borderTopWidth: 1,
      borderTopColor: brand.border,
      backgroundColor: 'rgba(255,255,255,0.92)',
    },
    tabItem: {
      alignItems: 'center',
      gap: 4,
      minWidth: 62,
    },
    tabLabel: {
      fontSize: 11,
      color: c.muted,
    },
    tabLabelActive: {
      color: brand.primary,
      fontWeight: '800',
    },
    controlCircleActive: {
      backgroundColor: brand.primary,
    },
    controlCircleHand: {
      backgroundColor: '#E07038',
    },
    cameraPreviewWrap: {
      width: 130,
      height: 175,
      borderRadius: 16,
      overflow: 'hidden',
      borderWidth: 2,
      borderColor: '#fff',
      position: 'absolute',
      bottom: 100,
      right: 16,
      zIndex: 10,
    },
    cameraPreviewImage: {
      width: '100%',
      height: '100%',
    },
    cameraOffOverlay: {
      width: '100%',
      height: '100%',
      backgroundColor: '#1E202C',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    cameraOffText: {
      color: 'rgba(255,255,255,0.7)',
      fontSize: 11,
    },
    handRaisedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: '#E07038',
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 999,
    },
    handRaisedText: {
      color: '#fff',
      fontWeight: '800',
      fontSize: 12,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.65)',
      justifyContent: 'flex-end',
    },
    modalCard: {
      backgroundColor: c.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 20,
      maxHeight: '75%',
      gap: 14,
      ...shadowSm,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: brand.border,
      paddingBottom: 12,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: c.text,
    },
    participantRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: '#F0EEEA',
    },
    participantRole: {
      color: c.muted,
      fontSize: 12,
    },
    videoModalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.85)',
      justifyContent: 'flex-end',
    },
    videoPlayerCard: {
      backgroundColor: '#13141E',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 20,
      maxHeight: '90%',
      gap: 14,
    },
    videoPlayerScreen: {
      width: '100%',
      height: 210,
      borderRadius: 18,
      overflow: 'hidden',
      backgroundColor: '#000',
    },
    videoPlayOverlay: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.3)',
    },
    videoProgressBarWrap: {
      height: 4,
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderRadius: 2,
      overflow: 'hidden',
    },
    videoProgressBarFill: {
      height: '100%',
      backgroundColor: brand.primary,
    },
    videoControlsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 6,
    },
    speedPill: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
      backgroundColor: 'rgba(255,255,255,0.1)',
    },
    speedPillActive: {
      backgroundColor: brand.primary,
    },
    speedPillText: {
      color: 'rgba(255,255,255,0.7)',
      fontSize: 11,
      fontWeight: '700',
    },
    speedPillTextActive: {
      color: '#fff',
    },
    chapterItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,255,255,0.08)',
    },
    chapterTimeText: {
      color: '#E07038',
      fontSize: 12,
      fontWeight: '800',
    },
    levelProgressTrack: {
      height: 8,
      backgroundColor: '#E2DFD7',
      borderRadius: 4,
      overflow: 'hidden',
      marginVertical: 6,
    },
    levelProgressFill: {
      height: '100%',
      backgroundColor: '#E07038',
    },
    levelBadgeChip: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: '#FFF0D6',
      alignSelf: 'flex-start',
    },
    levelBadgeText: {
      fontSize: 11,
      fontWeight: '800',
      color: '#B16A0E',
    },
    perkCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 14,
      backgroundColor: c.card,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: 10,
    },
    perkIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: '#FFF4EB',
      alignItems: 'center',
      justifyContent: 'center',
    },
    perkCostBadge: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 10,
      backgroundColor: '#E6F4EA',
    },
    perkCostText: {
      fontSize: 12,
      fontWeight: '800',
      color: '#137333',
    },
    voucherCodeBox: {
      backgroundColor: '#F4F2EE',
      padding: 14,
      borderRadius: 14,
      borderStyle: 'dashed',
      borderWidth: 1.5,
      borderColor: brand.primary,
      alignItems: 'center',
      marginVertical: 10,
    },
    voucherCodeText: {
      fontSize: 20,
      fontWeight: '800',
      color: brand.primary,
      letterSpacing: 2,
    },
    mapPreviewBox: {
      width: '100%',
      height: 180,
      borderRadius: 18,
      overflow: 'hidden',
      backgroundColor: '#E2DFD7',
      marginVertical: 10,
    },
    mapPinMarker: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: brand.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    directionsCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      padding: 12,
      backgroundColor: '#EFF6FF',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: '#BFDBFE',
    },
    directionsText: {
      color: '#1E40AF',
      fontSize: 13,
      fontWeight: '700',
    },
    hotspotWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginVertical: 6,
    },
    hotspotChip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      backgroundColor: c.inputBg,
    },
    hotspotChipActive: {
      backgroundColor: brand.primary,
    },
    hotspotChipText: {
      fontSize: 12,
      fontWeight: '700',
      color: c.muted,
    },
    hotspotChipTextActive: {
      color: '#fff',
    },
    verifiedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: '#E6F4EA',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 10,
      alignSelf: 'flex-start',
      marginTop: 4,
    },
    verifiedText: {
      fontSize: 11,
      fontWeight: '800',
      color: '#137333',
    },
    endorseChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 12,
    },
    endorseCount: {
      fontSize: 11,
      fontWeight: '800',
      color: brand.primary,
    },
    reviewCard: {
      backgroundColor: c.card,
      borderRadius: 16,
      padding: 14,
      borderWidth: 1,
      borderColor: c.border,
      gap: 6,
      marginBottom: 8,
    },
    starRow: {
      flexDirection: 'row',
      gap: 6,
      marginVertical: 6,
    },
    globalSearchBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.75)',
      justifyContent: 'flex-start',
      paddingTop: 50,
    },
    globalSearchCard: {
      backgroundColor: c.card,
      marginHorizontal: 16,
      borderRadius: 22,
      padding: 18,
      maxHeight: '85%',
      gap: 12,
    },
    globalSearchInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.inputBg,
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 12,
      gap: 10,
    },
    globalSearchInput: {
      flex: 1,
      fontSize: 15,
      color: c.text,
      fontWeight: '600',
    },
    entityBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      backgroundColor: '#E0E7FF',
      alignSelf: 'flex-start',
    },
    entityBadgeText: {
      fontSize: 10,
      fontWeight: '800',
      color: brand.primary,
    },
    searchResultRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#F4F2EE',
    },
    resourceFileRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 14,
      backgroundColor: c.card,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: 10,
    },
    pdfIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: '#FEE2E2',
      alignItems: 'center',
      justifyContent: 'center',
    },
    downloadPill: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 10,
      backgroundColor: brand.primary,
    },
    downloadPillDone: {
      backgroundColor: '#E6F4EA',
    },
    fileSizeText: {
      fontSize: 11,
      color: c.muted,
      marginTop: 2,
    },
    notificationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#F4F2EE',
    },
    notificationUnreadRow: {
      backgroundColor: '#EFF6FF',
      paddingHorizontal: 10,
      borderRadius: 14,
      borderBottomWidth: 0,
      marginBottom: 6,
    },
    notificationIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: '#E0E7FF',
      alignItems: 'center',
      justifyContent: 'center',
    },
    notificationUnreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: brand.primary,
    },
    streakCard: {
      backgroundColor: c.card,
      padding: 16,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: c.border,
      marginVertical: 10,
      gap: 10,
    },
    streakDaysRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 6,
    },
    streakDayItem: {
      alignItems: 'center',
      gap: 4,
      paddingVertical: 8,
      paddingHorizontal: 8,
      borderRadius: 12,
      backgroundColor: '#F4F2EE',
      minWidth: 40,
    },
    streakDayItemActive: {
      backgroundColor: '#FFF4EB',
      borderWidth: 1,
      borderColor: '#FFE4D1',
    },
    streakDayName: {
      fontSize: 11,
      fontWeight: '700',
      color: c.muted,
    },
    goalTaskCard: {
      backgroundColor: c.card,
      borderRadius: 16,
      padding: 14,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: 8,
    },
    goalTaskRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },

    /* ------------------------------ Appearance ----------------------------- */
    themePickerCard: {
      borderRadius: radius.md,
      borderWidth: 1,
      padding: space.lg,
      gap: space.sm,
      backgroundColor: c.card,
      borderColor: c.border,
      ...shadowSm,
    },
    themePickerTitle: {
      ...type.subheading,
      color: c.text,
    },
    themePickerHint: {
      ...type.caption,
      color: c.muted,
    },
    themePickerRow: {
      flexDirection: "row",
      gap: space.sm,
      marginTop: space.xs,
    },
    themeOption: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: space.md,
      paddingHorizontal: 4,
      borderRadius: radius.sm,
      borderWidth: 1.5,
    },
    themeOptionText: {
      ...type.label,
      textAlign: "center",
    },
  });
}

type AppStyles = ReturnType<typeof buildStyles>;

const styleCache = new Map<string, AppStyles>();

function buildCached(c: ThemeColors): AppStyles {
  const key = `${c.bg}|${c.card}|${c.text}|${c.border}|${c.inputBg}|${c.muted}`;
  let built = styleCache.get(key);
  if (!built) {
    built = buildStyles(c);
    styleCache.set(key, built);
  }
  return built;
}

let activeStyles: AppStyles = buildCached(getThemeColors("light"));

/** Swap the active stylesheet. Call during render, above the tree that reads it. */
export function applyThemeStyles(c: ThemeColors): void {
  activeStyles = buildCached(c);
}

export const styles = new Proxy({} as AppStyles, {
  get: (_target, prop: string) => (activeStyles as any)[prop],
  has: (_target, prop: string) => prop in (activeStyles as any),
  ownKeys: () => Reflect.ownKeys(activeStyles as any),
  getOwnPropertyDescriptor: (_target, prop) => ({
    ...Object.getOwnPropertyDescriptor(activeStyles as any, prop),
    configurable: true,
  }),
});

/** Styles for the current theme. Equivalent to `styles`, for explicit call sites. */
export function useStyles(): AppStyles {
  return buildCached(useThemeColors());
}
