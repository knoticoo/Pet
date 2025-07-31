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
            
            // Clear any existing NextAuth cookies to fix JWT error
            document.cookie.split(";").forEach(function(c) { 
              document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
            });
            console.log("🍪 Cleared existing cookies to fix NextAuth JWT error");
            
            // Check if CSS custom properties are loaded
            const rootStyles = getComputedStyle(document.documentElement);
            const debugCssLoaded = rootStyles.getPropertyValue('--debug-css-loaded');
            console.log("🎨 CSS custom properties loaded:", debugCssLoaded ? "✅ Yes" : "❌ No");
            
            // Check if Tailwind is loaded
            const testElement = document.createElement('div');
            testElement.className = 'bg-red-500 text-white p-4 rounded-lg shadow-lg';
            testElement.style.position = 'fixed';
            testElement.style.top = '50px';
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
              console.log("  - Border radius:", styles.borderRadius);
              console.log("  - Box shadow:", styles.boxShadow);
              
              const isRed = styles.backgroundColor === 'rgb(239, 68, 68)' || 
                           styles.backgroundColor.includes('239') ||
                           styles.backgroundColor.includes('ef4444');
              
              if (isRed) {
                console.log("✅ Tailwind CSS is working!");
                testElement.textContent = 'Tailwind ✅';
                testElement.style.backgroundColor = '#10b981';
              } else {
                console.log("❌ Tailwind CSS not applied. Background should be red.");
                console.log("❌ Computed background:", styles.backgroundColor);
                testElement.textContent = 'Tailwind ❌';
                testElement.style.backgroundColor = '#ef4444';
                testElement.style.color = 'white';
                testElement.style.padding = '16px';
              }
              
              // Remove test element after 5 seconds
              setTimeout(() => testElement.remove(), 5000);
            }, 500);
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
