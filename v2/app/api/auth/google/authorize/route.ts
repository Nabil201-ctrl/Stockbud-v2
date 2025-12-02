import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

// Generates a Google OAuth2 authorization URL and redirects the user there.
// Required env vars: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI

export async function GET(_request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback';

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: 'Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET' }, { status: 500 });
  }

  const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  const scopes = ['https://mail.google.com/'];

  // Allow embedding a JWT (current user token) as a query param `token` so the callback
  // can associate the refresh token with that user. We encode it as base64 and pass it
  // in the OAuth2 `state` parameter.
  const url = new URL(_request.url);
  const providedToken = url.searchParams.get('token') || undefined;
  const state = providedToken ? Buffer.from(providedToken).toString('base64') : undefined;

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline', // request refresh token
    prompt: 'consent', // force consent to ensure refresh token is returned
    scope: scopes,
    state,
  });

  return NextResponse.redirect(authUrl);
}
