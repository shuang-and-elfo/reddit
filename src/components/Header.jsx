export default function Header() {
  return (
    <header className="header">
      <div className="header-menu">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="18" x2="20" y2="18" />
        </svg>

      </div>

      <div className="header-search">
        <img className="header-search-snoo" src="/snoo.png" alt="Reddit" />
        <span>Find anything</span>
      </div>
    </header>
  );
}
