export default function FollowingCarousel({ subreddits, onSubredditSelect }) {
  return (
    <div className="following-carousel">
      <div className="following-scroll">
        {subreddits.map((sub) => (
          <button key={sub.id} className="following-item" onClick={() => onSubredditSelect?.(sub)}>
            <div className="following-avatar-wrap">
              <div className="following-avatar" style={{ background: sub.color }}>
                <span>{sub.icon}</span>
              </div>
              {sub.hasUpdate && <span className="following-dot" />}
            </div>
            <span className="following-name">{sub.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
