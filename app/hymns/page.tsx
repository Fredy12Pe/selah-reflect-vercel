"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { getHymnByMonth } from "@/lib/services/devotionService";
import { Hymn } from "@/lib/types/devotion";
import { format } from "date-fns";

export default function HymnsPage() {
  const { user, loading: authLoading } = useAuth();
  const [hymn, setHymn] = useState<Hymn | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currentMonth = format(new Date(), "MMMM");

  useEffect(() => {
    async function loadHymn() {
      try {
        const hymnData = await getHymnByMonth(currentMonth);
        setHymn(hymnData);
        setError(null);
      } catch (err) {
        console.error("Error loading hymn:", err);
        setError("Failed to load hymn");
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading && user) {
      loadHymn();
    }
  }, [currentMonth, user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
        <p className="text-xl mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!hymn) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-xl">No hymn found for this month</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-2">{hymn.hymnTitle}</h1>
            <div className="text-white/70">
              <p>Words by {hymn.author}</p>
              <p>Music by {hymn.composer}</p>
            </div>
          </div>

          <div className="bg-white/5 rounded-2xl p-8">
            <pre className="whitespace-pre-wrap text-lg leading-relaxed font-serif">
              {hymn.lyrics}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
