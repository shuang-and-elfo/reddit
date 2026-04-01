import { useState, useEffect, useCallback } from 'react';
import { fetchRedditPosts } from '../data/redditApi';
import { myCommunitiesList, favoriteSubreddits, followedSubreddits } from '../data/posts';

function formatCount(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'm';
  if (n >= 10000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return n.toString();
}

const SORT_TABS = [
  { id: 'hot', label: 'Hot', icon: '🔥' },
  { id: 'new', label: 'New', icon: '✨' },
  { id: 'top', label: 'Top', icon: '📈' },
];

function resolveSubredditMeta(subredditName) {
  const cleanName = subredditName.replace(/^r\//, '');
  const allSources = [...myCommunitiesList, ...favoriteSubreddits, ...followedSubreddits];
  const match = allSources.find(
    (s) => s.name.replace(/^r\//, '').toLowerCase() === cleanName.toLowerCase()
  );
  return match || null;
}

export default function SubredditPage({ subreddit, onClose, onPostSelect }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSort, setActiveSort] = useState('hot');
  const [joined, setJoined] = useState(false);

  const sub = subreddit?.name || subreddit;
  const cleanName = sub?.replace(/^r\//, '') || '';
  const meta = resolveSubredditMeta(cleanName);

  const icon = subreddit?.icon || meta?.icon || cleanName.charAt(0).toUpperCase();
  const color = subreddit?.color || meta?.color || '#0079D3';
  const members = subreddit?.members || meta?.members || null;
  const description = subreddit?.description || meta?.description || null;
  const online = meta?.online || null;

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const sortPath = activeSort === 'hot' ? '' : `/${activeSort}`;
      const data = await fetchRedditPosts(`r/${cleanName}${sortPath}`);
      setPosts(data);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [cleanName, activeSort]);

  useEffect(() => {
    if (cleanName) loadPosts();
  }, [cleanName, loadPosts]);

  useEffect(() => {
    const isFollowed = followedSubreddits.some(
      (s) => s.name.replace(/^r\//, '').toLowerCase() === cleanName.toLowerCase()
    );
    setJoined(isFollowed);
  }, [cleanName]);

  const handlePostClick = (post, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    onPostSelect?.(post, rect);
  };

  return (
    <div className="subreddit-page">
      {/* Banner */}
      <div className="subreddit-banner" style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}>
        <div className="subreddit-banner-overlay" />
        <div className="subreddit-banner-actions">
          <button className="subreddit-back" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <div className="subreddit-banner-right">
            <button className="subreddit-header-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round">
                <circle cx="11" cy="11" r="7" />
                <line x1="16.5" y1="16.5" x2="21" y2="21" />
              </svg>
            </button>
            <button className="subreddit-header-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
            </button>
            <button className="subreddit-header-btn">
              <svg viewBox="0 0 24 24" fill="#fff">
                <circle cx="12" cy="5" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="12" cy="19" r="1.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Info section */}
      <div className="subreddit-info">
        <div className="subreddit-info-top">
          <div className="subreddit-info-icon" style={{ background: color }}>
            <span>{icon}</span>
          </div>
          <div className="subreddit-info-text">
            <h1 className="subreddit-info-name">r/{cleanName}</h1>
            <div className="subreddit-info-stats">
              {members && <span>{members} members</span>}
              {online && <span className="subreddit-online-dot">{online} online</span>}
            </div>
          </div>
          <button
            className={`subreddit-join-btn${joined ? ' subreddit-join-btn--joined' : ''}`}
            onClick={() => setJoined(!joined)}
          >
            {joined ? 'Joined' : 'Join'}
          </button>
        </div>
        {description && <p className="subreddit-info-desc">{description}</p>}
      </div>

      {/* Sort tabs */}
      <div className="subreddit-sort-bar">
        {SORT_TABS.map((tab) => (
          <button
            key={tab.id}
            className={`subreddit-sort-tab${activeSort === tab.id ? ' active' : ''}`}
            onClick={() => setActiveSort(tab.id)}
          >
            <span className="subreddit-sort-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Feed */}
      <div className="subreddit-feed-scroll">
        {loading ? (
          <div className="subreddit-feed-loading">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="sub-post-skeleton">
                <div className="sub-post-skeleton-header">
                  <div className="skeleton-circle" />
                  <div className="skeleton-lines">
                    <div className="skeleton-line" style={{ width: '40%' }} />
                    <div className="skeleton-line" style={{ width: '25%' }} />
                  </div>
                </div>
                <div className="skeleton-line" style={{ width: '90%', height: 14 }} />
                <div className="skeleton-line" style={{ width: '70%', height: 14 }} />
                <div className="skeleton-image-block" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="subreddit-empty">
            <span className="subreddit-empty-icon">📭</span>
            <p>No posts found</p>
          </div>
        ) : (
          <div className="subreddit-feed">
            {posts.map((post) => (
              <article
                key={post.id}
                className="sub-post-card"
                onClick={(e) => handlePostClick(post, e)}
              >
                <div className="sub-post-header">
                  <span
                    className="sub-post-avatar"
                    style={{ background: post.subredditColor + '22', color: post.subredditColor }}
                  >
                    {post.subredditIcon}
                  </span>
                  <div className="sub-post-author-info">
                    <span className="sub-post-user">{post.user}</span>
                    <span className="sub-post-time">{post.timeAgo}</span>
                  </div>
                  <button className="sub-post-more" onClick={(e) => e.stopPropagation()}>
                    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                      <circle cx="5" cy="12" r="1.5" />
                      <circle cx="12" cy="12" r="1.5" />
                      <circle cx="19" cy="12" r="1.5" />
                    </svg>
                  </button>
                </div>

                <h3 className="sub-post-title">{post.title}</h3>

                {post.body && (
                  <p className="sub-post-body">
                    {post.body.length > 160 ? post.body.slice(0, 160) + '...' : post.body}
                  </p>
                )}

                {post.image && (
                  <div className="sub-post-image-wrap">
                    <img
                      className="sub-post-image"
                      src={post.image}
                      alt=""
                      loading="lazy"
                    />
                  </div>
                )}

                <div className="sub-post-actions">
                  <div className="sub-post-vote">
                    <button className="sub-post-vote-btn" onClick={(e) => e.stopPropagation()}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 19V5M5 12l7-7 7 7" />
                      </svg>
                    </button>
                    <span className="sub-post-vote-count">{formatCount(post.upvotes)}</span>
                    <button className="sub-post-vote-btn" onClick={(e) => e.stopPropagation()}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 5v14M5 12l7 7 7-7" />
                      </svg>
                    </button>
                  </div>
                  <button className="sub-post-action-btn" onClick={(e) => e.stopPropagation()}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                    </svg>
                    <span>{formatCount(post.comments)}</span>
                  </button>
                  <button className="sub-post-action-btn" onClick={(e) => e.stopPropagation()}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                      <polyline points="16 6 12 2 8 6" />
                      <line x1="12" y1="2" x2="12" y2="15" />
                    </svg>
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
