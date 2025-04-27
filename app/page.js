"use client";

import React, { useEffect, useState } from "react";

export default function HomePage() {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set a timeout to stop loading after 5 seconds regardless of state
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 5000);

    try {
      // Try to detect if we're running in a browser with Firebase available
      if (typeof window !== 'undefined') {
        if (typeof window.firebase === 'undefined') {
          console.warn('[Home Page] Firebase not available');
          setError('Firebase is not available. Please refresh or check the console for errors.');
        } else {
          console.log('[Home Page] App initialized successfully');
        }
      }
    } catch (err) {
      console.error('[Home Page] Error during initialization:', err);
      setError(err.message || 'An unknown error occurred');
    } finally {
      // Always set loading to false after checks
      setIsLoading(false);
    }

    return () => clearTimeout(timeout);
  }, []);

  if (isLoading) {
    return React.createElement(
      'div', 
      { className: "min-h-screen flex items-center justify-center bg-gray-900" },
      React.createElement(
        'div',
        { className: "text-center" },
        [
          React.createElement('div', { 
            key: 'spinner',
            className: "animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto" 
          }),
          React.createElement('p', { 
            key: 'text',
            className: "mt-4 text-white" 
          }, "Loading Selah...")
        ]
      )
    );
  }

  if (error) {
    return React.createElement(
      'div',
      { className: "min-h-screen flex items-center justify-center bg-gray-900" },
      React.createElement(
        'div',
        { className: "max-w-md p-6 bg-gray-800 rounded-lg shadow-lg" },
        [
          React.createElement('h1', { 
            key: 'title',
            className: "text-2xl font-bold text-white mb-4" 
          }, "Selah"),
          React.createElement(
            'div', 
            { 
              key: 'error',
              className: "bg-red-900 text-white p-4 rounded mb-4" 
            },
            React.createElement('p', {}, "Error: " + error)
          ),
          React.createElement(
            'div',
            { 
              key: 'buttons',
              className: "flex flex-wrap gap-2 justify-center" 
            },
            [
              React.createElement(
                'button',
                { 
                  key: 'reload',
                  onClick: () => window.location.reload(),
                  className: "px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                },
                "Reload Page"
              ),
              React.createElement(
                'button',
                { 
                  key: 'fallback',
                  onClick: () => { window.location.href = '/fallback.html'; },
                  className: "px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                },
                "Go to Fallback Page"
              )
            ]
          )
        ]
      )
    );
  }

  return React.createElement(
    'div',
    { className: "min-h-screen flex items-center justify-center bg-gray-900" },
    React.createElement(
      'div',
      { className: "max-w-md p-6 bg-gray-800 rounded-lg shadow-lg" },
      [
        React.createElement('h1', { 
          key: 'title',
          className: "text-2xl font-bold text-white mb-4" 
        }, "Selah - Emergency Mode"),
        React.createElement('p', { 
          key: 'desc',
          className: "text-gray-300 mb-4" 
        }, "The application is running in emergency mode. Some features may not be available."),
        React.createElement(
          'p',
          { 
            key: 'debug-link',
            className: "mt-4 text-gray-300" 
          },
          [
            "Visit ",
            React.createElement(
              'a',
              { 
                href: "/firebase-debug.html",
                className: "text-blue-400 hover:underline"
              },
              "Firebase Debug Page"
            ),
            " for more tools."
          ]
        )
      ]
    )
  );
}