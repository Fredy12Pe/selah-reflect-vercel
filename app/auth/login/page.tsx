"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import Authentication from "@/app/components/Authentication";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const from = searchParams?.get("from") || "/";

  // If user is already authenticated, redirect
  useEffect(() => {
    if (user) {
      router.push(from !== "/auth/login" ? from : "/");
    }
  }, [from, router, user]);

  return <Authentication />;
}
