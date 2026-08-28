import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TextInputProps,
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

// brand.secondary (#F4F2EE) as rgb, so image fades land exactly on the body colour.
const CREAM_RGB = '244,242,238';

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
  const [index, setIndex] = useState(0);

  const slides = [
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

  const current = slides[index];
  const isLast = index === slides.length - 1;

  const handleNext = () => {
    if (!isLast) {
      setIndex((prev) => prev + 1);
    } else {
      onDone();
    }
  };

  return (
    <View style={styles.authScreen}>
      <StatusBar style="light" />

      <ImageBackground source={{ uri: current.image }} style={styles.onboardingHero} imageStyle={styles.coverImage}>
        <View style={[styles.onboardingTopRow, { paddingTop: insets.top + 10 }]}>
          {index > 0 ? (
            <Pressable
              onPress={() => setIndex((prev) => Math.max(0, prev - 1))}
              style={styles.onboardingBackPill}
              accessibilityRole="button"
              accessibilityLabel="Previous slide"
            >
              <Ionicons name="arrow-back" size={18} color="#fff" />
            </Pressable>
          ) : (
            <View />
          )}
          <Pressable onPress={onSkip} style={styles.skipPill} accessibilityRole="button" accessibilityLabel="Skip onboarding">
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>

        <LinearGradient
          colors={[`rgba(${CREAM_RGB},0)`, `rgba(${CREAM_RGB},0.7)`, `rgba(${CREAM_RGB},1)`]}
          locations={[0, 0.6, 1]}
          style={styles.onboardingFade}
          pointerEvents="none"
        />
      </ImageBackground>

      <View style={[styles.onboardingBody, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.dotRow}>
          {slides.map((_, i) => (
            <View key={i} style={[styles.dot, i === index ? styles.dotActive : undefined]} />
          ))}
        </View>

        <Text style={styles.heroTitle}>{current.title}</Text>
        <Text style={styles.onboardingCopy}>{current.copy}</Text>

        <View style={styles.onboardingCta}>
          <PrimaryButton label={isLast ? 'Get Started' : 'Continue'} onPress={handleNext} />
        </View>
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

const AuthInput = React.forwardRef<any, {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: TextInputProps['autoComplete'];
  textContentType?: TextInputProps['textContentType'];
  returnKeyType?: TextInputProps['returnKeyType'];
  onSubmitEditing?: TextInputProps['onSubmitEditing'];
}>(({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  autoComplete,
  textContentType,
  returnKeyType,
  onSubmitEditing,
}, ref) => {
  const [revealed, setRevealed] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const isSecure = Boolean(secureTextEntry);

  return (
    <View style={{ gap: 6, marginBottom: 16 }}>
      <Text style={{ fontSize: 13, fontWeight: '600', color: brand.text }}>{label}</Text>
      <View style={{ position: 'relative', justifyContent: 'center' }}>
        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={brand.muted}
          secureTextEntry={isSecure && !revealed}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCapitalize === 'none' ? false : undefined}
          autoComplete={autoComplete}
          textContentType={textContentType}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={{
            backgroundColor: '#fff',
            borderRadius: 8,
            borderWidth: 1.5,
            borderColor: isFocused ? brand.primary : '#E8E4DE',
            paddingHorizontal: 14,
            paddingVertical: 12,
            fontSize: 15,
            color: brand.text,
            paddingRight: isSecure ? 46 : 14,
          }}
        />
        {isSecure ? (
          <Pressable
            onPress={() => setRevealed((prev) => !prev)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
            style={{
              position: 'absolute',
              right: 12,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name={revealed ? 'eye-off-outline' : 'eye-outline'} size={20} color={brand.muted} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
});

function AuthButton({
  label,
  onPress,
  disabled,
  loading,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  const isBlocked = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isBlocked}
      style={({ pressed }) => [
        {
          backgroundColor: isBlocked ? 'rgba(44, 47, 163, 0.5)' : brand.primary,
          borderRadius: 8,
          paddingVertical: 14,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 10,
          marginTop: 10,
        },
        pressed && !isBlocked && { opacity: 0.9 },
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: isBlocked, busy: loading }}
    >
      {loading ? <ActivityIndicator size="small" color="#fff" /> : null}
      <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>{label}</Text>
    </Pressable>
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
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [role, setRole] = useState<'Student' | 'Tutor'>('Student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [university, setUniversity] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);

  const nameRef = useRef<any>(null);
  const universityRef = useRef<any>(null);
  const emailRef = useRef<any>(null);
  const passwordRef = useRef<any>(null);

  useEffect(() => {
    if (step === 1) {
      setTimeout(() => {
        nameRef.current?.focus();
      }, 100);
    } else if (step === 2) {
      setTimeout(() => {
        universityRef.current?.focus();
      }, 100);
    } else if (step === 3) {
      setTimeout(() => {
        passwordRef.current?.focus();
      }, 100);
    }
  }, [step]);

  const isEmailValid = (emailStr: string) => {
    const trimmed = emailStr.trim();
    return trimmed.length > 0 && trimmed.includes('@') && trimmed.includes('.');
  };

  const isStep1Valid = () => name.trim().length > 0;
  const isStep2Valid = () => university.trim().length > 0 && isEmailValid(email);
  const isStep3Valid = () => password.length >= 8;

  const handleNextStep = () => {
    if (step === 1 && isStep1Valid()) {
      setStep(2);
    } else if (step === 2 && isStep2Valid()) {
      setStep(3);
    }
  };

  const handleBackStep = () => {
    if (step > 1) {
      setStep((prev) => (prev - 1) as 1 | 2 | 3);
    } else {
      onBack();
    }
  };

  const getStepContent = () => {
    switch (step) {
      case 1:
        return {
          title: `Join ${brand.name}`,
          subtitle: 'Choose your role and enter your name.',
        };
      case 2:
        return {
          title: 'Where do you study?',
          subtitle: 'Enter your university details.',
        };
      case 3:
        return {
          title: 'Secure your account',
          subtitle: 'Choose a password of at least 8 characters.',
        };
    }
  };
  const stepContent = getStepContent();

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
          <HeaderBar title="Create Account" onBack={handleBackStep} light />

          <Text style={styles.sectionHeadline}>{stepContent.title}</Text>
          <Text style={styles.sectionSubline}>{stepContent.subtitle}</Text>

          {/* Progress Tracker */}
          <View style={{ flexDirection: 'row', gap: 6, marginVertical: 14 }}>
            <View style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: step >= 1 ? brand.primary : '#EAE5DE' }} />
            <View style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: step >= 2 ? brand.primary : '#EAE5DE' }} />
            <View style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: step >= 3 ? brand.primary : '#EAE5DE' }} />
          </View>

          {verificationSent ? (
            <View style={[styles.verifyCard, { borderRadius: 8, padding: 16, borderColor: brand.border, backgroundColor: '#FFF' }]}>
              <View style={styles.verifyRow}>
                <Ionicons name="mail-unread" size={24} color={brand.primary} />
                <Text style={[styles.verifyTitle, { fontSize: 16, fontWeight: '700' }]}>Check your email inbox</Text>
              </View>
              <Text style={[styles.verifyBody, { fontSize: 14, color: brand.text, lineHeight: 20, marginTop: 8 }]}>
                We sent a verification link to <Text style={{ fontWeight: '700' }}>{email}</Text>. Open it to confirm your
                account, then sign in below.
              </Text>
              <View style={{ marginTop: 12 }}>
                <AuthButton label="Proceed to Sign In" onPress={onSignInClick} />
              </View>
            </View>
          ) : (
            <>
              {errorMsg ? <AuthError message={errorMsg} /> : null}

              {step === 1 && (
                <>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: brand.text, marginBottom: 8 }}>I am a:</Text>
                  <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                    {(['Student', 'Tutor'] as const).map((item) => {
                      const active = role === item;
                      return (
                        <Pressable
                          key={item}
                          onPress={() => setRole(item)}
                          style={{
                            flex: 1,
                            paddingVertical: 14,
                            borderRadius: 8,
                            borderWidth: 1.5,
                            borderColor: active ? brand.primary : '#E8E4DE',
                            backgroundColor: active ? brand.primary : '#fff',
                            alignItems: 'center',
                          }}
                          accessibilityRole="radio"
                          accessibilityState={{ selected: active }}
                          accessibilityLabel={`Sign up as ${item}`}
                        >
                          <Text
                            style={{
                              fontWeight: '700',
                              fontSize: 15,
                              color: active ? '#fff' : brand.muted,
                            }}
                          >
                            {item}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <AuthInput
                    ref={nameRef}
                    label="Full Name"
                    value={name}
                    onChangeText={setName}
                    placeholder="e.g. Seyram Mensah"
                    autoCapitalize="words"
                    autoComplete="name"
                    textContentType="name"
                    returnKeyType="next"
                    onSubmitEditing={handleNextStep}
                  />

                  <AuthButton
                    label="Continue"
                    onPress={handleNextStep}
                    disabled={!isStep1Valid()}
                  />
                </>
              )}

              {step === 2 && (
                <>
                  <AuthInput
                    ref={universityRef}
                    label="University"
                    value={university}
                    onChangeText={setUniversity}
                    placeholder="e.g. KNUST"
                    autoCapitalize="words"
                    returnKeyType="next"
                    onSubmitEditing={() => emailRef.current?.focus()}
                  />

                  <AuthInput
                    ref={emailRef}
                    label="University Email"
                    value={email}
                    onChangeText={setEmail}
                    placeholder="you@unimail.edu"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    textContentType="emailAddress"
                    returnKeyType="next"
                    onSubmitEditing={handleNextStep}
                  />

                  <AuthButton
                    label="Continue"
                    onPress={handleNextStep}
                    disabled={!isStep2Valid()}
                  />
                </>
              )}

              {step === 3 && (
                <>
                  <AuthInput
                    ref={passwordRef}
                    label="Password"
                    value={password}
                    onChangeText={setPassword}
                    placeholder="At least 8 characters"
                    secureTextEntry
                    autoCapitalize="none"
                    autoComplete="new-password"
                    textContentType="newPassword"
                    returnKeyType="done"
                    onSubmitEditing={() => {
                      if (isStep3Valid()) {
                        handleSignup();
                      }
                    }}
                  />

                  <AuthButton
                    label={loading ? 'Creating Account...' : 'Create Account'}
                    onPress={handleSignup}
                    disabled={!isStep3Valid()}
                    loading={loading}
                  />
                </>
              )}

              {step === 1 && (
                <Pressable onPress={onSignInClick} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Text style={styles.helperCenterText}>
                    Already have an account? <Text style={styles.helperLink}>Sign in</Text>
                  </Text>
                </Pressable>
              )}
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

  const emailRef = useRef<any>(null);
  const passwordRef = useRef<any>(null);

  useEffect(() => {
    setTimeout(() => {
      emailRef.current?.focus();
    }, 100);
  }, []);

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

          <AuthInput
            ref={emailRef}
            label="University Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@unimail.edu"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
          />
          <AuthInput
            ref={passwordRef}
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="done"
            onSubmitEditing={() => {
              if (email.trim() && password.trim()) {
                handleSignin();
              }
            }}
          />

          <AuthButton
            label={loading ? 'Signing in...' : 'Sign In'}
            onPress={handleSignin}
            disabled={!email.trim() || !password.trim()}
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
