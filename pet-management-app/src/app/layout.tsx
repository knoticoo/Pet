import type { Metadata, Viewport } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";
import { AuthProvider } from "@/components/AuthProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/lib/theme-provider";
import { PageWrapper } from "@/components/PageWrapper";
import { PWAWrapper } from "@/components/PWAWrapper";

// Optimize font loading with multiple fonts
const inter = Inter({ 
  subsets: ["latin", "cyrillic"],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial'],
  variable: '--font-inter'
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial'],
  variable: '--font-poppins'
});

export const metadata: Metadata = {
  title: "ПетКеа - Приложение для управления питомцами",
  description: "Комплексная система управления питомцами для владельцев домашних животных, ветеринаров и приютов",
  keywords: ["питомцы", "ветеринария", "управление", "здоровье животных", "pet care", "veterinary"],
  authors: [{ name: "PetCare Team" }],
  robots: "index, follow",
  openGraph: {
    title: "ПетКеа - Приложение для управления питомцами",
    description: "Комплексная система управления питомцами",
    type: "website",
    locale: "ru_RU",
  },
  twitter: {
    card: "summary_large_image",
    title: "ПетКеа - Приложение для управления питомцами",
    description: "Комплексная система управления питомцами",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" }
  ],
  // PWA-specific viewport settings
  viewportFit: "cover",
  // Ensure proper scaling on mobile devices
  minimumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`h-full ${inter.variable} ${poppins.variable}`}>
      <head>
        {/* Preload critical resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* DNS prefetch for external resources */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//api.mapbox.com" />
        
        {/* Critical CSS inline hint */}
        <meta name="color-scheme" content="light dark" />
        
        {/* PWA manifest */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="application-name" content="ПетКеа" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="ПетКеа" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        
        {/* Additional PWA meta tags for consistency */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        {/* Ensure consistent theme colors */}
        <meta name="theme-color" content="#3b82f6" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#0a0a0a" media="(prefers-color-scheme: dark)" />
        
        {/* Icons */}
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5" />
        
        {/* Service Worker Registration with Cache Busting */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  // Add cache busting parameter
                  const swUrl = '/sw.js?v=' + Date.now();
                  
                  navigator.serviceWorker.register(swUrl)
                    .then(function(registration) {
                      console.log('SW registered: ', registration);
                      
                      // Check for updates
                      registration.addEventListener('updatefound', function() {
                        const newWorker = registration.installing;
                        newWorker.addEventListener('statechange', function() {
                          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New service worker available
                            if (confirm('Новая версия приложения доступна. Обновить сейчас?')) {
                              newWorker.postMessage({ type: 'SKIP_WAITING' });
                              window.location.reload();
                            }
                          }
                        });
                      });
                    })
                    .catch(function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
              }
              
              // Clear old caches on page load
              if ('caches' in window) {
                caches.keys().then(function(cacheNames) {
                  return Promise.all(
                    cacheNames.map(function(cacheName) {
                      if (cacheName.startsWith('petcare-') && !cacheName.includes('v2')) {
                        console.log('Clearing old cache:', cacheName);
                        return caches.delete(cacheName);
                      }
                    })
                  );
                });
              }
            `,
          }}
        />
      </head>
      <body className={`${inter.className} h-full antialiased bg-background text-foreground`}>
        <ThemeProvider defaultTheme="default" storageKey="petcare-theme">
          <AuthProvider>
            <PWAWrapper>
              <div className="min-h-screen flex flex-col">
                <Navigation />
                <main className="flex-1 container mx-auto px-4 py-6 md:py-8 max-w-7xl">
                  <ErrorBoundary>
                    <PageWrapper>
                      {children}
                    </PageWrapper>
                  </ErrorBoundary>
                </main>
                
                {/* Footer */}
                <footer className="border-t bg-card/50 backdrop-blur-sm">
                  <div className="container mx-auto px-4 py-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">П</span>
                        </div>
                        <span className="font-semibold text-sm">ПетКеа</span>
                      </div>
                      <div className="text-xs text-muted-foreground text-center md:text-right">
                        © 2024 ПетКеа. Все права защищены.
                      </div>
                    </div>
                  </div>
                </footer>
              </div>
            </PWAWrapper>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
