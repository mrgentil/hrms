import { Outfit } from 'next/font/google';
import './globals.css';

import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { AppSettingsProvider } from '@/contexts/AppSettingsContext';
import Toaster from '@/components/common/Toaster';
import DynamicHead from '@/components/common/DynamicHead';
import QueryProvider from '@/providers/QueryProvider';

const outfit = Outfit({
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.className} dark:bg-gray-900`} suppressHydrationWarning>
        <QueryProvider>
          <AppSettingsProvider>
            <DynamicHead />
            <AuthProvider>
              <ThemeProvider>
                <SidebarProvider>
                  {children}
                </SidebarProvider>
                <Toaster />
              </ThemeProvider>
            </AuthProvider>
          </AppSettingsProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
