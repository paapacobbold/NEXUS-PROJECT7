import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/inter';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Animated, useColorScheme, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { MainShell } from './src/components/UIComponents';
import { AppRoute, AppStore, AppStoreContext, FilterKey, FilterState, TabKey, ThemeMode } from './src/context/AppStoreContext';
import {
  communities as initialCommunities,
  currentUser,
  DEFAULT_AVATAR,
  defaultNotificationPrefs,
  filterSections,
  sampleMeetups,
  threadMessages,
  threadPreviews,
  upcomingSessions as initialUpcomingSessions,
  CommunityItem,
  InPersonMeetup,
  SessionItem,
} from './src/data/mockData';
import { CommunitiesScreen, CommunityDetailScreen, CreateCommunityScreen } from './src/screens/CommunitiesScreens';
import { HomeScreen } from './src/screens/HomeScreen';
import { ProfileScreen, EditProfileScreen, ChangePasswordScreen, NotificationPreferencesScreen } from './src/screens/ProfileScreens';
import { ChatListScreen, PrivateChatScreen } from './src/screens/ChatScreens';
import { SessionsScreen, ScheduleSessionScreen, SessionLobbyScreen, CreateMeetupScreen } from './src/screens/SessionsScreens';
import { LeaderboardScreen, RecordingsScreen, FiltersScreen } from './src/screens/SecondaryScreens';
import { OnboardingScreen, SignupScreen, SigninScreen, SplashScreen, WelcomeScreen } from './src/screens/AuthScreens';
import { applyThemeStyles, getThemeColors, nowTime, styles } from './src/styles/appStyles';

import { resolveAuthenticated, resolveEntryRoute } from './src/lib/session';
import { GlobalSearchModal } from './src/components/GlobalSearchModal';
import { NotificationCenterModal } from './src/components/NotificationCenterModal';
import { ToastProvider } from './src/components/Toast';
import {
  clearSessionStorage,
  loadAuthState,
  loadCommunitiesCache,
  loadMeetupsCache,
  loadNotificationPrefsStorage,
  loadOnboardingSeen,
  loadProfileStorage,
  loadThemeStorage,
  saveAuthState,
  saveOnboardingSeen,
  saveCommunitiesCache,
  saveMeetupsCache,
  saveNotificationPrefsStorage,
  saveProfileStorage,
  saveThemeStorage,
} from './src/lib/storage';

ExpoSplashScreen.preventAutoHideAsync().catch(() => {
  /* already hidden, or unavailable in this runtime */
});

function ScreenTransitionContainer({ routeKey, children }: { routeKey: string; children: React.ReactNode }) {
  const fadeAnim = React.useRef(new Animated.Value(0.3)).current;
  const translateY = React.useRef(new Animated.Value(14)).current;

  React.useEffect(() => {
    fadeAnim.setValue(0.3);
    translateY.setValue(14);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [routeKey]);

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

const initialFilters: FilterState = {
  subject: ['Mathematics'],
  contentType: ['Live Session'],
  skillLevel: ['Intermediate'],
  availability: [],
  minimumRating: ['4+'],
};

export default function App() {
  const systemColorScheme = useColorScheme();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      ExpoSplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);
  const [stack, setStack] = useState<AppRoute[]>(['splash']);
  const [theme, setTheme] = useState<ThemeMode>('system');
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [profile, setProfile] = useState(currentUser);
  const [notificationPrefs, setNotificationPrefs] = useState(defaultNotificationPrefs);
  const [threads, setThreads] = useState(threadPreviews);
  const [messagesByThread, setMessagesByThread] = useState(threadMessages);
  const [activeThreadId, setActiveThreadId] = useState<string>('');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [selectedFilters, setSelectedFilters] = useState(initialFilters);
  const [communitiesList, setCommunitiesList] = useState(initialCommunities);
  const [sessionsList, setSessionsList] = useState(initialUpcomingSessions);
  const [meetupsList, setMeetupsList] = useState(sampleMeetups);

  const themeColors = useMemo(
    () => getThemeColors(theme, systemColorScheme),
    [theme, systemColorScheme]
  );

  // Rebuild the shared stylesheet for this theme before any child renders.
  useMemo(() => applyThemeStyles(themeColors), [themeColors]);

  const currentRoute = stack[stack.length - 1];
  const currentThreadId = activeThreadId || (threads[0]?.id ?? 'default');
  const featuredCommunity = communitiesList[0] || initialCommunities[0];

  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  /* --------------------------- Session lifecycle ---------------------------
   * The app used to open on 'splash' -> 'onboarding' unconditionally, so every
   * relaunch replayed onboarding even for a signed-in user. Launch now resolves
   * the persisted session first and picks an entry route from it. */
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [entryRoute, setEntryRoute] = useState<AppRoute | null>(null);
  // Splash stays up until BOTH its own minimum display time and bootstrap finish.
  const [splashHeld, setSplashHeld] = useState(true);

  const markAuthenticated = useCallback(() => {
    setIsAuthenticated(true);
    saveAuthState('authenticated');
  }, []);

  const markOnboardingSeen = useCallback(() => {
    setHasSeenOnboarding(true);
    saveOnboardingSeen();
  }, []);

  const signOut = useCallback(async () => {
    try {
      const { signOutUser } = await import('./src/lib/supabase');
      await signOutUser();
    } catch (err) {
      console.warn('Sign out error:', err);
    }
    await clearSessionStorage();
    setIsAuthenticated(false);
    setProfile(currentUser);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function bootstrapSession() {
      const [seenOnboarding, persistedAuth] = await Promise.all([
        loadOnboardingSeen(),
        loadAuthState(),
      ]);

      let hasSupabaseEnv = false;
      let hasSupabaseSession = false;

      try {
        const supabaseLib = await import('./src/lib/supabase');
        hasSupabaseEnv = supabaseLib.hasSupabaseEnv;
        if (hasSupabaseEnv) {
          // getSession() reads the AsyncStorage-persisted session, so this
          // resolves offline too.
          const session = await supabaseLib.getCurrentSession();
          hasSupabaseSession = Boolean(session?.user);
        }
      } catch (err) {
        console.warn('Session restore error:', err);
      }

      const authed = resolveAuthenticated({ hasSupabaseEnv, hasSupabaseSession, persistedAuth });
      if (hasSupabaseEnv) {
        await saveAuthState(authed ? 'authenticated' : 'guest');
      }

      if (cancelled) return;
      setHasSeenOnboarding(seenOnboarding);
      setIsAuthenticated(authed);
      setEntryRoute(resolveEntryRoute({ isAuthenticated: authed, hasSeenOnboarding: seenOnboarding }));
      setIsBootstrapping(false);
    }

    bootstrapSession();
    return () => {
      cancelled = true;
    };
  }, []);

  // Shared by the initial mount fetch and pull-to-refresh.
  const refreshCollections = useCallback(async () => {
    try {
      const { getCommunities, getSessions, getMeetups } = await import('./src/lib/supabase');

      const liveCommunities = await getCommunities();
      if (liveCommunities && liveCommunities.length > 0) {
        setCommunitiesList(liveCommunities);
        saveCommunitiesCache(liveCommunities);
      }

      const liveSessions = await getSessions();
      if (liveSessions && liveSessions.length > 0) {
        setSessionsList(liveSessions);
      }

      const liveMeetups = await getMeetups();
      if (liveMeetups && liveMeetups.length > 0) {
        setMeetupsList(liveMeetups);
        saveMeetupsCache(liveMeetups);
      }
    } catch (err) {
      console.warn('Collection refresh error:', err);
    }
  }, []);

  useEffect(() => {
    async function hydrateLocalStorage() {
      try {
        const cachedTheme = await loadThemeStorage();
        if (cachedTheme) setTheme(cachedTheme);

        const cachedProfile = await loadProfileStorage();
        if (cachedProfile) setProfile(cachedProfile);

        const cachedPrefs = await loadNotificationPrefsStorage();
        if (cachedPrefs) setNotificationPrefs(cachedPrefs);

        const cachedComms = await loadCommunitiesCache();
        if (cachedComms && cachedComms.length > 0) setCommunitiesList(cachedComms);

        const cachedMeetups = await loadMeetupsCache();
        if (cachedMeetups && cachedMeetups.length > 0) setMeetupsList(cachedMeetups);
      } catch (err) {
        console.warn('Local storage hydration error:', err);
      }
    }

    hydrateLocalStorage();

    async function initSupabaseData() {
      try {
        const {
          supabase,
          getUserJoinedCommunities,
          getUserMeetupRSVPs,
          getCurrentSession,
          fetchUserProfile,
        } = await import('./src/lib/supabase');

        if (!supabase) return;

        // Fetch initial Supabase auth user profile
        const session = await getCurrentSession();
        if (session?.user) {
          const liveProfile = await fetchUserProfile(session.user.id);
          if (liveProfile) {
            setProfile(liveProfile);
            saveProfileStorage(liveProfile);
          } else {
            const userEmail = session.user.email || '';
            const userName = session.user.user_metadata?.full_name || userEmail.split('@')[0] || 'User';
            setProfile((prev) => ({
              ...prev,
              name: userName,
              email: userEmail,
              avatar: session.user.user_metadata?.avatar_url || DEFAULT_AVATAR,
            }));
          }

          // Hydrate user community memberships
          const joinedIds = await getUserJoinedCommunities(session.user.id);
          if (joinedIds && joinedIds.length > 0) {
            setCommunitiesList((prev) =>
              prev.map((c) => ({ ...c, joined: joinedIds.includes(c.id) }))
            );
          }

          // Hydrate user meetup RSVPs
          const rsvpIds = await getUserMeetupRSVPs(session.user.id);
          if (rsvpIds && rsvpIds.length > 0) {
            setMeetupsList((prev) =>
              prev.map((m) => ({ ...m, rsvpStatus: rsvpIds.includes(m.id) }))
            );
          }
        }

        // Listen for live Auth State changes
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
          if (session?.user) {
            const liveProfile = await fetchUserProfile(session.user.id);
            if (liveProfile) {
              setProfile(liveProfile);
              saveProfileStorage(liveProfile);
            }
          }
        });

        // Register Expo Push Token for mobile notifications
        try {
          const { registerForPushNotificationsAsync } = await import('./src/lib/notifications');
          const token = await registerForPushNotificationsAsync();
          if (token) {
            console.log('Push token active:', token);
          }
        } catch (err) {
          console.warn('Push notification initialization error:', err);
        }

        await refreshCollections();

        return () => {
          authListener.subscription.unsubscribe();
        };
      } catch (err) {
        console.warn('Live backend connection error:', err);
      }
    }

    initSupabaseData().finally(() => setIsLoadingData(false));
  }, [refreshCollections]);

  // Splash exits only when the minimum display time has elapsed AND the
  // persisted session has resolved, so the first screen is never wrong.
  useEffect(() => {
    if (stack[stack.length - 1] === 'splash' && !splashHeld && entryRoute) {
      setStack([entryRoute]);
    }
  }, [stack, splashHeld, entryRoute]);

  const refreshAll = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refreshCollections();
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshCollections]);

  const push = (route: AppRoute) => setStack((prev) => [...prev, route]);
  const replace = (route: AppRoute) =>
    setStack((prev) => [...prev.slice(0, Math.max(prev.length - 1, 0)), route]);
  const goBack = () =>
    setStack((prev) => (prev.length > 1 ? prev.slice(0, prev.length - 1) : prev));
  const openTab = (tab: TabKey) => replace(`main-${tab}` as AppRoute);

  const handleSetTheme = (newTheme: ThemeMode) => {
    setTheme(newTheme);
    saveThemeStorage(newTheme);
  };

  const store = useMemo<AppStore>(
    () => ({
      theme,
      setTheme: handleSetTheme,
      profile,
      updateProfile: (patch) => {
        setProfile((prev) => {
          const updated = { ...prev, ...patch };
          saveProfileStorage(updated);
          import('./src/lib/supabase').then(({ getCurrentSession, updateUserProfile }) => {
            getCurrentSession().then((session) => {
              if (session?.user) {
                updateUserProfile(session.user.id, {
                  full_name: updated.name,
                  university: updated.university,
                  major: updated.major,
                  year: updated.year,
                  bio: updated.bio,
                  avatar_url: updated.avatar,
                  skills: updated.skills,
                });
              }
            });
          });
          return updated;
        });
      },
      notificationPrefs,
      toggleNotification: (key) =>
        setNotificationPrefs((prev) => {
          const updated = { ...prev, [key]: !prev[key] };
          saveNotificationPrefsStorage(updated);
          return updated;
        }),
      threads,
      messagesByThread,
      sendMessage: (threadId, text) => {
        if (!text.trim()) return;
        const newMessage = {
          id: `${threadId}-${Date.now()}`,
          sender: 'me' as const,
          text: text.trim(),
          time: nowTime(),
        };

        setMessagesByThread((prev) => ({
          ...prev,
          [threadId]: [...(prev[threadId] ?? prev.default), newMessage],
        }));

        setThreads((prev) => {
          const next = prev.map((thread) =>
            thread.id === threadId
              ? {
                  ...thread,
                  preview: text.trim(),
                  time: nowTime(),
                }
              : thread,
          );
          return next;
        });
      },
      selectedFilters,
      toggleFilter: (section, value) => {
        setSelectedFilters((prev) => {
          const current = prev[section];
          const exists = current.includes(value);
          const next = exists ? current.filter((item) => item !== value) : [...current, value];
          return { ...prev, [section]: next };
        });
      },
      resetFilters: () => setSelectedFilters(initialFilters),
      communitiesList,
      toggleJoinCommunity: (communityId) => {
        setCommunitiesList((prev) =>
          prev.map((item) => {
            if (item.id === communityId) {
              const nextJoined = !item.joined;
              import('./src/lib/supabase')
                .then(({ getCurrentSession, joinCommunity, leaveCommunity }) => {
                  getCurrentSession()
                    .then((session) => {
                      if (session?.user) {
                        if (nextJoined) {
                          joinCommunity(communityId, session.user.id);
                        } else {
                          leaveCommunity(communityId, session.user.id);
                        }
                      }
                    })
                    .catch((err) => console.warn('Community sync warning:', err));
                })
                .catch((err) => console.warn('Supabase import warning:', err));
              return {
                ...item,
                joined: nextJoined,
                members: nextJoined ? item.members + 1 : Math.max(item.members - 1, 0),
              };
            }
            return item;
          }),
        );
      },
      addCommunity: (name, subject, description) => {
        const newCommunity: CommunityItem = {
          id: `community-${Date.now()}`,
          name,
          subject,
          members: 1,
          posts: 0,
          description,
          image:
            'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
          joined: true,
          postsFeed: [],
        };
        setCommunitiesList((prev) => [newCommunity, ...prev]);
        import('./src/lib/supabase')
          .then(({ getCurrentSession, createCommunityInSupabase }) => {
            getCurrentSession()
              .then((session) => {
                createCommunityInSupabase(name, subject, description, session?.user?.id);
              })
              .catch((err) => console.warn('Create community sync warning:', err));
          })
          .catch((err) => console.warn('Supabase import warning:', err));
      },
      sessionsList,
      addSession: (title, tag, time) => {
        const newSession: SessionItem = {
          id: `session-${Date.now()}`,
          title,
          tutor: profile.name,
          time,
          participants: '1/20',
          tag,
          image: profile.avatar,
        };
        setSessionsList((prev) => [newSession, ...prev]);
        import('./src/lib/supabase')
          .then(({ getCurrentSession, createSession }) => {
            getCurrentSession()
              .then((session) => {
                if (session?.user) {
                  createSession({
                    title,
                    tutor_id: session.user.id,
                    tag,
                    scheduled_at: new Date().toISOString(),
                    duration_minutes: 60,
                    max_participants: 20,
                  });
                }
              })
              .catch((err) => console.warn('Create session sync warning:', err));
          })
          .catch((err) => console.warn('Supabase import warning:', err));
      },
      isLoadingData,
      isRefreshing,
      refreshAll,
      isBootstrapping,
      isAuthenticated,
      markAuthenticated,
      signOut,
      hasSeenOnboarding,
      markOnboardingSeen,
      meetupsList,
      toggleRSVPMeetup: (meetupId) => {
        setMeetupsList((prev) =>
          prev.map((m) => {
            if (m.id === meetupId) {
              const nextRSVP = !m.rsvpStatus;
              import('./src/lib/supabase')
                .then(({ getCurrentSession, rsvpMeetupInSupabase }) => {
                  getCurrentSession()
                    .then((session) => {
                      if (session?.user) {
                        rsvpMeetupInSupabase(meetupId, session.user.id, nextRSVP);
                      }
                    })
                    .catch((err) => console.warn('RSVP sync warning:', err));
                })
                .catch((err) => console.warn('Supabase import warning:', err));
              return {
                ...m,
                rsvpStatus: nextRSVP,
                rsvpCount: nextRSVP ? m.rsvpCount + 1 : Math.max(m.rsvpCount - 1, 0),
              };
            }
            return m;
          }),
        );
      },
      addMeetup: (title, location, dateTime) => {
        const newMeetup: InPersonMeetup = {
          id: `meetup-${Date.now()}`,
          title,
          location,
          dateTime,
          organizer: profile.name,
          rsvpCount: 1,
          rsvpStatus: true,
        };
        setMeetupsList((prev) => [newMeetup, ...prev]);
        import('./src/lib/supabase')
          .then(({ getCurrentSession, createMeetupInSupabase }) => {
            getCurrentSession()
              .then((session) => {
                createMeetupInSupabase(title, location, new Date().toISOString(), session?.user?.id);
              })
              .catch((err) => console.warn('Create meetup sync warning:', err));
          })
          .catch((err) => console.warn('Supabase import warning:', err));
      },
    }),
    [
      profile,
      notificationPrefs,
      threads,
      messagesByThread,
      selectedFilters,
      communitiesList,
      sessionsList,
      meetupsList,
      theme,
      isLoadingData,
      isRefreshing,
      refreshAll,
      isBootstrapping,
      isAuthenticated,
      markAuthenticated,
      signOut,
      hasSeenOnboarding,
      markOnboardingSeen,
    ],
  );

  const renderRoute = () => {
    switch (currentRoute) {
      case 'splash':
        return <SplashScreen onDone={() => setSplashHeld(false)} />;
      case 'onboarding':
        return (
          <OnboardingScreen
            onSkip={() => {
              markOnboardingSeen();
              replace('welcome');
            }}
            onDone={() => {
              markOnboardingSeen();
              replace('welcome');
            }}
          />
        );
      case 'welcome':
        return (
          <WelcomeScreen
            onCreateAccount={() => push('signup')}
            onSignIn={() => push('signin')}
          />
        );
      case 'signup':
        return (
          <SignupScreen
            onBack={goBack}
            onContinue={() => {
              markAuthenticated();
              setStack(['main-home']);
            }}
            onSignInClick={() => replace('signin')}
          />
        );
      case 'signin':
        return (
          <SigninScreen
            onBack={goBack}
            onContinue={() => {
              markAuthenticated();
              setStack(['main-home']);
            }}
            onSignUpClick={() => replace('signup')}
          />
        );
      case 'main-home':
        return (
          <MainShell activeTab="home" onTabChange={openTab}>
            <HomeScreen
              onOpenSearch={() => setShowGlobalSearch(true)}
              onOpenNotifications={() => setShowNotifications(true)}
              onOpenFilters={() => push('filters')}
              onOpenProfile={() => push('edit-profile')}
              onOpenLiveSession={(sessionId?: string) => {
                setActiveSessionId(sessionId ?? null);
                push('session-lobby');
              }}
              onOpenCommunity={() => push('community-details')}
              onOpenLeaderboard={() => push('leaderboard')}
              onOpenRecordings={() => push('recordings')}
            />
          </MainShell>
        );
      case 'main-communities':
        return (
          <MainShell activeTab="communities" onTabChange={openTab}>
            <CommunitiesScreen
              onOpenCommunity={() => push('community-details')}
              onCreateCommunity={() => push('create-community')}
            />
          </MainShell>
        );
      case 'main-sessions':
        return (
          <MainShell activeTab="sessions" onTabChange={openTab}>
            <SessionsScreen
              onOpenFilters={() => push('filters')}
              onOpenSchedule={() => push('schedule-session')}
              onOpenCreateMeetup={() => push('create-meetup')}
              onOpenLiveSession={(sessionId?: string) => {
                setActiveSessionId(sessionId ?? null);
                push('session-lobby');
              }}
              onOpenRecordings={() => push('recordings')}
            />
          </MainShell>
        );
      case 'main-chat':
        return (
          <MainShell activeTab="chat" onTabChange={openTab}>
            <ChatListScreen
              onOpenThread={(id) => {
                if (id) setActiveThreadId(id);
                push('private-chat');
              }}
              onSelectThread={(id) => {
                setActiveThreadId(id);
                push('private-chat');
              }}
            />
          </MainShell>
        );
      case 'main-profile':
        return (
          <MainShell activeTab="profile" onTabChange={openTab}>
            <ProfileScreen
              onEditProfile={() => push('edit-profile')}
              onChangePassword={() => push('change-password')}
              onNotificationPreferences={() => push('notification-preferences')}
              onSignOut={async () => {
                await signOut();
                // Reset the stack so Back cannot re-enter the signed-in app.
                setStack(['welcome']);
              }}
            />
          </MainShell>
        );
      case 'community-details':
        return (
          <CommunityDetailScreen
            community={featuredCommunity}
            onBack={goBack}
            onOpenChat={() => push('private-chat')}
            onScheduleSession={() => push('schedule-session')}
          />
        );
      case 'create-community':
        return <CreateCommunityScreen onBack={goBack} onCreated={() => replace('main-communities')} />;
      case 'schedule-session':
        return <ScheduleSessionScreen onBack={goBack} onSubmit={() => replace('main-sessions')} />;
      case 'create-meetup':
        return <CreateMeetupScreen onBack={goBack} onCreated={() => replace('main-sessions')} />;
      case 'leaderboard':
        return <LeaderboardScreen onBack={goBack} />;
      case 'recordings':
        return <RecordingsScreen onBack={goBack} />;
      case 'filters':
        return <FiltersScreen onBack={goBack} onApply={() => goBack()} />;
      case 'private-chat':
        return <PrivateChatScreen onBack={goBack} threadId={currentThreadId} />;
      case 'session-lobby':
        return (
          <SessionLobbyScreen
            sessionId={activeSessionId ?? undefined}
            onLeave={() => goBack()}
          />
        );
      case 'edit-profile':
        return <EditProfileScreen onBack={goBack} onSave={() => goBack()} />;
      case 'change-password':
        return <ChangePasswordScreen onBack={goBack} onSaved={() => goBack()} />;
      case 'notification-preferences':
        return <NotificationPreferencesScreen onBack={goBack} />;
      default:
        return null;
    }
  };

  // Keep the native splash up until Inter has loaded, otherwise the first
  // frame renders in the system font and visibly reflows.
  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <AppStoreContext.Provider value={store}>
        <ToastProvider>
          <StatusBar style={themeColors.statusBarStyle} />
          <View style={[styles.appShell, { backgroundColor: themeColors.bg }]}>
            <ScreenTransitionContainer routeKey={currentRoute}>
              {renderRoute()}
            </ScreenTransitionContainer>
          </View>
          <GlobalSearchModal
            visible={showGlobalSearch}
            onClose={() => setShowGlobalSearch(false)}
            onNavigate={(route) => push(route)}
          />
          <NotificationCenterModal
            visible={showNotifications}
            onClose={() => setShowNotifications(false)}
            onNavigate={(route) => push(route)}
          />
        </ToastProvider>
      </AppStoreContext.Provider>
    </SafeAreaProvider>
  );
}
