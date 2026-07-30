import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  ImageBackground,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  HeaderBar,
  IconButton,
  LabelledInput,
  PrimaryButton,
} from '../components/UIComponents';
import { useAppStore } from '../context/AppStoreContext';
import { brand } from '../data/mockData';
import { styles } from '../styles/appStyles';

export function SplashScreen({ onDone }: { onDone: () => void }) {
  return (
    <SafeAreaView style={styles.splashSafeArea}>
      <Pressable onPress={onDone} style={styles.splashContainer}>
        <View style={styles.splashRippleOne} />
        <View style={styles.splashRippleTwo} />
        <View style={styles.splashRippleThree} />
        <View style={styles.logoTile}>
          <Text style={styles.logoLetter}>N</Text>
        </View>
        <Text style={styles.splashBrand}>{brand.name}</Text>
        <Text style={styles.splashTagline}>{brand.tagline}</Text>
      </Pressable>
    </SafeAreaView>
  );
}

export function OnboardingScreen({
  onSkip,
  onDone,
}: {
  onSkip: () => void;
  onDone: () => void;
}) {
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

  const handleNext = () => {
    if (index < slides.length - 1) {
      setIndex((prev) => prev + 1);
    } else {
      onDone();
    }
  };

  return (
    <SafeAreaView style={styles.lightScreen}>
      <View style={styles.flexFill}>
        <ImageBackground source={{ uri: current.image }} style={styles.onboardingHero} imageStyle={styles.coverImage}>
          <View style={styles.onboardingTopRow}>
            <Pressable onPress={onSkip} style={styles.skipPill}>
              <Text style={styles.skipText}>Skip</Text>
            </Pressable>
          </View>
          <LinearGradient colors={['rgba(250,248,245,0)', 'rgba(250,248,245,1)']} style={styles.onboardingFade} />
        </ImageBackground>

        <View style={styles.onboardingBody}>
          <View style={styles.dotRow}>
            {slides.map((_, i) => (
              <View key={i} style={[styles.dot, i === index ? styles.dotActive : undefined]} />
            ))}
          </View>

          <Text style={styles.heroTitle}>{current.title}</Text>
          <Text style={styles.splashTagline}>{current.copy}</Text>

          <View style={{ marginTop: 20 }}>
            <PrimaryButton label={index === slides.length - 1 ? 'Get Started' : 'Continue'} onPress={handleNext} />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

export function WelcomeScreen({
  onCreateAccount,
  onSignIn,
}: {
  onCreateAccount: () => void;
  onSignIn: () => void;
}) {
  return (
    <SafeAreaView style={styles.lightScreen}>
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=1200&q=80' }}
        style={styles.welcomeHero}
        imageStyle={styles.coverImage}
      >
        <LinearGradient colors={['rgba(7,9,24,0.1)', 'rgba(7,9,24,0.92)']} style={styles.flexFill}>
          <View style={{ padding: 20 }}>
            <Text style={styles.splashBrand}>{brand.name}</Text>
          </View>

          <View style={{ padding: 20, gap: 12, marginTop: 'auto' }}>
            <Text style={styles.welcomeTitle}>Find your study community</Text>
            <Text style={styles.splashTagline}>
              Connect with university peers, share study materials, and excel together.
            </Text>

            <PrimaryButton label="Create Account" onPress={onCreateAccount} />
            <Pressable onPress={onSignIn} style={styles.outlineButton}>
              <Text style={styles.outlineButtonText}>Sign In</Text>
            </Pressable>
          </View>
        </LinearGradient>
      </ImageBackground>
    </SafeAreaView>
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
        avatar: `https://i.pravatar.cc/120?u=${encodeURIComponent(email.trim())}`,
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
    <SafeAreaView style={styles.lightScreen}>
      <ScrollView contentContainerStyle={styles.formScreen}>
        <HeaderBar title="Create Account" onBack={onBack} />

        <Text style={styles.sectionHeadline}>Join {brand.name}</Text>
        <Text style={styles.sectionSubline}>Start your peer learning journey today.</Text>

        {verificationSent ? (
          <View style={{ backgroundColor: '#EFF6FF', borderColor: '#BFDBFE', borderWidth: 1, padding: 18, borderRadius: 18, gap: 10, marginVertical: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="mail-unread" size={24} color={brand.primary} />
              <Text style={{ fontSize: 16, fontWeight: '800', color: brand.text }}>Check Your Email Inbox! ✉️</Text>
            </View>
            <Text style={{ fontSize: 13, color: brand.text, lineHeight: 18 }}>
              We sent a verification link to <Text style={{ fontWeight: '800' }}>{email}</Text>. Please click the link in your email to confirm your account, then sign in below.
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
                >
                  <Text style={[styles.segmentText, role === item ? styles.segmentTextActive : undefined]}>
                    {item}
                  </Text>
                </Pressable>
              ))}
            </View>

            {errorMsg ? <Text style={{ color: brand.danger, fontSize: 13, marginBottom: 8, fontWeight: '600' }}>{errorMsg}</Text> : null}

            <LabelledInput label="Full Name" value={name} onChangeText={setName} placeholder="e.g. Seyram Mensah" />
            <LabelledInput label="University Email" value={email} onChangeText={setEmail} placeholder="you@unimail.edu" keyboardType="email-address" />
            <LabelledInput label="University" value={university} onChangeText={setUniversity} placeholder="e.g. KNUST" />
            <LabelledInput label="Password" value={password} onChangeText={setPassword} placeholder="At least 8 characters" secureTextEntry />

            <PrimaryButton label={loading ? "Creating Account..." : "Create Account"} onPress={handleSignup} />

            <Pressable onPress={onSignInClick}>
              <Text style={styles.helperCenterText}>
                Already have an account? <Text style={styles.helperLink}>Sign in</Text>
              </Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
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
            avatar: `https://i.pravatar.cc/120?u=${encodeURIComponent(email)}`,
          });
        }
        setLoading(false);
        onContinue();
      } else {
        updateProfile({
          name: email.split('@')[0] || 'Student Learner',
          email: email.trim(),
          avatar: `https://i.pravatar.cc/120?u=${encodeURIComponent(email.trim())}`,
        });
        setLoading(false);
        onContinue();
      }
    } catch (err: any) {
      updateProfile({
        name: email.split('@')[0] || 'Student Learner',
        email: email.trim(),
        avatar: `https://i.pravatar.cc/120?u=${encodeURIComponent(email.trim())}`,
      });
      setLoading(false);
      onContinue();
    }
  };

  return (
    <SafeAreaView style={styles.lightScreen}>
      <ScrollView contentContainerStyle={styles.formScreen}>
        <HeaderBar title="Sign In" onBack={onBack} />

        <Text style={styles.sectionHeadline}>Welcome back</Text>
        <Text style={styles.sectionSubline}>Sign in to access your communities and sessions.</Text>

        {errorMsg ? <Text style={{ color: brand.danger, fontSize: 13, marginBottom: 8, fontWeight: '600' }}>{errorMsg}</Text> : null}

        <LabelledInput label="University Email" value={email} onChangeText={setEmail} placeholder="you@unimail.edu" keyboardType="email-address" />
        <LabelledInput label="Password" value={password} onChangeText={setPassword} placeholder="Enter your password" secureTextEntry />

        <PrimaryButton label={loading ? "Signing in..." : "Sign In"} onPress={handleSignin} />

        <Pressable onPress={onSignUpClick}>
          <Text style={styles.helperCenterText}>
            Don't have an account? <Text style={styles.helperLink}>Create one</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
