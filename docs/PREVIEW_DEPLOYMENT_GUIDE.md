# Preview Deployment Guide

This guide explains how authentication works in Vercel preview deployments for MyBoard.

## Overview

MyBoard uses NextAuth v5 which automatically handles different deployment environments. The recommended approach for preview deployments is to use email authentication.

## Authentication Methods

### 1. Email Authentication (Recommended)

Email authentication is perfect for preview deployments because:
- **No configuration needed**: Works with any dynamic preview URL
- **No OAuth setup**: No callback URLs to register
- **Instant testing**: Anyone can test with their email

#### Setup
```env
AUTH_SECRET=your-secret-here
AUTH_RESEND_KEY=re_xxxxxxxxxxxx
```

### 2. OAuth Providers (Limited)

OAuth providers (Google, GitHub) have limitations in preview deployments:
- Each preview URL is unique (e.g., `myboard-git-feature-xyz.vercel.app`)
- OAuth providers require pre-registered callback URLs
- Not practical to register every preview URL

## Environment Configuration

### Required Settings

1. **In `vercel.json`**:
   ```json
   {
     "buildCommand": "pnpm run build",
     "framework": "nextjs",
     "env": {
       "AUTH_TRUST_HOST": "true"
     }
   }
   ```

2. **In Vercel Dashboard**:
   - Go to Project Settings → Environment Variables
   - Add these variables for Preview environment:
     ```
     AUTH_SECRET        = [generate with: openssl rand -base64 32]
     AUTH_RESEND_KEY    = re_xxxxxxxxxxxx
     DATABASE_URL       = [your database connection string]
     ```

### How It Works

1. **Automatic URL Detection**: NextAuth v5 automatically detects the preview URL
2. **No NEXTAUTH_URL needed**: The framework uses the `VERCEL_URL` environment variable
3. **AUTH_TRUST_HOST**: Ensures NextAuth trusts the proxy headers from Vercel

## Testing Preview Deployments

### Workflow

1. **Push to GitHub**: 
   ```bash
   git push origin feature/your-branch
   ```

2. **Vercel Creates Preview**:
   - Automatic deployment starts
   - Unique URL generated: `myboard-git-branch-name-username.vercel.app`

3. **Test Authentication**:
   - Visit the preview URL
   - Click "Sign in with Email"
   - Enter your email address
   - Check email for magic link
   - Click link to authenticate

### Debugging

If authentication isn't working:

1. **Check Environment Variables**:
   - Ensure `AUTH_SECRET` is set in Vercel
   - Verify `AUTH_RESEND_KEY` is correct
   - Confirm `AUTH_TRUST_HOST=true` in vercel.json

2. **Check Logs**:
   - View Function logs in Vercel dashboard
   - Look for auth-related errors

3. **Common Issues**:
   - Missing `AUTH_SECRET`: Set in Vercel environment variables
   - Email not sending: Verify Resend API key
   - Redirect issues: Ensure `AUTH_TRUST_HOST=true`

## Best Practices

### For Development Teams

1. **Share Test Credentials**:
   - Use a shared Resend API key for preview testing
   - Consider a dedicated test email domain

2. **Environment Separation**:
   - Use different API keys for preview vs production
   - Keep production OAuth credentials separate

3. **Documentation**:
   - Document which auth method to use for testing
   - Include test email addresses if needed

### Security Considerations

1. **Unique AUTH_SECRET**:
   - Use different secrets for preview and production
   - Rotate secrets regularly

2. **API Key Management**:
   - Use Resend test API keys for preview
   - Monitor usage to prevent abuse

3. **Database Isolation**:
   - Consider separate database for preview deployments
   - Or use database branches/schemas

## Migrating to Production

When moving from preview to production:

1. **Update Environment Variables**:
   ```env
   # Production only
   AUTH_SECRET=new-production-secret
   AUTH_RESEND_KEY=production-resend-key
   
   # Optional: Enable OAuth
   GOOGLE_CLIENT_ID=xxx
   GOOGLE_CLIENT_SECRET=xxx
   GITHUB_ID=xxx
   GITHUB_SECRET=xxx
   ```

2. **Configure OAuth Providers**:
   - Register production domain in Google Console
   - Add production callback URLs to GitHub

3. **Update DNS** (if using custom email domain):
   - Configure SPF, DKIM records
   - Verify domain in Resend

## Quick Reference

### Environment Variables Checklist

| Variable | Preview | Production | Description |
|----------|---------|------------|-------------|
| AUTH_SECRET | ✅ Required | ✅ Required | Session encryption key |
| AUTH_RESEND_KEY | ✅ Required | ✅ Required | Email sending API key |
| AUTH_EMAIL_FROM | Optional | Recommended | Custom from address |
| DATABASE_URL | ✅ Required | ✅ Required | Database connection |
| GOOGLE_CLIENT_ID | ❌ Not recommended | ✅ Optional | Google OAuth |
| GOOGLE_CLIENT_SECRET | ❌ Not recommended | ✅ Optional | Google OAuth |
| GITHUB_ID | ❌ Not recommended | ✅ Optional | GitHub OAuth |
| GITHUB_SECRET | ❌ Not recommended | ✅ Optional | GitHub OAuth |

### Vercel Settings

- ✅ Enable "Automatically expose System Environment Variables"
- ✅ Set `AUTH_TRUST_HOST=true` in vercel.json
- ✅ Configure environment variables per environment

## Conclusion

Email authentication provides the best experience for preview deployments in MyBoard. It requires minimal configuration and works seamlessly with Vercel's dynamic preview URLs.