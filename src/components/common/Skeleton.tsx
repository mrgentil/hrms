"use client";

import React from "react";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
  animation?: "pulse" | "wave" | "none";
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = "",
  variant = "rectangular",
  width,
  height,
  animation = "pulse",
}) => {
  const baseClasses = "bg-gray-200 dark:bg-gray-700";
  
  const animationClasses = {
    pulse: "animate-pulse",
    wave: "animate-shimmer",
    none: "",
  };

  const variantClasses = {
    text: "rounded",
    circular: "rounded-full",
    rectangular: "rounded-lg",
  };

  const style: React.CSSProperties = {
    width: width ?? "100%",
    height: height ?? (variant === "text" ? "1em" : "100%"),
  };

  return (
    <div
      className={`${baseClasses} ${animationClasses[animation]} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  );
};

// Skeleton pour les KPI Cards
export const KPICardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
    <div className="flex items-center justify-between mb-4">
      <Skeleton variant="circular" width={48} height={48} />
      <Skeleton width={60} height={24} />
    </div>
    <Skeleton width={80} height={40} className="mb-2" />
    <Skeleton width={120} height={16} />
    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
      <Skeleton width="100%" height={12} />
    </div>
  </div>
);

// Skeleton pour les graphiques
export const ChartSkeleton: React.FC<{ height?: number }> = ({ height = 250 }) => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
    <Skeleton width={200} height={24} className="mb-4" />
    <Skeleton height={height} />
  </div>
);

// Skeleton pour les listes d'activités
export const ActivitySkeleton: React.FC = () => (
  <div className="flex items-start gap-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
    <Skeleton variant="circular" width={40} height={40} />
    <div className="flex-1">
      <Skeleton width="80%" height={16} className="mb-2" />
      <Skeleton width="40%" height={12} />
    </div>
  </div>
);

// Skeleton pour les tables
export const TableRowSkeleton: React.FC<{ cols?: number }> = ({ cols = 5 }) => (
  <tr>
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-6 py-4">
        <Skeleton height={20} />
      </td>
    ))}
  </tr>
);

export default Skeleton;
