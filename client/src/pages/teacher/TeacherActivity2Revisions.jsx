import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../lib/session';
import { socket } from '../../lib/socket';

export default function TeacherActivity2Revisions() {
  const [searchParams] = useSearchParams();
  const [post, setPost] = useState(null);
  const [revisions, setRevisions] = useState([]);
  const navigate = useNavigate();

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
            <button className="rounded-md bg-stone-950 px-4 py-2 font-bold text-white shadow-sm" onClick={() => navigate('/teacher/activity2-board')}>활동2 대시보드</button>
            <div className="rounded-full bg-white px-4 py-2 font-bold shadow-sm">{revisions.length}개 제출</div>
          </div>
        </header>
        <section className="columns-1 gap-4 md:columns-2 xl:columns-4">
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
