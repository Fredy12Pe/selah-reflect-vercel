interface OnboardingScreen2Props {
  onNext: () => void;
}

export default function OnboardingScreen2({ onNext }: OnboardingScreen2Props) {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between p-8">
      <div className="flex-grow flex flex-col justify-center items-center text-center">
        <h1 className="text-5xl font-bold mb-10">Welcome to<br />Selah</h1>
        
        <div className="my-10">
          <div className="h-48 w-48 rounded-3xl overflow-hidden bg-gradient-to-br from-green-200/30 to-blue-200/30 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-24 h-24">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
            </svg>
          </div>
        </div>
        
        <p className="text-2xl max-w-md">
          A space to pause, reflect, and draw closer to God - One day at a time.
        </p>
      </div>
      
      <div className="mt-10">
        <button 
          onClick={onNext}
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