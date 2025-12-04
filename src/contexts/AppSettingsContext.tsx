"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { settingsService } from '@/services/settings.service';

interface AppSettings {
  // Général
  app_name?: string;
  app_description?: string;
  app_version?: string;
  
  // Branding
  logo_light?: string;
  logo_dark?: string;
  favicon?: string;
  primary_color?: string;
  
  // SEO
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  og_image?: string;
  
  // Entreprise
  company_name?: string;
  company_address?: string;
  company_phone?: string;
  company_email?: string;
  company_website?: string;
}

interface AppSettingsContextType {
  settings: AppSettings;
  loading: boolean;
  error: string | null;
  refreshSettings: () => Promise<void>;
  getImageUrl: (path: string | null | undefined) => string;
}

const defaultSettings: AppSettings = {
  app_name: 'HRMS',
  app_description: 'Système de gestion des ressources humaines',
  meta_title: 'HRMS - Gestion RH',
  meta_description: 'Plateforme complète de gestion des ressources humaines',
};

const AppSettingsContext = createContext<AppSettingsContextType>({
  settings: defaultSettings,
  loading: true,
  error: null,
  refreshSettings: async () => {},
  getImageUrl: () => '',
});

export const useAppSettings = () => useContext(AppSettingsContext);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const publicSettings = await settingsService.getPublicSettings();
      setSettings({ ...defaultSettings, ...publicSettings });
    } catch (err: any) {
      console.error('Failed to load app settings:', err);
      setError(err.message);
      // Utiliser les valeurs par défaut en cas d'erreur
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  // Fonction pour construire l'URL complète d'une image
  const getImageUrl = (path: string | null | undefined): string => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
      return path;
    }
    // C'est un chemin relatif, construire l'URL complète
    return `${API_BASE_URL}${path}`;
  };

  return (
    <AppSettingsContext.Provider
      value={{
        settings,
        loading,
        error,
        refreshSettings: loadSettings,
        getImageUrl,
      }}
    >
      {children}
    </AppSettingsContext.Provider>
  );
}
