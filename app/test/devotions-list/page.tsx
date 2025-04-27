"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { safeCollection, safeGetDocs } from "@/lib/utils/firebase-helpers";
import { collection, getDocs } from "firebase/firestore";

interface DevotionSummary {
  id: string;
  date: string;
  title: string;
}

export default function DevotionsListPage() {
  const { user, loading: authLoading } = useAuth();
  const [devotions, setDevotions] = useState<DevotionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDevotions = async () => {
      try {
        setLoading(true);
        console.log("Fetching devotions from Firestore...");

        const devotionsRef = safeCollection("devotions");
        const snapshot = await safeGetDocs(devotionsRef);

        const devotionsList = snapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as DevotionSummary)
        );

        console.log("Found devotions:", devotionsList);
        setDevotions(devotionsList);
        setError(null);
      } catch (err) {
        console.error("Error fetching devotions:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch devotions"
        );
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDevotions();
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
      <h1 className="text-2xl font-bold mb-6">Available Devotions</h1>

      {error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded mb-6">
          Error: {error}
        </div>
      ) : devotions.length > 0 ? (
        <div className="space-y-4">
          {devotions.map((devotion) => (
            <div key={devotion.id} className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-lg font-semibold">{devotion.title}</h2>
              <p className="text-gray-600">Date: {devotion.date}</p>
              <p className="text-sm text-gray-500">ID: {devotion.id}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-yellow-50 p-4 rounded">
          <p className="text-yellow-700">No devotions found in the database.</p>
          <p className="text-sm text-yellow-600 mt-2">
            This might mean either:
            <ul className="list-disc ml-6 mt-2">
              <li>The devotions collection is empty</li>
              <li>You don't have permission to access the devotions</li>
              <li>The collection path is incorrect</li>
            </ul>
          </p>
        </div>
      )}

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
        <div className="bg-gray-100 p-4 rounded">
          <p>User ID: {user.uid}</p>
          <p>Email: {user.email}</p>
          <p>Total Devotions: {devotions.length}</p>
        </div>
      </div>
    </div>
  );
}
