import { TwitterApi } from 'twitter-api-v2';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const client = new TwitterApi(body.token);

    await client.v2.tweet({
        text: body.text
    });
});