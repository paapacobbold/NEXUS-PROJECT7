import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommunityItem, InPersonMeetup, NotificationPrefs, UserProfile } from '../data/mockData';
import { ThemeMode } from '../context/AppStoreContext';

const KEYS = {
  THEME: '@nexus_theme',
  PROFILE: '@nexus_user_profile',
  NOTIFICATIONS: '@nexus_notification_prefs',
  COMMUNITIES: '@nexus_communities_cache',
  MEETUPS: '@nexus_meetups_cache',
};

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
