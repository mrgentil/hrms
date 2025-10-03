import React, { createContext, useContext, useState, useEffect } from 'react';

// Créer le contexte du thème
const ThemeContext = createContext();

// Hook personnalisé pour utiliser le contexte du thème
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Fournisseur du contexte du thème
export const ThemeProvider = ({ children }) => {
  // Détection du thème système
  const getSystemTheme = () => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  };

  // État du thème avec valeur par défaut depuis localStorage ou système
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('hrms-theme');
      if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
        return savedTheme;
      }
    }
    return 'auto';
  });

  // Thème effectif (résolu)
  const [effectiveTheme, setEffectiveTheme] = useState(() => {
    if (theme === 'auto') {
      return getSystemTheme();
    }
    return theme;
  });

  // Écouter les changements du thème système
  useEffect(() => {
    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = (e) => {
        setEffectiveTheme(e.matches ? 'dark' : 'light');
      };

      mediaQuery.addEventListener('change', handleChange);
      setEffectiveTheme(mediaQuery.matches ? 'dark' : 'light');

      return () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    } else {
      setEffectiveTheme(theme);
    }
  }, [theme]);

  // Appliquer le thème au document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', effectiveTheme);
    document.body.className = effectiveTheme === 'dark' ? 'dark-theme' : 'light-theme';
    
    // Sauvegarder dans localStorage
    localStorage.setItem('hrms-theme', theme);
  }, [theme, effectiveTheme]);

  // Fonction pour changer le thème
  const toggleTheme = () => {
    setTheme(prevTheme => {
      switch (prevTheme) {
        case 'light':
          return 'dark';
        case 'dark':
          return 'auto';
        case 'auto':
          return 'light';
        default:
          return 'light';
      }
    });
  };

  // Fonction pour définir un thème spécifique
  const setSpecificTheme = (newTheme) => {
    if (['light', 'dark', 'auto'].includes(newTheme)) {
      setTheme(newTheme);
    }
  };

  // Obtenir l'icône du thème actuel
  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return 'fas fa-sun';
      case 'dark':
        return 'fas fa-moon';
      case 'auto':
        return 'fas fa-adjust';
      default:
        return 'fas fa-sun';
    }
  };

  // Obtenir le label du thème actuel
  const getThemeLabel = () => {
    switch (theme) {
      case 'light':
        return 'Mode Clair';
      case 'dark':
        return 'Mode Sombre';
      case 'auto':
        return 'Auto (Système)';
      default:
        return 'Mode Clair';
    }
  };

  const value = {
    theme,
    effectiveTheme,
    toggleTheme,
    setSpecificTheme,
    getThemeIcon,
    getThemeLabel,
    isDark: effectiveTheme === 'dark',
    isLight: effectiveTheme === 'light'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
