"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { getFirebaseDb } from "@/lib/firebase/firebase";
import { doc, setDoc } from "firebase/firestore";
import { toast, Toaster } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { safeDoc, safeSetDoc } from "@/lib/utils/firebase-helpers";

interface MonthData {
  month: string;
  hymn: {
    title: string;
    lyrics: string[];
    author?: string;
  };
  devotions: DevotionData[];
}

interface DevotionData {
  date: string;
  bibleText: string;
  reflectionSections: {
    passage: string;
    questions: string[];
  }[];
}

interface TransformedDevotion {
  date: string;
  title: string;
  scriptureReference: string;
  scriptureText: string;
  content: string;
  prayer: string;
  reflectionQuestions: string[];
}

export default function BulkUploadDevotions() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [jsonData, setJsonData] = useState<string>("");
  const ADMIN_EMAILS = ["fredypedro3@gmail.com"];

  useEffect(() => {
    console.log("Auth state:", { user, loading });
  }, [user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push("/auth/login?from=/admin/devotions/upload");
    return null;
  }

  if (!ADMIN_EMAILS.includes(user.email || "")) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p>You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = event.target?.result as string;
          // Validate JSON format
          const parsedData = JSON.parse(data);
          if (typeof parsedData !== "object") {
            toast.error("Invalid JSON format");
            return;
          }
          setJsonData(data);
        } catch (error) {
          console.error("Error parsing JSON:", error);
          toast.error("Invalid JSON format");
        }
      };
      reader.readAsText(file);
    }
  };

  const transformDevotion = (devotion: DevotionData): TransformedDevotion => {
    try {
      // Extract date in YYYY-MM-DD format
      const dateParts = devotion.date.split(", ");
      if (dateParts.length < 2) {
        console.error("Invalid date format:", devotion.date);
        throw new Error(`Invalid date format: ${devotion.date}`);
      }

      const monthDay = dateParts[1].split(" ");
      if (monthDay.length < 2) {
        console.error("Invalid month/day format:", dateParts[1]);
        throw new Error(`Invalid month/day format: ${dateParts[1]}`);
      }

      const month = monthDay[0];
      const day = monthDay[1];
      const year = new Date().getFullYear();
      const formattedDate = `${year}-${getMonthNumber(month)}-${day.padStart(
        2,
        "0"
      )}`;

      // Combine all questions into one array
      const allQuestions = devotion.reflectionSections.flatMap((section) => {
        if (!Array.isArray(section.questions)) {
          console.warn("Invalid questions format in section:", section);
          return [];
        }
        return section.questions;
      });

      return {
        date: formattedDate,
        title: `${devotion.bibleText} - ${devotion.date}`,
        scriptureReference: devotion.bibleText,
        scriptureText: "", // You might want to fetch this from an API
        content: `Reflection on ${devotion.bibleText}`,
        prayer: "Prayer for understanding and application",
        reflectionQuestions: allQuestions,
      };
    } catch (error) {
      console.error("Error transforming devotion:", error);
      console.error("Devotion data:", devotion);
      throw error;
    }
  };

  const getMonthNumber = (month: string): string => {
    const months: { [key: string]: string } = {
      January: "01",
      February: "02",
      March: "03",
      April: "04",
      May: "05",
      June: "06",
      July: "07",
      August: "08",
      September: "09",
      October: "10",
      November: "11",
      December: "12",
    };
    return months[month] || "01";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jsonData) {
      toast.error("Please upload a JSON file first");
      return;
    }

    try {
      setUploading(true);
      const parsedData = JSON.parse(jsonData);
      const db = getFirebaseDb();
      let successCount = 0;
      let errorCount = 0;

      // Process each month
      for (const [month, monthData] of Object.entries(parsedData)) {
        try {
          const data = monthData as MonthData;
          console.log(`Processing month: ${month}`);

          // Save hymn data
          try {
            console.log(`Saving hymn for ${data.month}`);
            const hymnRef = safeDoc("hymns", data.month.toLowerCase());
            await safeSetDoc(hymnRef, {
              title: data.hymn.title,
              lyrics: data.hymn.lyrics,
              author: data.hymn.author,
              updatedAt: new Date().toISOString(),
            });
            successCount++;
            console.log(`Successfully saved hymn for ${data.month}`);
          } catch (error) {
            console.error(`Error saving hymn for ${data.month}:`, error);
            errorCount++;
          }

          // Process and save each devotion
          for (const devotion of data.devotions) {
            try {
              console.log(`Processing devotion for date: ${devotion.date}`);
              const transformedDevotion = transformDevotion(devotion);
              const devotionRef = safeDoc(
                "devotions",
                transformedDevotion.date
              );
              await safeSetDoc(devotionRef, {
                ...transformedDevotion,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: user.email,
              });
              successCount++;
              console.log(
                `Successfully saved devotion for ${transformedDevotion.date}`
              );
            } catch (error) {
              console.error(
                `Error saving devotion for date ${devotion.date}:`,
                error
              );
              console.error("Devotion data:", devotion);
              errorCount++;
            }
          }
        } catch (error) {
          console.error(`Error processing month ${month}:`, error);
          console.error("Month data:", monthData);
          errorCount++;
        }
      }

      toast.success(
        `Upload complete! ${successCount} items uploaded successfully. ${errorCount} errors occurred.`
      );
      setJsonData("");
    } catch (error) {
      console.error("Error processing JSON:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to process JSON file. Please check the format."
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <Toaster position="top-center" />
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Bulk Upload Devotions</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Upload JSON File
            </label>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="w-full px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-700"
              required
            />
            <p className="mt-2 text-sm text-zinc-400">
              Upload a JSON file containing devotion data organized by month.
              The file should include hymns and devotions for each month.
            </p>
          </div>

          {jsonData && (
            <div>
              <label className="block text-sm font-medium mb-2">
                JSON Preview
              </label>
              <pre className="w-full p-4 rounded-lg bg-zinc-900 border border-zinc-700 overflow-auto max-h-96">
                {jsonData}
              </pre>
            </div>
          )}

          <button
            type="submit"
            disabled={uploading || !jsonData}
            className="w-full bg-white text-black rounded-full py-4 px-6 font-medium hover:bg-white/90 transition-colors disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Upload Devotions"}
          </button>
        </form>
      </div>
    </div>
  );
}
