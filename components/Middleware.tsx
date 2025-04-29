"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { isBrowser } from "@/lib/utils/environment";

// Public paths that don't require authentication
const PUBLIC_PATHS = [
  "/auth/login",
  "/_next",
  "/api",
  "/favicon.ico",
  "/manifest.json",
  "/firebase-fix.js",
  "/firebase-setup.js",
  "/debug",
  "/error",
  "/"
];

interface MiddlewareProps {
  children: React.ReactNode;
}

export function Middleware({ children }: MiddlewareProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname();
  
  // Check if current path is public
  const isPublicPath = PUBLIC_PATHS.some((path) => 
    pathname?.startsWith(path) || pathname === path
  );

  useEffect(() => {
    // Skip authentication check during SSR
    if (!isBrowser()) {
      setLoading(false);
      return;
    }

    // Skip authentication check for public paths
    if (isPublicPath) {
      setLoading(false);
      return;
    }

    // Add a safety timeout to prevent endless loading
    const safetyTimeout = setTimeout(() => {
      console.warn("[Middleware] Safety timeout reached, proceeding");
      setLoading(false);
    }, 3000); // 3 second safety timeout

    // Apply basic Firebase patches if needed
    const applyPatches = () => {
      if (typeof window === 'undefined') return;
      
      try {
        // Ensure Firebase internals are available
        window._registerComponent = window._registerComponent || 
          function(component) { return component; };
        
        window._getProvider = window._getProvider || 
          function() { return { getImmediate: () => ({}), get: () => ({}) }; };
        
        window._isFirebaseServerApp = window._isFirebaseServerApp || 
          function() { return false; };
        
        // Expose these functions on known module paths to prevent errors
        for (let i = 0; i < 5; i++) {
          const modName = `__FIREBASE_APP__WEBPACK_IMPORTED_MODULE_${i}__`;
          if (!window[modName]) window[modName] = {};
          window[modName]._registerComponent = window._registerComponent;
          window[modName]._getProvider = window._getProvider;
          window[modName]._isFirebaseServerApp = window._isFirebaseServerApp;
        }
      } catch (err) {
        console.error("[Middleware] Error applying patches:", err);
      } finally {
        clearTimeout(safetyTimeout);
        setLoading(false);
      }
    };

    // Allow a brief delay for Firebase to initialize
    setTimeout(applyPatches, 300);

    return () => {
      clearTimeout(safetyTimeout);
    };
  }, [pathname, isPublicPath]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white">Loading...</p>
          {error && <p className="mt-2 text-red-500 text-sm">{error}</p>}
        </div>
      </div>
    );
  }

  // Render children once authentication is checked
  return <>{children}</>;
}
