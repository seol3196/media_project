import { useEffect, useState } from 'react';
import { api } from '../../lib/session';
import { socket } from '../../lib/socket';

const mediaLabels = {
  newspaper: '신문',
  broadcast: '방송',
  sns: 'SNS',
  youtube: '유튜브',
};

export default function Activity1Padlet() {
  const [answers, setAnswers] = useState([]);

  async function load() {
    const data = await api('/api/student/activity1/answers?question=3');
    setAnswers(data.answers || []);
  }

  useEffect(() => {
    load();
    socket.on('activity1_padlet_updated', load);
    return () => socket.off('activity1_padlet_updated', load);
  }, []);

  return (
    <div className="min-h-screen bg-[#f6ecd2] p-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-amber-800">활동1 문제 3</p>
            <h1 className="text-4xl font-black text-stone-950">친구들 답변 보기</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="rounded-md border border-stone-300 bg-white px-4 py-2 font-bold text-stone-800 shadow-sm" onClick={() => window.close()}>창닫기</button>
            <div className="rounded-full bg-white px-4 py-2 font-bold shadow-sm">{answers.length}개 제출</div>
          </div>
        </header>
        <section className="columns-1 gap-4 md:columns-2 xl:columns-4">
          {answers.map((answer, index) => (
            <article key={answer.id} className={`mb-4 break-inside-avoid rounded-md border border-amber-200 p-4 shadow-md ${index % 3 === 0 ? 'bg-yellow-100' : index % 3 === 1 ? 'bg-emerald-100' : 'bg-sky-100'}`}>
              <div className="mb-3 text-sm font-black text-stone-600">{answer.student_number}번 {answer.name}</div>
              <div className="space-y-2 text-sm">
                <p><b>정확:</b> {mediaLabels[answer.payload.most_accurate] || answer.payload.most_accurate}</p>
                <p><b>관심:</b> {mediaLabels[answer.payload.most_emotional] || answer.payload.most_emotional}</p>
              </div>
              <div className="mt-3 space-y-3 whitespace-pre-wrap text-lg leading-8 text-stone-900">
                <p><b>정확해 보인 이유:</b> {answer.payload.accurate_reason || answer.payload.free_text}</p>
                <p><b>마음을 흔든 이유:</b> {answer.payload.emotional_reason || answer.payload.free_text}</p>
              </div>
            </article>
          ))}
          {answers.length === 0 && <div className="rounded-md bg-white p-5 font-bold text-stone-500 shadow-sm">아직 제출된 답변이 없습니다.</div>}
        </section>
      </div>
    </div>
  );
}
