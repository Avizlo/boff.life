// Vercel Serverless Function — fetches Boff field reports from Supabase
// Filters: candidate_post present, aura_outcome != AURA WIN
// Returns last 10 reports ordered newest first

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300');

    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
        return res.status(500).json({ error: 'Missing Supabase credentials' });
    }

    try {
        const query = new URLSearchParams({
            select: 'id,created_at,report_date,world_update,candidate_post,pillar,aura_outcome,signal_count,sighting_count',
            candidate_post: 'not.is.null',
            aura_outcome: 'neq.AURA WIN',
            order: 'created_at.desc',
            limit: '10',
        });

        const apiRes = await fetch(`${url}/rest/v1/boff_field_reports?${query}`, {
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${key}`,
            },
        });

        if (!apiRes.ok) {
            const detail = await apiRes.text();
            return res.status(apiRes.status).json({ error: 'Supabase error', detail });
        }

        const reports = await apiRes.json();
        return res.status(200).json({ reports });

    } catch (err) {
        return res.status(500).json({ error: 'Internal error', detail: err.message });
    }
}
