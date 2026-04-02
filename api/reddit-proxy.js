let tokenCache = { token: null, expiresAt: 0 };

async function getAccessToken() {
  if (tokenCache.token && Date.now() < tokenCache.expiresAt) {
    return tokenCache.token;
  }

  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;

  if (!clientId || !clientSecret) return null;

  const res = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'web:reddit-grid-redesign:v1.0',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) return null;

  const data = await res.json();
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return data.access_token;
}

export default async function handler(req, res) {
  const { path, ...query } = req.query;
  if (!path) {
    res.status(400).json({ error: 'Missing path parameter' });
    return;
  }

  const qs = new URLSearchParams(query).toString();

  try {
    const token = await getAccessToken();

    let url, headers;
    if (token) {
      url = `https://oauth.reddit.com/${path}${qs ? '?' + qs : ''}`;
      headers = {
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'web:reddit-grid-redesign:v1.0',
      };
    } else {
      url = `https://www.reddit.com/${path}${qs ? '?' + qs : ''}`;
      headers = {
        'User-Agent': 'Mozilla/5.0 (compatible; RedditRedesign/1.0)',
        'Accept': 'application/json',
      };
    }

    const response = await fetch(url, { headers });

    const contentType = response.headers.get('content-type') || 'application/json';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    res.status(response.status).send(await response.text());
  } catch {
    res.status(502).json({ error: 'Failed to fetch from Reddit' });
  }
}
