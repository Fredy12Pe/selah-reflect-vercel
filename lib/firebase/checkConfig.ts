import { getApps } from 'firebase/app';
import { firebaseConfig } from './firebase';

// Add type definition for the config
type FirebaseConfig = {
  [key: string]: string | undefined;
  apiKey: string | undefined;
  authDomain: string | undefined;
  projectId: string | undefined;
  storageBucket: string | undefined;
  messagingSenderId: string | undefined;
  appId: string | undefined;
};

export function checkFirebaseConfig() {
  const issues: string[] = [];
  let hasIssues = false;

  // Check if Firebase is already initialized
  const isInitialized = getApps().length > 0;

  // Required config fields
  const requiredFields = [
    'apiKey',
    'authDomain',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId'
  ] as const;

  // Cast firebaseConfig to the correct type
  const config = firebaseConfig as FirebaseConfig;

  // Check for missing required fields
  for (const field of requiredFields) {
    if (!config[field]) {
      issues.push(`Missing required field: ${field}`);
      hasIssues = true;
    }
  }

  // Check API Key format (should be a non-empty string)
  if (typeof config.apiKey !== 'string' || !config.apiKey.trim()) {
    issues.push('Invalid API Key format');
    hasIssues = true;
  }

  // Check Project ID format (should be a non-empty string)
  if (typeof config.projectId !== 'string' || !config.projectId.trim()) {
    issues.push('Invalid Project ID format');
    hasIssues = true;
  }

  // Check Auth Domain format (should be a valid domain)
  if (!config.authDomain?.match(/^[\w-]+\.firebaseapp\.com$/)) {
    issues.push('Invalid Auth Domain format (should end with .firebaseapp.com)');
    hasIssues = true;
  }

  // Check Storage Bucket format (should end with .appspot.com)
  if (!config.storageBucket?.match(/^[\w-]+\.appspot\.com$/)) {
    issues.push('Invalid Storage Bucket format (should end with .appspot.com)');
    hasIssues = true;
  }

  // Check Messaging Sender ID format (should be a numeric string)
  if (!config.messagingSenderId?.match(/^\d+$/)) {
    issues.push('Invalid Messaging Sender ID format (should be numeric)');
    hasIssues = true;
  }

  // Check App ID format (should follow Firebase format)
  if (!config.appId?.match(/^1:\d+:web:[a-f0-9]+$/)) {
    issues.push('Invalid App ID format');
    hasIssues = true;
  }

  // Return the check results
  return {
    hasIssues,
    issues,
    isInitialized,
    config: {
      ...config,
      // Mask sensitive values for display
      apiKey: config.apiKey ? '***' : undefined,
      appId: config.appId ? '***' : undefined,
    }
  };
} 