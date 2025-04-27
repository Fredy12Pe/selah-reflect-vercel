"use client";

import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase/firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import Link from "next/link";

export default function AdminDashboard() {
  const [user, loading] = useAuthState(auth);
  const [isSeedingToday, setIsSeedingToday] = useState(false);
  const [isSeedingSample, setIsSeedingSample] = useState(false);
  const [isSeeding425, setIsSeeding425] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const sampleDevotion = {
    title: "Sample Devotion",
    verse: "John 3:16",
    content:
      "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.",
    reflection:
      "This verse reminds us of God's immense love for humanity and the sacrifice He made for our salvation.",
    prayer:
      "Dear God, thank you for your incredible love and the gift of eternal life through your Son Jesus Christ. Help us to live in a way that reflects this amazing grace. Amen.",
    date: Timestamp.now(),
  };

  const april25Devotion = {
    title: "Walking in Faith",
    verse: "Hebrews 11:1",
    content:
      "Now faith is confidence in what we hope for and assurance about what we do not see.",
    reflection:
      "Faith requires us to trust in God's promises even when circumstances seem uncertain. It's not about having all the answers, but about trusting the One who does.",
    prayer:
      "Lord, strengthen my faith today. Help me to trust You even when I cannot see the path ahead clearly. May my confidence be in Your unfailing promises rather than my limited understanding. Amen.",
    date: Timestamp.fromDate(new Date(2024, 3, 25)), // April 25, 2024 (month is 0-indexed)
  };

  const getCurrentDate = () => {
    const today = new Date();
    return Timestamp.fromDate(today);
  };

  const getTodayDevotion = () => {
    const today = new Date();
    const formattedDate = today.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    return {
      title: `Daily Reflection - ${formattedDate}`,
      verse: "Psalm 118:24",
      content:
        "This is the day that the LORD has made; let us rejoice and be glad in it.",
      reflection:
        "Each day is a gift from God, with new opportunities to experience His presence and serve Him. Today is not just another day, but a unique blessing from the Lord.",
      prayer:
        "Heavenly Father, thank you for the gift of today. Help me to use this day wisely, to honor You in all I do, and to be mindful of Your presence throughout my activities. Amen.",
      date: getCurrentDate(),
    };
  };

  const handleSeedSample = async () => {
    try {
      setIsSeedingSample(true);
      setStatus("Adding sample devotion...");
      setError("");

      const devotionsRef = collection(db, "devotions");
      await addDoc(devotionsRef, sampleDevotion);

      setStatus("Sample devotion added successfully!");
    } catch (err) {
      console.error("Error seeding sample devotion:", err);
      setError(`Failed to seed sample devotion: ${err.message}`);
      setStatus("");
    } finally {
      setIsSeedingSample(false);
    }
  };

  const handleSeedToday = async () => {
    try {
      setIsSeedingToday(true);
      setStatus("Adding today's devotion...");
      setError("");

      const devotionsRef = collection(db, "devotions");
      await addDoc(devotionsRef, getTodayDevotion());

      setStatus("Today's devotion added successfully!");
    } catch (err) {
      console.error("Error seeding today's devotion:", err);
      setError(`Failed to seed today's devotion: ${err.message}`);
      setStatus("");
    } finally {
      setIsSeedingToday(false);
    }
  };

  const handleSeedApril25 = async () => {
    try {
      setIsSeeding425(true);
      setStatus("Adding April 25 devotion...");
      setError("");

      const devotionsRef = collection(db, "devotions");
      await addDoc(devotionsRef, april25Devotion);

      setStatus("April 25 devotion added successfully!");
    } catch (err) {
      console.error("Error seeding April 25 devotion:", err);
      setError(`Failed to seed April 25 devotion: ${err.message}`);
      setStatus("");
    } finally {
      setIsSeeding425(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading authentication status...</div>;
  }

  if (!user) {
    return <div className="p-8">Please log in to access admin features.</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold mb-3">Quick Devotion Actions</h2>
          <div className="flex flex-col gap-4">
            <button
              onClick={handleSeedSample}
              disabled={isSeedingSample}
              className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded disabled:opacity-50"
            >
              {isSeedingSample ? "Adding Sample..." : "Add Sample Devotion"}
            </button>

            <button
              onClick={handleSeedToday}
              disabled={isSeedingToday}
              className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded disabled:opacity-50"
            >
              {isSeedingToday ? "Adding Today's..." : "Add Today's Devotion"}
            </button>

            <button
              onClick={handleSeedApril25}
              disabled={isSeeding425}
              className="bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded disabled:opacity-50"
            >
              {isSeeding425
                ? "Adding April 25..."
                : "Add April 25, 2024 Devotion"}
            </button>

            <Link
              href="/admin/devotions/upload"
              className="bg-amber-500 hover:bg-amber-600 text-white py-2 px-4 rounded text-center"
            >
              Bulk Upload Devotions (JSON)
            </Link>
          </div>
        </div>

        {status && (
          <div className="mt-4 p-3 bg-green-100 text-green-800 rounded">
            {status}
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-800 rounded">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
