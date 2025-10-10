'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';

export default function WelcomeMessage() {
  const { user } = useAuth();
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    // Vérifier si c'est la première visite après connexion
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    if (user && !hasSeenWelcome) {
      setShowWelcome(true);
      localStorage.setItem('hasSeenWelcome', 'true');
    }
  }, [user]);

  if (!showWelcome) return null;

  const getRoleText = (role: string) => {
    switch (role) {
      case 'ROLE_ADMIN':
        return 'Administrateur';
      case 'ROLE_MANAGER':
        return 'Manager';
      case 'ROLE_EMPLOYEE':
        return 'Employé';
      default:
        return 'Utilisateur';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md mx-4 shadow-2xl">
        <div className="text-center">
          {/* Icône de bienvenue */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900 mb-4">
            <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>

          {/* Message de bienvenue */}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Bienvenue, {user?.full_name} !
          </h2>
          
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Vous êtes connecté en tant que <span className="font-semibold text-blue-600 dark:text-blue-400">{getRoleText(user?.role || '')}</span>
          </p>

          {/* Informations de sécurité */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">
              🔐 Système d'authentification sécurisé
            </h3>
            <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1 text-left">
              <li>• Vos données sont protégées par JWT</li>
              <li>• Session automatiquement rafraîchie</li>
              <li>• Déconnexion sécurisée disponible</li>
            </ul>
          </div>

          {/* Bouton de fermeture */}
          <button
            onClick={() => setShowWelcome(false)}
            className="w-full bg-brand-500 hover:bg-brand-600 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
          >
            Commencer à utiliser l'application
          </button>
        </div>
      </div>
    </div>
  );
}
