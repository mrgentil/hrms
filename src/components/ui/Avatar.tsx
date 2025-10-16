"use client";
import Image from "next/image";
import React, { useMemo, useState } from "react";
import { resolveImageUrl } from "@/lib/images";

interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: number;
  fallbackText?: string;
  fallbackIcon?: string;
  backgroundColor?: string;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = "Avatar",
  size = 44,
  fallbackText,
  fallbackIcon = "👤",
  backgroundColor = "#6b7280",
  className = "",
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const resolvedSrc = useMemo(() => resolveImageUrl(src), [src]);

  const showFallback = !resolvedSrc || imageError || !imageLoaded;

  const fallbackContent = fallbackIcon || fallbackText?.charAt(0) || "👤";

  return (
    <div 
      className={`relative overflow-hidden rounded-full flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {resolvedSrc && !imageError && (
        <Image
          width={size}
          height={size}
          src={resolvedSrc}
          alt={alt}
          className={`object-cover w-full h-full transition-opacity duration-200 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            setImageError(true);
            setImageLoaded(false);
          }}
          priority={false}
        />
      )}
      
      {showFallback && (
        <div 
          className={`absolute inset-0 flex items-center justify-center text-white font-bold transition-opacity duration-200 ${
            showFallback ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ 
            backgroundColor,
            fontSize: size > 32 ? '1.125rem' : '0.875rem'
          }}
        >
          {fallbackContent}
        </div>
      )}
    </div>
  );
};
