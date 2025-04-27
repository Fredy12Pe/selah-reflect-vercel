# Setting Up Firebase Admin Credentials in Vercel

We need to add the Firebase Admin credentials to your Vercel project settings to allow server-side authentication and Firestore access.

## Required Environment Variables

The test diagnosis shows that the Firebase service account credentials are missing from your Vercel project. Specifically, we need to add:

- `FIREBASE_CLIENT_EMAIL` - This is missing from your deployment
- `FIREBASE_PROJECT_ID` - This appears to be set already
- `FIREBASE_PRIVATE_KEY` - This appears to be set already

## Steps to Add Environment Variables

1. Log in to your [Vercel dashboard](https://vercel.com/dashboard)
2. Click on your "Selah-Reflect-Vercel" project
3. Go to the "Settings" tab
4. Select "Environment Variables" from the left menu

### Adding the Missing Variables

5. For each missing credential, add a new environment variable:

   - **Name**: `FIREBASE_CLIENT_EMAIL`
   - **Value**: This is the service account email from your Firebase Admin SDK credentials JSON file (looks like `firebase-adminsdk-xxxx@your-project.iam.gserviceaccount.com`)
   - **Environment**: Select all environments (Production, Preview, Development)

6. Click "Save" to store the environment variable

## Finding Your Firebase Admin Credentials

If you don't have your Firebase Admin credentials handy, you can get them from the Firebase Console:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings (gear icon) > Service accounts
4. Click "Generate new private key"
5. This will download a JSON file containing all the credentials needed

The JSON file will have fields like:

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxx@your-project.iam.gserviceaccount.com",
  "client_id": "client-id",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk..."
}
```

## After Adding the Credentials

After adding the environment variables, you need to redeploy your application for the changes to take effect:

1. Go back to the "Deployments" tab
2. Find your latest deployment
3. Click the three dots (⋮) beside it and select "Redeploy"

## Troubleshooting

If you still encounter issues after setting up the environment variables:

1. Check the Vercel logs for more detailed error messages
2. Verify that the values are correctly copied from your Firebase credentials (no extra spaces, etc.)
3. Make sure you've redeployed the application after adding the variables
4. Visit `/api/devotions/test-connection` on your deployed site to check the connection status

## Notes on Private Key Format

If your private key contains newlines (represented as `\n` in the JSON file), make sure these are preserved when adding to Vercel. You have two options:

1. Add the key as-is with the `\n` characters (most common)
2. Replace `\n` with actual newlines in a multi-line input (less common)

Vercel will handle both formats correctly.
