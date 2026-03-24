// Vercel Serverless Function — fetches last 5 tweets from @boff_05
// Uses X API v2 with Bearer Token from environment variable

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600'); // Cache 5 min

    const token = process.env.X_BEARER_TOKEN;
    if (!token) {
        return res.status(500).json({ error: 'Missing X_BEARER_TOKEN' });
    }

    try {
        // Step 1: Get user ID from username
        const userRes = await fetch(
            'https://api.twitter.com/2/users/by/username/boff_05',
            { headers: { 'Authorization': `Bearer ${token}` } }
        );

        if (!userRes.ok) {
            const errText = await userRes.text();
            return res.status(userRes.status).json({
                error: 'Failed to fetch user',
                detail: errText
            });
        }

        const userData = await userRes.json();
        const userId = userData.data?.id;

        if (!userId) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Step 2: Get last 5 tweets
        const tweetsRes = await fetch(
            `https://api.twitter.com/2/users/${userId}/tweets?` +
            new URLSearchParams({
                max_results: '5',
                'tweet.fields': 'created_at,public_metrics,text',
                exclude: 'retweets,replies'
            }),
            { headers: { 'Authorization': `Bearer ${token}` } }
        );

        if (!tweetsRes.ok) {
            const errText = await tweetsRes.text();
            return res.status(tweetsRes.status).json({
                error: 'Failed to fetch tweets',
                detail: errText
            });
        }

        const tweetsData = await tweetsRes.json();

        // Step 3: Format response
        const tweets = (tweetsData.data || []).map(tweet => ({
            id: tweet.id,
            text: tweet.text,
            created_at: tweet.created_at,
            metrics: {
                likes: tweet.public_metrics?.like_count || 0,
                retweets: tweet.public_metrics?.retweet_count || 0,
                replies: tweet.public_metrics?.reply_count || 0,
                impressions: tweet.public_metrics?.impression_count || 0
            }
        }));

        return res.status(200).json({ tweets });

    } catch (err) {
        return res.status(500).json({ error: 'Internal error', detail: err.message });
    }
}
