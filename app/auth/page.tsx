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

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  // Wait for client-side mount to avoid hydration issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Exit early during server-side rendering or static generation
  if (!isMounted && !isBrowser) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col justify-center px-6">
        <div className="max-w-md w-full mx-auto">
          <h2 className="text-center text-3xl font-extrabold text-gray-900 mb-8">
            Loading...
          </h2>
        </div>
      </div>
    );
  }

  const redirectToDevotionPage = () => {
    const today = format(new Date(), "yyyy-MM-dd");
    router.push(`/devotion/${today}`);
  };

  const setSessionAndRedirect = async (user: any) => {
    try {
      const token = await user.getIdToken(true);
      document.cookie = `__session=${token}; path=/; max-age=2592000; SameSite=Strict; Secure`;
      setTimeout(() => {
        redirectToDevotionPage();
      }, 500);
    } catch (err) {
      console.error("Error setting session:", err);
      setError("Failed to complete authentication. Please try again.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const auth = getFirebaseAuth();
    if (!auth) {
      setError("Authentication not initialized");
      return;
    }

    try {
      if (isLogin) {
        const result = await signInWithEmailAndPassword(auth, email, password);
        await setSessionAndRedirect(result.user);
      } else {
        const { user } = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        await updateProfile(user, { displayName: name });
        await setSessionAndRedirect(user);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const auth = getFirebaseAuth();
      const provider = getGoogleAuthProvider();

      if (!auth || !provider) {
        setError("Authentication services not initialized");
        return;
      }

      const result = await signInWithPopup(auth, provider);
      await setSessionAndRedirect(result.user);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center px-6">
      <div className="max-w-md w-full mx-auto">
        <h2 className="text-center text-3xl font-extrabold text-gray-900 mb-8">
          {isLogin ? "Sign in to Selah" : "Create your account"}
        </h2>

        <div className="mb-6">
          <button
            onClick={handleGoogleSignIn}
            className="w-full flex justify-center items-center gap-3 py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            <Image
              src="https://www.google.com/images/branding/googleg/1x/googleg_standard_color_128dp.png"
              alt="Google logo"
              width={20}
              height={20}
            />
            Continue with Google
          </button>
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-100 text-gray-500">
              Or continue with email
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Name
              </label>
              <input
                id="name"
                type="text"
                required={!isLogin}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            />
          </div>

          {error && <div className="text-red-600 text-sm">{error}</div>}

          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            {isLogin ? "Sign in" : "Create account"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-primary hover:text-primary/90"
          >
            {isLogin
              ? "Don't have an account? Sign up"
              : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
