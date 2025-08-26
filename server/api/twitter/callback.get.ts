import { getAccessToken } from '~/lib/twitterAuth';

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const { state, code, codeVerifier } = query;
    if (!state || !code || !codeVerifier) {
      return { error: 'Missing state, code or codeVerifier' };
    }
    let result;
    try {
      result = await getAccessToken(code as string, codeVerifier as string);
    } catch (e) {
      return { error: 'Error getting access token' };
    }
    if (result && result.accessToken) {
      let user = null;
      try {
        const me = await result.client.v2.me();
        user = me?.data ? {
          id: me.data.id,
          name: me.data.name,
          username: me.data.username
        } : null;
      } catch (e) {
        user = null;
      }
      return {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: result.expiresIn,
        user
      };
    }
    return { error: 'No access token returned' };
  } catch (error: any) {
    return { error: error.message };
  }
});
