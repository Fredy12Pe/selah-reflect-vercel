import Link from "next/link";

interface OnboardingScreen1Props {
  onNext: () => void;
}

export default function OnboardingScreen1({ onNext }: OnboardingScreen1Props) {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between p-8">
      <div className="flex-grow flex flex-col justify-center items-center text-center">
        <h1 className="text-5xl font-bold mb-6">Make Selah<br />Easy to Access</h1>
        
        <div className="mt-8 max-w-md">
          <p className="text-2xl mb-10">
            Bring Selah closer with just a tap. Here's how to add Selah to your phone's home screen:
          </p>
          
          <div className="text-left mt-8 space-y-6">
            <div>
              <h2 className="text-2xl mb-4">For iPhone (Safari)</h2>
              <ol className="list-decimal list-inside space-y-4">
                <li className="text-xl">Open Selah in Safari.</li>
                <li className="text-xl">Tap the Share button (the square with the arrow).</li>
                <li className="text-xl">Scroll down and tap Add to Home Screen.</li>
                <li className="text-xl">Tap Add — and you're done!</li>
              </ol>
            </div>
            
            <div className="mt-10">
              <h2 className="text-2xl mb-4">For Android (Chrome)</h2>
              <ol className="list-decimal list-inside space-y-4">
                <li className="text-xl">Open Selah in Chrome.</li>
                <li className="text-xl">Tap the Menu button (three dots at the top right).</li>
                <li className="text-xl">Tap Add to Home Screen.</li>
                <li className="text-xl">Tap Add — and Selah will appear on your home screen!</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-10">
        <button 
          onClick={onNext}
          className="w-full p-4 rounded-full bg-gradient-to-r from-green-300/20 to-blue-300/20 backdrop-blur-sm text-white flex items-center justify-center"
        >
          <span className="mr-2">Let's Begin</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>
    </div>
  );
} 