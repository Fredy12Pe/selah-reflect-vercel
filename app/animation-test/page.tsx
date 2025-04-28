'use client';

import { useState } from 'react';

export default function AnimationTestPage() {
  const [showModal, setShowModal] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const openModal = () => {
    setShowModal(true);
    setIsClosing(false);
  };

  const closeModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShowModal(false);
      setIsClosing(false);
    }, 300); // Match animation duration
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-8">Animation Test Page</h1>
      
      <div className="space-y-4">
        <button 
          onClick={openModal}
          className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          Open Modal
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className={`fixed inset-0 bg-black/50 ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`}
            onClick={closeModal}
          />
          <div className={`relative w-full max-w-lg mx-4 bg-zinc-900 rounded-lg shadow-xl ${isClosing ? 'animate-slide-down' : 'animate-slide-up'}`}>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Test Modal</h2>
              <p className="mb-4">This modal should animate in and out smoothly.</p>
              
              <div className="flex justify-end">
                <button 
                  onClick={closeModal}
                  className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Animation Classes</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="animate-fade-in bg-zinc-800 p-4 rounded-lg">animate-fade-in</div>
          <div className="animate-slide-up bg-zinc-800 p-4 rounded-lg">animate-slide-up</div>
        </div>
      </div>
    </div>
  );
} 