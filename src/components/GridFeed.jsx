import GridTile from './GridTile';

const IMAGE_HEIGHTS = [160, 200, 140, 180, 220, 150, 170, 210, 190, 155, 175, 145];

export default function GridFeed({ posts, onPostSelect, onSubredditSelect }) {
  if (posts.length === 0) {
    return (
      <div className="grid-empty">
        <span className="grid-empty-icon">📭</span>
        <p>No posts found for this filter</p>
      </div>
    );
  }

  const left = [];
  const right = [];

  posts.forEach((post, i) => {
    if (i % 2 === 0) left.push({ post, height: IMAGE_HEIGHTS[i % IMAGE_HEIGHTS.length] });
    else right.push({ post, height: IMAGE_HEIGHTS[i % IMAGE_HEIGHTS.length] });
  });

  return (
    <div className="grid-feed">
      <div className="grid-column">
        {left.map(({ post, height }) => (
          <GridTile
            key={post.id}
            post={post}
            imageHeight={height}
            onClick={(rect) => onPostSelect(post, rect)}
            onSubredditSelect={onSubredditSelect}
          />
        ))}
      </div>
      <div className="grid-column">
        {right.map(({ post, height }) => (
          <GridTile
            key={post.id}
            post={post}
            imageHeight={height}
            onClick={(rect) => onPostSelect(post, rect)}
            onSubredditSelect={onSubredditSelect}
          />
        ))}
      </div>
    </div>
  );
}
