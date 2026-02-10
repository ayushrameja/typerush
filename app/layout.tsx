import type { Metadata } from 'next';
import { ConvexClientProvider } from '@/components/providers/ConvexClientProvider';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { FloatingNavbar } from '@/components/ui/FloatingNavbar';
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Rajdhani:wght@400;500;600;700&family=Teko:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <ConvexClientProvider>
          <AuthProvider>
            <FloatingNavbar />
            {children}
          </AuthProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
