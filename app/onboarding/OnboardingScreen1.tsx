import Image from "next/image";

interface OnboardingScreen1Props {
  onNext: () => void;
}

export default function OnboardingScreen1({ onNext }: OnboardingScreen1Props) {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between p-8">
      <div className="flex-grow flex flex-col justify-center items-center text-center">
        <h1 className="text-4xl font-bold mb-10">Welcome to<br />Selah</h1>
        
        <div className="my-10">
          <div className="h-48 w-48 rounded-[32px] overflow-hidden bg-black flex items-center justify-center">
            <Image 
              src="/Selah-logo.png" 
              alt="Selah Logo" 
              width={200} 
              height={200}
              className="object-contain rounded-[28px]"
            />
          </div>
        </div>
        
        <p className="text-lg max-w-md">
          A space to pause, reflect, and draw closer to God - One day at a time.
        </p>
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