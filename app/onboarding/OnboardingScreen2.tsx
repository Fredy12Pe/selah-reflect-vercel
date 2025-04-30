import Image from "next/image";

interface OnboardingScreen2Props {
  onNext: () => void;
}

export default function OnboardingScreen2({ onNext }: OnboardingScreen2Props) {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between p-8">
      <div className="flex-grow flex flex-col justify-center items-center text-center">
        <h1 className="text-4xl font-bold mb-10">Daily Scripture<br />& Reflection</h1>
        
        <div className="flex flex-col space-y-12 max-w-lg mt-10">
          <div className="flex flex-col items-center">
            <p className="text-lg">Read today's verse</p>
          </div>
          
          <div className="flex flex-col items-center">
            <p className="text-lg">Reflect with guided questions</p>
          </div>
          
          <div className="flex flex-col items-center">
            <p className="text-lg">Explore resources tied to today's Word</p>
          </div>
          
          <div className="flex flex-col items-center">
            <p className="text-lg">Ask AI for deeper insight</p>
          </div>
        </div>
      </div>
      
      <div className="mt-10">
        <button 
          onClick={onNext}
          className="w-full p-4 rounded-full bg-gradient-to-r from-green-300/20 to-blue-300/20 backdrop-blur-sm text-white flex items-center justify-center"
        >
          Next
        </button>
      </div>
    </div>
  );
} 