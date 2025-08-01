import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";
import { AuthProvider } from "@/components/AuthProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ПетКеа - Приложение для управления питомцами",
  description: "Комплексная система управления питомцами для владельцев домашних животных, ветеринаров и приютов",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <AuthProvider>
          <div className="min-h-screen bg-background">
            <Navigation />
            <main className="container mx-auto px-4 py-4 md:py-8 max-w-7xl">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
