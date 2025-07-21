# Email Authentication Guide

This guide explains how email authentication is implemented in MyBoard using Resend provider. For detailed Resend setup, refer to the [official Auth.js documentation](https://authjs.dev/getting-started/authentication/email).

## Overview

Email authentication using magic links is the recommended authentication method for MyBoard, especially for:
- Development environments
- Preview deployments
- Users who prefer not to use social login
- Simplified authentication flow

## Why Email Authentication?

### Advantages
- **No OAuth configuration needed**: Works immediately without complex setup
- **Preview deployment friendly**: No callback URL registration required
- **Better privacy**: Users don't need to connect social accounts
- **Universal**: Everyone has an email address
- **Secure**: Magic links expire after 24 hours

### How It Works
1. User enters their email address
2. System sends a magic link to their email
3. User clicks the link to sign in
4. Session is created and user is authenticated

## Environment Variables

### Required Variables

#### `AUTH_RESEND_KEY`
- **Description**: Your Resend API key for sending emails
- **Format**: `re_xxxxxxxxxxxx` (starts with `re_`)
- **How to get**: Sign up at [Resend](https://resend.com) and create an API key
- **Example**: 
  ```env
  AUTH_RESEND_KEY=re_123abc456def789ghi
  ```

### Optional Variables

#### `AUTH_EMAIL_FROM`
- **Description**: The email address that sends authentication emails
- **Default**: `"MyBoard <onboarding@resend.dev>"` (if not using custom domain)
- **Custom domain**: `"MyBoard <noreply@yourdomain.com>"`
- **Format**: `"Display Name <email@domain.com>"`
- **Example**:
  ```env
  AUTH_EMAIL_FROM="MyBoard <noreply@myboard.justinxiao.app>"
  ```

## Quick Setup

1. Get your Resend API key from [Resend Dashboard](https://resend.com)
2. Add to `.env`:
   ```env
   AUTH_RESEND_KEY=re_your_api_key_here
   ```
3. (Optional) For custom domain, add:
   ```env
   AUTH_EMAIL_FROM="MyBoard <noreply@yourdomain.com>"
   ```

## Usage in Different Environments

### Local Development
```env
AUTH_RESEND_KEY=re_test_key
# Uses default: onboarding@resend.dev
```

### Preview Deployments
```env
AUTH_RESEND_KEY=re_test_key
# Works automatically with any preview URL
```

### Production
```env
AUTH_RESEND_KEY=re_production_key
AUTH_EMAIL_FROM="MyBoard <noreply@myboard.com>"
```

## Implementation in MyBoard

### Configuration

In `auth.config.ts`:
```typescript
import Resend from "next-auth/providers/resend"

export default {
  providers: [
    Resend({
      from: process.env.AUTH_EMAIL_FROM || "MyBoard <onboarding@resend.dev>"
    }),
    // Other providers...
  ]
}
```

### How It Works
1. User enters email on sign-in page
2. Auth.js generates a verification token
3. Resend sends magic link to user's email
4. User clicks link and gets authenticated
5. Session is created with JWT strategy

## Common Issues

### Preview Deployments
Email authentication works perfectly for preview deployments because:
- No callback URL registration needed
- Each preview gets a unique URL automatically
- Users can test with any email address

### Troubleshooting
- **Email not sending**: Check `AUTH_RESEND_KEY` in environment variables
- **Going to spam**: Use a verified custom domain
- **Rate limits**: Free tier allows 100 emails/day

For detailed troubleshooting, see [Auth.js Email Provider docs](https://authjs.dev/getting-started/authentication/email)

## Key Benefits for MyBoard

### Perfect for Preview Deployments
- No OAuth callback URL configuration
- Works with dynamic Vercel preview URLs
- Each developer can test independently

### User Experience
- Simple one-step authentication
- No password to remember
- Works on all devices
- Secure 24-hour magic links

### Developer Experience
- Minimal configuration
- Works alongside OAuth providers
- Same email can use multiple auth methods

## Additional Resources

- [Auth.js Email Provider Documentation](https://authjs.dev/getting-started/authentication/email)
- [Resend Documentation](https://resend.com/docs)
- [MyBoard GitHub Issues](https://github.com/ttpss930141011/myboard/issues)