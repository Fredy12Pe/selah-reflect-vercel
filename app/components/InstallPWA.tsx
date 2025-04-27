"use client";

import { useState, useEffect } from "react";

export default function InstallPWA() {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    // Check if the device is iOS
    const isIOSDevice =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Listen for the beforeinstallprompt event (triggered on non-iOS devices)
    window.addEventListener("beforeinstallprompt", (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      // Show the install button
      setShowInstallPrompt(true);
    });

    // Check if the app is already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setShowInstallPrompt(false);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", () => {});
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowInstructions(true);
      return;
    }

    if (!deferredPrompt) {
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    // We no longer need the prompt. Clear it up
    setDeferredPrompt(null);
    setShowInstallPrompt(false);

    console.log(`User ${outcome} the A2HS prompt`);
  };

  if (!showInstallPrompt && !showInstructions) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-900 text-white z-50">
      {showInstructions ? (
        <div>
          <h3 className="text-lg font-bold mb-2">
            Install Selah on your Home Screen
          </h3>
          <p className="mb-2">For iOS:</p>
          <ol className="list-decimal pl-5 mb-4">
            <li>
              Tap the share icon{" "}
              <span className="inline-block border border-white px-1 rounded">
                ↑
              </span>{" "}
              at the bottom of the screen
            </li>
            <li>Scroll and tap "Add to Home Screen"</li>
            <li>Tap "Add" in the top right</li>
          </ol>
          <div className="flex justify-between">
            <button
              onClick={() => setShowInstructions(false)}
              className="px-4 py-2 bg-gray-700 rounded"
            >
              Close
            </button>
          </div>
        </div>
      ) : (
        <div className="flex justify-between items-center">
          <p>Install Selah on your device for easy access</p>
          <button
            onClick={handleInstallClick}
            className="px-4 py-2 bg-blue-600 rounded"
          >
            Install
          </button>
        </div>
      )}
    </div>
  );
}
