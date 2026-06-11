import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/session';
import { socket } from '../../lib/socket';
import { snsPhotoLabels, snsPhotoMap } from '../../lib/activity1SnsPhotos';

export default function Activity1SNS() {
  const [posts, setPosts] = useState([]);
  const [hasPosted, setHasPosted] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  async function loadPosts() {
    const data = await api('/api/student/activity1/sns-posts');
    setPosts(data.posts || []);
    setHasPosted(Boolean(data.has_posted));
    setLoading(false);
  }

  useEffect(() => {
    loadPosts();
    socket.on('activity1_sns_updated', loadPosts);
    return () => socket.off('activity1_sns_updated', loadPosts);
  }, []);

  async function toggleLike(postId) {
    await api(`/api/student/activity1/sns-posts/${postId}/like`, { method: 'POST', body: '{}' });
    loadPosts();
  }

  const sortedPosts = useMemo(() => [...posts].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)), [posts]);

  if (!loading && !hasPosted) {
    return (
      <div className="mx-auto max-w-3xl rounded-lg border border-stone-200 bg-white p-6 text-center shadow-sm">
        <h2 className="text-2xl font-black">우리반 SNS</h2>
        <p className="mt-3 text-stone-600">먼저 4번 문제에서 내 SNS 글을 게시해주세요.</p>
        <button className="mt-5 rounded-md bg-stone-950 px-4 py-2 font-bold text-white" onClick={() => navigate('/student/phase1')}>4번 문제로 돌아가기</button>
      </div>
    );
  }

  return (
    <div className="relative left-1/2 min-h-[calc(100vh-96px)] w-screen -translate-x-1/2 bg-[#fafafa] px-4 py-6">
      <div className="mx-auto max-w-xl space-y-5">
        <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 bg-[#fafafa]/95 py-3 backdrop-blur">
          <div>
            <div className="text-sm font-bold text-rose-600">활동1</div>
            <h2 className="text-3xl font-black tracking-normal">우리반스타그램</h2>
          </div>
          <button className="rounded-md border border-stone-300 bg-white px-3 py-2 font-bold" onClick={() => navigate('/student/phase1')}>돌아가기</button>
        </header>

        {loading && <div className="rounded-lg bg-white p-6 text-center font-bold text-stone-500">불러오는 중입니다</div>}

        {!loading && sortedPosts.length === 0 && (
          <div className="rounded-lg bg-white p-6 text-center font-bold text-stone-500">아직 올라온 글이 없습니다.</div>
        )}

        <section className="space-y-5">
          {sortedPosts.map((post) => {
            const imageSrc = snsPhotoMap[post.photo_id];
            return (
              <article key={post.id} className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
                <div className="flex items-center gap-3 border-b border-stone-100 p-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-fuchsia-600 p-[2px]">
                    <div className="grid h-full w-full place-items-center rounded-full bg-white text-sm font-black text-stone-900">{post.student_number}</div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-black">{post.name}</div>
                    <div className="text-xs text-stone-500">{post.student_number}번 학생</div>
                  </div>
                  <div className="text-xl font-black text-stone-400">...</div>
                </div>
                {imageSrc && <img className="max-h-[360px] w-full object-cover" src={imageSrc} alt={snsPhotoLabels[post.photo_id] || 'SNS 사진'} />}
                {!imageSrc && <div className="grid h-48 place-items-center bg-stone-100 text-sm font-bold text-stone-400">사진 없이 작성한 글</div>}
                <div className="space-y-3 p-4">
                  <div className="flex gap-3 text-2xl">
                    <button
                      type="button"
                      className={post.liked_by_me ? 'text-rose-500' : 'text-stone-900'}
                      onClick={() => toggleLike(post.id)}
                      aria-label="좋아요"
                    >
                      {post.liked_by_me ? '♥' : '♡'}
                    </button>
                  </div>
                  <div className="text-sm font-black">좋아요 {post.like_count}개</div>
                  <p className="whitespace-pre-wrap text-base leading-7 text-stone-900">{post.content}</p>
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </div>
  );
}
