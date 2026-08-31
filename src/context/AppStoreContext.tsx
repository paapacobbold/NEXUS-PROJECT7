import { createContext, useContext } from 'react';
import {
  CommunityItem,
  InPersonMeetup,
  NotificationPrefs,
  SessionItem,
  ThreadPreview,
  UserProfile,
  filterSections,
} from '@/data/mockData';

export type AppRoute =
  | 'splash'
  | 'onboarding'
  | 'welcome'
  | 'signup'
  | 'signin'
  | 'main-home'
  | 'main-communities'
  | 'main-sessions'
  | 'main-chat'
  | 'main-profile'
  | 'community-details'
  | 'create-community'
  | 'schedule-session'
  | 'create-meetup'
  | 'leaderboard'
  | 'recordings'
  | 'filters'
  | 'private-chat'
  | 'session-lobby'
  | 'edit-profile'
  | 'change-password'
  | 'notification-preferences'
  | 'moderation'
  | 'community-members';

export type TabKey = 'home' | 'communities' | 'sessions' | 'chat' | 'profile';
export type FilterKey = keyof typeof filterSections;
export type FilterState = Record<FilterKey, string[]>;
export type ThemeMode = 'system' | 'light' | 'dark' | 'midnight';

export type AppStore = {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  profile: UserProfile;
  updateProfile: (patch: Partial<UserProfile>) => void;
  notificationPrefs: NotificationPrefs;
  toggleNotification: (key: keyof NotificationPrefs) => void;
  threads: ThreadPreview[];
  messagesByThread: Record<string, { id: string; sender: 'me' | 'them'; text: string; time: string }[]>;
  sendMessage: (threadId: string, text: string) => void;
  selectedFilters: FilterState;
  toggleFilter: (section: FilterKey, value: string) => void;
  resetFilters: () => void;
  communitiesList: CommunityItem[];
  toggleJoinCommunity: (communityId: string) => void;
  addCommunity: (name: string, subject: string, description: string) => void;
  sessionsList: SessionItem[];
  addSession: (title: string, tag: string, time: string) => void;
  meetupsList: InPersonMeetup[];
  toggleRSVPMeetup: (meetupId: string) => void;
  addMeetup: (title: string, location: string, dateTime: string) => void;
  /** True until the first remote fetch settles — drives skeleton placeholders. */
  isLoadingData: boolean;
  /** True while a pull-to-refresh is in flight. */
  isRefreshing: boolean;
  /** Re-fetches communities, sessions and meetups. Wired to RefreshControl. */
  refreshAll: () => Promise<void>;

  /* ------------------------------- Session ------------------------------- */
  /** True while the launch sequence restores the persisted session. */
  isBootstrapping: boolean;
  /** True when a Supabase session (or an offline sign-in) is active. */
  isAuthenticated: boolean;
  /** Records a successful sign-in / sign-up and persists it across relaunches. */
  markAuthenticated: () => void;
  /** Ends the session, clears cached user state, and returns to the welcome screen. */
  signOut: () => Promise<void>;
  /** True once the user has completed or skipped onboarding on this device. */
  hasSeenOnboarding: boolean;
  /** Records that onboarding has been seen so it never replays. */
  markOnboardingSeen: () => void;
};

export const AppStoreContext = createContext<AppStore | null>(null);

export const useAppStore = (): AppStore => {
  const value = useContext(AppStoreContext);
  if (!value) {
    throw new Error('AppStoreContext is not available');
  }
  return value;
};
