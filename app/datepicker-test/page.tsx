"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";

export default function DatePickerTestPage() {
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAvailableDates() {
      try {
        console.log("Starting to fetch available dates");
        setLoading(true);
        setError(null);

        // Fetch directly from the API endpoint
        const response = await fetch("/api/devotions/available-dates", {
          credentials: "include",
        });

        console.log("API response status:", response.status);

        if (!response.ok) {
          throw new Error(
            `Failed to fetch available dates: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();
        console.log("Available dates data:", data);

        if (Array.isArray(data.dates)) {
          setAvailableDates(data.dates);
        } else {
          console.error("Unexpected data format:", data);
          setError("Unexpected data format received from server");
        }
      } catch (error) {
        console.error("Error fetching available dates:", error);
        setError(
          error instanceof Error ? error.message : "Unknown error occurred"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchAvailableDates();
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">DatePicker Test Page</h1>

      <div className="p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Available Dates</h2>

        {loading && <p className="text-blue-500">Loading available dates...</p>}

        {error && (
          <div className="p-4 bg-red-100 text-red-800 rounded-lg mb-4">
            <h3 className="font-medium mb-1">Error:</h3>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && (
          <>
            <p className="mb-4">
              Found {availableDates.length} available dates:
            </p>

            {availableDates.length > 0 ? (
              <div className="max-h-60 overflow-y-auto p-4 bg-gray-100 rounded grid grid-cols-3 gap-2">
                {availableDates.map((date) => (
                  <div key={date} className="p-2 bg-white rounded shadow">
                    {date}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-orange-500">No available dates found.</p>
            )}
          </>
        )}
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Network Status</h2>
        <button
          onClick={() => {
            fetch("/api/test-connection")
              .then((res) => res.json())
              .then((data) => {
                console.log("Connection test result:", data);
                alert(JSON.stringify(data, null, 2));
              })
              .catch((err) => {
                console.error("Connection test error:", err);
                alert(`Error: ${err.message}`);
              });
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Test API Connection
        </button>
      </div>
    </div>
  );
}
