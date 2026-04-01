import { useState, useRef } from 'react';
import { trendingSearches, favoriteSubreddits, myCommunitiesList } from '../data/posts';

export default function SearchTab({ onSubredditSelect }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const [focused, setFocused] = useState(false);

  const filteredCommunities = query
    ? myCommunitiesList.filter(c =>
        c.name.toLowerCase().includes(query.toLowerCase())
      )
    : myCommunitiesList;

  const filteredFavorites = query
    ? favoriteSubreddits.filter(c =>
        c.name.toLowerCase().includes(query.toLowerCase())
      )
    : favoriteSubreddits;

  const showEmpty = query && filteredCommunities.length === 0 && filteredFavorites.length === 0;

  return (
    <div className="search-tab">
      {/* Search bar */}
      <div className="search-tab-bar">
        <div className={`search-input-wrap${focused ? ' focused' : ''}`}>
          <svg className="search-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <line x1="16.5" y1="16.5" x2="21" y2="21" />
          </svg>
          <input
            ref={inputRef}
            className="search-input"
            type="text"
            placeholder="Search Reddit"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
          {query && (
            <button className="search-clear" onClick={() => { setQuery(''); inputRef.current?.focus(); }}>
              <svg viewBox="0 0 20 20" fill="currentColor">
                <circle cx="10" cy="10" r="10" opacity="0.12" />
                <path d="M7 7l6 6M13 7l-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="search-tab-scroll">
        {showEmpty ? (
          <div className="search-no-results">
            <span className="search-no-results-icon">🔍</span>
            <p>No results for "{query}"</p>
          </div>
        ) : (
          <>
            {/* Trending */}
            {!query && (
              <section className="search-section">
                <div className="search-section-header">
                  <svg className="search-section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                    <polyline points="17 6 23 6 23 12" />
                  </svg>
                  <h3>Trending</h3>
                </div>
                <div className="trending-pills">
                  {trendingSearches.map(term => (
                    <button
                      key={term}
                      className="trending-pill"
                      onClick={() => setQuery(term)}
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Favorites */}
            {filteredFavorites.length > 0 && (
              <section className="search-section">
                <div className="search-section-header">
                  <svg className="search-section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  <h3>Favorites</h3>
                </div>
                <div className="favorites-grid">
                  {filteredFavorites.map(sub => (
                    <button key={sub.id} className="favorite-card" onClick={() => onSubredditSelect?.(sub)}>
                      <div className="favorite-card-banner" style={{ background: sub.color }} />
                      <div className="favorite-card-body">
                        <div className="favorite-card-icon" style={{ background: sub.color }}>
                          <span>{sub.icon}</span>
                        </div>
                        <span className="favorite-card-name">{sub.name}</span>
                        <span className="favorite-card-members">{sub.members}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Communities */}
            {filteredCommunities.length > 0 && (
              <section className="search-section search-section--communities">
                <div className="search-section-header">
                  <svg className="search-section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 00-3-3.87" />
                    <path d="M16 3.13a4 4 0 010 7.75" />
                  </svg>
                  <h3>Your Communities</h3>
                </div>
                <div className="communities-list">
                  {filteredCommunities.map(sub => (
                    <button key={sub.id} className="community-row" onClick={() => onSubredditSelect?.(sub)}>
                      <div className="community-row-icon" style={{ background: sub.color }}>
                        <span>{sub.icon}</span>
                      </div>
                      <div className="community-row-info">
                        <span className="community-row-name">{sub.name}</span>
                        <span className="community-row-meta">{sub.members} members · {sub.online} online</span>
                      </div>
                      <svg className="community-row-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
