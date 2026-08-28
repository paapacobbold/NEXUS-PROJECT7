import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  HeaderBar,
  LabelledInput,
  PrimaryButton,
} from '../components/UIComponents';
import { useAppStore } from '../context/AppStoreContext';
import { brand, DEFAULT_AVATAR } from '../data/mockData';
import { styles } from '../styles/appStyles';

// brand.secondary (#F4F2EE) as rgb, so the hero fade lands exactly on the body colour.
const CREAM_FADE = ['rgba(244,242,238,0)', 'rgba(244,242,238,0.75)', 'rgba(244,242,238,1)'] as const;

const ONBOARDING_SLIDES = [
  {
    title: 'Peer-to-Peer Learning',
    copy: 'Connect with top-rated tutors and student study groups across your university campus.',
    image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Live Study Sessions & Meetups',
    copy: 'Schedule virtual lobbies or meet up in person at campus libraries and study lounges.',
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Earn Perks & Track Streaks',
    copy: 'Level up your study rank, earn XP points, and unlock free campus coffee vouchers.',
    image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80',
  },
];

function AuthError({ message }: { message: string }) {
  return (
    <View style={styles.authErrorBox}>
      <Ionicons name="alert-circle" size={18} color="#8C2F27" />
      <Text style={styles.authErrorText}>{message}</Text>
    </View>
  );
}

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const insets = useSafeAreaInsets();
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(18)).current;
  const settled = useRef(false);

  // Guard against the auto-advance timer and a tap both firing.
  const finish = useCallback(() => {
    if (settled.current) return;
    settled.current = true;
    onDone();
  }, [onDone]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 520,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(rise, {
        toValue: 0,
        duration: 520,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(finish, 2200);
    return () => clearTimeout(timer);
  }, [fade, rise, finish]);

  return (
    <Pressable onPress={finish} style={styles.splashRoot} accessibilityRole="button" accessibilityLabel="Continue">
      <StatusBar style="light" />
      <View style={styles.splashRippleOne} />
      <View style={styles.splashRippleTwo} />
      <View style={styles.splashRippleThree} />

      <Animated.View style={{ alignItems: 'center', opacity: fade, transform: [{ translateY: rise }] }}>
        <View style={styles.logoTile}>
          <Text style={styles.logoLetter}>N</Text>
        </View>
        <Text style={styles.splashBrand}>{brand.name}</Text>
        <Text style={styles.splashTagline}>{brand.tagline}</Text>
      </Animated.View>

      <Text style={[styles.splashHint, { bottom: insets.bottom + 28 }]}>Tap to continue</Text>
    </Pressable>
  );
}

export function OnboardingScreen({
  onSkip,
  onDone,
}: {
  onSkip: () => void;
  onDone: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);

  // One native-driven value powers the hero and body (transform + opacity only,
  // so it can stay off the JS thread). The dots need animated width and colour,
  // which the native driver cannot do, so they read a JS-side mirror fed by the
  // same scroll event.
  const scrollX = useRef(new Animated.Value(0)).current;
  const dotsX = useRef(new Animated.Value(0)).current;

  const [index, setIndex] = useState(0);
  const [chromeHeight, setChromeHeight] = useState(0);

  const heroHeight = Math.round(height * 0.58);
  const parallax = width * 0.1;
  const lastIndex = ONBOARDING_SLIDES.length - 1;
  const isLast = index === lastIndex;

  const onScroll = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
        useNativeDriver: true,
        listener: (event: any) => dotsX.setValue(event.nativeEvent.contentOffset.x),
      }),
    [scrollX, dotsX]
  );

  // Each slide reacts to the window one page either side of itself.
  const rangeFor = useCallback((i: number) => [(i - 1) * width, i * width, (i + 1) * width], [width]);

  const handleNext = () => {
    if (isLast) {
      onDone();
      return;
    }
    scrollRef.current?.scrollTo({ x: (index + 1) * width, animated: true });
  };

  // Cross-fade the button label across the final page turn rather than snapping it.
  const ctaSwap = { inputRange: [(lastIndex - 1) * width, lastIndex * width], extrapolate: 'clamp' as const };

  return (
    <View style={styles.authScreen}>
      <StatusBar style="light" />

      {/* Hero layer sits behind the pager: images cross-fade and drift at a
          slower rate than the swipe, which is what sells the depth. */}
      <View style={[styles.onboardingHeroLayer, { height: heroHeight }]} pointerEvents="none">
        {ONBOARDING_SLIDES.map((slide, i) => (
          <Animated.Image
            key={slide.image}
            source={{ uri: slide.image }}
            resizeMode="cover"
            style={[
              styles.onboardingHeroImage,
              {
                opacity: scrollX.interpolate({ inputRange: rangeFor(i), outputRange: [0, 1, 0], extrapolate: 'clamp' }),
                transform: [
                  {
                    translateX: scrollX.interpolate({
                      inputRange: rangeFor(i),
                      outputRange: [parallax, 0, -parallax],
                      extrapolate: 'clamp',
                    }),
                  },
                  {
                    scale: scrollX.interpolate({
                      inputRange: rangeFor(i),
                      outputRange: [1.22, 1.08, 1.22],
                      extrapolate: 'clamp',
                    }),
                  },
                ],
              },
            ]}
          />
        ))}
        <LinearGradient colors={CREAM_FADE} locations={[0, 0.62, 1]} style={styles.onboardingFade} />
      </View>

      <Animated.ScrollView
        ref={scrollRef as any}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={onScroll}
        onMomentumScrollEnd={(event) => setIndex(Math.round(event.nativeEvent.contentOffset.x / width))}
        style={StyleSheet.absoluteFill}
      >
        {ONBOARDING_SLIDES.map((slide, i) => (
          <View key={slide.image} style={{ width }}>
            <View style={{ height: heroHeight }} />
            <Animated.View
              style={[
                styles.onboardingBody,
                { paddingBottom: chromeHeight + 12 },
                {
                  opacity: scrollX.interpolate({
                    inputRange: rangeFor(i),
                    outputRange: [0, 1, 0],
                    extrapolate: 'clamp',
                  }),
                  transform: [
                    {
                      translateY: scrollX.interpolate({
                        inputRange: rangeFor(i),
                        outputRange: [28, 0, 28],
                        extrapolate: 'clamp',
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text style={styles.heroTitle}>{slide.title}</Text>
              <Text style={styles.onboardingCopy}>{slide.copy}</Text>
            </Animated.View>
          </View>
        ))}
      </Animated.ScrollView>

      <View style={[styles.onboardingTopBar, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={onSkip} style={styles.skipPill} accessibilityRole="button" accessibilityLabel="Skip onboarding">
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      <View
        style={[styles.onboardingChrome, { paddingBottom: insets.bottom + 24 }]}
        onLayout={(event) => setChromeHeight(event.nativeEvent.layout.height)}
      >
        <View style={styles.dotRow}>
          {ONBOARDING_SLIDES.map((slide, i) => (
            <Animated.View
              key={slide.image}
              style={[
                styles.dot,
                {
                  width: dotsX.interpolate({ inputRange: rangeFor(i), outputRange: [8, 24, 8], extrapolate: 'clamp' }),
                  backgroundColor: dotsX.interpolate({
                    inputRange: rangeFor(i),
                    outputRange: ['#D7D1C8', brand.primary, '#D7D1C8'],
                    extrapolate: 'clamp',
                  }),
                },
              ]}
            />
          ))}
        </View>

        <Pressable
          onPress={handleNext}
          style={({ pressed }) => [
            styles.onboardingCtaButton,
            pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
          ]}
          accessibilityRole="button"
          accessibilityLabel={isLast ? 'Get Started' : 'Continue'}
        >
          <Animated.View
            style={[styles.onboardingCtaLayer, { opacity: scrollX.interpolate({ ...ctaSwap, outputRange: [1, 0] }) }]}
          >
            <Text style={styles.primaryButtonText}>Continue</Text>
          </Animated.View>
          <Animated.View
            style={[styles.onboardingCtaLayer, { opacity: scrollX.interpolate({ ...ctaSwap, outputRange: [0, 1] }) }]}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </Animated.View>
        </Pressable>
      </View>
    </View>
  );
}

export function WelcomeScreen({
  onCreateAccount,
  onSignIn,
}: {
  onCreateAccount: () => void;
  onSignIn: () => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.authScreenDark}>
      <StatusBar style="light" />

      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=1200&q=80' }}
        style={styles.welcomeHero}
        imageStyle={styles.coverImage}
      >
        <LinearGradient
          colors={['rgba(7,9,24,0.15)', 'rgba(7,9,24,0.55)', 'rgba(7,9,24,0.95)']}
          locations={[0, 0.45, 1]}
          style={styles.flexFill}
        >
          <View style={{ paddingHorizontal: 24, paddingTop: insets.top + 18 }}>
            <Text style={styles.splashBrand}>{brand.name}</Text>
          </View>

          <View style={[styles.welcomeActions, { paddingBottom: insets.bottom + 28 }]}>
            <Text style={styles.welcomeTitle}>Find your study community</Text>
            <Text style={styles.welcomeTagline}>
              Connect with university peers, share study materials, and excel together.
            </Text>

            <View style={styles.welcomeButtons}>
              <PrimaryButton label="Create Account" onPress={onCreateAccount} />
              <Pressable
                onPress={onSignIn}
                style={({ pressed }) => [
                  styles.outlineButtonOnDark,
                  pressed && { opacity: 0.75, transform: [{ scale: 0.97 }] },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Sign In"
              >
                <Text style={styles.outlineButtonTextOnDark}>Sign In</Text>
              </Pressable>
            </View>

            <Text style={styles.welcomeTerms}>
              By continuing you agree to the {brand.name} community guidelines.
            </Text>
          </View>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

export function SignupScreen({
  onBack,
  onContinue,
  onSignInClick,
}: {
  onBack: () => void;
  onContinue: () => void;
  onSignInClick: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { updateProfile } = useAppStore();
  const [role, setRole] = useState<'Student' | 'Tutor'>('Student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [university, setUniversity] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setErrorMsg('Please fill in your name, email, and password.');
      return;
    }
    setLoading(true);
    setErrorMsg('');

    try {
      const { signUpWithEmail } = await import('../lib/supabase');
      const { data, error } = await signUpWithEmail(email.trim(), password, name.trim());

      const isApiKeyErr = Boolean(
        error &&
        (error.message?.toLowerCase().includes('api key') ||
         error.message?.toLowerCase().includes('apikey') ||
         error.message?.toLowerCase().includes('not configured'))
      );

      if (error && !isApiKeyErr) {
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      updateProfile({
        name: name.trim(),
        email: email.trim(),
        university: university.trim() || 'KNUST',
        major: role === 'Tutor' ? 'Peer Tutor' : 'Computer Science',
        year: '1st Year',
        bio: `Joined Learning Commons as ${role} from ${university.trim() || 'KNUST'}.`,
        skills: role === 'Tutor' ? ['Peer Tutoring', 'Mentorship'] : ['Collaborative Study', 'Group Learning'],
        points: 100,
        sessions: 0,
        communities: 1,
        streak: '1 day',
        avatar: DEFAULT_AVATAR,
      });

      // Check if Supabase sent an email confirmation link
      if (data?.user && !data.session && !isApiKeyErr) {
        setVerificationSent(true);
        setLoading(false);
        return;
      }
    } catch (err: any) {
      const isApiKeyErr = Boolean(
        err.message?.toLowerCase().includes('api key') ||
        err.message?.toLowerCase().includes('apikey') ||
        err.message?.toLowerCase().includes('not configured')
      );

      if (!isApiKeyErr) {
        setErrorMsg(err.message || 'Signup failed.');
        setLoading(false);
        return;
      }

      updateProfile({
        name: name.trim(),
        email: email.trim(),
        university: university.trim() || 'KNUST',
        major: role === 'Tutor' ? 'Peer Tutor' : 'Computer Science',
        year: '1st Year',
        bio: `Joined Learning Commons as ${role} from ${university.trim() || 'KNUST'}.`,
        skills: role === 'Tutor' ? ['Peer Tutoring', 'Mentorship'] : ['Collaborative Study', 'Group Learning'],
        points: 100,
        sessions: 0,
        communities: 1,
        streak: '1 day',
        avatar: `https://i.pravatar.cc/120?u=${encodeURIComponent(email.trim())}`,
      });
    }

    setLoading(false);
    onContinue();
  };

  return (
    <View style={styles.authScreen}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView style={styles.flexFill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[
            styles.formScreen,
            { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 36 },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <HeaderBar title="Create Account" onBack={onBack} light />

          <Text style={styles.sectionHeadline}>Join {brand.name}</Text>
          <Text style={styles.sectionSubline}>Start your peer learning journey today.</Text>

          {verificationSent ? (
            <View style={styles.verifyCard}>
              <View style={styles.verifyRow}>
                <Ionicons name="mail-unread" size={24} color={brand.primary} />
                <Text style={styles.verifyTitle}>Check your email inbox</Text>
              </View>
              <Text style={styles.verifyBody}>
                We sent a verification link to <Text style={{ fontWeight: '800' }}>{email}</Text>. Open it to confirm your
                account, then sign in below.
              </Text>
              <PrimaryButton label="Proceed to Sign In" onPress={onSignInClick} />
            </View>
          ) : (
            <>
              <View style={styles.segmentedRow}>
                {(['Student', 'Tutor'] as const).map((item) => (
                  <Pressable
                    key={item}
                    onPress={() => setRole(item)}
                    style={[styles.segment, role === item ? styles.segmentActive : undefined]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: role === item }}
                    accessibilityLabel={`Sign up as ${item}`}
                  >
                    <Text style={[styles.segmentText, role === item ? styles.segmentTextActive : undefined]}>
                      {item}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {errorMsg ? <AuthError message={errorMsg} /> : null}

              <LabelledInput
                label="Full Name"
                value={name}
                onChangeText={setName}
                placeholder="e.g. Seyram Mensah"
                autoCapitalize="words"
                autoComplete="name"
                textContentType="name"
                light
              />
              <LabelledInput
                label="University Email"
                value={email}
                onChangeText={setEmail}
                placeholder="you@unimail.edu"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                light
              />
              <LabelledInput
                label="University"
                value={university}
                onChangeText={setUniversity}
                placeholder="e.g. KNUST"
                autoCapitalize="words"
                light
              />
              <LabelledInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="At least 8 characters"
                secureTextEntry
                autoCapitalize="none"
                autoComplete="new-password"
                textContentType="newPassword"
                returnKeyType="go"
                onSubmitEditing={handleSignup}
                light
              />

              <PrimaryButton
                label={loading ? 'Creating Account...' : 'Create Account'}
                onPress={handleSignup}
                loading={loading}
              />

              <Pressable onPress={onSignInClick} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={styles.helperCenterText}>
                  Already have an account? <Text style={styles.helperLink}>Sign in</Text>
                </Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

export function SigninScreen({
  onBack,
  onContinue,
  onSignUpClick,
}: {
  onBack: () => void;
  onContinue: () => void;
  onSignUpClick: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { updateProfile } = useAppStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSignin = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter your email and password.');
      return;
    }
    setLoading(true);
    setErrorMsg('');

    try {
      const { signInWithEmail, fetchUserProfile } = await import('../lib/supabase');
      const { data, error } = await signInWithEmail(email.trim(), password);

      const isApiKeyErr = Boolean(
        error &&
        (error.message?.toLowerCase().includes('api key') ||
         error.message?.toLowerCase().includes('apikey') ||
         error.message?.toLowerCase().includes('not configured'))
      );

      if (error && !isApiKeyErr) {
        setErrorMsg(error.message || 'Invalid email or password.');
        setLoading(false);
        return;
      }

      if (data?.user && !isApiKeyErr) {
        const liveProfile = await fetchUserProfile(data.user.id);
        if (liveProfile) {
          updateProfile(liveProfile);
        } else {
          updateProfile({
            name: data.user.user_metadata?.full_name || email.split('@')[0] || 'User',
            email: data.user.email || email,
            avatar: DEFAULT_AVATAR,
          });
        }
        setLoading(false);
        onContinue();
      } else {
        updateProfile({
          name: email.split('@')[0] || 'Student Learner',
          email: email.trim(),
          avatar: DEFAULT_AVATAR,
        });
        setLoading(false);
        onContinue();
      }
    } catch (err: any) {
      updateProfile({
        name: email.split('@')[0] || 'Student Learner',
        email: email.trim(),
        avatar: DEFAULT_AVATAR,
      });
      setLoading(false);
      onContinue();
    }
  };

  return (
    <View style={styles.authScreen}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView style={styles.flexFill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[
            styles.formScreen,
            { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 36 },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <HeaderBar title="Sign In" onBack={onBack} light />

          <Text style={styles.sectionHeadline}>Welcome back</Text>
          <Text style={styles.sectionSubline}>Sign in to access your communities and sessions.</Text>

          {errorMsg ? <AuthError message={errorMsg} /> : null}

          <LabelledInput
            label="University Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@unimail.edu"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            light
          />
          <LabelledInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={handleSignin}
            light
          />

          <PrimaryButton
            label={loading ? 'Signing in...' : 'Sign In'}
            onPress={handleSignin}
            loading={loading}
          />

          <Pressable onPress={onSignUpClick} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.helperCenterText}>
              Don't have an account? <Text style={styles.helperLink}>Create one</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
