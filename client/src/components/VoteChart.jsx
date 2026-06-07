export default function VoteChart({ votes = {} }) {
  const labels = { trust: '믿을만함', suspicious: '이상함', unsure: '모르겠음' };
  const total = Object.values(votes).reduce((sum, value) => sum + Number(value || 0), 0) || 1;
  return (
    <div className="space-y-3">
      {Object.entries(labels).map(([key, label]) => {
        const count = Number(votes[key] || 0);
        return (
          <div key={key}>
            <div className="mb-1 flex justify-between text-sm"><span>{label}</span><span>{count}명</span></div>
            <div className="h-3 overflow-hidden rounded-full bg-stone-200">
              <div className="h-full bg-amber-500" style={{ width: `${(count / total) * 100}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
