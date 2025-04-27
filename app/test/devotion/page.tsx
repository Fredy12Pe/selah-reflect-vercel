"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/context/AuthContext";

interface Devotion {
  date: string;
  title: string;
  verse: string;
  content: string;
  prayer: string;
  reflection: string;
}

export default function DevotionTestPage() {
  const { user, loading: authLoading } = useAuth();
  const [devotion, setDevotion] = useState<Devotion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDevotion = async () => {
      try {
        setLoading(true);
        // Try to fetch a devotion we know exists
        const response = await fetch("/api/devotions/2025-04-01");

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Devotion data:", data);
        setDevotion(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching devotion:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch devotion"
        );
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDevotion();
    }
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">Loading...</h1>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">Please sign in</h1>
        <p>You need to be authenticated to view devotions.</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Devotion Test Page</h1>

      {error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded mb-6">
          Error: {error}
        </div>
      ) : devotion ? (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">{devotion.title}</h2>
            <p className="text-gray-600 mb-2">Date: {devotion.date}</p>
            <p className="italic mb-4">{devotion.verse}</p>
            <div className="prose max-w-none">
              <h3 className="text-lg font-semibold mb-2">Content</h3>
              <p>{devotion.content}</p>

              <h3 className="text-lg font-semibold mt-4 mb-2">Prayer</h3>
              <p>{devotion.prayer}</p>

              <h3 className="text-lg font-semibold mt-4 mb-2">Reflection</h3>
              <p>{devotion.reflection}</p>
            </div>
          </div>
        </div>
      ) : (
        <p>No devotion data available.</p>
      )}

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
        <div className="bg-gray-100 p-4 rounded">
          <p>User ID: {user.uid}</p>
          <p>Email: {user.email}</p>
        </div>
      </div>
    </div>
  );
}
