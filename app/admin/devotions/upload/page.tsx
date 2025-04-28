"use client";

import { useState } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { toast, Toaster } from "react-hot-toast";
import { useRouter } from "next/navigation";

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

const ADMIN_EMAILS = ["fredy12pe@gmail.com", "fredypedro3@gmail.com"];

export default function BulkUploadDevotions() {
  const [jsonData, setJsonData] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();

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
          // Parse and validate JSON format
          const parsedData = JSON.parse(data);
          
          // Convert object format to array format if needed
          let monthsArray: MonthData[];
          if (Array.isArray(parsedData)) {
            monthsArray = parsedData;
          } else {
            // Convert object format to array
            monthsArray = Object.values(parsedData);
          }

          // Validate each month's structure
          const isValid = monthsArray.every((month: MonthData) => {
            return (
              month.month &&
              month.hymn &&
              month.hymn.title &&
              Array.isArray(month.hymn.lyrics) &&
              Array.isArray(month.devotions)
            );
          });

          if (!isValid) {
            toast.error("Invalid data structure in JSON");
            return;
          }

          // Store as stringified array
          setJsonData(JSON.stringify(monthsArray));
          toast.success("JSON file validated successfully");
        } catch (error) {
          console.error("Error parsing JSON:", error);
          toast.error("Invalid JSON format");
        }
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jsonData) {
      toast.error("Please upload a JSON file first");
      return;
    }

    try {
      setUploading(true);
      const response = await fetch('/api/admin/upload-json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload data');
      }

      const result = await response.json();
      toast.success('Data uploaded successfully!');
      console.log('Upload result:', result);
      
    } catch (error) {
      console.error('Error uploading data:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload data');
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
