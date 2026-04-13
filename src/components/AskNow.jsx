import { useState, useEffect, useRef, useCallback } from 'react';
import { getSubredditIcon, getSubredditColor } from '../data/redditApi';

function proxyImage(url) {
  if (!url) return null;
  if (url.includes('redd.it') || url.includes('redditmedia.com')) {
    return '/reddit-media/' + encodeURIComponent(url);
  }
  return url;
}

function parseMarkdown(text) {
  const parts = [];
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === '') {
      parts.push({ type: 'break', key: i });
      continue;
    }
    const segments = [];
    let remaining = line;
    while (remaining.length > 0) {
      const quoteMatch = remaining.match(/"([^"]{10,})"/);
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);

      let firstMatch = null;
      let firstIdx = Infinity;

      if (boldMatch && boldMatch.index < firstIdx) {
        firstMatch = { type: 'bold', match: boldMatch };
        firstIdx = boldMatch.index;
      }
      if (quoteMatch && quoteMatch.index < firstIdx) {
        firstMatch = { type: 'quote', match: quoteMatch };
        firstIdx = quoteMatch.index;
      }

      if (firstMatch) {
        const m = firstMatch.match;
        if (m.index > 0) segments.push({ type: 'text', content: remaining.slice(0, m.index) });
        segments.push({ type: firstMatch.type, content: m[1] || m[0] });
        remaining = remaining.slice(m.index + m[0].length);
      } else {
        segments.push({ type: 'text', content: remaining });
        remaining = '';
      }
    }
    parts.push({ type: 'line', segments, key: i });
  }
  return parts;
}

function MarkdownRenderer({ text }) {
  const parsed = parseMarkdown(text);
  return (
    <div className="asknow-markdown">
      {parsed.map((part) => {
        if (part.type === 'break') return <div key={part.key} className="asknow-linebreak" />;
        return (
          <span key={part.key} className="asknow-line">
            {part.segments.map((seg, j) => {
              if (seg.type === 'bold') return <strong key={j}>{seg.content}</strong>;
              if (seg.type === 'quote') return <span key={j} className="asknow-quote">"{seg.content}"</span>;
              return <span key={j}>{seg.content}</span>;
            })}
            {'\n'}
          </span>
        );
      })}
    </div>
  );
}

export default function AskNow({ query, onBack, onPostSelect, onSubredditSelect, prefetchedData }) {
  const [status, setStatus] = useState(prefetchedData?.status || 'loading');
  const [summary, setSummary] = useState(prefetchedData?.summary || '');
  const [posts, setPosts] = useState(prefetchedData?.posts || []);
  const [suggestions, setSuggestions] = useState(prefetchedData?.suggestions || []);
  const [followup, setFollowup] = useState('');
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  const runQuery = useCallback((q, isFollowup = false) => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus('loading');
    setSummary('');
    setSuggestions([]);
    if (!isFollowup) setPosts([]);

    const params = new URLSearchParams({ q: isFollowup ? query : q });
    if (isFollowup) params.set('followup', q);

    fetch(`/api/ask?${params}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(`API error ${res.status}`);
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = '';
        let accumulated = '';

        setStatus('streaming');

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
            if (payload === '[DONE]') { setStatus('done'); continue; }
            try {
              const data = JSON.parse(payload);
              if (data.type === 'meta') setPosts(data.posts);
              else if (data.type === 'token') { accumulated += data.content; setSummary(accumulated); }
              else if (data.type === 'suggestions') setSuggestions(data.prompts || []);
              else if (data.type === 'error') setStatus('error');
            } catch {}
          }
        }
      })
      .catch((err) => { if (err.name !== 'AbortError') setStatus('error'); });
  }, [query]);

  useEffect(() => {
    if (prefetchedData) return;
    runQuery(query);
    return () => { if (abortRef.current) abortRef.current.abort(); };
  }, [query, runQuery, prefetchedData]);

  useEffect(() => {
    if (scrollRef.current && status === 'streaming') {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [summary, status]);

  const handleFollowup = (text) => {
    if (!text.trim()) return;
    setFollowup('');
    runQuery(text.trim(), true);
  };

  const handleSubredditTap = (subredditName) => {
    if (!onSubredditSelect) return;
    const clean = subredditName.replace('r/', '');
    onSubredditSelect({
      id: clean,
      name: `r/${clean}`,
      icon: clean.charAt(0).toUpperCase(),
      color: '#0079D3',
      members: '',
    });
  };

  const uniqueSubs = [...new Set(posts.map(p => p.subreddit))];
  const shownSubs = uniqueSubs.slice(0, 2);
  const extraCount = uniqueSubs.length - shownSubs.length;

  return (
    <div className="asknow-overlay">
      {/* Header */}
      <div className="asknow-header">
        <button className="asknow-back" onClick={onBack}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className="asknow-header-title">
          <img src="/asknow-logo.png" alt="" className="asknow-header-logo" />
          <span>Ask Now</span>
        </div>
        <div className="asknow-header-actions">
          <button className="asknow-header-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="asknow-body" ref={scrollRef}>
        <h1 className="asknow-query">{query}</h1>

        {/* Sources badge */}
        {(status === 'streaming' || status === 'done') && posts.length > 0 && (
          <div className="asknow-sources">
            <div className="asknow-sources-avatars">
              {posts.slice(0, 3).map((p, i) => (
                <button
                  key={p.id || i}
                  className="asknow-sources-dot"
                  style={{ zIndex: 3 - i }}
                  onClick={() => handleSubredditTap(p.subreddit)}
                >
                  {p.subreddit.replace('r/', '').charAt(0).toUpperCase()}
                </button>
              ))}
            </div>
            <span className="asknow-sources-text">
              {shownSubs.map((s, i) => (
                <span key={s}>
                  {i > 0 && ', '}
                  <button className="asknow-source-link" onClick={() => handleSubredditTap(s)}>{s}</button>
                </span>
              ))}
              {extraCount > 0 ? `, and ${extraCount} others` : ''}
            </span>
          </div>
        )}

        {/* Loading state */}
        {status === 'loading' && (
          <div className="asknow-loading">
            <div className="asknow-shimmer-lines">
              <div className="asknow-shimmer-line asknow-shimmer-line--long" />
              <div className="asknow-shimmer-line asknow-shimmer-line--medium" />
              <div className="asknow-shimmer-line asknow-shimmer-line--short" />
              <div className="asknow-shimmer-line asknow-shimmer-line--long" />
              <div className="asknow-shimmer-line asknow-shimmer-line--medium" />
            </div>
          </div>
        )}

        {/* Summary */}
        {(status === 'streaming' || status === 'done') && (
          <div className="asknow-summary-section">
            <MarkdownRenderer text={summary} />
            {status === 'streaming' && <span className="asknow-cursor" />}
          </div>
        )}

        {/* Images from source posts */}
        {status === 'done' && posts.filter(p => p.image).length > 0 && (
          <div className="asknow-images">
            <div className="asknow-images-scroll">
              {posts.filter(p => p.image).slice(0, 6).map((p) => (
                <button
                  key={p.id}
                  className="asknow-image-card"
                  onClick={() => onPostSelect?.({
                    id: p.id, title: p.title, subreddit: p.subreddit,
                    subredditIcon: getSubredditIcon(p.subreddit) || p.subreddit.replace('r/', '').charAt(0).toUpperCase(),
                    subredditColor: getSubredditColor(p.subreddit),
                    user: `u/${p.author}`, upvotes: p.upvotes, comments: p.comments,
                    image: p.image, body: '', timeAgo: '',
                  })}
                >
                  <img src={proxyImage(p.image)} alt="" loading="lazy" onError={e => { e.target.parentElement.style.display = 'none'; }} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* References */}
        {status === 'done' && posts.length > 0 && (
          <div className="asknow-refs">
            <div className="asknow-refs-label">Sources</div>
            {posts.slice(0, 6).map((p) => (
              <button
                key={p.id}
                className="asknow-ref-row"
                onClick={() => onPostSelect?.({
                  id: p.id,
                  title: p.title,
                  subreddit: p.subreddit,
                  subredditIcon: getSubredditIcon(p.subreddit) || p.subreddit.replace('r/', '').charAt(0).toUpperCase(),
                  subredditColor: getSubredditColor(p.subreddit),
                  user: `u/${p.author}`,
                  upvotes: p.upvotes,
                  comments: p.comments,
                  body: '',
                  timeAgo: '',
                })}
              >
                <div className="asknow-ref-row-info">
                  <span className="asknow-ref-row-sub">
                    {p.subIcon ? (
                      <img className="asknow-ref-row-img" src={proxyImage(p.subIcon)} alt="" onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                    ) : null}
                    <span className="asknow-ref-row-icon" style={{ background: getSubredditColor(p.subreddit) + '22', color: getSubredditColor(p.subreddit), display: p.subIcon ? 'none' : 'flex' }}>
                      {getSubredditIcon(p.subreddit) || p.subreddit.replace('r/', '').charAt(0).toUpperCase()}
                    </span>
                    {p.subreddit}
                  </span>
                  <span className="asknow-ref-row-title">{p.title}</span>
                  <span className="asknow-ref-row-stats">{p.upvotes.toLocaleString()} upvotes · {p.comments} comments</span>
                </div>
                <svg className="asknow-ref-row-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="16" height="16">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            ))}
          </div>
        )}

        {/* Suggestions */}
        {status === 'done' && suggestions.length > 0 && (
          <div className="asknow-suggestions">
            {suggestions.map((s, i) => (
              <button key={i} className="asknow-suggestion-pill" onClick={() => handleFollowup(s)}>
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div className="asknow-error">
            <span>Something went wrong. Please try again.</span>
            <button className="asknow-retry" onClick={() => runQuery(query)}>Retry</button>
          </div>
        )}
      </div>

      {/* Bottom input */}
      <div className="asknow-input-bar">
        <input
          ref={inputRef}
          className="asknow-input"
          type="text"
          placeholder="Ask a followup"
          value={followup}
          onChange={e => setFollowup(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleFollowup(followup); }}
        />
        <button
          className="asknow-send"
          onClick={() => handleFollowup(followup)}
          disabled={!followup.trim()}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>
    </div>
  );
}
