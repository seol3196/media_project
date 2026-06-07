import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../lib/session';
import { socket } from '../../lib/socket';

export default function Activity2Revisions() {
  const [searchParams] = useSearchParams();
  const [post, setPost] = useState(null);
  const [revisions, setRevisions] = useState([]);
  const navigate = useNavigate();

  async function load() {
    const postId = searchParams.get('post') || '';
    const data = await api(`/api/student/activity2/revisions${postId ? `?post_id=${encodeURIComponent(postId)}` : ''}`);
    setPost(data.post);
    setRevisions(data.revisions || []);
  }

  useEffect(() => {
    load();
    socket.on('activity2_revisions_updated', load);
    return () => socket.off('activity2_revisions_updated', load);
  }, [searchParams]);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-stone-500">활동2</p>
          <h2 className="text-3xl font-black">다른 학생 댓글 보기</h2>
        </div>
        <button className="rounded-md border px-3 py-2 font-bold" onClick={() => navigate('/student/phase2')}>돌아가기</button>
      </header>
      <section className="rounded-lg border border-stone-200 bg-white p-5">
        <h3 className="text-xl font-black">{post?.headline || post?.title || post?.content}</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {revisions.map((revision) => (
            <article key={revision.id} className="rounded-lg border border-stone-200 bg-stone-50 p-4">
              <div className="mb-2 text-sm font-black text-stone-600">{revision.student_number}번 {revision.name}</div>
              <p className="whitespace-pre-wrap leading-7">{revision.revised_text}</p>
            </article>
          ))}
          {revisions.length === 0 && <div className="text-stone-500">아직 제출된 수정 댓글이 없습니다.</div>}
        </div>
      </section>
    </div>
  );
}
