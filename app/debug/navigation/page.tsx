import Link from 'next/link';

export default function DebugNavigationPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Debug Navigation</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DebugLink 
          title="Environment Check" 
          href="/debug/env-check"
          description="Check if environment variables are properly loaded"
        />
        
        <DebugLink 
          title="Environment Setup Instructions" 
          href="/debug/env-instructions"
          description="Instructions for setting up environment variables"
        />
        
        <DebugLink 
          title="Firebase Debug Page" 
          href="/debug"
          description="Test Firebase initialization, authentication, and token handling"
        />
        
        <DebugLink 
          title="Simple Auth Test" 
          href="/debug/simple-auth"
          description="Simplified authentication flow without extra logic"
        />
        
        <DebugLink 
          title="Session Test" 
          href="/debug/session-test"
          description="Verify session cookies are being set and recognized"
        />
        
        <DebugLink 
          title="Original Login" 
          href="/auth/login"
          description="The original authentication page"
        />
        
        <DebugLink 
          title="Application Home" 
          href="/"
          description="The main application home page"
        />
        
        <DebugLink 
          title="Today's Devotion" 
          href="/devotion/today"
          description="Shortcut to today's devotion page"
        />
      </div>
      
      <div className="mt-12 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Troubleshooting Tips</h2>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Use the <strong>Environment Check</strong> to verify environment variables are being loaded properly.</li>
          <li>Use the <strong>Firebase Debug Page</strong> to verify your Firebase configuration is correct.</li>
          <li>Try the <strong>Simple Auth Test</strong> to isolate authentication issues from the rest of the app.</li>
          <li>Check the <strong>Session Test</strong> to verify cookies are working properly.</li>
          <li>Look for errors in the browser console (F12 or Command+Option+I).</li>
          <li>Clear your browser cookies and cache if you're experiencing persistent issues.</li>
          <li>Try using an incognito/private window to eliminate browser extension interference.</li>
        </ol>
      </div>
    </div>
  );
}

function DebugLink({ title, href, description }: { title: string, href: string, description: string }) {
  return (
    <Link 
      href={href}
      className="block p-6 bg-white border border-gray-200 rounded-lg shadow hover:shadow-md transition-shadow"
    >
      <h2 className="text-xl font-semibold mb-2 text-blue-600">{title}</h2>
      <p className="text-gray-600">{description}</p>
    </Link>
  );
} 