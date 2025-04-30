interface OnboardingScreen3Props {
  onComplete: () => void;
}

export default function OnboardingScreen3({ onComplete }: OnboardingScreen3Props) {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between p-8">
      <div className="flex-grow flex flex-col justify-center items-center text-center">
        <h1 className="text-5xl font-bold mb-10">Daily Scripture<br />& Reflection</h1>
        
        <div className="flex flex-col space-y-12 max-w-lg mt-10">
          <div className="flex flex-col items-center">
            <p className="text-2xl">Read today's verse</p>
          </div>
          
          <div className="flex flex-col items-center">
            <p className="text-2xl">Reflect with guided questions</p>
          </div>
          
          <div className="flex flex-col items-center">
            <p className="text-2xl">Explore resources tied to today's Word</p>
          </div>
          
          <div className="flex flex-col items-center">
            <p className="text-2xl">Ask AI for deeper insight</p>
          </div>
        </div>
      </div>
      
      <div className="mt-10">
        <button 
          onClick={onComplete}
          className="w-full p-4 rounded-full bg-gradient-to-r from-green-300/20 to-blue-300/20 backdrop-blur-sm text-white flex items-center justify-center"
        >
          <span className="mr-2">Next</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>
    </div>
  );
} 