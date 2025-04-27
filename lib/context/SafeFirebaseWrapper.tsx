"use client";

import React from "react";
import { isBrowser } from "../utils/environment";

interface SafeFirebaseWrapperProps {
  children: React.ReactNode;
}

/**
 * A wrapper component that ensures Firebase services are only initialized
 * in browser environments to prevent build-time errors on Netlify
 */
const SafeFirebaseWrapper: React.FC<SafeFirebaseWrapperProps> = ({
  children,
}) => {
  // During server-side rendering (SSR) or static site generation (SSG),
  // return a basic loading placeholder
  if (!isBrowser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-white text-lg">Loading application...</div>
      </div>
    );
  }

  // In browser, render the children components normally
  return <>{children}</>;
};

export default SafeFirebaseWrapper;
