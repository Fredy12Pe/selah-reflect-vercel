// Import Firebase patch first to fix initialization errors
import "./_firebase";
import "./globals.css";
// Remove next/font imports
import { AuthProvider } from "@/lib/context/AuthContext";
import type { Metadata } from "next";
import { Providers } from "./providers";
import { Toaster } from "react-hot-toast";
import { Middleware } from "@/components/Middleware";

export const metadata: Metadata = {
  title: "Selah - Daily Devotions",
  description: "A personal devotional app for daily reflection",
  manifest: "/manifest.json",
  themeColor: "#000000",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Selah",
  },
};

// Separate viewport export
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Single Firebase patch to fix initialization issues */}
        <script src="/firebase-fix.js" />

        {/* Register Service Worker for PWA support */}
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js')
                  .then(function(registration) {
                    console.log('Service Worker registered with scope:', registration.scope);
                  })
                  .catch(function(error) {
                    console.log('Service Worker registration failed:', error);
                  });
              });
            }
          `
        }} />

        <meta name="application-name" content="Selah" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="Selah" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        
        {/* Icon for PWA */}
        <link rel="icon" href="/icons/favicon.ico" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-180.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-167.png" />
        
        {/* Icons for various devices */}
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-TileImage" content="/icons/icon-144.png" />
        <meta name="theme-color" content="#000000" />

        {/* Add Google Fonts using link instead of next/font */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />

        {/* Apple Splash Screens */}
        <link rel="apple-touch-startup-image" href="/splash.png" />
      </head>
      <body className="font-sans bg-white dark:bg-gray-950 text-black dark:text-white">
        <Providers>
          <Middleware>
            <AuthProvider>
              {children}
              <Toaster position="bottom-center" />
            </AuthProvider>
          </Middleware>
        </Providers>
      </body>
    </html>
  );
}
