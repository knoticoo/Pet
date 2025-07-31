import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";
import { AuthProvider } from "@/components/AuthProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PetCare - Pet Management App",
  description: "Comprehensive pet management system for pet owners, vets, and shelters",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  console.log("🎨 RootLayout rendering with Inter font:", inter.className);
  console.log("🔧 CSS imported from globals.css");
  
  return (
    <html lang="en">
      <body className={inter.className}>
        <script dangerouslySetInnerHTML={{
          __html: `
            console.log("🌐 Body element created with classes:", document.body.className);
            console.log("📄 Document ready state:", document.readyState);
            
            // Check if Tailwind is loaded
            const testElement = document.createElement('div');
            testElement.className = 'bg-red-500 text-white p-4';
            testElement.style.position = 'fixed';
            testElement.style.top = '10px';
            testElement.style.right = '10px';
            testElement.style.zIndex = '9999';
            testElement.textContent = 'Tailwind Test';
            document.body.appendChild(testElement);
            
            setTimeout(() => {
              const styles = window.getComputedStyle(testElement);
              console.log("🎨 Tailwind test element styles:");
              console.log("  - Background color:", styles.backgroundColor);
              console.log("  - Color:", styles.color);
              console.log("  - Padding:", styles.padding);
              
              if (styles.backgroundColor === 'rgb(239, 68, 68)' || styles.backgroundColor.includes('239')) {
                console.log("✅ Tailwind CSS is working!");
              } else {
                console.log("❌ Tailwind CSS not applied. Background should be red.");
              }
              
              // Remove test element after 3 seconds
              setTimeout(() => testElement.remove(), 3000);
            }, 100);
          `
        }} />
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
