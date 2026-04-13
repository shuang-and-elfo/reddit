import { useState, useEffect, useRef, useCallback } from 'react';
import { searchRedditPosts, searchRedditAutocomplete } from '../data/redditApi';
import AskNow from './AskNow';

function formatCount(n) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return n.toString();
}

function proxyImage(url) {
  if (!url) return null;
  if (url.includes('redd.it') || url.includes('redditmedia.com')) {
    return '/reddit-media/' + encodeURIComponent(url);
  }
  return url;
}

function parsePreviewText(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\n+/g, ' ')
    .slice(0, 160);
}

export default function SearchResults({ query, onBack, onPostSelect, onSubredditSelect }) {
  const [activeTab, setActiveTab] = useState('posts');
  const [posts, setPosts] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // AskNow inline card state
  const [askStatus, setAskStatus] = useState('loading');
  const [askSummary, setAskSummary] = useState('');
  const [askPosts, setAskPosts] = useState([]);
  const [askSuggestions, setAskSuggestions] = useState([]);
  const [showFullAsk, setShowFullAsk] = useState(false);
  const abortRef = useRef(null);

  // Fetch Reddit search results
  useEffect(() => {
    setLoadingPosts(true);
    setPosts([]);
    searchRedditPosts(query).then(results => {
      setPosts(results);
      setLoadingPosts(false);
    }).catch(() => setLoadingPosts(false));
  }, [query]);

  // Fetch community results
  useEffect(() => {
    searchRedditAutocomplete(query).then(r => setCommunities(r.subreddits));
  }, [query]);

  // Start AskNow SSE stream
  useEffect(() => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setAskStatus('loading');
    setAskSummary('');
    setAskPosts([]);
    setAskSuggestions([]);

    fetch(`/api/ask?q=${encodeURIComponent(query)}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(`API error ${res.status}`);
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = '';
        let accumulated = '';

        setAskStatus('streaming');

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
            if (payload === '[DONE]') { setAskStatus('done'); continue; }
            try {
              const data = JSON.parse(payload);
              if (data.type === 'meta') setAskPosts(data.posts);
              else if (data.type === 'token') { accumulated += data.content; setAskSummary(accumulated); }
              else if (data.type === 'suggestions') setAskSuggestions(data.prompts || []);
              else if (data.type === 'error') setAskStatus('error');
            } catch {}
          }
        }
      })
      .catch((err) => { if (err.name !== 'AbortError') setAskStatus('error'); });

    return () => controller.abort();
  }, [query]);

  const uniqueSubs = [...new Set(askPosts.map(p => p.subreddit))];
  const shownSubs = uniqueSubs.slice(0, 2);
  const extraCount = uniqueSubs.length - shownSubs.length;

  const tabs = [
    { id: 'posts', label: 'Posts' },
    { id: 'communities', label: 'Communities' },
    { id: 'comments', label: 'Comments' },
    { id: 'media', label: 'Media' },
  ];

  if (showFullAsk) {
    return (
      <AskNow
        query={query}
        onBack={() => setShowFullAsk(false)}
        onPostSelect={onPostSelect}
        onSubredditSelect={onSubredditSelect}
        prefetchedData={{ status: askStatus, summary: askSummary, posts: askPosts, suggestions: askSuggestions }}
      />
    );
  }

  return (
    <div className="search-results">
      {/* Header bar */}
      <div className="sr-header">
        <button className="sr-back" onClick={onBack}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className="sr-query-display">
          <span>{query}</span>
        </div>
      </div>

      <div className="sr-scroll">
        {/* AskNow inline card */}
        <button className="sr-ask-card" onClick={() => { if (askStatus === 'done') setShowFullAsk(true); }}>
          {(askStatus === 'loading' || askStatus === 'streaming') && (
            <div className="sr-ask-loading">
              <div className="sr-ask-loading-header">
                <div className="sr-ask-spinner" />
                <span>AskNow is summarizing...</span>
              </div>
              <div className="sr-ask-shimmer">
                <div className="sr-shimmer-line sr-shimmer-line--long" />
                <div className="sr-shimmer-line sr-shimmer-line--medium" />
                <div className="sr-shimmer-line sr-shimmer-line--short" />
              </div>
            </div>
          )}

          {askStatus === 'done' && (
            <div className="sr-ask-preview">
              <div className="sr-ask-preview-header">
                <img src="/asknow-logo.png" alt="" className="sr-ask-logo" />
                {askPosts.length > 0 && (
                  <span className="sr-ask-sources">
                    {shownSubs.join(', ')}{extraCount > 0 ? `, and ${extraCount} others` : ''}
                  </span>
                )}
              </div>
              <p className="sr-ask-preview-text">{parsePreviewText(askSummary)}</p>
              {askPosts.filter(p => p.image).length > 0 && (
                <div className="sr-ask-images">
                  {askPosts.filter(p => p.image).slice(0, 4).map((p) => (
                    <img
                      key={p.id}
                      className="sr-ask-img-thumb"
                      src={proxyImage(p.image)}
                      alt=""
                      loading="lazy"
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                  ))}
                </div>
              )}
              <div className="sr-ask-expand">
                <span>Read full AI summary</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="14" height="14">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </div>
          )}

          {askStatus === 'error' && (
            <div className="sr-ask-preview">
              <span className="sr-ask-error-text">Could not generate summary</span>
            </div>
          )}
        </button>

        {/* Tab bar */}
        <div className="sr-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`sr-tab${activeTab === tab.id ? ' sr-tab--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="sr-content">
          {activeTab === 'posts' && (
            <>
              {loadingPosts ? (
                <div className="sr-loading-posts">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="sr-post-skeleton">
                      <div className="sr-skel-text">
                        <div className="sr-shimmer-line sr-shimmer-line--medium" />
                        <div className="sr-shimmer-line sr-shimmer-line--long" />
                        <div className="sr-shimmer-line sr-shimmer-line--short" />
                      </div>
                      <div className="sr-skel-thumb" />
                    </div>
                  ))}
                </div>
              ) : posts.length === 0 ? (
                <div className="sr-empty">No posts found</div>
              ) : (
                <div className="sr-post-list">
                  {posts.map(post => (
                    <button
                      key={post.id}
                      className="sr-post-row"
                      onClick={() => onPostSelect?.(post)}
                    >
                      <div className="sr-post-info">
                        <div className="sr-post-meta">
                          {post.subredditIconUrl ? (
                            <img className="sr-post-sub-img" src={post.subredditIconUrl} alt="" onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                          ) : null}
                          <span className="sr-post-sub-icon" style={{ background: post.subredditColor + '22', color: post.subredditColor, display: post.subredditIconUrl ? 'none' : 'flex' }}>
                            {post.subredditIcon}
                          </span>
                          <span className="sr-post-sub">{post.subreddit}</span>
                          <span className="sr-post-dot">·</span>
                          <span className="sr-post-time">{post.timeAgo}</span>
                        </div>
                        <h3 className="sr-post-title">{post.title}</h3>
                        <div className="sr-post-stats">
                          <span>{formatCount(post.upvotes)} upvotes</span>
                          <span className="sr-post-dot">·</span>
                          <span>{formatCount(post.comments)} comments</span>
                        </div>
                      </div>
                      {post.image && (
                        <img
                          className="sr-post-thumb"
                          src={proxyImage(post.image)}
                          alt=""
                          loading="lazy"
                          onError={e => { e.target.style.display = 'none'; }}
                        />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'communities' && (
            <div className="sr-community-list">
              {communities.length === 0 ? (
                <div className="sr-empty">No communities found</div>
              ) : (
                communities.map(sub => (
                  <button
                    key={sub.id}
                    className="sr-community-row"
                    onClick={() => onSubredditSelect?.({
                      id: sub.id,
                      name: sub.name,
                      icon: sub.icon || sub.displayName.charAt(0).toUpperCase(),
                      color: sub.color,
                      members: sub.members || '',
                    })}
                  >
                    <div className="sr-community-icon">
                      {sub.iconUrl ? (
                        <img src={sub.iconUrl} alt="" onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                      ) : null}
                      <div className="sr-community-icon-fb" style={{ background: sub.color, display: sub.iconUrl ? 'none' : 'flex' }}>
                        {sub.icon || sub.displayName.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div className="sr-community-info">
                      <span className="sr-community-name">{sub.name}</span>
                      <span className="sr-community-meta">{sub.members ? sub.members + ' members' : ''}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="sr-empty">Comment search coming soon</div>
          )}

          {activeTab === 'media' && (
            <div className="sr-empty">Media search coming soon</div>
          )}
        </div>
      </div>
    </div>
  );
}
