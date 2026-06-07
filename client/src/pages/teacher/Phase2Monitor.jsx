export default function Phase2Monitor({ data }) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-4">
      <h2 className="mb-3 text-lg font-black">활동2 댓글</h2>
      <div className="space-y-2">
        {data.comments?.map((row) => <div key={row.id} className="rounded border p-3 text-sm">{row.student_number}번 {row.name}: {row.content}</div>)}
      </div>
    </section>
  );
}
