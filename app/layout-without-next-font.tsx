// Import Firebase patch first to fix initialization errors
import "./_firebase";
import "./globals.css";
// Remove next/font imports
import { AuthProvider } from "@/lib/context/AuthContext";
import FirebasePatch from "./_document";
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
        {/* Critical Firebase patches applied before any React code runs */}
        <script src="/firebase-fix.js" />
        <FirebasePatch />
        <script src="/firebase-patch.js" async />
        <meta name="application-name" content="Selah" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="Selah" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icon-192.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="msapplication-TileColor" content="#000000" />
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
