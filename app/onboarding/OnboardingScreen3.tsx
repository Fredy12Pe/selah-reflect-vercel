import Image from "next/image";

interface OnboardingScreen3Props {
  onComplete: () => void;
}

export default function OnboardingScreen3({ onComplete }: OnboardingScreen3Props) {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between p-8">
      <div className="flex-grow flex flex-col justify-center items-center text-center">
        <h1 className="text-4xl font-bold mb-6">Make Selah<br />Easy to Access</h1>
        
        <div className="mt-8 max-w-md">
          <p className="text-lg mb-10">
            Bring Selah closer with just a tap. Here's how to add Selah to your phone's home screen:
          </p>
          
          <div className="text-left mt-8 space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-4">For iPhone (Safari)</h2>
              <ol className="list-decimal list-inside space-y-4">
                <li className="text-base">Open Selah in Safari.</li>
                <li className="text-base">Tap the Share button (the square with the arrow).</li>
                <li className="text-base">Scroll down and tap Add to Home Screen.</li>
                <li className="text-base">Tap Add — and you're done!</li>
              </ol>
            </div>
            
            <div className="mt-10">
              <h2 className="text-xl font-bold mb-4">For Android (Chrome)</h2>
              <ol className="list-decimal list-inside space-y-4">
                <li className="text-base">Open Selah in Chrome.</li>
                <li className="text-base">Tap the Menu button (three dots at the top right).</li>
                <li className="text-base">Tap Add to Home Screen.</li>
                <li className="text-base">Tap Add — and Selah will appear on your home screen!</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-10">
        <button 
          onClick={onComplete}
          className="w-full p-4 rounded-full bg-gradient-to-r from-green-300/20 to-blue-300/20 backdrop-blur-sm text-white flex items-center justify-center"
        >
          Let's Begin
        </button>
      </div>
    </div>
  );
} 