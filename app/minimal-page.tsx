"use client";

import { useEffect, useState } from "react";

export default function MinimalPage() {
  const [status, setStatus] = useState("Loading...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if Firebase was initialized
    if (typeof window !== "undefined") {
      if (window.firebase) {
        setStatus("Firebase loaded successfully");
      } else {
        setStatus("Firebase not initialized");
        setError("Firebase object not found on window");
      }
    }
  }, []);

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: 20,
      }}
    >
      <h1>Selah - Firebase Test</h1>
      <div
        style={{
          padding: 20,
          background: status.includes("success") ? "#1a2e1a" : "#2e1a1a",
          borderRadius: 8,
          marginTop: 20,
          maxWidth: 400,
        }}
      >
        <h2>{status}</h2>
        {error && <p style={{ color: "#ff5555" }}>{error}</p>}
      </div>
      <div style={{ marginTop: 20 }}>
        <a
          href="/firebase-debug.html"
          style={{
            display: "inline-block",
            padding: "10px 20px",
            background: "#333",
            color: "#fff",
            textDecoration: "none",
            borderRadius: 4,
          }}
        >
          Go to Debug Page
        </a>
      </div>
    </div>
  );
}
