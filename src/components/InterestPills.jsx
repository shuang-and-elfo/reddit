export default function InterestPills({ interests, activeInterest, onInterestChange }) {
  return (
    <div className="pills-container">
      <div className="pills-scroll">
        {interests.map((interest) => (
          <button
            key={interest.id}
            className={`pill${activeInterest === interest.id ? ' active' : ''}`}
            onClick={() => onInterestChange(interest.id)}
          >
            {interest.label}
          </button>
        ))}
      </div>
    </div>
  );
}
