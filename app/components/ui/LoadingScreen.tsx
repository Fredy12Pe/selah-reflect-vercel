import React from 'react';

export default function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-8">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-r-2 border-white"></div>
      <p className="mt-4 text-white/80 text-lg">Loading...</p>
    </div>
  );
} 