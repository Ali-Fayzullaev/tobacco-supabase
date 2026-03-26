import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { Toaster } from 'sonner';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { FavoritesProvider } from '@/context/FavoritesContext';
import { StoreSettingsProvider } from '@/hooks/useStoreSettings';
import AgeGate from '@/components/AgeGate';
import { MobileTabBar } from '@/components/MobileTabBar';
import { ClientDiag } from '@/components/ClientDiag';

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
      <head>
        <Script id="global-error-catcher" strategy="beforeInteractive">{`
          window.__DIAG_ERRORS = [];
          window.onerror = function(msg, url, line, col) {
            window.__DIAG_ERRORS.push({type:'error', msg:String(msg), url:String(url), line:line, col:col, ts:Date.now()});
            try {
              navigator.sendBeacon('/api/debug-auth', new Blob([JSON.stringify({step:'js-error',origin:location.origin,msg:String(msg),url:String(url),line:line,col:col})],{type:'application/json'}));
            } catch(e){}
          };
          window.onunhandledrejection = function(e) {
            var msg = e.reason ? (e.reason.message || String(e.reason)) : 'unknown';
            window.__DIAG_ERRORS.push({type:'rejection', msg:msg, ts:Date.now()});
            try {
              navigator.sendBeacon('/api/debug-auth', new Blob([JSON.stringify({step:'js-rejection',origin:location.origin,msg:msg})],{type:'application/json'}));
            } catch(ex){}
          };
        `}</Script>
      </head>
      <body className={`${montserrat.className} overflow-x-hidden`}>
        <AuthProvider>
          <CartProvider>
            <FavoritesProvider>
            <StoreSettingsProvider>
              <ErrorBoundary>
                <AgeGate>
                  {children}
                  <MobileTabBar />
                </AgeGate>
              </ErrorBoundary>
            </StoreSettingsProvider>
            </FavoritesProvider>
          </CartProvider>
        </AuthProvider>
        <Toaster position="top-right" richColors />
        <ClientDiag />
      </body>
    </html>
  );
}
