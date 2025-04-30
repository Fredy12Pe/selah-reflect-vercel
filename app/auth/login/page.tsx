"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import Authentication from "@/app/components/Authentication";
import { useOnboarding } from "@/lib/hooks/useOnboarding";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const { hasCompletedOnboarding, loading: onboardingLoading } = useOnboarding(user);
  const from = searchParams?.get("from") || "/";

  // If user is already authenticated, check onboarding status and redirect
  useEffect(() => {
    if (!loading && user && !onboardingLoading) {
      if (hasCompletedOnboarding === false) {
        // First-time user, redirect to onboarding
        router.push('/onboarding');
      } else {
        // Existing user, redirect to requested page or home
        router.push(from !== "/auth/login" ? from : "/");
      }
    }
  }, [from, router, user, loading, hasCompletedOnboarding, onboardingLoading]);

  return <Authentication />;
}
