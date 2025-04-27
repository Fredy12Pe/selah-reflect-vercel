import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Get Firebase environment variables
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.FIREBASE_ADMIN_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_ADMIN_PRIVATE_KEY;
    
    // Create safe version of private key for debugging
    const safePrivateKey = privateKey 
      ? {
          length: privateKey.length,
          startsWith: privateKey.substring(0, 15) + '...',
          endsWith: '...' + privateKey.substring(privateKey.length - 15),
          includesBeginMarker: privateKey.includes('-----BEGIN PRIVATE KEY-----'),
          includesEndMarker: privateKey.includes('-----END PRIVATE KEY-----'),
          includesEscapedNewlines: privateKey.includes('\\n'),
          includesActualNewlines: privateKey.includes('\n'),
          includesQuotes: privateKey.startsWith('"') || privateKey.endsWith('"'),
          valueType: typeof privateKey,
        }
      : 'undefined';
      
    return NextResponse.json({
      status: 'success',
      environmentVariables: {
        projectId: projectId ? `${projectId.substring(0, 5)}...` : undefined,
        clientEmail: clientEmail ? `${clientEmail.substring(0, 5)}...@...` : undefined,
        privateKey: safePrivateKey,
      },
      allFirebaseVars: Object.keys(process.env)
        .filter(key => key.includes('FIREBASE'))
        .reduce((obj, key) => {
          obj[key] = key.includes('KEY') ? `[REDACTED - Length: ${process.env[key]?.length || 0}]` : !!process.env[key];
          return obj;
        }, {}),
    });
  } catch (error: any) {
    console.error('Debug API: Error getting environment variables:', error);
    return NextResponse.json(
      { 
        status: 'error',
        message: 'Error getting environment variables',
        error: error.message,
      },
      { status: 500 }
    );
  }
} 