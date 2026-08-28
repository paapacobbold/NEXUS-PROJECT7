import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommunityItem, InPersonMeetup, NotificationPrefs, UserProfile } from '../data/mockData';
import { ThemeMode } from '../context/AppStoreContext';

const KEYS = {
  THEME: '@nexus_theme',
  PROFILE: '@nexus_user_profile',
  NOTIFICATIONS: '@nexus_notification_prefs',
  COMMUNITIES: '@nexus_communities_cache',
  MEETUPS: '@nexus_meetups_cache',
  ONBOARDING_SEEN: '@nexus_onboarding_seen',
  AUTH_STATE: '@nexus_auth_state',
};

/**
 * Local record of whether the user is signed in.
 *
 * When Supabase is configured its own persisted session is authoritative; this
 * flag is what carries sign-in state in offline/mock mode, and it is what lets
 * the launch sequence pick an entry route before any network call resolves.
 */
export type PersistedAuthState = 'authenticated' | 'guest';

export async function saveAuthState(state: PersistedAuthState): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.AUTH_STATE, state);
  } catch (err) {
    console.warn('Error saving auth state:', err);
  }
}

export async function loadAuthState(): Promise<PersistedAuthState | null> {
  try {
    const val = await AsyncStorage.getItem(KEYS.AUTH_STATE);
    return val === 'authenticated' || val === 'guest' ? val : null;
  } catch (err) {
    console.warn('Error loading auth state:', err);
    return null;
  }
}

export async function saveOnboardingSeen(): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.ONBOARDING_SEEN, 'true');
  } catch (err) {
    console.warn('Error saving onboarding flag:', err);
  }
}

export async function loadOnboardingSeen(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(KEYS.ONBOARDING_SEEN)) === 'true';
  } catch (err) {
    console.warn('Error loading onboarding flag:', err);
    return false;
  }
}

/** Clears per-user state on sign out. Onboarding and theme are device-level, so they stay. */
export async function clearSessionStorage(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([KEYS.AUTH_STATE, KEYS.PROFILE]);
  } catch (err) {
    console.warn('Error clearing session storage:', err);
  }
}

export async function saveThemeStorage(theme: ThemeMode): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.THEME, theme);
  } catch (err) {
    console.warn('Error saving theme:', err);
  }
}

export async function loadThemeStorage(): Promise<ThemeMode | null> {
  try {
    const val = await AsyncStorage.getItem(KEYS.THEME);
    if (val === 'light' || val === 'dark' || val === 'midnight') {
      return val;
    }
    return null;
  } catch (err) {
    console.warn('Error loading theme:', err);
    return null;
  }
}

export async function saveProfileStorage(profile: UserProfile): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
  } catch (err) {
    console.warn('Error saving profile:', err);
  }
}

export async function loadProfileStorage(): Promise<UserProfile | null> {
  try {
    const val = await AsyncStorage.getItem(KEYS.PROFILE);
    return val ? JSON.parse(val) : null;
  } catch (err) {
    console.warn('Error loading profile:', err);
    return null;
  }
}

export async function saveNotificationPrefsStorage(prefs: NotificationPrefs): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(prefs));
  } catch (err) {
    console.warn('Error saving notifications:', err);
  }
}

export async function loadNotificationPrefsStorage(): Promise<NotificationPrefs | null> {
  try {
    const val = await AsyncStorage.getItem(KEYS.NOTIFICATIONS);
    return val ? JSON.parse(val) : null;
  } catch (err) {
    console.warn('Error loading notifications:', err);
    return null;
  }
}

export async function saveCommunitiesCache(communities: CommunityItem[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.COMMUNITIES, JSON.stringify(communities));
  } catch (err) {
    console.warn('Error caching communities:', err);
  }
}

export async function loadCommunitiesCache(): Promise<CommunityItem[] | null> {
  try {
    const val = await AsyncStorage.getItem(KEYS.COMMUNITIES);
    return val ? JSON.parse(val) : null;
  } catch (err) {
    console.warn('Error loading communities cache:', err);
    return null;
  }
}

export async function saveMeetupsCache(meetups: InPersonMeetup[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.MEETUPS, JSON.stringify(meetups));
  } catch (err) {
    console.warn('Error caching meetups:', err);
  }
}

export async function loadMeetupsCache(): Promise<InPersonMeetup[] | null> {
  try {
    const val = await AsyncStorage.getItem(KEYS.MEETUPS);
    return val ? JSON.parse(val) : null;
  } catch (err) {
    console.warn('Error loading meetups cache:', err);
    return null;
  }
}
