"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getFirebaseAuth, getGoogleAuthProvider } from "@/lib/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
} from "firebase/auth";
import Image from "next/image";
import { format } from "date-fns";
import { isBrowser } from "@/lib/utils/environment";

// Mock function for build time
const mockRedirect = () => {
  console.log("Mock redirect during build");
  return Promise.resolve();
};

export default function AuthPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the actual login page
    router.replace("/auth/login");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Redirecting to login...</h1>
      </div>
    </div>
  );
}
