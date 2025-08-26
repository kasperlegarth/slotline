import { TwitterApi } from 'twitter-api-v2';

const CALLBACK_URL = process.env.X_REDIRECT_URI || 'http://localhost:3000/api/twitter/callback';
const SCOPES = (process.env.X_SCOPES ?? 'tweet.read users.read offline.access')
    .split(' ')
    .map(scope => scope.trim())
    .filter(Boolean);

export function generateAuthLink() {
  if (!process.env.X_CLIENT_ID || !process.env.X_CLIENT_SECRET) {
    throw new Error('X_CLIENT_ID or X_CLIENT_SECRET not set');
  }
  const client = new TwitterApi({
    clientId: process.env.X_CLIENT_ID,
    clientSecret: process.env.X_CLIENT_SECRET,
  });
  return client.generateOAuth2AuthLink(CALLBACK_URL, { scope: SCOPES });
}

export async function getAccessToken(code: string, codeVerifier: string) {
  if (!process.env.X_CLIENT_ID || !process.env.X_CLIENT_SECRET) {
    throw new Error('X_CLIENT_ID or X_CLIENT_SECRET not set');
  }
  const client = new TwitterApi({
    clientId: process.env.X_CLIENT_ID,
    clientSecret: process.env.X_CLIENT_SECRET,
  });
  return await client.loginWithOAuth2({ code, codeVerifier, redirectUri: CALLBACK_URL });
}

export async function refreshAccessToken(refreshToken: string) {
  if (!process.env.X_CLIENT_ID || !process.env.X_CLIENT_SECRET) {
    throw new Error('X_CLIENT_ID or X_CLIENT_SECRET not set');
  }
  const client = new TwitterApi({
    clientId: process.env.X_CLIENT_ID,
    clientSecret: process.env.X_CLIENT_SECRET,
  });
  return await client.refreshOAuth2Token(refreshToken);
}
