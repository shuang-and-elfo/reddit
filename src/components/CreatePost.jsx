import { useState, useRef, useEffect } from 'react';
import { fetchRedditPosts } from '../data/redditApi';

export default function CreatePost({ visible, onClose, onPostSelect }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [showRulesWarning, setShowRulesWarning] = useState(false);
  const [titleFocused, setTitleFocused] = useState(false);
  const [showFirstPostBadge, setShowFirstPostBadge] = useState(true);
  const [communityPosts, setCommunityPosts] = useState([]);
  const titleRef = useRef(null);

  useEffect(() => {
    if (visible) {
      setTitle('');
      setBody('');
      setShowRulesWarning(false);
      setShowFirstPostBadge(true);
      setTimeout(() => titleRef.current?.focus(), 350);
    }
  }, [visible]);

  useEffect(() => {
    let cancelled = false;
    fetchRedditPosts('r/olympics', 10)
      .then((posts) => {
        if (!cancelled) setCommunityPosts(posts.slice(0, 5));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const handlePost = () => {
    if (title.trim().length < 20) {
      setShowRulesWarning(true);
      return;
    }
    setShowRulesWarning(false);
    onClose();
  };

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
    if (showRulesWarning && e.target.value.trim().length >= 20) {
      setShowRulesWarning(false);
    }
  };

  if (!visible) return null;

  const canPost = title.trim().length >= 20;

  return (
    <div className="create-post-overlay">
      {/* Header */}
      <div className="create-post-header">
        <button className="create-post-close" onClick={onClose}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <div className="create-post-community-picker">
          <span className="create-post-community-icon">🏅</span>
          <span className="create-post-community-name">r/olympics</span>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3,4.5 6,7.5 9,4.5" />
          </svg>
        </div>
        <button
          className={`create-post-submit${canPost ? ' create-post-submit--active' : ''}`}
          onClick={handlePost}
        >
          Post
        </button>
      </div>

      {/* Scrollable content */}
      <div className="create-post-scroll">
        {/* Title input */}
        <div className="create-post-title-area">
          <textarea
            ref={titleRef}
            className="create-post-title-input"
            placeholder="What's on your mind?"
            value={title}
            onChange={handleTitleChange}
            onFocus={() => setTitleFocused(true)}
            onBlur={() => setTitleFocused(false)}
            rows={1}
            maxLength={300}
          />
          {showRulesWarning && (
            <div className="create-post-warning">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="6" stroke="#FF4500" strokeWidth="1.5"/>
                <line x1="7" y1="4" x2="7" y2="7.5" stroke="#FF4500" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="7" cy="9.5" r="0.75" fill="#FF4500"/>
              </svg>
              <span>Titles need at least 20 characters in r/olympics</span>
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="create-post-tags-row">
          {showFirstPostBadge && (
            <span className="create-post-badge">
              <span className="create-post-badge-emoji">🎉</span>
              <span className="create-post-badge-text">First post in r/olympics</span>
              <button
                className="create-post-badge-x"
                onClick={() => setShowFirstPostBadge(false)}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <line x1="3" y1="3" x2="9" y2="9"/>
                  <line x1="9" y1="3" x2="3" y2="9"/>
                </svg>
              </button>
            </span>
          )}
          <button className="create-post-tags-btn" style={{ marginLeft: showFirstPostBadge ? 0 : undefined }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.5 7.8l-4.7 4.7a1 1 0 01-1.4 0L1.5 7.6V1.5h6.1l4.9 4.9a1 1 0 010 1.4z"/>
              <circle cx="4.5" cy="4.5" r="0.8" fill="currentColor" stroke="none"/>
            </svg>
            Add tags (optional)
          </button>
        </div>

        {/* Body input */}
        <textarea
          className="create-post-body-input"
          placeholder="Add some details (optional)"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
        />

      </div>

      {/* Bottom: examples + toolbar + keyboard */}
      <div className="create-post-bottom">
        {/* Community examples carousel */}
        {title.length === 0 && body.length === 0 && communityPosts.length > 0 && (
          <div className="create-post-examples">
            <div className="create-post-examples-header">
              <span>What people are posting in r/olympics right now</span>
            </div>
            <div className="create-post-examples-carousel-wrap">
            <div className="create-post-examples-carousel">
              {communityPosts.map((post) => (
                <button
                  key={post.id}
                  className="create-post-example-card"
                  onClick={() => {
                    onClose();
                    onPostSelect?.(post);
                  }}
                >
                  <div className="create-post-example-top">
                    {post.image && (
                      <img className="create-post-example-thumb" src={post.image} alt="" />
                    )}
                    <div className="create-post-example-info">
                      <div className="create-post-example-title">{post.title}</div>
                      <div className="create-post-example-meta">
                        <span className="create-post-example-stat">
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="5,1 9,5 5,9" transform="rotate(-90 5 5)" />
                          </svg>
                          {post.upvotes >= 1000 ? (post.upvotes / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : post.upvotes}
                        </span>
                        <span className="create-post-example-stat">
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                            <path d="M1 7.5V3a1.5 1.5 0 011.5-1.5h5A1.5 1.5 0 019 3v2.5A1.5 1.5 0 017.5 7H4L2 9V7.5z"/>
                          </svg>
                          {post.comments}
                        </span>
                        <span className="create-post-example-time">{post.timeAgo}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            </div>
          </div>
        )}
        <div className="create-post-toolbar">
          <img
            className="create-post-toolbar-img"
            src="/toolbar-icons.png"
            alt="Link, Image, Video, Poll, AMA, Format"
            draggable={false}
          />
        </div>
        <div className="fake-keyboard">
          <div className="fake-kb-suggestions">
            <span>I</span>
            <span>The</span>
            <span>I'm</span>
          </div>
          <div className="fake-kb-row">
            {'QWERTYUIOP'.split('').map(k => <span key={k} className="fake-kb-key">{k}</span>)}
          </div>
          <div className="fake-kb-row fake-kb-row--mid">
            {'ASDFGHJKL'.split('').map(k => <span key={k} className="fake-kb-key">{k}</span>)}
          </div>
          <div className="fake-kb-row">
            <span className="fake-kb-key fake-kb-key--shift">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M3 9h3v4h4V9h3L8 3 3 9z"/></svg>
            </span>
            {'ZXCVBNM'.split('').map(k => <span key={k} className="fake-kb-key">{k}</span>)}
            <span className="fake-kb-key fake-kb-key--shift">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M5 7l3 3 3-3H9V4H7v3H5z" transform="rotate(0 8 8)"/><rect x="4" y="11" width="8" height="1.5" rx="0.5"/></svg>
            </span>
          </div>
          <div className="fake-kb-row fake-kb-row--bottom">
            <span className="fake-kb-key fake-kb-key--fn">123</span>
            <span className="fake-kb-key fake-kb-key--fn">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.3"><circle cx="9" cy="9" r="7"/><circle cx="6.5" cy="7.5" r="0.8" fill="currentColor" stroke="none"/><circle cx="11.5" cy="7.5" r="0.8" fill="currentColor" stroke="none"/><path d="M6.5 11.5s1 1.5 2.5 1.5 2.5-1.5 2.5-1.5" strokeLinecap="round"/></svg>
            </span>
            <span className="fake-kb-key fake-kb-key--space">space</span>
            <span className="fake-kb-key fake-kb-key--go">next</span>
          </div>
          <div className="fake-kb-bottom-row">
            <span className="fake-kb-bottom-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="10" r="8"/><line x1="10" y1="6" x2="10" y2="14"/><line x1="6" y1="10" x2="14" y2="10"/></svg>
            </span>
            <span className="fake-kb-bottom-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="10" cy="16" r="2" fill="currentColor" stroke="none"/><path d="M4 8l6-4 6 4"/><path d="M6 10l4-2.5L14 10"/></svg>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
