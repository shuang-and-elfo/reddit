import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchComments } from '../data/redditApi';

function formatCount(n) {
  if (n >= 10000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return n.toString();
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

    fetchComments(post.subreddit, post.id, 5)
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
              <span className="post-detail-subreddit-icon" style={{ fontSize: 11 }}>{post.subredditIcon}</span>
              <div
                className="post-detail-subreddit"
                onClick={() => onSubredditSelect?.({
                  name: post.subreddit,
                  icon: post.subredditIcon,
                  color: post.subredditColor,
                })}
                style={{ cursor: 'pointer' }}
              >
                {post.subreddit} — Reddit
              </div>

              {/* Win2K title bar buttons */}
              <div className="win-title-buttons">
                <button className="win-title-btn" aria-label="Minimize">_</button>
                <button className="win-title-btn" aria-label="Maximize">□</button>
                <button className="win-title-btn" aria-label="Close" onClick={onClose} style={{ fontWeight: 900 }}>✕</button>
              </div>
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
              ) : post.image ? (
                <img
                  className="post-detail-image"
                  src={post.image}
                  alt=""
                />
              ) : null}
              <div className="post-detail-body">
                <div className="post-detail-user">{post.user} &middot; {post.timeAgo}</div>
                <h1 className="post-detail-title">{post.title}</h1>
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
                          <p className="comment-text">{c.body}</p>
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
                                    <p className="comment-text">{r.body}</p>
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
              <div className="input-bar-field">Join the conversation</div>
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
