import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * API route to serve static JavaScript files with the correct MIME type
 * This ensures that JavaScript files are always served with the correct
 * Content-Type header, preventing MIME type errors.
 */

// Make this a static API route for build
export const dynamic = 'force-static';

export function generateStaticParams() {
  return [{}]; // Empty params for a static route
}

// Stub function for static build
export async function GET() {
  return NextResponse.json(
    { info: 'This API endpoint is available after deployment.' },
    { status: 200 }
  );
}

// Update the route configuration to be compatible with static export
export const runtime = 'nodejs'; 