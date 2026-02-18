import type { Metadata } from 'next';
import { ConvexClientProvider } from '@/components/providers/ConvexClientProvider';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { IdentityProvider } from '@/components/providers/IdentityProvider';
import { FloatingNavbar } from '@/components/ui/FloatingNavbar';
import { ArchiveBanner } from '@/components/ui/ArchiveBanner';
import './globals.css';

export const metadata: Metadata = {
  title: 'TypeRush - Tactical Typing Arena',
  description:
    'Minimal competitive typing with practice and multiplayer race modes.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="/assets/font/cabinet-grotesk/css/cabinet-grotesk.css"
        />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <ConvexClientProvider>
          <AuthProvider>
            <IdentityProvider>
              <FloatingNavbar />
              <ArchiveBanner />
              {children}
            </IdentityProvider>
          </AuthProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
