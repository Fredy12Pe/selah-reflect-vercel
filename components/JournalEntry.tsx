"use client";

import React, { useState } from "react";
import { getFirebaseFirestore, getFirebaseAuth } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { isBrowser } from "@/lib/utils/environment";

interface JournalEntryProps {
  date: string;
  prompt: string;
  onSave?: () => void;
}

export default function JournalEntry({
  date,
  prompt,
  onSave,
}: JournalEntryProps) {
  const [entry, setEntry] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    // Skip if not in browser
    if (!isBrowser) return;

    setError(null);
    setSaving(true);
    try {
      const db = getFirebaseFirestore();
      const auth = getFirebaseAuth();

      if (!db || !auth) {
        setError("Firebase services not initialized");
        return;
      }

      const user = auth.currentUser;

      if (!user) {
        setError("User not authenticated");
        return;
      }

      const docRef = doc(db, "journal_entries", `${user.uid}_${date}`);
      await setDoc(docRef, {
        userId: user.uid,
        date,
        prompt,
        entry,
        createdAt: new Date().toISOString(),
      });

      if (onSave) {
        onSave();
      }
    } catch (error) {
      console.error("Error saving journal entry:", error);
      setError(
        error instanceof Error ? error.message : "Failed to save journal entry"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-800">Journal Entry</h3>
      {error && (
        <div className="text-red-500 text-sm bg-red-50 p-2 rounded">
          {error}
        </div>
      )}
      <textarea
        value={entry}
        onChange={(e) => setEntry(e.target.value)}
        placeholder="Write your reflections here..."
        className="input-field min-h-[200px] resize-y"
      />
      <div className="flex justify-between items-center">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Entry"}
        </button>
      </div>
    </div>
  );
}
