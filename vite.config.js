import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

function redditImageProxy() {
  return {
    name: 'reddit-image-proxy',
    configureServer(server) {
      server.middlewares.use('/reddit-media', async (req, res) => {
        try {
          const url = decodeURIComponent(req.url.slice(1));
          const resp = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; RedditRedesign/1.0)',
              'Accept': 'image/*,*/*',
            },
          });
          if (!resp.ok) {
            res.writeHead(resp.status);
            res.end();
            return;
          }
          const contentType = resp.headers.get('content-type') || 'image/jpeg';
          res.writeHead(200, {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=86400',
          });
          const buffer = Buffer.from(await resp.arrayBuffer());
          res.end(buffer);
        } catch {
          res.writeHead(502);
          res.end();
        }
      });
    },
  };
}

function askNowProxy(env) {
  return {
    name: 'asknow-proxy',
    configureServer(server) {
      server.middlewares.use('/api/ask', async (req, res) => {
        const url = new URL(req.url, 'http://localhost');
        const q = url.searchParams.get('q');
        const followup = url.searchParams.get('followup');
        if (!q) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing q parameter' }));
          return;
        }

        const demoQuery = q.toLowerCase().replace(/[^a-z ]/g, '').trim();
        const isDemoQuery = !followup && (demoQuery === 'best coffee shop in nyc' || demoQuery === 'best coffee in nyc' || demoQuery === 'best coffee shop in new york');

        if (isDemoQuery) {
          res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' });
          const demoPosts = [
            { id: 'demo1', title: 'Best coffee shops in NYC?', subreddit: 'r/AskNYC', author: 'coffeelover22', upvotes: 847, comments: 234, permalink: '', image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=400&fit=crop' },
            { id: 'demo2', title: 'NYC Coffee Guide - my top picks after 3 years', subreddit: 'r/FoodNYC', author: 'nycfoodie', upvotes: 1203, comments: 189, permalink: '', image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=400&fit=crop' },
            { id: 'demo3', title: 'Specialty coffee recommendations in Manhattan?', subreddit: 'r/Coffee', author: 'pourover_fan', upvotes: 562, comments: 145, permalink: '', image: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=400&h=400&fit=crop' },
            { id: 'demo4', title: 'Hidden gem coffee shops in Brooklyn', subreddit: 'r/Brooklyn', author: 'bk_local', upvotes: 389, comments: 97, permalink: '', image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=400&fit=crop' },
            { id: 'demo5', title: 'Best espresso in NYC - settled debate', subreddit: 'r/espresso', author: 'barista_life', upvotes: 721, comments: 312, permalink: '', image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefda?w=400&h=400&fit=crop' },
          ];
          const demoSummary = `The best coffee shops in NYC, according to Reddit users, are **Devocion**, **Sey Coffee**, and **La Cabra**.

**Best for Specialty Coffee**

• **Devocion:** Renowned for its direct-sourced Colombian beans and stunning Williamsburg space. "The freshness of their beans is unmatched — you can taste the difference in every sip."

• **Sey Coffee:** A Bushwick favorite known for light roasts and transparency in sourcing. "Sey is in contention for best in the city if you're into 3rd wave coffee."

• **La Cabra:** Consistently mentioned as a standout for quality. "La Cabra is one of the only standout shops I've been to so far."

**Best for Atmosphere & Experience**

• **Abraço:** A tiny East Village gem with exceptional espresso. "Their olive oil cake with a cortado is the perfect NYC morning."

• **Black Fox Coffee:** Praised for lighter espresso and high-quality flavored lattes. "Black Fox on Pine St is my favorite cafe in NYC."

• **Cafe Integral:** Known for Nicaraguan single-origin beans and a minimalist vibe. "If you want to taste truly exceptional coffee, Integral is the move."`;
          const demoSuggestions = ['Which has the best espresso?', 'Best coffee shops in Brooklyn?', 'Any good decaf options?'];

          res.write(`data: ${JSON.stringify({ type: 'meta', posts: demoPosts })}\n\n`);
          await new Promise(r => setTimeout(r, 1800));
          res.write(`data: ${JSON.stringify({ type: 'token', content: demoSummary })}\n\n`);
          res.write(`data: ${JSON.stringify({ type: 'suggestions', prompts: demoSuggestions })}\n\n`);
          res.write('data: [DONE]\n\n');
          res.end();
          return;
        }

        const apiKey = env.OPENAI_API_KEY;
        if (!apiKey) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'OPENAI_API_KEY not configured in .env.local' }));
          return;
        }

        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        });

        try {
          const searchParams = new URLSearchParams({ q, limit: '10', sort: 'relevance', raw_json: '1' });
          const redditRes = await fetch(`https://www.reddit.com/search.json?${searchParams}`, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RedditRedesign/1.0)', 'Accept': 'application/json' },
          });
          if (!redditRes.ok) throw new Error(`Reddit search ${redditRes.status}`);
          const redditJson = await redditRes.json();

          const posts = redditJson.data.children
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
              return {
                id: d.id, title: d.title, subreddit: d.subreddit_name_prefixed,
                author: d.author, selftext: (d.selftext || '').slice(0, 500),
                upvotes: d.ups, comments: d.num_comments,
                permalink: `https://reddit.com${d.permalink}`, image,
              };
            });

          res.write(`data: ${JSON.stringify({ type: 'meta', posts: posts.map(p => ({ id: p.id, title: p.title, subreddit: p.subreddit, author: p.author, upvotes: p.upvotes, comments: p.comments, permalink: p.permalink, image: p.image, subIcon: p.subIcon })) })}\n\n`);

          const context = posts.map((p, i) =>
            `[Post ${i + 1}] ${p.subreddit} | ${p.upvotes} upvotes | ${p.comments} comments\nTitle: ${p.title}\n${p.selftext ? 'Body: ' + p.selftext : '(no body text)'}`
          ).join('\n\n');

          let promptText = `You are a helpful assistant that summarizes Reddit discussions. A user searched for: "${q}"\n\nHere are the top Reddit posts found:\n\n${context}\n\nCRITICAL: ONLY answer what the user asked. If the query is "best coffee in NYC", ONLY talk about recommended coffee shops. Do NOT add sections about challenges, social issues, pricing complaints, wait times, or anything the user did not ask about. Skip any Reddit posts that are off-topic.\n\nFormat your response like this:\n\n1. Start with a 1-2 sentence intro naming the top recommendations in bold (e.g. **La Cabra** and **Sey Coffee**)\n\n2. Use 1-2 **bold section headers** grouping recommendations by theme (e.g. "**Best for Specialty Coffee**", "**Best Atmosphere**")\n\n3. Under each section, use bullet points: "• **Name:** Description. \\"Quote from a user.\\""\n\nRules:\n- ONLY include information that directly answers the query\n- NO tangential topics, complaints, controversies, or filler\n- Include real quotes from posts in double quotes\n- Bold place/product/person names\n- Do NOT mention post numbers or say "according to Reddit"\n- Keep it concise: 3-6 bullet points total, 2 sentences max each\n- If a post is irrelevant to the query, ignore it completely`;

          if (followup) {
            promptText += `\n\nThe user has a follow-up question: "${followup}"\nPlease answer this follow-up based on the same Reddit context above.`;
          }

          const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [{ role: 'user', content: promptText }],
              stream: true, temperature: 0.7, max_tokens: 1000,
            }),
          });

          if (!openaiRes.ok) {
            res.write(`data: ${JSON.stringify({ type: 'error', message: `OpenAI error: ${openaiRes.status}` })}\n\n`);
            res.write('data: [DONE]\n\n');
            res.end();
            return;
          }

          const reader = openaiRes.body.getReader();
          const decoder = new TextDecoder();
          let fullText = '';
          let buf = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += decoder.decode(value, { stream: true });
            const lines = buf.split('\n');
            buf = lines.pop() || '';
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
              headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: `Given a user searched for "${q}" and received this summary:\n\n${fullText}\n\nGenerate exactly 3 short follow-up questions (each under 50 characters) the user might want to ask next. Return them as a JSON array of strings. Only output the JSON array, nothing else.` }],
                temperature: 0.8, max_tokens: 200,
              }),
            });
            if (sugRes.ok) {
              const sugJson = await sugRes.json();
              const sugText = sugJson.choices?.[0]?.message?.content || '[]';
              const match = sugText.match(/\[[\s\S]*\]/);
              if (match) {
                res.write(`data: ${JSON.stringify({ type: 'suggestions', prompts: JSON.parse(match[0]) })}\n\n`);
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
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), redditImageProxy(), askNowProxy(env)],
    server: {
      port: 5173,
      open: true,
      proxy: {
        '/reddit-api': {
          target: 'https://www.reddit.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/reddit-api/, ''),
          headers: {
            'User-Agent': 'web:reddit-grid-redesign:v1.0',
          },
        },
      },
    },
  };
});
