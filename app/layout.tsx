import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { OfflineManager } from '@/components/offline-manager';
import { Toaster } from 'react-hot-toast';
import { Inter, JetBrains_Mono } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const viewport: Viewport = {
  themeColor: '#131b2e',
};

export const metadata: Metadata = {
  title: 'Controle de Escavação',
  description: 'Sistema completo de controle de escavação e logística de materiais.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Cargo Control',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body suppressHydrationWarning className="bg-surface text-on-surface font-sans">
        <AuthProvider>
          {children}
          <OfflineManager />
          <Toaster position="bottom-center" />
        </AuthProvider>
      </body>
    </html>
  );
}
