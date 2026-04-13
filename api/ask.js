let tokenCache = { token: null, expiresAt: 0 };

async function getRedditToken() {
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
  tokenCache = { token: data.access_token, expiresAt: Date.now() + (data.expires_in - 60) * 1000 };
  return data.access_token;
}

async function searchReddit(query) {
  const token = await getRedditToken();
  const params = new URLSearchParams({ q: query, limit: '10', sort: 'relevance', raw_json: '1', sr_detail: '1' });

  let url, headers;
  if (token) {
    url = `https://oauth.reddit.com/search?${params}`;
    headers = { 'Authorization': `Bearer ${token}`, 'User-Agent': 'web:reddit-grid-redesign:v1.0' };
  } else {
    url = `https://www.reddit.com/search.json?${params}`;
    headers = { 'User-Agent': 'Mozilla/5.0 (compatible; RedditRedesign/1.0)', 'Accept': 'application/json' };
  }

  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Reddit search ${res.status}`);
  const json = await res.json();

  return json.data.children
    .filter(c => c.kind === 't3' && !c.data.over_18)
    .map(c => {
      const d = c.data;
      let image = null;
      if (d.post_hint === 'image' && d.url) image = d.url;
      else if (d.preview?.images?.[0]?.source?.url) image = d.preview.images[0].source.url;
      else if (d.url && /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(d.url)) image = d.url;
      else if (d.is_gallery && d.media_metadata) {
        const firstKey = Object.keys(d.media_metadata)[0];
        if (d.media_metadata[firstKey]?.s?.u) image = d.media_metadata[firstKey].s.u;
      }

      let subIcon = null;
      const sr = d.sr_detail;
      if (sr) {
        const icon = sr.community_icon || sr.icon_img || null;
        if (icon) subIcon = icon.split('?')[0];
      }

      return {
        id: d.id,
        title: d.title,
        subreddit: d.subreddit_name_prefixed,
        author: d.author,
        selftext: (d.selftext || '').slice(0, 500),
        upvotes: d.ups,
        comments: d.num_comments,
        permalink: `https://reddit.com${d.permalink}`,
        image,
        subIcon,
        created: d.created_utc,
      };
    });
}

function buildPrompt(query, posts, followup) {
  const context = posts.map((p, i) =>
    `[Post ${i + 1}] r/${p.subreddit.replace('r/', '')} | ${p.upvotes} upvotes | ${p.comments} comments\nTitle: ${p.title}\n${p.selftext ? 'Body: ' + p.selftext : '(no body text)'}`
  ).join('\n\n');

  const base = `You are a helpful assistant that summarizes Reddit discussions. A user searched for: "${query}"

Here are the top Reddit posts found:

${context}

CRITICAL: ONLY answer what the user asked. If the query is "best coffee in NYC", ONLY talk about recommended coffee shops. Do NOT add sections about challenges, social issues, pricing complaints, wait times, or anything the user did not ask about. Skip any Reddit posts that are off-topic.

Format your response like this:

1. Start with a 1-2 sentence intro naming the top recommendations in bold (e.g. **La Cabra** and **Sey Coffee**)

2. Use 1-2 **bold section headers** grouping recommendations by theme (e.g. "**Best for Specialty Coffee**", "**Best Atmosphere**")

3. Under each section, use bullet points: "• **Name:** Description. "Quote from a user.""

Rules:
- ONLY include information that directly answers the query
- NO tangential topics, complaints, controversies, or filler
- Include real quotes from posts in double quotes
- Bold place/product/person names
- Do NOT mention post numbers or say "according to Reddit"
- Keep it concise: 3-6 bullet points total, 2 sentences max each
- If a post is irrelevant to the query, ignore it completely`;

  if (followup) {
    return base + `\n\nThe user has a follow-up question: "${followup}"\nPlease answer this follow-up based on the same Reddit context above.`;
  }
  return base;
}

function buildSuggestionsPrompt(query, summary) {
  return `Given a user searched for "${query}" and received this summary:

${summary}

Generate exactly 3 short follow-up questions (each under 50 characters) the user might want to ask next. Return them as a JSON array of strings. Only output the JSON array, nothing else.`;
}

export default async function handler(req, res) {
  const { q, followup } = req.query;
  if (!q) {
    res.status(400).json({ error: 'Missing q parameter' });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'OPENAI_API_KEY not configured' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const posts = await searchReddit(q);

    res.write(`data: ${JSON.stringify({ type: 'meta', posts: posts.map(p => ({ id: p.id, title: p.title, subreddit: p.subreddit, author: p.author, upvotes: p.upvotes, comments: p.comments, permalink: p.permalink, image: p.image, subIcon: p.subIcon })) })}\n\n`);

    const prompt = buildPrompt(q, posts, followup);

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        stream: true,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!openaiRes.ok) {
      const err = await openaiRes.text();
      res.write(`data: ${JSON.stringify({ type: 'error', message: `OpenAI error: ${openaiRes.status}` })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }

    const reader = openaiRes.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;
        const payload = trimmed.slice(6);
        if (payload === '[DONE]') continue;

        try {
          const parsed = JSON.parse(payload);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            fullText += content;
            res.write(`data: ${JSON.stringify({ type: 'token', content })}\n\n`);
          }
        } catch {}
      }
    }

    try {
      const sugRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: buildSuggestionsPrompt(q, fullText) }],
          temperature: 0.8,
          max_tokens: 200,
        }),
      });

      if (sugRes.ok) {
        const sugJson = await sugRes.json();
        const sugText = sugJson.choices?.[0]?.message?.content || '[]';
        const match = sugText.match(/\[[\s\S]*\]/);
        if (match) {
          const prompts = JSON.parse(match[0]);
          res.write(`data: ${JSON.stringify({ type: 'suggestions', prompts })}\n\n`);
        }
      }
    } catch {}

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
}
