import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthProvider } from '@/context/AuthContext';
import { StoreSettingsProvider } from '@/hooks/useStoreSettings';
import AgeGate from '@/components/AgeGate';

const montserrat = Montserrat({ 
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-montserrat',
});

export const metadata: Metadata = {
  title: 'Premium Tobacco - Премиальные табачные изделия',
  description: 'Интернет-магазин табачных изделий в Казахстане. Только для лиц старше 21 года.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className={montserrat.className}>
        <AuthProvider>
          <StoreSettingsProvider>
            <ErrorBoundary>
              <AgeGate>
                {children}
              </AgeGate>
            </ErrorBoundary>
          </StoreSettingsProvider>
        </AuthProvider>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
