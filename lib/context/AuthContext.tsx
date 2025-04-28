"use client";

// Import patches before Firebase modules - fixes _registerComponent errors
import "../firebase/patch";
import "../firebase/patchAuth";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User,
  sendPasswordResetEmail,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  Auth,
} from "firebase/auth";
import { useRouter, usePathname } from "next/navigation";
import { auth } from "../firebase/config";
import { setCookie, clearCookie } from "../utils/cookies";
import { isBrowser } from "../utils/environment";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (displayName: string) => Promise<void>;
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initAttempted, setInitAttempted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const setSessionCookie = async (user: User) => {
    try {
      // Get the ID token with force refresh to ensure it's up to date
      const idToken = await user.getIdToken(false);

      // Set the cookie with the token
      setCookie("session", idToken, {
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        httpOnly: true
      });

      console.log("Session cookie set successfully");
    } catch (error) {
      console.error("Error setting session cookie:", error);
    }
  };

  const clearSessionCookie = () => {
    try {
      clearCookie("session");
      console.log("Session cookie cleared successfully");
    } catch (error) {
      console.error("Error clearing session cookie:", error);
    }
  };

  useEffect(() => {
    // Only run in browser environment
    if (!isBrowser()) {
      console.log("AuthProvider: Skip auth state listener in server environment");
      setLoading(false);
      return;
    }

    let authInitialized = false;
    
    // Safety timeout to prevent infinite loading
    const safetyTimeout = setTimeout(() => {
      if (!authInitialized) {
        console.warn("AuthProvider: Safety timeout reached, continuing without auth");
        setLoading(false);
        setInitAttempted(true);
      }
    }, 5000);

    // Check if auth is available
    if (!auth || Object.keys(auth).length === 0) {
      console.error("AuthProvider: Firebase Auth is not initialized");
      setLoading(false);
      setError("Firebase authentication is not available");
      clearTimeout(safetyTimeout);
      setInitAttempted(true);
      return;
    }

    console.log("AuthProvider: Setting up auth state listener");

    try {
      // Set up authentication listener
      const unsubscribe = onAuthStateChanged(
        auth,
        async (authUser) => {
          setLoading(true);
          authInitialized = true;

          try {
            if (authUser) {
              console.log("User authenticated:", authUser.uid);
              setUser(authUser);

              // Set the session cookie whenever the user is authenticated
              // But don't wait for it to complete
              setSessionCookie(authUser).catch(console.error);

              // If on login page and authenticated, redirect to home
              if (pathname === "/auth/login") {
                router.push("/");
              }
            } else {
              console.log("No user authenticated");
              setUser(null);
              clearSessionCookie();

              // Only redirect to login if on protected route and not already on login page
              const isPublicPath = pathname?.startsWith("/auth/") || 
                                 pathname?.includes("_next") ||
                                 pathname?.includes("api/") ||
                                 pathname === "/";
              
              if (pathname && !isPublicPath) {
                console.log("Redirecting to login from:", pathname);
                router.push("/auth/login");
              }
            }
          } catch (err) {
            console.error("Error processing auth state:", err);
            // Don't set error state here to avoid UI disruption
          } finally {
            setLoading(false);
            setInitAttempted(true);
          }
        },
        (error) => {
          console.error("Auth state change error:", error);
          // Don't set error state to avoid blocking the UI
          setLoading(false);
          setInitAttempted(true);
          authInitialized = true;
        }
      );

      // Cleanup subscription
      return () => {
        console.log("Cleaning up auth state listener");
        clearTimeout(safetyTimeout);
        unsubscribe();
      };
    } catch (err) {
      console.error("Error setting up auth listener:", err);
      setLoading(false);
      setInitAttempted(true);
      return () => {};
    }
  }, [router, pathname]);

  // Provide default implementations for auth methods if Firebase is unavailable
  const defaultErrorHandler = (methodName: string) => {
    return async () => {
      const errorMsg = `Cannot ${methodName}: Firebase Auth is not initialized`;
      console.error(errorMsg);
      setError(errorMsg);
      throw new Error(errorMsg);
    };
  };

  // Create auth methods with safety checks
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      if (!auth || Object.keys(auth).length === 0) {
        throw new Error("Auth is not initialized");
      }

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      await setSessionCookie(userCredential.user);
      setUser(userCredential.user);

      return;
    } catch (error: any) {
      console.error("Login error:", error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (
    email: string,
    password: string,
    displayName: string
  ) => {
    try {
      setLoading(true);
      setError(null);

      if (!auth || Object.keys(auth).length === 0) {
        throw new Error("Auth is not initialized");
      }

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Update the user's profile with displayName
      await updateProfile(userCredential.user, { displayName });

      // Set the session cookie
      await setSessionCookie(userCredential.user);

      setUser(userCredential.user);
      return;
    } catch (error: any) {
      console.error("Signup error:", error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);

      if (!auth || Object.keys(auth).length === 0) {
        throw new Error("Auth is not initialized");
      }

      await signOut(auth);
      clearSessionCookie();
      setUser(null);
      router.push("/auth/login");
    } catch (error: any) {
      console.error("Logout error:", error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setLoading(true);
      setError(null);

      if (!auth || Object.keys(auth).length === 0) {
        throw new Error("Auth is not initialized");
      }

      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      console.error("Reset password error:", error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (displayName: string) => {
    try {
      setLoading(true);
      setError(null);

      if (!auth || Object.keys(auth).length === 0) {
        throw new Error("Auth is not initialized");
      }

      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("User not authenticated");
      }

      await updateProfile(currentUser, { displayName });
      setUser(currentUser);
    } catch (error: any) {
      console.error("Update profile error:", error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string
  ) => {
    try {
      setLoading(true);
      setError(null);

      if (!auth || Object.keys(auth).length === 0) {
        throw new Error("Auth is not initialized");
      }

      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("User not authenticated");
      }
      if (!currentUser.email) {
        throw new Error("User email is not available");
      }

      // Re-authenticate the user
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        currentPassword
      );
      await reauthenticateWithCredential(currentUser, credential);

      // Update the password
      await updatePassword(currentUser, newPassword);
    } catch (error: any) {
      console.error("Change password error:", error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    signup,
    logout,
    resetPassword,
    updateUserProfile,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
