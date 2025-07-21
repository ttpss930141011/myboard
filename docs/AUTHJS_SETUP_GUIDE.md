# Auth.js Setup Guide

This guide walks you through setting up Auth.js v5 (NextAuth) for the MyBoard application.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database running
- At least one authentication provider:
  - Resend account (recommended) for email authentication
  - Google and/or GitHub OAuth app credentials (optional)

## Step 1: Environment Setup

Create a `.env` file in your project root with the following variables:

```env
# Database (required)
DATABASE_URL="postgresql://user:password@localhost:5432/myboard"

# Auth.js Configuration (required)
AUTH_SECRET=your-secret-key-here

# Email Provider - Resend (recommended)
AUTH_RESEND_KEY=re_xxxxxxxxxxxx
# Optional: Custom from address (default: noreply@myboard.justinxiao.app)
# AUTH_EMAIL_FROM="MyBoard <noreply@yourdomain.com>"

# OAuth Providers (optional - for social login)
# Google
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# GitHub
GITHUB_ID=your-github-client-id
GITHUB_SECRET=your-github-client-secret
```

### Generating AUTH_SECRET

Generate a secure secret key:

```bash
openssl rand -base64 32
```

## Step 2: Authentication Provider Setup

### Email Authentication (Resend) - Recommended

Email authentication is the simplest and most reliable method, especially for preview deployments.

#### Setting up Resend

1. Sign up for a free account at [Resend](https://resend.com)
2. Navigate to the API Keys section
3. Create a new API key
4. Copy the key (starts with `re_`) to your `.env` file as `AUTH_RESEND_KEY`

#### Custom Domain Setup (Optional)

For production use, you can configure a custom domain:

1. In Resend dashboard, go to "Domains"
2. Add your domain (e.g., `justinxiao.app`)
3. Configure the DNS records as shown:
   ```
   # SPF Record
   TXT  @  "v=spf1 include:amazonses.com ~all"
   
   # DKIM Record (Resend will provide the exact value)
   CNAME  resend._domainkey  [value].dkim.amazonses.com
   ```
4. Once verified, update `AUTH_EMAIL_FROM` in your `.env`:
   ```env
   AUTH_EMAIL_FROM="MyBoard <noreply@yourdomain.com>"
   ```

### OAuth Provider Setup (Optional)

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth client ID"
5. Choose "Web application"
6. Add authorized redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://yourdomain.com/api/auth/callback/google`
7. Copy the Client ID and Client Secret to your `.env` file

### GitHub OAuth Setup

1. Go to GitHub Settings > Developer settings > [OAuth Apps](https://github.com/settings/applications/new)
2. Click "New OAuth App"
3. Fill in the application details:
   - **Application name**: Your app name
   - **Homepage URL**: `http://localhost:3000` (or production URL)
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
4. Click "Register application"
5. Copy the Client ID and generate a new Client Secret
6. Add them to your `.env` file

## Step 3: Database Setup

Auth.js requires specific tables in your database. Run the Prisma migrations:

```bash
# Generate Prisma client
pnpm exec prisma generate

# Run migrations
pnpm exec prisma migrate dev

# (Optional) View database in Prisma Studio
pnpm exec prisma studio
```

## Step 4: Auth.js Configuration Files

The project uses three main configuration files:

### auth.config.ts
Edge-compatible configuration for middleware and Edge runtime:
- OAuth provider configuration
- Custom sign-in and error pages
- JWT callbacks for session management

### auth.ts
Main auth instance with database adapter:
- PrismaAdapter for database integration
- JWT session strategy
- Session callbacks

### auth-edge.ts
Edge runtime instance for middleware:
- Imports Edge-compatible configuration
- Used in middleware.ts for route protection

## Step 5: Testing Authentication

1. Start the development server:
   ```bash
   pnpm run dev
   ```

2. Navigate to http://localhost:3000

3. You should be redirected to the sign-in page

4. Choose your authentication method:
   - **Email**: Enter your email address and click "Sign in with Email"
   - **OAuth**: Click on Google or GitHub to authenticate

5. For email authentication:
   - Check your email for the magic link
   - Click the link to sign in

6. After successful authentication, you'll be redirected to the dashboard

## Step 6: Production Deployment

### Update OAuth Redirect URIs

For production deployment, update your OAuth provider settings:

**Google:**
- Add production redirect URI: `https://yourdomain.com/api/auth/callback/google`

**GitHub:**
- Update the Authorization callback URL to: `https://yourdomain.com/api/auth/callback/github`

### Environment Variables

Update your production environment variables:

```env
# Required
AUTH_SECRET=production-secret-key # Generate a new one for production!

# Email Provider
AUTH_RESEND_KEY=re_xxxxxxxxxxxx # Your production Resend API key
AUTH_EMAIL_FROM="MyBoard <noreply@yourdomain.com>" # Your verified domain

# OAuth Providers (if using)
GOOGLE_CLIENT_ID=your-production-google-id
GOOGLE_CLIENT_SECRET=your-production-google-secret
GITHUB_ID=your-production-github-id
GITHUB_SECRET=your-production-github-secret
```

**Note**: NextAuth v5 automatically detects the URL in Vercel deployments, so you don't need to set `NEXTAUTH_URL` explicitly.

### Database

Ensure your production database is properly configured and migrations are run:

```bash
# Run migrations in production
pnpm exec prisma migrate deploy
```

## Troubleshooting

### Common Issues

1. **"Invalid callback URL"**
   - Ensure the callback URL in your OAuth provider matches exactly
   - Check for trailing slashes
   - Verify protocol (http vs https)

2. **"NEXTAUTH_URL is not set"**
   - Make sure NEXTAUTH_URL is set in your environment
   - For Vercel, add it to your project settings

3. **"Preview deployments not working"**
   - Ensure AUTH_TRUST_HOST=true is set in vercel.json
   - Email authentication works best for preview deployments
   - OAuth requires callback URL registration for each preview URL

4. **Database connection errors**
   - Verify DATABASE_URL is correct
   - Ensure PostgreSQL is running
   - Check network connectivity

5. **OAuth provider errors**
   - Verify Client ID and Secret are correct
   - Check if the OAuth app is enabled
   - Ensure redirect URIs are properly configured

### Debug Mode

Enable debug mode by adding to your `.env`:

```env
NEXTAUTH_DEBUG=true
```

This will log detailed information about the authentication flow.

## Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use different secrets** for development and production
3. **Enable HTTPS** in production
4. **Regularly rotate** your NEXTAUTH_SECRET
5. **Restrict OAuth app** redirect URIs to your domains only
6. **Monitor authentication logs** for suspicious activity

## Advanced Configuration

### Adding More Providers

To add more OAuth providers, update `auth.config.ts`:

```typescript
import TwitterProvider from "next-auth/providers/twitter"

providers: [
  GoogleProvider({...}),
  GitHubProvider({...}),
  TwitterProvider({
    clientId: process.env.TWITTER_ID!,
    clientSecret: process.env.TWITTER_SECRET!,
  })
]
```

### Custom Sign-In Page

The application includes a custom sign-in page at `/auth/signin`. You can customize it by editing `app/auth/signin/page.tsx`.

### Session Management

Sessions are managed using JWT tokens with the following configuration:
- Session duration: 30 days (default)
- Token rotation: Automatic
- Secure cookies: Enabled in production

## API Integration

### Getting Current User

In server components:
```typescript
import { auth } from "@/auth"

const session = await auth()
const user = session?.user
```

In API routes:
```typescript
import { AuthService } from "@/lib/auth-service"

const user = await AuthService.requireAuth()
```

### Protecting Routes

Routes are automatically protected by middleware. Public routes are defined in `lib/constants.ts`:
- `/auth/*` - Authentication pages
- `/api/auth/*` - Auth.js API routes
- `/share/*` - Public board sharing

All other routes require authentication.

## Support

For issues related to:
- **Auth.js**: Check the [official documentation](https://authjs.dev/)
- **OAuth Providers**: Refer to provider-specific documentation
- **This Project**: Open an issue on GitHub

## Related Documentation

- [Migration Guide](./CLERK_TO_AUTHJS_MIGRATION.md) - Complete migration details from Clerk
- [Architecture Changes](./architecture/ARCHITECTURE_CHANGES.md) - Overall architecture transformation
- [Main README](../README.md) - Project overview and quick start

## References

- [Auth.js Documentation](https://authjs.dev/)
- [Edge Compatibility Guide](https://authjs.dev/guides/edge-compatibility)
- [Prisma Adapter](https://authjs.dev/reference/adapter/prisma)
- [OAuth Provider Setup](https://authjs.dev/getting-started/providers/oauth-tutorial)