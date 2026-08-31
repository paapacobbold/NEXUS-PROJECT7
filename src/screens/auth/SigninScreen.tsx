import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { HeaderBar, Text } from '@/components/ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '@/context/AppStoreContext';
import { brand, DEFAULT_AVATAR } from '@/data/mockData';
import { styles } from '@/styles/appStyles';
import { AuthError, AuthInput, AuthButton } from './components/AuthFields';

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
      const { signInWithEmail, fetchUserProfile } = await import('../../lib/supabase');
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

          <Text style={[styles.sectionHeadline, { color: brand.text }]}>Welcome back</Text>
          <Text style={[styles.sectionSubline, { color: brand.muted }]}>Sign in to access your communities and sessions.</Text>

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
