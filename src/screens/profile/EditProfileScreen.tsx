import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Image, Modal, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppImage } from '@/components/media';
import { useToast } from '@/components/feedback';
import { LabelledInput, PrimaryButton, Text } from '@/components/ui';
import { useAppStore } from '@/context/AppStoreContext';
import { brand, DEFAULT_AVATAR, UserProfile } from '@/data/mockData';
import { notifyError } from '@/lib/haptics';
import { updateUserProfile } from '@/lib/supabase';
import { uploadFile } from '@/lib/uploads';
import { styles, useThemeColors } from '@/styles/appStyles';

export function EditProfileScreen({
  onBack,
  onSave,
}: {
  onBack: () => void;
  onSave: () => void;
}) {
  const colors = useThemeColors();
  const { profile, updateProfile } = useAppStore();
  const toast = useToast();
  const [localProfile, setLocalProfile] = useState(profile);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [loadingPic, setLoadingPic] = useState(false);

  const updateField = (key: keyof UserProfile, value: any) => {
    setLocalProfile((prev) => ({ ...prev, [key]: value }));
  };

  const handlePickProfilePicture = async () => {
    try {
      setLoadingPic(true);
      const permResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permResult.granted === false) {
        notifyError();
        toast.show('Photo library access is needed to change your picture.', 'error');
        setLoadingPic(false);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedUri = result.assets[0].uri;

        // Show the local file straight away, then swap in the hosted URL. The
        // local file:// URI is device-only, so persisting it produced a broken
        // avatar everywhere else.
        updateField('avatar', selectedUri);
        setShowAvatarModal(false);

        const { url } = await uploadFile({
          bucket: 'avatars',
          userId: profile.id || '',
          uri: selectedUri,
          contentType: 'image/jpeg',
          fileName: 'avatar.jpg',
        });
        updateField('avatar', url);
        toast.show('Profile picture updated');
      }
    } catch (err) {
      toast.show(
        err instanceof Error ? err.message : 'Could not update your picture. Try again.',
        'error'
      );
    } finally {
      setLoadingPic(false);
    }
  };

  const handleSaveProfile = async () => {
    updateProfile(localProfile);

    if (profile?.id) {
      try {
        await updateUserProfile(profile.id, {
          full_name: localProfile.name,
          university: localProfile.university,
          major: localProfile.major,
          year: localProfile.year,
          bio: localProfile.bio,
          avatar_url: localProfile.avatar,
        });
      } catch (err) {
        console.warn('Sync profile update error:', err);
      }
    }

    onSave();
  };

  return (
    <SafeAreaView style={styles.lightScreen}>
      <ScrollView contentContainerStyle={styles.formScreen}>
        <View style={styles.screenHeaderRow}>
          <Pressable onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </Pressable>
          <Text style={styles.screenTitle}>Edit Profile</Text>
          <Pressable onPress={handleSaveProfile} style={styles.saveChip}>
            <Text style={styles.saveChipText}>Save</Text>
          </Pressable>
        </View>

        {/* Profile Avatar Display with Camera Badge */}
        <View style={{ alignItems: 'center', marginVertical: 12 }}>
          <Pressable
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={() => setShowAvatarModal(true)}
            style={({ pressed }) => [styles.editAvatarWrap, pressed && { opacity: 0.8, transform: [{ scale: 0.96 }] }]}
          >
            <AppImage source={{ uri: localProfile.avatar }} style={styles.editAvatar} />
            <View style={styles.editAvatarBadge}>
              <Ionicons name="camera-outline" size={18} color="#fff" />
            </View>
          </Pressable>
          <Pressable hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} onPress={() => setShowAvatarModal(true)}>
            <Text style={{ marginTop: 8, fontSize: 13, fontWeight: '700', color: brand.primary }}>
              Change Profile Picture
            </Text>
          </Pressable>
        </View>

        <LabelledInput
          label="Full Name"
          value={localProfile.name}
          onChangeText={(val) => updateField('name', val)}
          placeholder="Enter full name"
        />
        <LabelledInput
          label="University"
          value={localProfile.university}
          onChangeText={(val) => updateField('university', val)}
          placeholder="Enter university"
        />
        <LabelledInput
          label="Major / Field of Study"
          value={localProfile.major}
          onChangeText={(val) => updateField('major', val)}
          placeholder="Enter major"
        />
        <LabelledInput
          label="Year"
          value={localProfile.year}
          onChangeText={(val) => updateField('year', val)}
          placeholder="e.g. Senior · 4th Year"
        />
        <LabelledInput
          label="Bio"
          value={localProfile.bio}
          onChangeText={(val) => updateField('bio', val)}
          placeholder="Write a brief bio"
          multiline
        />

        <PrimaryButton label="Save Profile Changes" onPress={handleSaveProfile} />
      </ScrollView>

      {/* Change Profile Picture Modal */}
      <Modal visible={showAvatarModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Profile Picture</Text>
              <Pressable onPress={() => setShowAvatarModal(false)}>
                <Ionicons name="close-circle" size={26} color={colors.muted} />
              </Pressable>
            </View>

            <Text style={styles.mutedCopySmall}>Choose how you want to update your profile photo:</Text>

            {/* Option 1: Pick from Device Photos */}
            <Pressable
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={handlePickProfilePicture}
              style={({ pressed }) => [
                {
                  backgroundColor: brand.primary,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  marginVertical: 8,
                },
                pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
              ]}
            >
              <Ionicons name="images-outline" size={20} color="#FFFFFF" />
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14 }}>
                {loadingPic ? 'Opening Gallery...' : 'Choose Photo from Device Gallery'}
              </Text>
            </Pressable>

            {/* Option 2: Default Facebook Silhouette */}
            <Pressable
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={() => {
                updateField('avatar', DEFAULT_AVATAR);
                setShowAvatarModal(false);
              }}
              style={({ pressed }) => [
                {
                  backgroundColor: '#F3F4F6',
                  borderWidth: 1,
                  borderColor: '#D1D5DB',
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  marginBottom: 12,
                },
                pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
              ]}
            >
              <Ionicons name="person-circle-outline" size={20} color={colors.text} />
              <Text style={{ color: colors.text, fontWeight: '700', fontSize: 14 }}>
                Use Facebook Default Silhouette
              </Text>
            </Pressable>

            {/* Option 3: Custom Photo URL Input */}
            <LabelledInput
              label="Or Paste Custom Image URL"
              value={localProfile.avatar}
              onChangeText={(val) => updateField('avatar', val)}
              placeholder="https://example.com/my-photo.jpg"
            />

            <PrimaryButton label="Done" onPress={() => setShowAvatarModal(false)} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
