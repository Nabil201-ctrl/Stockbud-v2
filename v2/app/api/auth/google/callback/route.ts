import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import jwt from 'jsonwebtoken';
import connectDB from '../../../../../lib/mongodb';
import User from '../../../../../models/User';

// OAuth2 callback handler. Exchanges code for tokens and prints the refresh token to server console.
// Make sure GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and GOOGLE_REDIRECT_URI match the values used
// to generate the auth URL and are registered in the Google Cloud Console.

export async function GET(request: NextRequest) {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'https://developers.google.com/oauthplayground';

    if (!clientId || !clientSecret) {
      return NextResponse.json({ error: 'Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET' }, { status: 500 });
    }

  const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');
  const state = url.searchParams.get('state') || undefined;

    if (error) {
      console.error('Google OAuth error:', error);
      return new NextResponse(`<h1>Google OAuth Error</h1><p>${error}</p>`, { status: 400, headers: { 'Content-Type': 'text/html' } });
    }

    if (!code) {
      return new NextResponse('<h1>No code returned</h1>', { status: 400, headers: { 'Content-Type': 'text/html' } });
    }

    const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    const { tokens } = await oAuth2Client.getToken(code);

    // If we received a refresh token, associate it with the user passed via state (if present)
    if (tokens.refresh_token && state) {
      try {
        // state contains base64-encoded JWT from the frontend (see authorize route)
        const decodedToken = Buffer.from(state, 'base64').toString('utf-8');
        const payload = jwt.verify(decodedToken, process.env.JWT_SECRET as string) as { id?: string; email?: string };

        await connectDB();

        // Prefer finding the user by id, fall back to email
        const query: any = {};
        if (payload.id) query._id = payload.id;
        else if (payload.email) query.email = payload.email;

        const user = await User.findOne(query);
        if (user) {
          user.gmailRefreshToken = tokens.refresh_token;
          await user.save();
          console.log(`Saved Gmail refresh token for user ${user.email}`);
        } else {
          console.warn('Could not find user to attach Gmail refresh token (state JWT decoded but user not found)');
        }
      } catch (err) {
        console.error('Failed to persist refresh token for user:', err);
      }
    }

    // Print the refresh token clearly in the server terminal for convenience during setup
    if (tokens.refresh_token) {
      console.log('=== GOOGLE REFRESH TOKEN ===');
      console.log(tokens.refresh_token);
      console.log('=== END REFRESH TOKEN ===');
    } else {
      console.warn('No refresh token received. If you have previously granted consent to this client, Google may not return a refresh token. To force a refresh token, use prompt=consent during authorization.');
    }

  // Redirect the user to the admin login page after storing the token (or always).
  // Next.js requires absolute URLs here for app routes/middleware; build one from the incoming request.
  const origin = url.origin || (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
  const redirectTo = new URL('/admin/login', origin).toString();
  return NextResponse.redirect(redirectTo);
  } catch (err: any) {
    console.error('OAuth callback error:', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
