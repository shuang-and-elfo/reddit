const tabs = [
  { id: 'following', label: 'Following' },
  { id: 'explore', label: 'Explore' },
  { id: 'nearby', label: 'Local' },
];

export default function TabBar({ activeTab, onTabChange, onSearchClick }) {
  return (
    <nav className="tab-bar">
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
  );
}
