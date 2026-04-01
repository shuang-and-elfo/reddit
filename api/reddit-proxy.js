export default async function handler(req, res) {
  const { path, ...query } = req.query;
  if (!path) {
    res.status(400).json({ error: 'Missing path parameter' });
    return;
  }

  const qs = new URLSearchParams(query).toString();
  const url = `https://www.reddit.com/${path}${qs ? '?' + qs : ''}`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RedditRedesign/1.0)',
        'Accept': 'application/json',
      },
    });

    const contentType = response.headers.get('content-type') || 'application/json';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    res.status(response.status).send(await response.text());
  } catch {
    res.status(502).json({ error: 'Failed to fetch from Reddit' });
  }
}
