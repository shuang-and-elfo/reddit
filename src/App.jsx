import { useState, useEffect, useCallback } from 'react';
import './App.css';
import TabBar from './components/TabBar';
import InterestPills from './components/InterestPills';
import FollowingCarousel from './components/FollowingCarousel';
import GridFeed from './components/GridFeed';
import PostDetail from './components/PostDetail';
import BottomNav from './components/BottomNav';
import SearchTab from './components/SearchTab';
import SubredditPage from './components/SubredditPage';
import {
  explorePosts,
  followingPosts,
  nearbyPosts,
  followedSubreddits,
  interests,
} from './data/posts';
import { fetchRedditPosts, SOURCES, INTEREST_SOURCES } from './data/redditApi';

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
      subreddit: 'r/SnapchatHelp',
      subredditIcon: '👻',
      subredditColor: '#FFFC00',
      user: 'u/onthaBRINKofGR8',
      timeAgo: '10h',
      title: 'Does snapchat glitch?',
      contentType: 'text',
      upvotes: 28,
      comments: 39,
      body: 'This random girl added my husband on snapchat, she said they have been "In Touch" recently. Does snapchat ever glitch or is this legit?',
      tags: ['tech'],
      mockComments: [
        { id: 'tc1', author: 'snap_support_unofficial', body: 'Snapchat doesn\'t add people randomly. If someone was added, it was done intentionally from one of the accounts.', ups: 45, timeAgo: '9h', isSubmitter: false, replies: [] },
        { id: 'tc2', author: 'techie_truth', body: 'No, Snapchat does not glitch like that. Quick add suggests people based on contacts and mutual friends, but someone has to manually add them.', ups: 31, timeAgo: '8h', isSubmitter: false, replies: [{ id: 'tc2r1', author: 'onthaBRINKofGR8', body: 'That\'s what I was afraid of...', ups: 12, timeAgo: '7h', isSubmitter: true, replies: [] }] },
        { id: 'tc3', author: 'digital_detective', body: 'Check his snap score over a few days. If it keeps going up but he\'s not snapping you, that tells you something.', ups: 28, timeAgo: '7h', isSubmitter: false, replies: [] },
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
    index: 7,
    post: {
      id: '__text_tile_2',
      subreddit: 'r/AskReddit',
      subredditIcon: '💬',
      subredditColor: '#5A7EC2',
      user: 'u/midnight_thoughts',
      timeAgo: '3h',
      title: 'What skill took you the longest to learn but was 100% worth it?',
      contentType: 'text',
      textBg: '#EEF2F7',
      textAccent: '#5B7A9D',
      upvotes: 8420,
      comments: 2341,
      body: 'What skill took you the longest to learn but was 100% worth it? For me it was learning to cook. Took years of burnt food and kitchen disasters but now I genuinely enjoy it.',
      tags: ['news'],
      mockComments: [
        { id: 'ar1', author: 'lifelong_learner', body: 'Playing piano. Started at 25, didn\'t feel "good" until 30. Now it\'s the best stress relief I have.', ups: 1240, timeAgo: '2h', isSubmitter: false, replies: [{ id: 'ar1r1', author: 'keys_n_strings', body: 'Same here! I almost quit so many times in the first two years.', ups: 342, timeAgo: '1h', isSubmitter: false, replies: [] }] },
        { id: 'ar2', author: 'code_and_coffee', body: 'Programming. The first 6 months were absolute misery. Now I build things that make my life easier every single day.', ups: 890, timeAgo: '2h', isSubmitter: false, replies: [] },
        { id: 'ar3', author: 'midnight_thoughts', body: 'Loving all these answers. Seems like the common thread is pushing through that first year of feeling terrible at something.', ups: 567, timeAgo: '1h', isSubmitter: true, replies: [] },
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

const SPECIAL_IDS = new Set(SPECIAL_TILES.map((t) => t.post.id));

function injectSpecialTiles(posts) {
  const result = posts.filter((p) => !SPECIAL_IDS.has(p.id));
  for (const { index, post } of SPECIAL_TILES) {
    result.splice(index, 0, post);
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
  const [activeSubreddit, setActiveSubreddit] = useState(null);

  const handleSubredditSelect = (sub) => {
    setActiveSubreddit(sub);
  };

  const loadPosts = useCallback(async (tab, interest) => {
    setLoading(true);
    try {
      let source;
      if (interest !== 'foryou' && INTEREST_SOURCES[interest]) {
        source = INTEREST_SOURCES[interest];
      } else {
        source = SOURCES[tab] || SOURCES.explore;
      }
      const data = await fetchRedditPosts(source);
      const shouldInject = tab === 'explore' && interest === 'foryou';
      setPosts(shouldInject ? injectSpecialTiles(data) : data);
    } catch {
      const fallback = fallbackByTab[tab] || explorePosts;
      const shouldInject = tab === 'explore' && interest === 'foryou';
      setPosts(shouldInject ? injectSpecialTiles(fallback) : fallback);
    } finally {
      setLoading(false);
    }
  }, []);

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
            <svg width="15" height="10.5" viewBox="0 0 17 12" fill="#000000" style={{ position: 'relative', top: '1px' }}>
              <rect x="0" y="4" width="3" height="8" rx="0" opacity="0.3"/>
              <rect x="4.5" y="3" width="3" height="9" rx="0" opacity="0.5"/>
              <rect x="9" y="1.5" width="3" height="10.5" rx="0" opacity="0.75"/>
              <rect x="13.5" y="0" width="3" height="12" rx="0"/>
            </svg>
            <svg width="16" height="12" viewBox="0 0 16 12" fill="#000000">
              <path d="M8 2C5.8 2 3.7 2.9 2.2 4.4L0.8 3C2.7 1.1 5.2 0 8 0s5.3 1.1 7.2 3L13.8 4.4C12.3 2.9 10.2 2 8 2z" opacity="0.3"/>
              <path d="M8 5.5C6.5 5.5 5.1 6.1 4 7.2L2.6 5.8C4.1 4.3 6 3.5 8 3.5s3.9.8 5.4 2.3L12 7.2C10.9 6.1 9.5 5.5 8 5.5z" opacity="0.55"/>
              <path d="M8 9c-.8 0-1.6.3-2.1.9L4.5 8.5C5.4 7.6 6.7 7 8 7s2.6.6 3.5 1.5l-1.4 1.4C9.6 9.3 8.8 9 8 9z" opacity="0.8"/>
              <circle cx="8" cy="11" r="1.2"/>
            </svg>
            <svg width="27" height="13" viewBox="0 0 27 13" fill="none">
              <rect x="0.5" y="0.5" width="22" height="12" rx="0" stroke="#000000" strokeOpacity="0.6"/>
              <rect x="2" y="2" width="16" height="9" rx="0" fill="#000000"/>
              <path d="M24 4.5V8.5C25.1 8.1 25.1 4.9 24 4.5Z" fill="#000000" fillOpacity="0.5"/>
            </svg>
          </span>
        </div>
        <div className="app">
          {activeNav === 'search' ? (
            <>
              <SearchTab onSubredditSelect={handleSubredditSelect} />
              <BottomNav activeNav={activeNav} onNavChange={setActiveNav} />
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
              <div className="app-scroll">
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
                  <GridFeed posts={posts} onPostSelect={(post, rect) => { setTileOrigin(rect); setSelectedPost(post); }} onSubredditSelect={handleSubredditSelect} />
                )}
              </div>
              <BottomNav activeNav={activeNav} onNavChange={setActiveNav} />
              <PostDetail
                post={selectedPost}
                onClose={() => setSelectedPost(null)}
                isFollowing={activeTab === 'following'}
                tileOrigin={tileOrigin}
                onSubredditSelect={handleSubredditSelect}
              />
            </>
          )}
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
