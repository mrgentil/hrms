"use client";

import React, { useState } from "react";
import Image from "next/image";

interface Attachment {
  id: number;
  file_name: string;
  file_size: number;
  file_type: string;
  file_path: string;
}

interface CommentAttachmentsProps {
  attachments: Attachment[];
  className?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function CommentAttachments({ attachments, className = "" }: CommentAttachmentsProps) {
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  
  if (attachments.length === 0) return null;

  const isImage = (fileType: string) => fileType.startsWith("image/");

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return "🖼️";
    if (fileType.includes("pdf")) return "📄";
    if (fileType.includes("word") || fileType.includes("document")) return "📝";
    if (fileType.includes("excel") || fileType.includes("spreadsheet")) return "📊";
    if (fileType.includes("zip") || fileType.includes("rar")) return "📦";
    if (fileType.includes("text")) return "📄";
    return "📎";
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileUrl = (filePath: string) => {
    // Utiliser l'URL complète du backend pour accéder aux fichiers
    const cleanPath = filePath.replace(/\\/g, '/');
    if (cleanPath.startsWith('uploads/')) {
      return `${API_BASE_URL}/${cleanPath}`;
    }
    return `${API_BASE_URL}/uploads/tasks/${cleanPath.split('/').pop()}`;
  };

  const imageAttachments = attachments.filter(a => isImage(a.file_type));
  const otherAttachments = attachments.filter(a => !isImage(a.file_type));

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Images en preview (comme Gmail) */}
      {imageAttachments.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {imageAttachments.length} image(s)
          </div>
          
          <div className="flex flex-wrap gap-2">
            {imageAttachments.map((attachment) => (
              <div
                key={attachment.id}
                className="relative group cursor-pointer"
                onClick={() => setLightboxImage(getFileUrl(attachment.file_path))}
              >
                <div className="w-32 h-32 rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-600 hover:border-primary transition-colors">
                  <img
                    src={getFileUrl(attachment.file_path)}
                    alt={attachment.file_name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-lg transition-colors flex items-center justify-center">
                  <svg className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate max-w-[128px]">
                  {attachment.file_name}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Autres fichiers */}
      {otherAttachments.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            {otherAttachments.length} fichier(s)
          </div>
          
          <div className="flex flex-wrap gap-2">
            {otherAttachments.map((attachment) => (
              <a
                key={attachment.id}
                href={getFileUrl(attachment.file_path)}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-primary transition-colors group"
              >
                <span className="text-lg">{getFileIcon(attachment.file_type)}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[150px] group-hover:text-primary transition-colors">
                    {attachment.file_name}
                  </p>
                  {attachment.file_size > 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(attachment.file_size)}
                    </p>
                  )}
                </div>
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </a>
            ))}
          </div>
        </div>
      )}
      
      {/* Lightbox pour voir l'image en grand */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            onClick={() => setLightboxImage(null)}
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={lightboxImage}
            alt="Preview"
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
