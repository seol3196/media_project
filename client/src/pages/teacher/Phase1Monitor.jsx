const mediaLabels = {
  newspaper: '신문',
  broadcast: '방송',
  sns: 'SNS',
  youtube: '유튜브',
};

export default function Phase1Monitor({ data }) {
  function parseJson(value, fallback) {
    try {
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  }

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-4">
      <h2 className="mb-3 text-lg font-black">활동1 응답</h2>
      <div className="space-y-2">
        {data.map((row) => {
          const methods = parseJson(row.delivery_methods, {});
          return (
            <div key={row.id} className="rounded border p-3 text-sm">
              <div className="font-semibold">{row.student_number}번 {row.name}</div>
              <div className="mt-1">정확: {mediaLabels[row.most_accurate] || row.most_accurate}, 관심: {mediaLabels[row.most_emotional] || row.most_emotional}</div>
              <div className="mt-1 text-stone-500">
                전달 방식: {Object.entries(methods).map(([key, value]) => `${mediaLabels[key] || key}(${value.join(', ')})`).join(' / ') || '-'}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
