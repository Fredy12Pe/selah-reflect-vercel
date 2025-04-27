// This file provides the generateStaticParams function for the journal page
// It's separated from the main page.tsx because that file uses 'use client'

export function generateStaticParams() {
  // Return a placeholder to make the static export work
  // For client-side pages that require dynamic data, this is just to satisfy the build process
  return [
    { date: 'placeholder' },
  ]
} 