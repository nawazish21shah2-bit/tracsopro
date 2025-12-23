import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { launchImageLibrary, launchCamera, MediaType, ImagePickerResponse } from 'react-native-image-picker';
import { CameraIcon } from '../ui/AppIcons';
import { COLORS, SPACING, TYPOGRAPHY } from '../../styles/globalStyles';

interface ProfileAvatarProps {
  /** User's first name */
  firstName?: string;
  /** User's last name */
  lastName?: string;
  /** Profile picture URL */
  profilePictureUrl?: string | null;
  /** Avatar size in pixels */
  size?: number;
  /** Whether the avatar is editable (shows camera icon and allows image selection) */
  editable?: boolean;
  /** Callback when a new image is selected */
  onImageSelected?: (imageUri: string) => void;
  /** Whether the component is in a loading state */
  isLoading?: boolean;
  /** Custom background color for initials avatar */
  backgroundColor?: string;
  /** Custom text color for initials */
  textColor?: string;
}

/**
 * ProfileAvatar - A reusable component for displaying user profile pictures
 * Shows initials as fallback when no profile picture is available
 * Supports image selection when editable is true
 */
export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  firstName = '',
  lastName = '',
  profilePictureUrl,
  size = 80,
  editable = false,
  onImageSelected,
  isLoading = false,
  backgroundColor = COLORS.primaryLight,
  textColor = COLORS.primary,
}) => {
  const [imageError, setImageError] = useState(false);
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);

  // Generate initials from name
  const getInitials = (): string => {
    const firstInitial = firstName?.charAt(0)?.toUpperCase() || '';
    const lastInitial = lastName?.charAt(0)?.toUpperCase() || '';
    return firstInitial + lastInitial || 'U';
  };

  // Determine which image to show
  const imageSource = localImageUri || profilePictureUrl;
  const shouldShowImage = imageSource && !imageError;

  // Handle image picker options
  const handleImagePicker = () => {
    if (!editable) return;

    Alert.alert(
      'Change Profile Picture',
      'Choose how you want to update your profile picture',
      [
        {
          text: 'Take Photo',
          onPress: handleCamera,
        },
        {
          text: 'Choose from Gallery',
          onPress: handleGallery,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleCamera = () => {
    const options = {
      mediaType: 'photo' as MediaType,
      includeBase64: false,
      maxHeight: 800,
      maxWidth: 800,
      quality: 0.8 as const,
      saveToPhotos: false,
    };

    launchCamera(options, handleImageResponse);
  };

  const handleGallery = () => {
    const options = {
      mediaType: 'photo' as MediaType,
      includeBase64: false,
      maxHeight: 800,
      maxWidth: 800,
      quality: 0.8 as const,
    };

    launchImageLibrary(options, handleImageResponse);
  };

  const handleImageResponse = (response: ImagePickerResponse) => {
    if (response.didCancel) {
      return;
    }

    if (response.errorCode) {
      Alert.alert('Error', response.errorMessage || 'Failed to select image');
      return;
    }

    if (response.assets && response.assets[0]?.uri) {
      const uri = response.assets[0].uri;
      setLocalImageUri(uri);
      setImageError(false);
      onImageSelected?.(uri);
    }
  };

  // Calculate font size based on avatar size
  const fontSize = size * 0.35;
  const cameraIconSize = size * 0.25;
  const cameraIconContainerSize = size * 0.35;

  return (
    <TouchableOpacity
      style={[styles.container, { width: size, height: size }]}
      onPress={handleImagePicker}
      disabled={!editable || isLoading}
      activeOpacity={editable ? 0.7 : 1}
    >
      {isLoading ? (
        <View style={[styles.avatarPlaceholder, { width: size, height: size, borderRadius: size / 2, backgroundColor }]}>
          <ActivityIndicator size="small" color={textColor} />
        </View>
      ) : shouldShowImage ? (
        <Image
          source={{ uri: imageSource }}
          style={[styles.avatarImage, { width: size, height: size, borderRadius: size / 2 }]}
          onError={() => setImageError(true)}
        />
      ) : (
        <View style={[styles.avatarPlaceholder, { width: size, height: size, borderRadius: size / 2, backgroundColor }]}>
          <Text style={[styles.initialsText, { fontSize, color: textColor }]}>
            {getInitials()}
          </Text>
        </View>
      )}

      {/* Camera icon overlay for editable avatars */}
      {editable && !isLoading && (
        <View
          style={[
            styles.cameraIconContainer,
            {
              width: cameraIconContainerSize,
              height: cameraIconContainerSize,
              borderRadius: cameraIconContainerSize / 2,
            },
          ]}
        >
          <CameraIcon size={cameraIconSize} color={COLORS.primary} />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  avatarImage: {
    resizeMode: 'cover',
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  cameraIconContainer: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.backgroundPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.backgroundPrimary,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
});

export default ProfileAvatar;

