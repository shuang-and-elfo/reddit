import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchComments } from '../data/redditApi';

function ImageCarousel({ images }) {
  const [current, setCurrent] = useState(0);
  const trackRef = useRef(null);
  const touchStart = useRef(null);
  const touchDelta = useRef(0);
  const dragging = useRef(false);

  const goTo = useCallback((idx) => {
    setCurrent(Math.max(0, Math.min(idx, images.length - 1)));
  }, [images.length]);

  const handleTouchStart = (e) => {
    touchStart.current = e.touches[0].clientX;
    dragging.current = true;
    touchDelta.current = 0;
    if (trackRef.current) trackRef.current.style.transition = 'none';
  };

  const handleTouchMove = (e) => {
    if (!dragging.current || touchStart.current === null) return;
    touchDelta.current = e.touches[0].clientX - touchStart.current;
    if (trackRef.current) {
      const offset = -(current * 100) + (touchDelta.current / trackRef.current.parentElement.offsetWidth) * 100;
      trackRef.current.style.transform = `translateX(${offset}%)`;
    }
  };

  const handleTouchEnd = () => {
    dragging.current = false;
    if (trackRef.current) trackRef.current.style.transition = '';
    const threshold = 50;
    if (touchDelta.current < -threshold) goTo(current + 1);
    else if (touchDelta.current > threshold) goTo(current - 1);
    else goTo(current);
    touchStart.current = null;
    touchDelta.current = 0;
  };

  useEffect(() => {
    if (trackRef.current) {
      trackRef.current.style.transform = `translateX(-${current * 100}%)`;
    }
  }, [current]);

  return (
    <div className="carousel">
      <div
        className="carousel-viewport"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="carousel-track" ref={trackRef}>
          {images.map((src, i) => (
            <img
              key={i}
              className="carousel-slide"
              src={src}
              alt=""
              loading={i === 0 ? 'eager' : 'lazy'}
              draggable={false}
            />
          ))}
        </div>
      </div>
      <div className="carousel-counter">{current + 1} / {images.length}</div>
      <div className="carousel-dots">
        {images.map((_, i) => (
          <span
            key={i}
            className={`carousel-dot${i === current ? ' carousel-dot--active' : ''}`}
            onClick={() => goTo(i)}
          />
        ))}
      </div>
    </div>
  );
}

function GameCard({ game }) {
  const [selected, setSelected] = useState(null);

  const handlePick = (id) => {
    if (selected) return;
    setSelected(id);
  };

  return (
    <div className="game-card">
      <div className="game-card-header">
        <span className="game-card-prompt">{game.prompt}</span>
      </div>
      <div className="game-grid">
        {game.options.map((opt) => (
          <div
            key={opt.id}
            className={`game-cell${selected === opt.id ? ' game-cell--picked' : ''}${selected && selected !== opt.id ? ' game-cell--dimmed' : ''}`}
            onClick={() => handlePick(opt.id)}
          >
            <span className="game-cell-emoji">{opt.emoji}</span>
            <span className="game-cell-label">{opt.label}</span>
          </div>
        ))}
      </div>
      <div className="game-card-footer">
        <span className="game-vote-count">{game.totalVotes.toLocaleString()} votes</span>
        {!selected && <span className="game-cta">Tap to see what others picked</span>}
        {selected && <span className="game-cta game-cta--revealed">Thanks for voting!</span>}
      </div>
    </div>
  );
}

function formatCount(n) {
  if (n >= 10000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return n.toString();
}

function CommentBody({ text }) {
  const parts = text.split(/(!\[(?:img|image)?\]\([^)]+\))/g);
  const imgPattern = /^!\[(?:img|image)?\]\(([^)]+)\)$/;

  const elements = parts.map((part, i) => {
    const match = part.match(imgPattern);
    if (match) {
      const url = match[1].startsWith('/reddit-media/')
        ? match[1]
        : (match[1].includes('redd.it') || match[1].includes('redditmedia.com'))
          ? '/reddit-media/' + encodeURIComponent(match[1])
          : match[1];
      return <img key={i} src={url} alt="" className="comment-inline-img" loading="lazy" />;
    }
    if (!part) return null;
    return <span key={i}>{part}</span>;
  });

  return <div className="comment-text">{elements}</div>;
}

const AVATAR_POOL = ['🧑', '👩', '🧔', '👱', '🧑‍💻', '👩‍🦰', '🧑‍🎤', '👨‍🔬', '👩‍💼', '🧑‍🚀'];

function pickAvatar(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_POOL[Math.abs(hash) % AVATAR_POOL.length];
}

function getOriginStyle(origin, containerRef) {
  if (!origin || !containerRef.current) return '50% 50%';
  const container = containerRef.current.getBoundingClientRect();
  const x = origin.left + origin.width / 2 - container.left;
  const y = origin.top + origin.height / 2 - container.top;
  return `${x}px ${y}px`;
}

function CommentSkeleton() {
  return (
    <div className="comment">
      <div className="comment-avatar comment-skeleton-pulse" style={{ opacity: 0.4 }} />
      <div className="comment-content">
        <div className="comment-meta">
          <span className="comment-skeleton-bar" style={{ width: 80 }} />
          <span className="comment-skeleton-bar" style={{ width: 24 }} />
        </div>
        <div className="comment-skeleton-bar" style={{ width: '90%', height: 12, marginTop: 6 }} />
        <div className="comment-skeleton-bar" style={{ width: '60%', height: 12, marginTop: 4 }} />
      </div>
    </div>
  );
}

export default function PostDetail({ post, onClose, isFollowing, tileOrigin, onSubredditSelect }) {
  const containerRef = useRef(null);
  const originRef = useRef('50% 50%');
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);

  if (tileOrigin && containerRef.current) {
    originRef.current = getOriginStyle(tileOrigin, containerRef);
  } else if (tileOrigin) {
    const x = tileOrigin.left + tileOrigin.width / 2;
    const y = tileOrigin.top + tileOrigin.height / 2;
    originRef.current = `${x}px ${y}px`;
  }

  useEffect(() => {
    if (!post) {
      setComments([]);
      return;
    }

    if (post.mockComments) {
      setComments(post.mockComments);
      setLoadingComments(false);
      return;
    }

    let cancelled = false;
    setLoadingComments(true);
    setComments([]);

    fetchComments(post.subreddit, post.id, 20)
      .then((data) => {
        if (!cancelled) setComments(data);
      })
      .catch(() => {
        if (!cancelled) setComments([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingComments(false);
      });

    return () => { cancelled = true; };
  }, [post?.id, post?.subreddit]);

  return (
    <AnimatePresence>
      {post && (
        <div className="post-detail-overlay" key={post.id} ref={containerRef}>
          <motion.div
            className="post-detail-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            className="post-detail"
            style={{ transformOrigin: originRef.current }}
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div className="post-detail-header">
              <button className="post-detail-close" onClick={onClose}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>

              <div
                className="post-detail-subreddit"
                onClick={() => onSubredditSelect?.({
                  name: post.subreddit,
                  icon: post.subredditIcon,
                  color: post.subredditColor,
                })}
                style={{ cursor: 'pointer' }}
              >
                <span
                  className="post-detail-subreddit-icon"
                  style={{ background: post.subredditColor + '22', color: post.subredditColor }}
                >
                  {post.subredditIcon}
                </span>
                {post.subreddit}
              </div>

              {isFollowing ? (
                <button className="post-detail-join post-detail-join--joined">Joined</button>
              ) : (
                <button className="post-detail-join">Join</button>
              )}

              <button className="post-detail-share">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>
              </button>
            </div>

            <div className="post-detail-scroll">
              {post.contentType === 'video' && post.video ? (
                <video
                  className="post-detail-video"
                  src={post.video}
                  poster={post.image}
                  controls
                  autoPlay
                  playsInline
                  loop
                />
              ) : post.images?.length > 1 ? (
                <ImageCarousel images={post.images} />
              ) : post.image ? (
                <img
                  className="post-detail-image"
                  src={post.image}
                  alt=""
                />
              ) : null}
              <div className="post-detail-body">
                {post.contentType === 'game' && <span className="post-detail-game-tag">🎮 GAME</span>}
                <div className="post-detail-user">{post.user} &middot; {post.timeAgo}</div>
                <h1 className="post-detail-title">{post.title}</h1>
                {post.game && <GameCard game={post.game} />}
                {post.body && <p className="post-detail-text">{post.body}</p>}

                <div className="post-detail-comments-section">
                  <div className="comments-header">
                    {formatCount(post.comments)} comment{post.comments !== 1 ? 's' : ''}
                  </div>

                  {loadingComments ? (
                    <>
                      <CommentSkeleton />
                      <CommentSkeleton />
                      <CommentSkeleton />
                    </>
                  ) : comments.length > 0 ? (
                    comments.map((c) => (
                      <div key={c.id} className="comment">
                        <div className="comment-avatar">{pickAvatar(c.author)}</div>
                        <div className="comment-content">
                          <div className="comment-meta">
                            <span className="comment-user">{c.author}</span>
                            {c.isSubmitter && <span className="comment-author-tag">OP</span>}
                            <span className="comment-time">{c.timeAgo}</span>
                          </div>
                          <CommentBody text={c.body} />
                          <div className="comment-actions">
                            <span className="comment-action">Reply</span>
                            <span className="comment-likes">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" />
                              </svg>
                              {formatCount(c.ups)}
                            </span>
                          </div>

                          {c.replies?.length > 0 && (
                            <div className="comment-replies">
                              {c.replies.map((r) => (
                                <div key={r.id} className="comment comment-reply">
                                  <div className="comment-avatar comment-avatar--small">{pickAvatar(r.author)}</div>
                                  <div className="comment-content">
                                    <div className="comment-meta">
                                      <span className="comment-user">{r.author}</span>
                                      {r.isSubmitter && <span className="comment-author-tag">OP</span>}
                                      <span className="comment-time">{r.timeAgo}</span>
                                    </div>
                                    <CommentBody text={r.body} />
                                    <div className="comment-actions">
                                      <span className="comment-action">Reply</span>
                                      <span className="comment-likes">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" />
                                        </svg>
                                        {formatCount(r.ups)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="comments-empty">No comments yet</p>
                  )}
                </div>
              </div>
            </div>

            <div className="post-detail-input-bar">
              <input
                className="input-bar-field"
                placeholder="Join the conversation"
                readOnly={false}
              />
              <div className="input-bar-engagement">
                <span className="engagement-item">
                  <img src="/icons/upvote-arrow.png" alt="Upvote" className="upvote-arrow-icon" />
                  {formatCount(post.upvotes)}
                </span>
                <span className="engagement-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                  </svg>
                  {formatCount(post.comments)}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
