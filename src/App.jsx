import { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';
import TabBar from './components/TabBar';
import InterestPills from './components/InterestPills';
import FollowingCarousel from './components/FollowingCarousel';
import GridFeed from './components/GridFeed';
import PostDetail from './components/PostDetail';
import BottomNav from './components/BottomNav';
import SearchTab from './components/SearchTab';
import SubredditPage from './components/SubredditPage';
import CreatePost from './components/CreatePost';
import {
  explorePosts,
  followingPosts,
  nearbyPosts,
  followedSubreddits,
  interests,
} from './data/posts';
import { fetchRedditPosts, fetchMoreRedditPosts, SOURCES, INTEREST_SOURCES } from './data/redditApi';

const fallbackByTab = {
  explore: explorePosts,
  following: followingPosts,
  nearby: nearbyPosts,
};

const SPECIAL_TILES = [
  {
    index: 2,
    post: {
      id: '__video_tile',
      subreddit: 'r/ClaudeAI',
      subredditIcon: '🤖',
      subredditColor: '#D4A373',
      user: 'u/ai_tinkerer',
      timeAgo: '7h',
      title: 'Revenge for all the unfair lateral thinking puzzles Claude gives me',
      image: 'https://picsum.photos/seed/claudeai/400/350',
      video: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      contentType: 'video',
      duration: '3:42',
      upvotes: 1200,
      comments: 89,
      body: 'I gave Claude a taste of its own medicine by sending it a wall of text puzzle that is basically unsolvable. The response was hilarious.',
      tags: ['ai', 'tech'],
      mockComments: [
        { id: 'vc1', author: 'prompt_wizard', body: 'The look on Claude\'s face (metaphorically) when it realized it was being trolled was priceless.', ups: 342, timeAgo: '6h', isSubmitter: false, replies: [] },
        { id: 'vc2', author: 'ai_tinkerer', body: 'I actually felt bad afterwards. Claude was so polite about it lol.', ups: 218, timeAgo: '5h', isSubmitter: true, replies: [{ id: 'vc2r1', author: 'neural_net_ninja', body: 'That\'s the thing about Claude — it\'s too nice to tell you your puzzle is terrible.', ups: 89, timeAgo: '4h', isSubmitter: false, replies: [] }] },
        { id: 'vc3', author: 'llm_skeptic', body: 'Honestly these models handle lateral thinking better than most humans. Try giving it something truly adversarial.', ups: 156, timeAgo: '4h', isSubmitter: false, replies: [] },
      ],
    },
  },
  {
    index: 4,
    post: {
      id: '__text_tile_1',
      subreddit: 'r/NoStupidQuestions',
      subredditIcon: '❓',
      subredditColor: '#6B4EE6',
      user: 'u/genuinely_curious_42',
      timeAgo: '4h',
      title: 'Why do we park in driveways but drive on parkways?',
      contentType: 'text',
      upvotes: 4120,
      comments: 387,
      body: 'Seriously though, who decided on these names? English is wild.',
      tags: ['memes'],
      mockComments: [
        { id: 'tc1', author: 'etymology_nerd', body: 'Driveway originally meant the path you "drove" up to reach your house from the road. Parkway meant a road through a park-like setting with trees.', ups: 892, timeAgo: '3h', isSubmitter: false, replies: [] },
        { id: 'tc2', author: 'linguistics_prof', body: 'English borrows from so many languages that naming conventions are wildly inconsistent. This is one of the fun ones.', ups: 456, timeAgo: '2h', isSubmitter: false, replies: [{ id: 'tc2r1', author: 'genuinely_curious_42', body: 'That actually makes total sense. Thanks for the real answer!', ups: 120, timeAgo: '1h', isSubmitter: true, replies: [] }] },
        { id: 'tc3', author: 'shower_thoughts_fan', body: 'Wait until you learn that we ship cargo by truck and send shipments by ship.', ups: 1340, timeAgo: '2h', isSubmitter: false, replies: [] },
      ],
    },
  },
  {
    index: 5,
    post: {
      id: '__community_tile',
      contentType: 'community',
      subreddit: 'r/CozyPlaces',
      subredditIcon: '🛋️',
      subredditColor: '#C4956A',
      user: 'r/CozyPlaces',
      timeAgo: '',
      title: 'r/CozyPlaces',
      upvotes: 0,
      comments: 0,
      body: '',
      tags: [],
      tagline: 'Warm corners, soft lights & cozy vibes',
      members: 2400000,
      previews: [
        { title: 'My reading nook is finally done', image: 'https://picsum.photos/seed/cozy1/80/80' },
        { title: 'Rain + fairy lights + tea = perfection' },
        { title: 'Converted a closet into a tiny office', image: 'https://picsum.photos/seed/cozy3/80/80' },
        { title: 'Fall vibes in the living room' },
      ],
    },
  },
  {
    index: 8,
    post: {
      id: '__text_tile_3',
      subreddit: 'r/showerthoughts',
      subredditIcon: '🚿',
      subredditColor: '#FFB000',
      user: 'u/deep_thinker_99',
      timeAgo: '5h',
      title: 'The oldest person alive was once the youngest',
      contentType: 'text',
      upvotes: 14200,
      comments: 467,
      body: 'The oldest person on Earth was, at one point, the youngest person on Earth. And neither time did they know it.',
      tags: ['memes'],
      mockComments: [
        { id: 'st1', author: 'philosophy_buff', body: 'This is the kind of content I come to this sub for. Simple but genuinely mind-bending.', ups: 2100, timeAgo: '4h', isSubmitter: false, replies: [] },
        { id: 'st2', author: 'math_nerd_42', body: 'Technically you\'re only the youngest person alive for a fraction of a second before the next baby is born.', ups: 890, timeAgo: '3h', isSubmitter: false, replies: [{ id: 'st2r1', author: 'deep_thinker_99', body: 'True but for that fraction of a second, you held the title!', ups: 445, timeAgo: '2h', isSubmitter: true, replies: [] }] },
        { id: 'st3', author: 'existential_crisis', body: 'Great now I need to go lie down and think about my entire existence.', ups: 670, timeAgo: '3h', isSubmitter: false, replies: [] },
      ],
    },
  },
  {
    index: 11,
    post: {
      id: '__text_tile_4',
      subreddit: 'r/unpopularopinion',
      subredditIcon: '🔥',
      subredditColor: '#E8390E',
      user: 'u/against_the_grain',
      timeAgo: '2h',
      title: 'Cold pizza is better than reheated pizza',
      contentType: 'text',
      upvotes: 3890,
      comments: 1204,
      body: 'Cold pizza straight from the fridge the next morning is peak pizza. Reheating it in the microwave makes it rubbery and the oven takes too long. Cold is the way.',
      tags: ['food'],
      mockComments: [
        { id: 'up1', author: 'pizza_purist', body: 'Finally someone said it. Cold pepperoni pizza with a glass of orange juice is the ultimate breakfast.', ups: 560, timeAgo: '1h', isSubmitter: false, replies: [] },
        { id: 'up2', author: 'italian_grandma', body: 'You have clearly never used a cast iron skillet to reheat pizza. Crispy bottom, melty top. Life changing.', ups: 1200, timeAgo: '1h', isSubmitter: false, replies: [{ id: 'up2r1', author: 'against_the_grain', body: 'Okay I\'ll admit I\'ve never tried that. But I stand by cold being easier and still delicious.', ups: 340, timeAgo: '45m', isSubmitter: true, replies: [] }] },
        { id: 'up3', author: 'taste_scientist', body: 'Cold pizza actually has different flavor compounds activated vs hot. The fat solidifies and carries flavor differently. Both are valid.', ups: 780, timeAgo: '1h', isSubmitter: false, replies: [] },
      ],
    },
  },
];

const GAMING_TILES = [
  {
    index: 2,
    post: {
      id: '__game_bunny_trials',
      subreddit: 'r/BunnyTrials',
      subredditIcon: '🐰',
      subredditColor: '#6C3FC5',
      user: 'u/Genya_DM',
      timeAgo: '4h',
      title: 'Would you rather (Upvote please, I need those carrots)',
      contentType: 'game',
      upvotes: 350,
      comments: 685,
      body: '',
      tags: ['gaming'],
      game: {
        type: 'wouldyourather',
        prompt: 'Which side will you choose?',
        totalVotes: 4537,
        options: [
          { id: 'a', emoji: '🐮', label: 'Talk to Animals' },
          { id: 'b', emoji: '🛡️', label: 'Invincible vs Animals' },
          { id: 'c', emoji: '🐸', label: 'Risk becoming a Frog' },
          { id: 'd', emoji: '🦁', label: 'Except one Animal' },
        ],
        sides: {
          left: { optionIds: ['a', 'c'], pct: 62 },
          right: { optionIds: ['b', 'd'], pct: 38 },
        },
      },
      mockComments: [
        { id: 'bt1', author: 'bunny_gamer_42', body: 'Talk to animals easy pick. Imagine asking your dog what they actually want.', ups: 620, timeAgo: '3h', isSubmitter: false, replies: [{ id: 'bt1r1', author: 'Genya_DM', body: 'Right?! But the frog risk is real...', ups: 210, timeAgo: '2h', isSubmitter: true, replies: [] }] },
        { id: 'bt2', author: 'shield_main', body: 'Invincible against ALL animal attacks? That includes mosquitoes. I pick right side every time.', ups: 445, timeAgo: '3h', isSubmitter: false, replies: [] },
        { id: 'bt3', author: 'chaotic_neutral', body: 'Becoming a frog sounds like a win tbh. No rent, no taxes, just vibes at a pond.', ups: 890, timeAgo: '2h', isSubmitter: false, replies: [] },
      ],
    },
  },
];

const SPECIAL_IDS = new Set(SPECIAL_TILES.map((t) => t.post.id));
const GAMING_IDS = new Set(GAMING_TILES.map((t) => t.post.id));

function injectSpecialTiles(posts, tiles, ids) {
  const result = posts.filter((p) => !ids.has(p.id));
  for (const { index, post } of tiles) {
    result.splice(Math.min(index, result.length), 0, post);
  }
  return result;
}

export default function App() {
  const [activeNav, setActiveNav] = useState('home');
  const [activeTab, setActiveTab] = useState('explore');
  const [activeInterest, setActiveInterest] = useState('foryou');
  const [selectedPost, setSelectedPost] = useState(null);
  const [tileOrigin, setTileOrigin] = useState(null);
  const [posts, setPosts] = useState(explorePosts);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeSubreddit, setActiveSubreddit] = useState(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const scrollRef = useRef(null);
  const currentSourceRef = useRef('');

  const handleSubredditSelect = (sub) => {
    setActiveSubreddit(sub);
  };

  const getSource = useCallback((tab, interest) => {
    if (interest !== 'foryou' && INTEREST_SOURCES[interest]) {
      return INTEREST_SOURCES[interest];
    }
    return SOURCES[tab] || SOURCES.explore;
  }, []);

  const loadPosts = useCallback(async (tab, interest) => {
    setLoading(true);
    const source = getSource(tab, interest);
    currentSourceRef.current = source;
    try {
      const data = await fetchRedditPosts(source);
      if (tab === 'explore' && interest === 'foryou') {
        setPosts(injectSpecialTiles(data, SPECIAL_TILES, SPECIAL_IDS));
      } else if (interest === 'gaming') {
        setPosts(injectSpecialTiles(data, GAMING_TILES, GAMING_IDS));
      } else {
        setPosts(data);
      }
    } catch {
      const fallback = fallbackByTab[tab] || explorePosts;
      if (tab === 'explore' && interest === 'foryou') {
        setPosts(injectSpecialTiles(fallback, SPECIAL_TILES, SPECIAL_IDS));
      } else if (interest === 'gaming') {
        setPosts(injectSpecialTiles(fallback, GAMING_TILES, GAMING_IDS));
      } else {
        setPosts(fallback);
      }
    } finally {
      setLoading(false);
    }
  }, [getSource]);

  const loadMore = useCallback(async () => {
    if (loadingMore) return;
    const source = currentSourceRef.current;
    if (!source) return;
    setLoadingMore(true);
    try {
      const newPosts = await fetchMoreRedditPosts(source);
      if (newPosts.length > 0) {
        setPosts((prev) => [...prev, ...newPosts]);
      }
    } catch { /* ignore */ }
    finally { setLoadingMore(false); }
  }, [loadingMore]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 300) {
        loadMore();
      }
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [loadMore]);

  useEffect(() => {
    loadPosts(activeTab, activeInterest);
  }, [activeTab, activeInterest, loadPosts]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setActiveInterest('foryou');
  };

  return (
    <div className="phone-frame">
      <div className="phone-notch" />
      <div className="phone-btn phone-btn--silent" />
      <div className="phone-btn phone-btn--volup" />
      <div className="phone-btn phone-btn--voldn" />
      <div className="phone-btn phone-btn--power" />
      <div className="phone-screen">
        <div className="status-bar">
          <span className="status-time">3:00</span>
          <span className="status-icons">
            <svg width="15" height="10.5" viewBox="0 0 17 12" fill="#1A1A1B" style={{ position: 'relative', top: '1px' }}>
              <rect x="0" y="4" width="3" height="8" rx="0.8" opacity="0.3"/>
              <rect x="4.5" y="3" width="3" height="9" rx="0.8" opacity="0.5"/>
              <rect x="9" y="1.5" width="3" height="10.5" rx="0.8" opacity="0.75"/>
              <rect x="13.5" y="0" width="3" height="12" rx="0.8"/>
            </svg>
            <svg width="16" height="12" viewBox="0 0 16 12" fill="#1A1A1B">
              <path d="M8 2C5.8 2 3.7 2.9 2.2 4.4L0.8 3C2.7 1.1 5.2 0 8 0s5.3 1.1 7.2 3L13.8 4.4C12.3 2.9 10.2 2 8 2z" opacity="0.3"/>
              <path d="M8 5.5C6.5 5.5 5.1 6.1 4 7.2L2.6 5.8C4.1 4.3 6 3.5 8 3.5s3.9.8 5.4 2.3L12 7.2C10.9 6.1 9.5 5.5 8 5.5z" opacity="0.55"/>
              <path d="M8 9c-.8 0-1.6.3-2.1.9L4.5 8.5C5.4 7.6 6.7 7 8 7s2.6.6 3.5 1.5l-1.4 1.4C9.6 9.3 8.8 9 8 9z" opacity="0.8"/>
              <circle cx="8" cy="11" r="1.2"/>
            </svg>
            <svg width="27" height="13" viewBox="0 0 27 13" fill="none">
              <rect x="0.5" y="0.5" width="22" height="12" rx="3.5" stroke="#1A1A1B" strokeOpacity="0.35"/>
              <rect x="2" y="2" width="16" height="9" rx="2" fill="#1A1A1B"/>
              <path d="M24 4.5V8.5C25.1 8.1 25.1 4.9 24 4.5Z" fill="#1A1A1B" fillOpacity="0.4"/>
            </svg>
          </span>
        </div>
        <div className="app">
          {activeNav === 'search' ? (
            <>
              <SearchTab onSubredditSelect={handleSubredditSelect} onPostSelect={(post) => { setSelectedPost(post); }} />
              <BottomNav activeNav={activeNav} onNavChange={setActiveNav} onCreateClick={() => setShowCreatePost(true)} />
            </>
          ) : (
            <>
              <TabBar activeTab={activeTab} onTabChange={handleTabChange} onSearchClick={() => setActiveNav('search')} />
              {activeTab === 'following' && (
                <FollowingCarousel subreddits={followedSubreddits} onSubredditSelect={handleSubredditSelect} />
              )}
              {activeTab === 'explore' && (
                <InterestPills
                  interests={interests}
                  activeInterest={activeInterest}
                  onInterestChange={setActiveInterest}
                />
              )}
              <div className="app-scroll" ref={scrollRef}>
                {loading ? (
                  <div className="feed-loading">
                    <div className="feed-loading-grid">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="skeleton-tile">
                          <div className="skeleton-image" />
                          <div className="skeleton-text" />
                          <div className="skeleton-text skeleton-text--short" />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    <GridFeed posts={posts} onPostSelect={(post, rect) => { setTileOrigin(rect); setSelectedPost(post); }} onSubredditSelect={handleSubredditSelect} />
                    {loadingMore && <div className="feed-loading-more"><div className="loading-spinner" /></div>}
                  </>
                )}
              </div>
              <BottomNav activeNav={activeNav} onNavChange={setActiveNav} onCreateClick={() => setShowCreatePost(true)} />
            </>
          )}
          <CreatePost visible={showCreatePost} onClose={() => setShowCreatePost(false)} onPostSelect={(post) => { setSelectedPost(post); }} />
          <PostDetail
            post={selectedPost}
            onClose={() => setSelectedPost(null)}
            isFollowing={activeTab === 'following'}
            tileOrigin={tileOrigin}
            onSubredditSelect={handleSubredditSelect}
          />
          {activeSubreddit && (
            <SubredditPage
              subreddit={activeSubreddit}
              onClose={() => setActiveSubreddit(null)}
              onPostSelect={(post, rect) => { setTileOrigin(rect); setSelectedPost(post); }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
