import apiService from '../api';

export const userApi = {
  uploadProfilePicture: (imageUri: string) => apiService.uploadProfilePicture(imageUri),
  updateUserProfilePicture: (profilePictureUrl: string | null) =>
    apiService.updateUserProfilePicture(profilePictureUrl),
  updateGuardProfile: (data: Parameters<typeof apiService.updateGuardProfile>[0]) =>
    apiService.updateGuardProfile(data),
};
