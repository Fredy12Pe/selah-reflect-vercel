# Vercel Deployment Guide

## Prerequisites

- A [Vercel account](https://vercel.com/signup)
- [Git](https://git-scm.com/downloads) installed
- This project repository

## Deployment Steps

### Option 1: Deploy from GitHub

1. Push your code to a GitHub repository
2. Log in to your Vercel account
3. Click "Add New" > "Project"
4. Import your GitHub repository
5. Configure the project:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: next build
   - Output Directory: .next
6. Add environment variables from your `.env.local` file to Vercel's Environment Variables section
7. Click "Deploy"

### Option 2: Deploy using Vercel CLI

1. Install Vercel CLI:
   ```
   npm install -g vercel
   ```
2. Login to Vercel:
   ```
   vercel login
   ```
3. Navigate to your project directory
4. Deploy:
   ```
   vercel
   ```
5. Follow the prompts to configure your project

### Environment Variables

Make sure to add all environment variables from your `.env.local` file to Vercel:

- Firebase credentials
- API keys
- Other configuration values

### Post-Deployment

- Test your application thoroughly
- Set up custom domains if needed
- Configure analytics and monitoring

## Troubleshooting

- If you encounter build errors, check the Vercel build logs
- Ensure all dependencies are correctly specified in package.json
- Verify environment variables are correctly set in Vercel dashboard
