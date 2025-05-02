# Selah Reflect Utility Scripts

This directory contains utility scripts for managing and troubleshooting the Selah Reflect app.

## Bible API Tools

### `setup-bible-api.js`

This interactive script helps you configure your ESV Bible API key in the `.env.local` file.

```bash
node scripts/setup-bible-api.js
```

### `diagnose-bible-apis.js`

Comprehensive diagnostic tool that tests both the ESV API and the fallback Bible API.

```bash
node scripts/diagnose-bible-apis.js
```

### `test-esv-api.js`

Tests the ESV Bible API connection using your configured API key.

```bash
node scripts/test-esv-api.js
```

### `test-bible-api.js`

Tests the fallback Bible API (bible-api.com) to ensure it's working correctly.

```bash
node scripts/test-bible-api.js
```

### `reset-cache.js`

Clears the browser's localStorage Bible verse cache to resolve display issues.

```bash
node scripts/reset-cache.js
```

## Getting an ESV API Key

1. Go to https://api.esv.org/
2. Create an account and sign in
3. Create a new API key for your application
4. Copy the API key
5. Run `node scripts/setup-bible-api.js` to configure your key

## Troubleshooting

If you're experiencing issues with Bible verse display:

1. Run the diagnostic tool: `node scripts/diagnose-bible-apis.js`
2. Check that your ESV API key is correctly configured
3. Test your API connections directly in the browser at `/debug/test-bible-api`
4. Clear the Bible verse cache if needed
5. Restart your Next.js server

For more detailed diagnostics, visit `/debug/reset-app` or `/debug/esv-api-setup` in your browser. 