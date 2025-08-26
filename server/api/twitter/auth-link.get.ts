import { generateAuthLink } from '~/lib/twitterAuth';

export default defineEventHandler(async (event) => {
  try {
    const { url, codeVerifier, state } = generateAuthLink();
    // Return auth link, codeVerifier og state til frontend
    return { url, codeVerifier, state };
  } catch (error: any) {
    return { error: error.message };
  }
});
