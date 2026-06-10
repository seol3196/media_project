import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../lib/session';
import { socket } from '../../lib/socket';

const exampleRevisions = {
  newspaper: '킥보드 타는 사람 전부가 그런 건 아니니까, 아무 데나 세우는 행동이 문제라고 쓰는 게 좋을 것 같아요. 주차구역을 더 만들면 해결에 도움 될 듯.',
  broadcast: '회사가 망해야 한다고 하기보다는, 사고 안 나게 업체가 관리랑 안내를 더 잘해야 한다고 쓰면 좋을 것 같아요.',
  sns: '타는 사람을 다 민폐라고 하면 싸움 날 것 같아요. 보도에 세우거나 위험하게 타는 행동을 고치자고 쓰면 좋겠어요.',
  youtube: '유튜버를 다 없어져야 한다고 하면 너무 심한 말 같아요. 제목이 자극적인지, 영상에 근거가 있는지 확인하자고 쓰면 좋겠어요.',
};

export default function TeacherActivity2Revisions() {
  const [searchParams] = useSearchParams();
  const [post, setPost] = useState(null);
  const [revisions, setRevisions] = useState([]);

  async function load() {
    const postId = searchParams.get('post') || '';
    const data = await api(`/api/teacher/activity2/revisions${postId ? `?post_id=${encodeURIComponent(postId)}` : ''}`);
    setPost(data.post);
    setRevisions(data.revisions || []);
  }

  useEffect(() => {
    load();
    socket.on('activity2_revisions_updated', load);
    return () => socket.off('activity2_revisions_updated', load);
  }, [searchParams]);

  const exampleText = post ? exampleRevisions[post.id] : '';

  return (
    <div className="min-h-screen bg-[#f6ecd2] p-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-amber-800">활동2</p>
            <h1 className="text-4xl font-black text-stone-950">수정된 댓글 보기</h1>
            <p className="mt-2 font-bold text-stone-600">{post?.headline || post?.title || post?.content}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="rounded-md border border-stone-300 bg-white px-4 py-2 font-bold text-stone-800 shadow-sm" onClick={() => window.close()}>창닫기</button>
            <div className="rounded-full bg-white px-4 py-2 font-bold shadow-sm">{revisions.length}개 제출</div>
          </div>
        </header>
        <section className="columns-1 gap-4 md:columns-2 xl:columns-4">
          {exampleText && (
            <article className="mb-4 break-inside-avoid rounded-md border-2 border-stone-800 bg-white p-4 shadow-md">
              <div className="mb-3 text-sm font-black text-stone-700">예시 답안</div>
              <p className="whitespace-pre-wrap text-lg font-bold leading-8 text-stone-950">{exampleText}</p>
            </article>
          )}
          {revisions.map((revision, index) => (
            <article key={revision.id} className={`mb-4 break-inside-avoid rounded-md border border-amber-200 p-4 shadow-md ${index % 3 === 0 ? 'bg-yellow-100' : index % 3 === 1 ? 'bg-emerald-100' : 'bg-sky-100'}`}>
              <div className="mb-3 text-sm font-black text-stone-600">{revision.student_number}번 {revision.name}</div>
              <p className="whitespace-pre-wrap text-lg leading-8 text-stone-900">{revision.revised_text}</p>
            </article>
          ))}
          {revisions.length === 0 && <div className="rounded-md bg-white p-5 font-bold text-stone-500 shadow-sm">아직 제출된 수정 댓글이 없습니다.</div>}
        </section>
      </div>
    </div>
  );
}
