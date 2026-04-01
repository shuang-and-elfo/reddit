export default async function handler(req, res) {
  const url = decodeURIComponent(req.query.url || '');
  if (!url) {
    res.status(400).end();
    return;
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RedditRedesign/1.0)',
        Accept: 'image/*,*/*',
      },
    });

    if (!response.ok) {
      res.status(response.status).end();
      return;
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const buffer = Buffer.from(await response.arrayBuffer());

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    res.status(200).send(buffer);
  } catch {
    res.status(502).end();
  }
}
