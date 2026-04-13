export default function BottomNav({ activeNav = 'home', onNavChange, onCreateClick }) {
  return (
    <nav className="bottom-nav">
      <button
        className={`nav-item${activeNav === 'home' ? ' active' : ''}`}
        onClick={() => onNavChange?.('home')}
      >
        <img className="nav-icon-img" src="/home-icon.png" alt="Home" />
        <span>Home</span>
      </button>

      <button
        className={`nav-item${activeNav === 'search' ? ' active' : ''}`}
        onClick={() => onNavChange?.('search')}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <circle cx="11" cy="11" r="7" />
          <line x1="16.5" y1="16.5" x2="21" y2="21" />
        </svg>
        <span>Search</span>
      </button>

      <button className="nav-create" onClick={() => onCreateClick?.()}>
        <div className="nav-create-inner">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </div>
      </button>

      <button className="nav-item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
        <span>Inbox</span>
      </button>

      <button className="nav-item">
        <img className="nav-avatar" src="/avatar.png" alt="You" />
        <span>You</span>
      </button>
    </nav>
  );
}
