import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useState } from 'react';
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
import { getThemeColors, nowTime, styles } from './src/styles/appStyles';

import { GlobalSearchModal } from './src/components/GlobalSearchModal';
import { NotificationCenterModal } from './src/components/NotificationCenterModal';
import {
  loadCommunitiesCache,
  loadMeetupsCache,
  loadNotificationPrefsStorage,
  loadProfileStorage,
  loadThemeStorage,
  saveCommunitiesCache,
  saveMeetupsCache,
  saveNotificationPrefsStorage,
  saveProfileStorage,
  saveThemeStorage,
} from './src/lib/storage';

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
  const [stack, setStack] = useState<AppRoute[]>(['splash']);
  const [theme, setTheme] = useState<ThemeMode>('system');
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [profile, setProfile] = useState(currentUser);
  const [notificationPrefs, setNotificationPrefs] = useState(defaultNotificationPrefs);
  const [threads, setThreads] = useState(threadPreviews);
  const [messagesByThread, setMessagesByThread] = useState(threadMessages);
  const [activeThreadId, setActiveThreadId] = useState<string>('');
  const [selectedFilters, setSelectedFilters] = useState(initialFilters);
  const [communitiesList, setCommunitiesList] = useState(initialCommunities);
  const [sessionsList, setSessionsList] = useState(initialUpcomingSessions);
  const [meetupsList, setMeetupsList] = useState(sampleMeetups);

  const themeColors = useMemo(
    () => getThemeColors(theme, systemColorScheme),
    [theme, systemColorScheme]
  );

  const currentRoute = stack[stack.length - 1];
  const currentThreadId = activeThreadId || (threads[0]?.id ?? 'default');
  const featuredCommunity = communitiesList[0] || initialCommunities[0];

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
          getCommunities,
          getUserJoinedCommunities,
          getSessions,
          getMeetups,
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

        // Fetch live communities
        const liveCommunities = await getCommunities();
        if (liveCommunities && liveCommunities.length > 0) {
          setCommunitiesList(liveCommunities);
          saveCommunitiesCache(liveCommunities);
        }

        // Fetch live sessions
        const liveSessions = await getSessions();
        if (liveSessions && liveSessions.length > 0) {
          setSessionsList(liveSessions);
        }

        // Fetch live campus meetups
        const liveMeetups = await getMeetups();
        if (liveMeetups && liveMeetups.length > 0) {
          setMeetupsList(liveMeetups);
          saveMeetupsCache(liveMeetups);
        }

        return () => {
          authListener.subscription.unsubscribe();
        };
      } catch (err) {
        console.warn('Live backend connection error:', err);
      }
    }

    initSupabaseData();
  }, []);

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
    [profile, notificationPrefs, threads, messagesByThread, selectedFilters, communitiesList, sessionsList, meetupsList, theme],
  );

  const renderRoute = () => {
    switch (currentRoute) {
      case 'splash':
        return <SplashScreen onDone={() => replace('onboarding')} />;
      case 'onboarding':
        return (
          <OnboardingScreen
            onSkip={() => replace('welcome')}
            onDone={() => replace('welcome')}
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
            onContinue={() => replace('main-home')}
            onSignInClick={() => replace('signin')}
          />
        );
      case 'signin':
        return (
          <SigninScreen
            onBack={goBack}
            onContinue={() => replace('main-home')}
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
              onOpenLiveSession={() => push('session-lobby')}
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
              onOpenLiveSession={() => push('session-lobby')}
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
                try {
                  const { signOutUser } = await import('./src/lib/supabase');
                  await signOutUser();
                } catch (err) {
                  console.error('Sign out error:', err);
                }
                replace('welcome');
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
        return <SessionLobbyScreen onLeave={() => goBack()} />;
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

  return (
    <SafeAreaProvider>
      <AppStoreContext.Provider value={store}>
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
      </AppStoreContext.Provider>
    </SafeAreaProvider>
  );
}
