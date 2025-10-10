import { apiClient } from './api';

export interface UpdatePersonalProfileData {
  profile_photo_url?: string;
}

export interface ChangePasswordData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface ProfileResponse {
  success: boolean;
  data?: any;
  message: string;
}

class ProfileService {
  /**
   * Récupérer le profil utilisateur
   */
  async getProfile() {
    try {
      const response = await apiClient.get('/auth/profile');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour le profil personnel utilisateur
   */
  async updatePersonalProfile(data: UpdatePersonalProfileData): Promise<ProfileResponse> {
    try {
      const response = await apiClient.put('/auth/profile/personal', data);
      return response.data;
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      throw new Error(error.response?.data?.message || 'Erreur lors de la mise à jour du profil');
    }
  }

  /**
   * Changer le mot de passe
   */
  async changePassword(data: ChangePasswordData): Promise<ProfileResponse> {
    try {
      const response = await apiClient.put('/auth/change-password', data);
      return response.data;
    } catch (error: any) {
      console.error('Erreur lors du changement de mot de passe:', error);
      throw new Error(error.response?.data?.message || 'Erreur lors du changement de mot de passe');
    }
  }

  /**
   * Upload d'avatar
   */
  async uploadAvatar(file: File): Promise<ProfileResponse> {
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await apiClient.post('/auth/upload-avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('Erreur lors de l\'upload d\'avatar:', error);
      throw new Error(error.response?.data?.message || 'Erreur lors de l\'upload d\'avatar');
    }
  }

}

export const profileService = new ProfileService();
