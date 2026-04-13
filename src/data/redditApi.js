const TAG_MAP = {
  gaming: ['gaming'], pcgaming: ['gaming'], PS5: ['gaming'], xbox: ['gaming'],
  nintendo: ['gaming'], Steam: ['gaming'], Minecraft: ['gaming'],
  technology: ['tech'], programming: ['tech'], webdev: ['tech'],
  apple: ['tech'], Android: ['tech'], gadgets: ['tech'],
  artificial: ['ai', 'tech'], MachineLearning: ['ai', 'tech'],
  ClaudeAI: ['ai', 'tech'], ChatGPT: ['ai', 'tech'], LocalLLaMA: ['ai', 'tech'],
  news: ['news'], worldnews: ['news'], politics: ['news'],
  memes: ['memes'], funny: ['memes'], dankmemes: ['memes'], me_irl: ['memes'],
  pics: ['memes'], MadeMeSmile: ['memes'],
  cats: ['pets'], dogs: ['pets'], aww: ['pets'], AnimalsBeingBros: ['pets'],
  food: ['food'], Cooking: ['food'], FoodPorn: ['food'],
  science: ['science'], space: ['science'], askscience: ['science'],
  movies: ['movies'], television: ['movies'], netflix: ['movies'],
  cars: ['cars'], Autos: ['cars'], carporn: ['cars'],
  sports: ['sports'], nba: ['sports'], nfl: ['sports'], soccer: ['sports'], olympics: ['sports'],
  EarthPorn: ['science'], Art: ['memes'], art: ['memes'],
  interestingasfuck: ['science', 'news'], Damnthatsinteresting: ['science', 'news'],
  nextfuckinglevel: ['news'], oddlysatisfying: ['memes'],
};

const ICON_MAP = {
  gaming: '🎮', technology: '💻', science: '🔬', space: '🚀',
  memes: '😂', funny: '🤣', cats: '🐱', dogs: '🐕', aww: '🥰',
  food: '🍕', Cooking: '👨‍🍳', FoodPorn: '🍔',
  movies: '🎬', television: '📺', netflix: '🎥',
  news: '📰', worldnews: '🌍', politics: '🏛️',
  cars: '🚗', Autos: '🚙', carporn: '🏎️',
  sports: '⚽', nba: '🏀', nfl: '🏈', soccer: '⚽', olympics: '🏅',
  pics: '📷', EarthPorn: '🌄', Art: '🎨', art: '🎨',
  programming: '💻', webdev: '🌐',
  apple: '🍎', Android: '🤖', gadgets: '📱',
  artificial: '🤖', MachineLearning: '🧠',
  ClaudeAI: '🤖', ChatGPT: '💬', LocalLLaMA: '🦙',
  LosAngeles: '🌴', bayarea: '🌉', nyc: '🗽',
  chicago: '🏙️', seattle: '☕', sanfrancisco: '🌉',
  pcgaming: '🖥️', PS5: '🎮', xbox: '🎮', nintendo: '🍄',
  Steam: '🎮', Minecraft: '⛏️',
  AnimalsBeingBros: '🐾', MadeMeSmile: '😊',
  interestingasfuck: '🤯', Damnthatsinteresting: '😮',
  nextfuckinglevel: '🔥', oddlysatisfying: '✨',
  dankmemes: '💀', me_irl: '🙃',
  CityPorn: '🏙️', itookapicture: '📸',
  AskNYC: '🗽', FoodNYC: '🍽️', Coffee: '☕', Brooklyn: '🌉', espresso: '☕',
  seoul: '🇰🇷', GlobalOffensive: '🎮', PUBATTLEGROUNDS: '🎮',
  FoodPH: '🍜', leagueoflegends: '🎮', taskmaster: '🎭',
  DotA2: '🎮', BestofRedditorUpdates: '📖', heroesofthestorm: '🎮',
  DunkinDonuts: '🍩', BORUpdates: '📖', MPLSbitcheswithtaste: '🍷',
  india: '🇮🇳', IAmA: '🎤', astoria: '🏘️', cafe: '☕',
};

const COLOR_MAP = {
  gaming: '#FF4500', technology: '#46D160', science: '#0079D3',
  space: '#003366', memes: '#FF4500', funny: '#FF4500',
  cats: '#FF6600', dogs: '#FF4500', aww: '#FF69B4',
  food: '#E25822', movies: '#014980', news: '#0266B3',
  worldnews: '#0266B3', politics: '#5A45FF',
  cars: '#46D160', sports: '#0079D3', olympics: '#0079D3', pics: '#0079D3',
  programming: '#46D160', EarthPorn: '#2E8B57',
  LosAngeles: '#0079D3', bayarea: '#46D160', nyc: '#FF4500',
  Art: '#D4A373', art: '#D4A373',
  interestingasfuck: '#FF6B35', Damnthatsinteresting: '#FF6B35',
  nextfuckinglevel: '#FF4500', oddlysatisfying: '#7B68EE',
};

function timeAgo(utcSeconds) {
  const diff = Date.now() / 1000 - utcSeconds;
  if (diff < 60) return 'now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h';
  return Math.floor(diff / 86400) + 'd';
}

function proxyImage(url) {
  if (!url) return null;
  if (url.includes('redd.it') || url.includes('redditmedia.com')) {
    return '/reddit-media/' + encodeURIComponent(url);
  }
  return url;
}

function extractImage(post) {
  if (post.post_hint === 'image' && post.url) return proxyImage(post.url);

  if (post.preview?.images?.[0]?.source?.url) {
    return proxyImage(post.preview.images[0].source.url);
  }

  if (post.url && /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(post.url)) {
    return proxyImage(post.url);
  }

  if (post.is_gallery && post.media_metadata) {
    const firstKey = Object.keys(post.media_metadata)[0];
    const media = post.media_metadata[firstKey];
    if (media?.s?.u) return proxyImage(media.s.u);
  }

  return null;
}

function extractGalleryImages(post) {
  if (!post.is_gallery || !post.media_metadata) return null;

  const order = post.gallery_data?.items?.map((item) => item.media_id)
    || Object.keys(post.media_metadata);

  const urls = order
    .map((id) => {
      const media = post.media_metadata[id];
      if (media?.s?.u) return proxyImage(media.s.u);
      if (media?.s?.gif) return proxyImage(media.s.gif);
      return null;
    })
    .filter(Boolean);

  return urls.length > 1 ? urls : null;
}

function mapPost(child) {
  const d = child.data;
  if (d.over_18 || d.stickied) return null;

  const image = extractImage(d);
  const images = extractGalleryImages(d);
  const sub = d.subreddit;

  return {
    id: d.id,
    subreddit: `r/${sub}`,
    subredditIcon: ICON_MAP[sub] || sub.charAt(0).toUpperCase(),
    subredditColor: COLOR_MAP[sub] || '#0079D3',
    user: `u/${d.author}`,
    timeAgo: timeAgo(d.created_utc),
    title: d.title,
    image,
    images,
    contentType: image ? undefined : 'text',
    upvotes: d.ups,
    comments: d.num_comments,
    body: d.selftext || '',
    tags: TAG_MAP[sub] || [],
  };
}

const cache = {};
const afterTokens = {};

export async function fetchRedditPosts(source, limit = 50) {
  if (cache[source]) return cache[source];

  const url = `/reddit-api/${source}.json?limit=${limit}&raw_json=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Reddit API ${res.status}`);
  const json = await res.json();

  const posts = json.data.children
    .filter((c) => c.kind === 't3')
    .map(mapPost)
    .filter(Boolean);

  cache[source] = posts;
  afterTokens[source] = json.data.after || null;
  return posts;
}

export async function fetchMoreRedditPosts(source, limit = 25) {
  const after = afterTokens[source];
  if (!after) return [];

  const url = `/reddit-api/${source}.json?limit=${limit}&after=${after}&raw_json=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Reddit API ${res.status}`);
  const json = await res.json();

  const posts = json.data.children
    .filter((c) => c.kind === 't3')
    .map(mapPost)
    .filter(Boolean);

  const existing = cache[source] || [];
  const existingIds = new Set(existing.map((p) => p.id));
  const newPosts = posts.filter((p) => !existingIds.has(p.id));

  cache[source] = [...existing, ...newPosts];
  afterTokens[source] = json.data.after || null;
  return newPosts;
}

const commentsCache = {};

function mapComment(child) {
  if (child.kind !== 't1') return null;
  const d = child.data;
  if (!d.body || d.body === '[deleted]' || d.body === '[removed]') return null;

  return {
    id: d.id,
    author: d.author,
    body: d.body,
    ups: d.ups,
    timeAgo: timeAgo(d.created_utc),
    isSubmitter: d.is_submitter,
    flairText: d.author_flair_text || null,
    replies: (d.replies?.data?.children || [])
      .map(mapComment)
      .filter(Boolean)
      .slice(0, 2),
  };
}

export async function fetchComments(subreddit, postId, limit = 20) {
  const key = `${subreddit}/${postId}`;
  if (commentsCache[key]) return commentsCache[key];

  const sub = subreddit.replace('r/', '');
  const url = `/reddit-api/r/${sub}/comments/${postId}.json?limit=${limit}&depth=2&sort=top&raw_json=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Comments API ${res.status}`);
  const json = await res.json();

  const comments = (json[1]?.data?.children || [])
    .map(mapComment)
    .filter(Boolean)
    .slice(0, limit);

  commentsCache[key] = comments;
  return comments;
}

const autocompleteCache = {};

export async function searchRedditAutocomplete(query) {
  if (!query || query.length < 2) return { subreddits: [] };
  const key = query.toLowerCase();
  if (autocompleteCache[key]) return autocompleteCache[key];

  try {
    const params = new URLSearchParams({
      query,
      include_over_18: 'false',
      include_profiles: 'false',
      typeahead_active: 'true',
      search_query_id: '',
      raw_json: '1',
    });
    const url = `/reddit-api/api/subreddit_autocomplete_v2.json?${params}`;
    const res = await fetch(url);
    if (!res.ok) return { subreddits: [] };
    const json = await res.json();

    const subreddits = (json.data?.children || [])
      .filter(c => c.kind === 't5' && c.data)
      .map(c => {
        const d = c.data;
        const name = d.display_name;
        let icon = d.community_icon || d.icon_img || null;
        if (icon) icon = icon.split('?')[0];
        return {
          id: d.id,
          name: `r/${name}`,
          displayName: name,
          members: d.subscribers
            ? d.subscribers >= 1_000_000
              ? (d.subscribers / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'm'
              : d.subscribers >= 1_000
                ? Math.floor(d.subscribers / 1_000) + 'k'
                : String(d.subscribers)
            : null,
          subscriberCount: d.subscribers || 0,
          icon: ICON_MAP[name] || null,
          iconUrl: icon ? proxyImage(icon) : null,
          color: COLOR_MAP[name] || d.primary_color || d.key_color || '#0079D3',
          description: d.public_description || '',
          activeUsers: d.accounts_active
            ? d.accounts_active >= 1_000
              ? Math.floor(d.accounts_active / 1_000) + 'K weekly visitors'
              : d.accounts_active + ' online'
            : null,
        };
      })
      .slice(0, 5);

    const result = { subreddits };
    autocompleteCache[key] = result;
    return result;
  } catch {
    return { subreddits: [] };
  }
}

const searchCache = {};

export async function searchRedditPosts(query, sort = 'relevance', limit = 25) {
  const key = `${query}:${sort}`;
  if (searchCache[key]) return searchCache[key];

  const params = new URLSearchParams({ q: query, sort, limit: String(limit), raw_json: '1', sr_detail: '1' });
  const url = `/reddit-api/search.json?${params}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Reddit search ${res.status}`);
  const json = await res.json();

  const posts = json.data.children
    .filter((c) => c.kind === 't3')
    .map((child) => {
      const post = mapPost(child);
      if (!post) return null;
      const sr = child.data.sr_detail;
      if (sr) {
        const icon = sr.community_icon || sr.icon_img || null;
        if (icon) post.subredditIconUrl = proxyImage(icon.split('?')[0]);
      }
      return post;
    })
    .filter(Boolean);

  searchCache[key] = posts;
  return posts;
}

export function getSubredditIcon(name) {
  const clean = name.replace('r/', '');
  return ICON_MAP[clean] || null;
}

export function getSubredditColor(name) {
  const clean = name.replace('r/', '');
  return COLOR_MAP[clean] || '#0079D3';
}

export const SOURCES = {
  explore: 'r/popular',
  following: 'r/gaming+technology+cats+food+memes+movies+space+pics+aww+EarthPorn',
  nearby: 'r/LosAngeles+bayarea+nyc+chicago+seattle+CityPorn',
};

export const INTEREST_SOURCES = {
  gaming: 'r/gaming+pcgaming+PS5+nintendo+Steam+Minecraft',
  tech: 'r/technology+programming+gadgets+webdev+apple+Android',
  news: 'r/news+worldnews+politics',
  cars: 'r/cars+Autos+carporn',
  memes: 'r/memes+funny+dankmemes+me_irl+MadeMeSmile',
  ai: 'r/artificial+MachineLearning+ClaudeAI+ChatGPT+LocalLLaMA',
  sports: 'r/sports+nba+nfl+soccer',
  movies: 'r/movies+television+netflix',
  food: 'r/food+FoodPorn+Cooking',
  science: 'r/science+space+EarthPorn+askscience',
  pets: 'r/cats+dogs+aww+AnimalsBeingBros',
};
