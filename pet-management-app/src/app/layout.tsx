import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";
import { AuthProvider } from "@/components/AuthProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/lib/theme-provider";
import { PageWrapper } from "@/components/PageWrapper";

// Optimize font loading
const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial']
});

export const metadata: Metadata = {
  title: "ПетКеа - Приложение для управления питомцами",
  description: "Комплексная система управления питомцами для владельцев домашних животных, ветеринаров и приютов",
  keywords: ["питомцы", "ветеринария", "управление", "здоровье животных"],
  authors: [{ name: "PetCare Team" }],
  robots: "index, follow",
  openGraph: {
    title: "ПетКеа - Приложение для управления питомцами",
    description: "Комплексная система управления питомцами",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="h-full">
      <head>
        {/* Preload critical resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* DNS prefetch for external resources */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        
        {/* Critical CSS inline hint */}
        <meta name="color-scheme" content="light dark" />
      </head>
      <body className={`${inter.className} h-full antialiased`}>
        <ThemeProvider defaultTheme="default" storageKey="petcare-theme">
          <AuthProvider>
            <div className="min-h-screen bg-background flex flex-col">
              <Navigation />
              <main className="flex-1 container mx-auto px-4 py-4 md:py-8 max-w-7xl">
                <ErrorBoundary>
                  <PageWrapper>
                    {children}
                  </PageWrapper>
                </ErrorBoundary>
              </main>
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
