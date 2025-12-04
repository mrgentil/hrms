"use client";

import GridShape from "@/components/common/GridShape";
import ThemeTogglerTwo from "@/components/common/ThemeTogglerTwo";
import DynamicHead from "@/components/common/DynamicHead";
import { ThemeProvider } from "@/context/ThemeContext";
import { AppSettingsProvider, useAppSettings } from "@/contexts/AppSettingsContext";
import Image from "next/image";
import Link from "next/link";
import React from "react";

function AuthLayoutContent({ children }: { children: React.ReactNode }) {
  const { settings, getImageUrl } = useAppSettings();

  return (
    <div className="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
      <ThemeProvider>
        <DynamicHead />
        <div className="relative flex lg:flex-row w-full h-screen justify-center flex-col dark:bg-gray-900 sm:p-0">
          {children}
          <div className="lg:w-1/2 w-full h-full bg-brand-950 dark:bg-white/5 lg:grid items-center hidden">
            <div className="relative items-center justify-center flex z-1">
              <GridShape />
              <div className="flex flex-col items-center max-w-xs">
                <Link href="/" className="block mb-4">
                  {settings.logo_dark ? (
                    <img
                      className="h-12 w-auto"
                      src={getImageUrl(settings.logo_dark)}
                      alt={settings.app_name || "Logo"}
                    />
                  ) : (
                    <Image
                      width={231}
                      height={48}
                      src="/images/logo/auth-logo.svg"
                      alt="Logo"
                    />
                  )}
                </Link>
                <p className="text-center text-gray-400 dark:text-white/60">
                  {settings.app_description || "Système de gestion des ressources humaines"}
                </p>
              </div>
            </div>
          </div>
          <div className="fixed bottom-6 right-6 z-50 hidden sm:block">
            <ThemeTogglerTwo />
          </div>
        </div>
      </ThemeProvider>
    </div>
  );
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppSettingsProvider>
      <AuthLayoutContent>{children}</AuthLayoutContent>
    </AppSettingsProvider>
  );
}
