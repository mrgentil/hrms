"use client";

import React, { memo } from "react";

interface PageLoaderProps {
  text?: string;
  fullScreen?: boolean;
}

const PageLoader: React.FC<PageLoaderProps> = memo(({ 
  text = "Chargement...",
  fullScreen = false 
}) => {
  const containerClass = fullScreen 
    ? "fixed inset-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm"
    : "flex items-center justify-center min-h-[400px]";

  return (
    <div className={`${containerClass} flex items-center justify-center`}>
      <div className="flex flex-col items-center gap-4">
        {/* Modern spinner */}
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-gray-700" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 animate-spin" />
        </div>
        {text && (
          <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">
            {text}
          </p>
        )}
      </div>
    </div>
  );
});

PageLoader.displayName = "PageLoader";

export default PageLoader;
