import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle = ({ showLabel = true, className = '' }) => {
  const { theme, toggleTheme, setSpecificTheme, getThemeIcon, getThemeLabel } = useTheme();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleToggle = () => {
    toggleTheme();
  };

  const handleDropdownToggle = (e) => {
    e.stopPropagation();
    setShowDropdown(!showDropdown);
  };

  const handleThemeSelect = (selectedTheme) => {
    setSpecificTheme(selectedTheme);
    setShowDropdown(false);
  };

  const themeOptions = [
    { value: 'light', label: 'Mode Clair', icon: 'fas fa-sun' },
    { value: 'dark', label: 'Mode Sombre', icon: 'fas fa-moon' },
    { value: 'auto', label: 'Auto (Système)', icon: 'fas fa-adjust' }
  ];

  return (
    <div className={`theme-toggle-container ${className}`}>
      {/* Version simple avec toggle */}
      <div className="theme-toggle" onClick={handleToggle} title={getThemeLabel()}>
        <i className={`theme-toggle-icon ${getThemeIcon()}`}></i>
        {showLabel && <span className="theme-toggle-label">{getThemeLabel()}</span>}
      </div>

      {/* Version dropdown pour plus d'options */}
      <div className="theme-dropdown" style={{ position: 'relative', display: 'inline-block' }}>
        <button
          className="btn btn-outline-secondary btn-sm dropdown-toggle"
          type="button"
          onClick={handleDropdownToggle}
          style={{ 
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--card-bg)',
            color: 'var(--text-primary)'
          }}
        >
          <i className={getThemeIcon()}></i>
          {showLabel && <span className="ml-2">{getThemeLabel()}</span>}
        </button>
        
        {showDropdown && (
          <div 
            className="dropdown-menu show"
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              zIndex: 1000,
              backgroundColor: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
              borderRadius: '0.375rem',
              boxShadow: '0 0.5rem 1rem var(--card-shadow)',
              minWidth: '200px'
            }}
          >
            {themeOptions.map((option) => (
              <button
                key={option.value}
                className={`dropdown-item ${theme === option.value ? 'active' : ''}`}
                onClick={() => handleThemeSelect(option.value)}
                style={{
                  backgroundColor: theme === option.value ? 'var(--nav-active)' : 'transparent',
                  color: theme === option.value ? 'white' : 'var(--text-primary)',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  width: '100%',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <i className={option.icon}></i>
                <span>{option.label}</span>
                {theme === option.value && <i className="fas fa-check ml-auto"></i>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Overlay pour fermer le dropdown */}
      {showDropdown && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999
          }}
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
};

// Version compacte pour la navbar
export const CompactThemeToggle = () => {
  const { toggleTheme, getThemeIcon, getThemeLabel } = useTheme();

  return (
    <li className="nav-item">
      <a 
        className="nav-link" 
        href="#" 
        onClick={(e) => {
          e.preventDefault();
          toggleTheme();
        }}
        title={getThemeLabel()}
        style={{ cursor: 'pointer' }}
      >
        <i className={getThemeIcon()}></i>
      </a>
    </li>
  );
};

// Version pour dropdown utilisateur
export const UserDropdownThemeToggle = () => {
  const { theme, setSpecificTheme, getThemeIcon } = useTheme();
  const [showSubmenu, setShowSubmenu] = useState(false);

  const themeOptions = [
    { value: 'light', label: 'Mode Clair', icon: 'fas fa-sun' },
    { value: 'dark', label: 'Mode Sombre', icon: 'fas fa-moon' },
    { value: 'auto', label: 'Auto (Système)', icon: 'fas fa-adjust' }
  ];

  return (
    <>
      <a 
        href="#" 
        className="dropdown-item"
        onClick={(e) => {
          e.preventDefault();
          setShowSubmenu(!showSubmenu);
        }}
      >
        <i className={`${getThemeIcon()} mr-2`}></i> Thème
        <i className={`fas fa-chevron-${showSubmenu ? 'up' : 'down'} float-right mt-1`}></i>
      </a>
      
      {showSubmenu && (
        <div style={{ paddingLeft: '1rem', backgroundColor: 'var(--bg-secondary)' }}>
          {themeOptions.map((option) => (
            <a
              key={option.value}
              href="#"
              className={`dropdown-item ${theme === option.value ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                setSpecificTheme(option.value);
                setShowSubmenu(false);
              }}
              style={{
                fontSize: '0.875rem',
                paddingLeft: '2rem',
                backgroundColor: theme === option.value ? 'var(--nav-active)' : 'transparent'
              }}
            >
              <i className={`${option.icon} mr-2`}></i>
              {option.label}
              {theme === option.value && <i className="fas fa-check float-right mt-1"></i>}
            </a>
          ))}
        </div>
      )}
    </>
  );
};

export default ThemeToggle;

