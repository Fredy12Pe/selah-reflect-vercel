"use client";

import { useState, useEffect } from "react";

export default function ApiTestPage() {
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [devotion, setDevotion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testDate, setTestDate] = useState("2025-04-21");

  // Test available dates API
  const testAvailableDates = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/devotions/available-dates");

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Available dates response:", data);
      setAvailableDates(data.dates || []);
    } catch (err) {
      console.error("Error testing available dates:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch dates");
    } finally {
      setLoading(false);
    }
  };

  // Test specific devotion API
  const testSpecificDevotion = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/devotions/${testDate}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Devotion response:", data);
      setDevotion(data);
    } catch (err) {
      console.error("Error testing devotion:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch devotion");
    } finally {
      setLoading(false);
    }
  };

  // Test Firebase connection API
  const testConnection = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/test-connection");

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Connection test response:", data);
      alert(JSON.stringify(data, null, 2));
    } catch (err) {
      console.error("Error testing connection:", err);
      setError(
        err instanceof Error ? err.message : "Failed to test connection"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">API Test Page</h1>

      <div className="space-y-8">
        {/* Connection Test */}
        <div className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">
            Test Firebase Connection
          </h2>
          <button
            onClick={testConnection}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Test Connection
          </button>
        </div>

        {/* Available Dates Test */}
        <div className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">
            Test Available Dates API
          </h2>
          <button
            onClick={testAvailableDates}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 mb-4"
          >
            Fetch Available Dates
          </button>

          {availableDates.length > 0 && (
            <div>
              <h3 className="font-medium mb-2">
                Found {availableDates.length} dates:
              </h3>
              <div className="max-h-40 overflow-y-auto p-2 bg-gray-100 rounded">
                {availableDates.slice(0, 10).map((date) => (
                  <div key={date} className="mb-1">
                    {date}
                  </div>
                ))}
                {availableDates.length > 10 && (
                  <div>...and {availableDates.length - 10} more</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Specific Devotion Test */}
        <div className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">
            Test Specific Devotion API
          </h2>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={testDate}
              onChange={(e) => setTestDate(e.target.value)}
              className="px-3 py-2 border rounded flex-grow"
              placeholder="YYYY-MM-DD"
            />
            <button
              onClick={testSpecificDevotion}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Fetch Devotion
            </button>
          </div>

          {devotion && (
            <div>
              <h3 className="font-medium mb-2">Devotion Data:</h3>
              <pre className="max-h-60 overflow-y-auto p-2 bg-gray-100 rounded text-sm">
                {JSON.stringify(devotion, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Status */}
      <div className="mt-6">
        {loading && <p className="text-blue-500">Loading...</p>}
        {error && <p className="text-red-500">Error: {error}</p>}
      </div>
    </div>
  );
}
