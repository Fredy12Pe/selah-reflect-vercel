import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Get all Firebase-related environment variables
    const envVars = Object.keys(process.env)
      .filter(key => key.includes('FIREBASE'))
      .reduce((obj, key) => {
        // Redact sensitive information but show the key exists
        if (key.includes('KEY') || key.includes('SECRET')) {
          obj[key] = '[REDACTED]';
        } else if (key.includes('EMAIL')) {
          // For email, show the first few characters to verify it's correct
          const email = process.env[key];
          obj[key] = email ? `${email.substring(0, 10)}...` : null;
        } else {
          obj[key] = process.env[key];
        }
        return obj;
      }, {});

    // Check specific variables we're having trouble with
    const results = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      firebaseVariables: envVars,
      specificChecks: {
        FIREBASE_CLIENT_EMAIL: {
          exists: !!process.env.FIREBASE_CLIENT_EMAIL,
          sample: process.env.FIREBASE_CLIENT_EMAIL 
            ? `${process.env.FIREBASE_CLIENT_EMAIL.substring(0, 10)}...` 
            : null,
        },
        FIREBASE_ADMIN_CLIENT_EMAIL: {
          exists: !!process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          sample: process.env.FIREBASE_ADMIN_CLIENT_EMAIL 
            ? `${process.env.FIREBASE_ADMIN_CLIENT_EMAIL.substring(0, 10)}...` 
            : null,
        },
        FIREBASE_PROJECT_ID: {
          exists: !!process.env.FIREBASE_PROJECT_ID,
          value: process.env.FIREBASE_PROJECT_ID,
        },
        FIREBASE_PRIVATE_KEY: {
          exists: !!process.env.FIREBASE_PRIVATE_KEY,
          length: process.env.FIREBASE_PRIVATE_KEY?.length,
          startsWith: process.env.FIREBASE_PRIVATE_KEY?.substring(0, 27),
        }
      }
    };

    return NextResponse.json(results);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Error checking environment variables', message: error.message },
      { status: 500 }
    );
  }
} 