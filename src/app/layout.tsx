import { Outfit } from 'next/font/google';
import './globals.css';

import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { PermissionsProvider } from '@/contexts/PermissionsContext';
import { AppSettingsProvider } from '@/contexts/AppSettingsContext';
import Toaster from '@/components/common/Toaster';
import DynamicHead from '@/components/common/DynamicHead';
import QueryProvider from '@/providers/QueryProvider';
import { SocketProvider } from '@/contexts/SocketContext';
import ChatWidget from '@/components/Chat/ChatWidget';
import CommandSearchWrapper from '@/components/ui/CommandSearchWrapper';

const outfit = Outfit({ subsets: ['latin'] });

// ... other imports ...

// ...

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={outfit.className}>
      <body suppressHydrationWarning={true}>
        <QueryProvider>
          <AuthProvider>
            <AppSettingsProvider>
              <SocketProvider>
                <PermissionsProvider>
                  <ThemeProvider>
                    <SidebarProvider>
                      <DynamicHead />
                      {children}
                    </SidebarProvider>
                    <ChatWidget />
                    <Toaster />
                    <CommandSearchWrapper />
                  </ThemeProvider>
                </PermissionsProvider>
              </SocketProvider>
            </AppSettingsProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
