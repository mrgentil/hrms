'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService, User } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<any>;
  completeLogin2FA: (authResponse: any) => Promise<void>;
  register: (userData: {
    username: string;
    password: string;
    full_name: string;
    work_email?: string;
  }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Vérifier si l'utilisateur est déjà connecté
        const storedUser = authService.getUser();
        const isAuth = authService.isAuthenticated();

        if (storedUser && isAuth) {
          // Vérifier que le token est toujours valide en récupérant le profil
          try {
            const profile = await authService.getProfile();
            setUser(profile);
          } catch (error) {
            // Token invalide, déconnecter l'utilisateur
            authService.logout();
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Erreur lors de l\'initialisation de l\'authentification:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      setLoading(true);
      const authResponse = await authService.login(username, password);
      
      if (authResponse.requires_2fa) {
        // Just return it so the UI can show the 2FA step
        return authResponse;
      }

      setUser(authResponse.user);
      return authResponse;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const completeLogin2FA = async (authResponse: any) => {
    const fullAuth = authService.setFullAuthData(authResponse);
    setUser(fullAuth.user);
  };

  const register = async (userData: {
    username: string;
    password: string;
    full_name: string;
    work_email?: string;
  }) => {
    try {
      setLoading(true);
      const authResponse = await authService.register(userData);
      setUser(authResponse.user);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const profile = await authService.getProfile();
      setUser(profile);
      authService.storeUser(profile);
    } catch (error) {
      console.error('Erreur lors du rafraîchissement du profil:', error);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    completeLogin2FA,
    register,
    logout,
    refreshUser,
    isAuthenticated: user !== null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
