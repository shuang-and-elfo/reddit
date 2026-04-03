function formatCount(n) {
  if (n >= 10000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return n.toString();
}

function truncateAtSentence(text, maxChars = 100) {
  if (text.length <= maxChars) return text;
  const trimmed = text.slice(0, maxChars);
  const lastEnd = Math.max(
    trimmed.lastIndexOf('. '),
    trimmed.lastIndexOf('! '),
    trimmed.lastIndexOf('? '),
    trimmed.lastIndexOf('."'),
    trimmed.lastIndexOf('!"'),
    trimmed.lastIndexOf('?"'),
  );
  if (lastEnd > 20) return text.slice(0, lastEnd + 1);
  const period = trimmed.lastIndexOf('.');
  if (period > 20) return text.slice(0, period + 1);
  return text;
}

function TileMeta({ post }) {
  return (
    <>
      <div className="tile-meta">
        <span
          className="tile-subreddit-icon"
          style={{ background: post.subredditColor + '22', color: post.subredditColor }}
        >
          {post.subredditIcon}
        </span>
        <span className="tile-subreddit-name">{post.subreddit}</span>
      </div>
      <div className="tile-stats">
        <span className="tile-stat">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
          <span className="format-count">{formatCount(post.upvotes)}</span>
        </span>
        <span className="tile-stat">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="format-count">{formatCount(post.comments)}</span>
        </span>
      </div>
    </>
  );
}

const TEXT_COLORS = [
  { bg: '#EEF2F7', accent: '#5B7A9D' },
  { bg: '#FDF6EC', accent: '#B8935A' },
  { bg: '#EDF5ED', accent: '#5A8A5E' },
  { bg: '#F3EDF7', accent: '#7E5EA0' },
  { bg: '#FDF0EC', accent: '#C27856' },
];

function pickTextColor(id) {
  let hash = 0;
  const s = String(id);
  for (let i = 0; i < s.length; i++) hash = s.charCodeAt(i) + ((hash << 5) - hash);
  return TEXT_COLORS[Math.abs(hash) % TEXT_COLORS.length];
}

function formatMembers(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'm';
  if (n >= 1000) return (n / 1000).toFixed(0) + 'k';
  return n.toString();
}

import { useState } from 'react';

export default function GridTile({ post, imageHeight, onClick, onSubredditSelect }) {
  const [joined, setJoined] = useState(false);

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    onClick(rect);
  };

  const isVideo = post.contentType === 'video';
  const isText = post.contentType === 'text';
  const isCommunity = post.contentType === 'community';
  const isGame = post.contentType === 'game';

  if (isGame) {
    const game = post.game;
    return (
      <div className="grid-tile grid-tile--game" onClick={handleClick}>
        <div className="tile-game-body">
          <span className="tile-game-tag">GAME</span>
          <p className="tile-game-prompt">{game.prompt}</p>
          <div className="tile-game-grid">
            {game.options.slice(0, 4).map((opt) => (
              <span key={opt.id} className="tile-game-cell"><span className="tile-game-cell-emoji">{opt.emoji}</span>{opt.label}</span>
            ))}
          </div>
          <span className="tile-game-votes">{game.totalVotes.toLocaleString()} votes</span>
        </div>
        <div className="tile-content">
          <div className="tile-title">{post.title}</div>
          <TileMeta post={post} />
        </div>
      </div>
    );
  }

  if (isCommunity) {
    const handleCommunityClick = () => {
      onSubredditSelect?.({
        name: post.subreddit,
        icon: post.subredditIcon,
        color: post.subredditColor,
      });
    };

    return (
      <div className="grid-tile grid-tile--community" onClick={handleCommunityClick}>
        <span
          className="community-icon"
          style={{ background: post.subredditColor + '18', color: post.subredditColor }}
        >
          {post.subredditIcon}
        </span>
        <span className="community-name">{post.subreddit}</span>
        <span className="community-members">{formatMembers(post.members)} members</span>
        <p className="community-tagline">{post.tagline}</p>
        <button
          className={`community-join${joined ? ' community-join--joined' : ''}`}
          style={joined ? {} : { background: post.subredditColor }}
          onClick={(e) => { e.stopPropagation(); setJoined(!joined); }}
        >
          {joined ? 'Joined' : 'Join'}
        </button>
      </div>
    );
  }

  if (isText) {
    const colors = pickTextColor(post.id);
    const bg = post.textBg || colors.bg;
    const accent = post.textAccent || colors.accent;
    const text = post.title;
    const len = text.length;
    const fontSize = len < 30 ? 22 : len < 60 ? 18 : len < 100 ? 16 : 15;
    return (
      <div className="grid-tile grid-tile--text" onClick={handleClick}>
        <div className="tile-text-body" style={{ background: bg }}>
          <span className="tile-text-tag" style={{ color: accent }}>
            {post.subredditIcon} {post.subreddit}
          </span>
          <p className="tile-text-content" style={{ fontSize }}>{text}</p>
        </div>
        <div className="tile-content">
          <TileMeta post={post} />
        </div>
      </div>
    );
  }

  const [imgError, setImgError] = useState(false);

  if (!post.image || imgError) {
    const colors = pickTextColor(post.id);
    const bg = colors.bg;
    const accent = colors.accent;
    const len = post.title.length;
    const fontSize = len < 30 ? 22 : len < 60 ? 18 : len < 100 ? 16 : 15;
    return (
      <div className="grid-tile grid-tile--text" onClick={handleClick}>
        <div className="tile-text-body" style={{ background: bg }}>
          <span className="tile-text-tag" style={{ color: accent }}>
            {post.subredditIcon} {post.subreddit}
          </span>
          <p className="tile-text-content" style={{ fontSize }}>{post.title}</p>
        </div>
        <div className="tile-content">
          <TileMeta post={post} />
        </div>
      </div>
    );
  }

  return (
    <div className="grid-tile" onClick={handleClick}>
      <div className="tile-image-wrap">
        <img
          className="tile-image"
          src={post.image}
          alt=""
          style={{ height: imageHeight }}
          loading="lazy"
          onError={() => setImgError(true)}
        />
        {isVideo && (
          <>
            <div className="tile-video-play">
              <svg viewBox="0 0 24 24" fill="#fff">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            {post.duration && (
              <span className="tile-video-duration">{post.duration}</span>
            )}
          </>
        )}
      </div>
      <div className="tile-content">
        <div className="tile-title">{post.title}</div>
        <TileMeta post={post} />
      </div>
    </div>
  );
}
