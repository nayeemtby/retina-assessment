export function StatusBadge({ status }) {
  const normalized = (status || '').toLowerCase();
  let badgeClass = 'badge badge-draft';
  let label = status || 'draft';

  if (normalized === 'published') {
    badgeClass = 'badge badge-published';
    label = 'Published';
  } else if (normalized === 'completed') {
    badgeClass = 'badge badge-completed';
    label = 'Completed';
  } else if (normalized === 'draft') {
    badgeClass = 'badge badge-draft';
    label = 'Draft';
  }

  return <span className={badgeClass}>{label}</span>;
}

export function RankBadge({ rank }) {
  const numRank = Number(rank);

  if (numRank === 1) {
    return (
      <span className="rank-badge rank-gold" title="1st Place (Gold)">
        <span className="rank-medal">🥇</span>
        <span className="rank-text">#1 Gold</span>
      </span>
    );
  }

  if (numRank === 2) {
    return (
      <span className="rank-badge rank-silver" title="2nd Place (Silver)">
        <span className="rank-medal">🥈</span>
        <span className="rank-text">#2 Silver</span>
      </span>
    );
  }

  if (numRank === 3) {
    return (
      <span className="rank-badge rank-bronze" title="3rd Place (Bronze)">
        <span className="rank-medal">🥉</span>
        <span className="rank-text">#3 Bronze</span>
      </span>
    );
  }

  return (
    <span className="rank-badge rank-standard">
      <span className="rank-text">#{numRank}</span>
    </span>
  );
}
