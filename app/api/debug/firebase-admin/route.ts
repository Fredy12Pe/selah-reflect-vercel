import { NextRequest, NextResponse } from 'next/server';
import { getApps, cert } from 'firebase-admin/app';
import { initAdmin } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.FIREBASE_ADMIN_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_ADMIN_PRIVATE_KEY;
    
    const envStatus = {
      nodeEnv: process.env.NODE_ENV,
      projectId: !!projectId,
      clientEmail: !!clientEmail,
      privateKey: !!privateKey,
      privateKeyLength: privateKey ? privateKey.length : 0,
      privateKeyStart: privateKey ? privateKey.substring(0, 20) + '...' : 'null',
      appsInitialized: getApps().length
    };
    
    // Try to initialize Firebase Admin
    let adminInitialized = false;
    let initError = null;
    try {
      initAdmin();
      adminInitialized = true;
    } catch (error) {
      adminInitialized = false;
      initError = error instanceof Error ? {
        message: error.message,
        stack: error.stack
      } : String(error);
    }
    
    // Return debug information
    return NextResponse.json({
      status: 'success',
      environmentVariables: envStatus,
      adminInitialized,
      initError
    });
  } catch (error) {
    console.error('Debug API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to debug Firebase Admin',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 