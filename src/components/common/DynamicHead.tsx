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
      favicon.href = getImageUrl(settings.favicon);
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
