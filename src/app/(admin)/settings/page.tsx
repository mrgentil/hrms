"use client";

import React, { useState, useEffect, useRef } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { useToast } from "@/hooks/useToast";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import {
  settingsService,
  AppSetting,
  SettingCategory,
  CATEGORY_ICONS,
  CATEGORY_LABELS,
} from "@/services/settings.service";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Composant pour l'upload d'images
function ImageUploadInput({
  settingKey,
  value,
  label,
  onValueChange,
  onUploadSuccess,
}: {
  settingKey: string;
  value: string;
  label: string;
  onValueChange: (key: string, value: string | null) => void;
  onUploadSuccess: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const getFullImageUrl = (path: string | null) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
      return path;
    }
    return `${API_BASE_URL}${path}`;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      setError('Seules les images sont autorisées');
      return;
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('La taille maximum est de 5MB');
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const result = await settingsService.uploadImage(settingKey, file);
      onUploadSuccess(result.url);
      toast.success('Image uploadée avec succès');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors de l\'upload');
      toast.error('Erreur lors de l\'upload');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-3">
      {/* Prévisualisation */}
      {value && (
        <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <img
            src={getFullImageUrl(value)}
            alt={label}
            className="h-16 w-auto max-w-[200px] object-contain bg-white dark:bg-gray-800 rounded border p-1"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="50"><text x="10" y="30" fill="gray">Image non trouvée</text></svg>';
            }}
          />
          <div className="flex-1 text-xs text-gray-500 dark:text-gray-400 truncate">
            {value}
          </div>
          <button
            type="button"
            onClick={() => onValueChange(settingKey, null)}
            className="px-2 py-1 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
          >
            Supprimer
          </button>
        </div>
      )}

      {/* Zone d'upload */}
      <div className="flex items-center gap-3">
        <label
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
            uploading
              ? 'border-gray-300 bg-gray-100 dark:bg-gray-700'
              : 'border-gray-300 dark:border-gray-600 hover:border-primary hover:bg-primary/5'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
          />
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
              <span className="text-sm text-gray-500">Upload en cours...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Cliquez ou déposez une image ici
              </span>
            </>
          )}
        </label>
      </div>

      {/* Message d'erreur */}
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      {/* Info */}
      <p className="text-xs text-gray-400">
        Formats acceptés : JPG, PNG, GIF, SVG, WebP, ICO • Max 5MB
      </p>
    </div>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSetting[]>([]);
  const [categories, setCategories] = useState<SettingCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedValues, setEditedValues] = useState<Record<string, string | null>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const toast = useToast();
  const { refreshSettings } = useAppSettings();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Initialiser les paramètres par défaut d'abord
      try {
        await settingsService.initialize();
      } catch (e) {
        // Ignorer si déjà initialisé
      }
      
      const [settingsData, categoriesData] = await Promise.all([
        settingsService.getAll(),
        settingsService.getCategories(),
      ]);
      
      setSettings(settingsData);
      setCategories(categoriesData);
      
      // Initialiser les valeurs éditées
      const values: Record<string, string | null> = {};
      settingsData.forEach((s) => {
        values[s.key] = s.value;
      });
      setEditedValues(values);
    } catch (error: any) {
      console.error("Settings error:", error);
      const message = error?.response?.data?.message || error?.message || "Erreur inconnue";
      toast.error(`Erreur: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleValueChange = (key: string, value: string | null) => {
    setEditedValues((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Trouver les paramètres modifiés (comparer correctement les valeurs null/undefined/empty)
      const changedSettings = settings
        .filter((s) => {
          const edited = editedValues[s.key] ?? '';
          const original = s.value ?? '';
          return edited !== original;
        })
        .map((s) => ({ key: s.key, value: editedValues[s.key] ?? null }));
      
      console.log('Changed settings:', changedSettings);
      
      if (changedSettings.length === 0) {
        toast.info("Aucune modification à enregistrer");
        setSaving(false);
        return;
      }
      
      const result = await settingsService.updateMany(changedSettings);
      console.log('Update result:', result);
      
      toast.success(`${changedSettings.length} paramètre(s) mis à jour`);
      
      // Recharger les paramètres locaux
      await loadData();
      // Rafraîchir les paramètres globaux de l'application
      await refreshSettings();
      setHasChanges(false);
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(`Erreur: ${error?.response?.data?.message || error?.message || 'Erreur inconnue'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    const values: Record<string, string | null> = {};
    settings.forEach((s) => {
      values[s.key] = s.value;
    });
    setEditedValues(values);
    setHasChanges(false);
  };

  const filteredSettings = selectedCategory === "all"
    ? settings
    : settings.filter((s) => s.category === selectedCategory);

  const groupedSettings = filteredSettings.reduce((acc, setting) => {
    const cat = setting.category;
    if (!acc[cat]) {
      acc[cat] = [];
    }
    acc[cat].push(setting);
    return acc;
  }, {} as Record<string, AppSetting[]>);

  const renderSettingInput = (setting: AppSetting) => {
    const value = editedValues[setting.key] ?? "";
    
    switch (setting.type) {
      case "boolean":
        return (
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={value === "true"}
              onChange={(e) => handleValueChange(setting.key, e.target.checked ? "true" : "false")}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
          </label>
        );
      
      case "number":
        return (
          <input
            type="number"
            value={value || ""}
            onChange={(e) => handleValueChange(setting.key, e.target.value || null)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
          />
        );
      
      case "image":
        return (
          <ImageUploadInput
            settingKey={setting.key}
            value={value}
            label={setting.label}
            onValueChange={handleValueChange}
            onUploadSuccess={(url) => {
              handleValueChange(setting.key, url);
              loadData(); // Refresh to get updated value
            }}
          />
        );
      
      default:
        // Utiliser textarea pour les descriptions longues
        if (setting.key.includes("description") || setting.key.includes("address")) {
          return (
            <textarea
              value={value || ""}
              onChange={(e) => handleValueChange(setting.key, e.target.value || null)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm resize-none"
            />
          );
        }
        
        // Input couleur pour les couleurs
        if (setting.key.includes("color")) {
          return (
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={value || "#3b82f6"}
                onChange={(e) => handleValueChange(setting.key, e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border-0"
              />
              <input
                type="text"
                value={value || ""}
                onChange={(e) => handleValueChange(setting.key, e.target.value || null)}
                placeholder="#3b82f6"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
              />
            </div>
          );
        }
        
        return (
          <input
            type="text"
            value={value || ""}
            onChange={(e) => handleValueChange(setting.key, e.target.value || null)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
          />
        );
    }
  };

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Paramètres de l'application" />

      {/* Header avec boutons */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === "all"
                ? "bg-primary text-white"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            Tout ({settings.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === cat.key
                  ? "bg-primary text-white"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              {CATEGORY_ICONS[cat.key] || "📁"} {CATEGORY_LABELS[cat.key] || cat.key} ({cat.count})
            </button>
          ))}
        </div>
        
        <div className="flex gap-2">
          {hasChanges && (
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Annuler
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              hasChanges 
                ? 'text-white bg-primary hover:bg-primary/90' 
                : 'text-gray-400 bg-gray-200 dark:bg-gray-700 cursor-not-allowed'
            } disabled:opacity-50`}
          >
            {saving ? "Enregistrement..." : hasChanges ? "Enregistrer les modifications" : "Aucune modification"}
          </button>
        </div>
      </div>

      {/* Contenu */}
      {loading ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-500">Chargement...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedSettings).map(([category, categorySettings]) => (
            <div
              key={category}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <span>{CATEGORY_ICONS[category] || "📁"}</span>
                  {CATEGORY_LABELS[category] || category}
                </h2>
              </div>
              <div className="p-6 space-y-6">
                {categorySettings.map((setting) => (
                  <div key={setting.key} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                    <div className="md:col-span-1">
                      <label className="block text-sm font-medium text-gray-900 dark:text-white">
                        {setting.label}
                      </label>
                      {setting.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {setting.description}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-mono">
                        {setting.key}
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      {renderSettingInput(setting)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Floating save button */}
      {hasChanges && (
        <div className="fixed bottom-6 right-6 flex gap-2 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <span className="text-sm text-gray-600 dark:text-gray-400 self-center mr-2">
            Modifications non enregistrées
          </span>
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? "..." : "Enregistrer"}
          </button>
        </div>
      )}
    </div>
  );
}
