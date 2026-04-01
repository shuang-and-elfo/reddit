const tabs = [
  { id: 'following', label: 'Following' },
  { id: 'explore', label: 'Explore' },
  { id: 'nearby', label: 'Local' },
];

export default function TabBar({ activeTab, onTabChange, onSearchClick }) {
  return (
    <div style={{ background: 'var(--win-face)', flexShrink: 0 }}>
      {/* Win2K Title Bar */}
      <div className="win-title-bar" style={{ paddingTop: '48px', paddingBottom: '3px' }}>
        <span style={{ fontSize: '9px', marginRight: '4px' }}>🌐</span>
        <span className="win-title-bar-text">Reddit — Microsoft Internet Explorer</span>
        <div className="win-title-buttons">
          <button className="win-title-btn" aria-label="Minimize">_</button>
          <button className="win-title-btn" aria-label="Maximize">□</button>
          <button className="win-title-btn" aria-label="Close" style={{ fontWeight: 900 }}>✕</button>
        </div>
      </div>
      {/* Menu Bar */}
      <nav className="tab-bar" style={{ paddingTop: '4px' }}>
        <button className="tab-bar-icon" aria-label="Menu">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="18" x2="20" y2="18" />
          </svg>
        </button>
        <div className="tab-bar-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-item${activeTab === tab.id ? ' active' : ''}`}
              onClick={() => onTabChange(tab.id)}
            >
              {tab.label}
              {tab.hasNotification && <span className="notification-dot" />}
            </button>
          ))}
        </div>
        <button className="tab-bar-icon" aria-label="Search" onClick={onSearchClick}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <line x1="16.5" y1="16.5" x2="21" y2="21" />
          </svg>
        </button>
      </nav>
    </div>
  );
}
