"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  // Redirect to login page after rendering on client
  useEffect(() => {
    router.push("/");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold">Loading Admin Area</h2>
        <p>Please wait while we set up the admin area...</p>
        <p>
          If you are not redirected,{" "}
          <Link href="/" className="underline">
            click here to go back to the home page
          </Link>
        </p>
      </div>
    </div>
  );
}
