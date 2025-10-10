"use client";

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { profileService, ChangePasswordData } from '@/lib/profile';
import { formatUserRole } from '@/lib/roleLabels';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('avatar');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // État pour le changement de mot de passe
  const [passwordData, setPasswordData] = useState<ChangePasswordData>({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  // État pour l'avatar
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await profileService.changePassword(passwordData);
      showMessage('success', result.message);
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (error: any) {
      showMessage('error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;

    setLoading(true);
    try {
      const result = await profileService.uploadAvatar(avatarFile);
      showMessage('success', result.message);
      await refreshUser();
      setAvatarFile(null);
    } catch (error: any) {
      showMessage('error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const roleLabel = user?.role_info?.name || user?.current_role || formatUserRole(user?.role);

  return (
    <div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          Mon Profil
        </h3>

        {/* Message de notification */}
        {message.text && (
          <div className={`mb-4 rounded-lg border px-4 py-3 ${
            message.type === 'success' 
              ? 'border-green-300 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' 
              : 'border-red-300 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
          }`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
          {/* Section Avatar */}
          <div>
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
              <h4 className="mb-4 text-lg font-medium text-gray-800 dark:text-white">
                Photo de profil
              </h4>
              
              <div className="mb-6 flex items-center gap-4">
                <div className="h-20 w-20 overflow-hidden rounded-full bg-gray-200">
                  {avatarPreview || (user as any)?.profile_photo_url ? (
                    <img
                      src={avatarPreview || (user as any)?.profile_photo_url}
                      alt="Avatar"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gray-300 text-2xl font-semibold text-gray-600">
                      {user?.full_name?.charAt(0) || 'U'}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800 dark:text-white">
                    {user?.full_name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{roleLabel}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{user?.work_email}</p>
                </div>
              </div>

              <div className="relative mb-4 rounded-lg border-2 border-dashed border-gray-300 p-6 text-center dark:border-gray-600">
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 z-50 h-full w-full cursor-pointer opacity-0"
                  onChange={handleAvatarChange}
                />
                <div className="space-y-2">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                    <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium text-blue-600">Cliquez pour télécharger</span> ou glissez-déposez
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF (max. 5MB)</p>
                </div>
              </div>

              {avatarFile && (
                <button
                  onClick={handleAvatarUpload}
                  disabled={loading}
                  className="w-full rounded-lg bg-blue-600 py-2 px-4 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Upload...' : 'Télécharger la photo'}
                </button>
              )}
            </div>
          </div>

          {/* Section Mot de passe */}
          <div>
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
              <h4 className="mb-4 text-lg font-medium text-gray-800 dark:text-white">
                Changer le mot de passe
              </h4>
              
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Mot de passe actuel
                  </label>
                  <input
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-blue-400"
                    type="password"
                    value={passwordData.current_password}
                    onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                    placeholder="Votre mot de passe actuel"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nouveau mot de passe
                  </label>
                  <input
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-blue-400"
                    type="password"
                    value={passwordData.new_password}
                    onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                    placeholder="Nouveau mot de passe"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Confirmer le mot de passe
                  </label>
                  <input
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-blue-400"
                    type="password"
                    value={passwordData.confirm_password}
                    onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                    placeholder="Confirmer le mot de passe"
                    required
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                    type="button"
                    onClick={() => {
                      setPasswordData({
                        current_password: '',
                        new_password: '',
                        confirm_password: '',
                      });
                    }}
                  >
                    Annuler
                  </button>
                  <button
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? 'Modification...' : 'Modifier le mot de passe'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
