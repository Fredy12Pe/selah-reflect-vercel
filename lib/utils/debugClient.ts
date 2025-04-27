/**
 * Debug Client
 * 
 * A simple fetch wrapper that adds diagnostic information.
 * This helps identify network issues with the application.
 */

import { isDebugMode } from './environment';

interface DebugRequestOptions extends RequestInit {
  timeout?: number;
}

/**
 * Debug fetch client - logs requests and adds diagnostic information
 */
export async function debugFetch(url: string, options: DebugRequestOptions = {}) {
  // Start timer
  const startTime = performance.now();
  
  // Log request if in debug mode
  if (isDebugMode()) {
    console.log(`[Debug] Fetching: ${url}`, {
      method: options.method || 'GET',
      headers: options.headers,
      body: options.body ? '(body present)' : undefined,
    });
  }
  
  try {
    // Set up timeout if provided
    const { timeout = 30000, ...fetchOptions } = options;
    
    // Create an AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    // Make the request with timeout
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    
    // Clear timeout
    clearTimeout(timeoutId);
    
    // Calculate time taken
    const timeTaken = performance.now() - startTime;
    
    // Log response if in debug mode
    if (isDebugMode()) {
      console.log(`[Debug] Response from ${url}:`, {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        timeTaken: `${timeTaken.toFixed(2)}ms`,
      });
    }
    
    return response;
  } catch (error: any) {
    // Calculate time taken
    const timeTaken = performance.now() - startTime;
    
    // Add diagnostics to the error
    if (error.name === 'AbortError') {
      console.error(`[Debug] Request to ${url} timed out after ${timeTaken.toFixed(2)}ms`);
    } else {
      console.error(`[Debug] Error fetching ${url}:`, error, `(${timeTaken.toFixed(2)}ms)`);
    }
    
    // Rethrow with additional info
    throw error;
  }
}

/**
 * Log network connectivity status and changes
 */
export function monitorNetworkStatus() {
  if (typeof window === 'undefined') return;
  
  // Log initial status
  console.log(`[Debug] Network status: ${navigator.onLine ? 'online' : 'offline'}`);
  
  // Set up listeners
  window.addEventListener('online', () => {
    console.log('[Debug] Network status changed: online');
  });
  
  window.addEventListener('offline', () => {
    console.log('[Debug] Network status changed: offline');
  });
} 