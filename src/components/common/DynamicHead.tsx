"use client";

import { useEffect } from 'react';
import { useAppSettings } from '@/contexts/AppSettingsContext';

export default function DynamicHead() {
  const { settings, getImageUrl } = useAppSettings();

  useEffect(() => {
    // Mettre à jour le titre de la page
    if (settings.meta_title) {
      document.title = settings.meta_title;
    }

    // Mettre à jour la meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (settings.meta_description) {
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        document.head.appendChild(metaDescription);
      }
      metaDescription.setAttribute('content', settings.meta_description);
    }

    // Mettre à jour les meta keywords
    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (settings.meta_keywords) {
      if (!metaKeywords) {
        metaKeywords = document.createElement('meta');
        metaKeywords.setAttribute('name', 'keywords');
        document.head.appendChild(metaKeywords);
      }
      metaKeywords.setAttribute('content', settings.meta_keywords);
    }

    // Mettre à jour le favicon
    if (settings.favicon) {
      let favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      if (!favicon) {
        favicon = document.createElement('link');
        favicon.rel = 'icon';
        document.head.appendChild(favicon);
      }
      
      // Ajout d'un paramètre de version pour forcer le navigateur à contourner le cache (très agressif sur les favicons)
      const baseUrl = getImageUrl(settings.favicon);
      // Si l'URL contient déjà un point d'interrogation, on ajoute avec &, sinon avec ?
      const separator = baseUrl.includes('?') ? '&' : '?';
      // On utilise un timestamp de la date de dernière mise à jour des paramètres ou la date actuelle
      const cacheBuster = `v=${new Date().getTime()}`;
      
      favicon.href = `${baseUrl}${separator}${cacheBuster}`;
    }

    // Mettre à jour Open Graph
    if (settings.meta_title) {
      let ogTitle = document.querySelector('meta[property="og:title"]');
      if (!ogTitle) {
        ogTitle = document.createElement('meta');
        ogTitle.setAttribute('property', 'og:title');
        document.head.appendChild(ogTitle);
      }
      ogTitle.setAttribute('content', settings.meta_title);
    }

    if (settings.meta_description) {
      let ogDescription = document.querySelector('meta[property="og:description"]');
      if (!ogDescription) {
        ogDescription = document.createElement('meta');
        ogDescription.setAttribute('property', 'og:description');
        document.head.appendChild(ogDescription);
      }
      ogDescription.setAttribute('content', settings.meta_description);
    }

    if (settings.og_image) {
      let ogImage = document.querySelector('meta[property="og:image"]');
      if (!ogImage) {
        ogImage = document.createElement('meta');
        ogImage.setAttribute('property', 'og:image');
        document.head.appendChild(ogImage);
      }
      ogImage.setAttribute('content', getImageUrl(settings.og_image));
    }

  }, [settings, getImageUrl]);

  return null; // Ce composant ne rend rien visuellement
}
