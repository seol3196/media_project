import PaddletWall from '../../components/PaddletWall.jsx';
import VoteChart from '../../components/VoteChart.jsx';

export default function Phase3Monitor({ data, onMark }) {
  const votes = Object.fromEntries((data.votes || []).map((row) => [row.vote, row.count]));
  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-stone-200 bg-white p-4">
        <h2 className="mb-3 text-lg font-black">활동3 투표</h2>
        <VoteChart votes={votes} />
      </div>
      <div className="rounded-lg border border-stone-200 bg-white p-4">
        <h2 className="mb-3 text-lg font-black">조작 댓글</h2>
        <div className="space-y-2">
          {data.comments?.map((row) => <div key={row.id} className="rounded border p-3 text-sm">[{row.team}] {row.student_number}번 {row.name}: {row.content}</div>)}
        </div>
      </div>
      <div>
        <h2 className="mb-3 text-lg font-black">담벼락</h2>
        <PaddletWall guesses={data.guesses || []} teacher onMark={onMark} />
      </div>
    </section>
  );
}
