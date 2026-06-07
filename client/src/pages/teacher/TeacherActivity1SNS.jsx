import { useEffect, useMemo, useState } from 'react';
import { api } from '../../lib/session';
import { socket } from '../../lib/socket';
import newspaperImage from '../../assets/phase1/newspaper-kickboards.jpg';
import broadcastImage from '../../assets/phase1/broadcast-kickboards.jpg';
import broadcastImage2 from '../../assets/phase1/broadcast-kickboards1.jpg';
import snsImage from '../../assets/phase1/sns-kickboards.jpg';
import youtubeImage from '../../assets/phase1/youtube-thumbnail.png';

const photoMap = {
  'park-entrance': newspaperImage,
  'sidewalk-news': broadcastImage,
  'phone-shot': snsImage,
  'video-thumb': youtubeImage,
  'wide-sidewalk': broadcastImage2,
};

const photoLabels = {
  'park-entrance': '공원 입구',
  'sidewalk-news': '인도 현장',
  'phone-shot': '가까이 찍은 사진',
  'video-thumb': '영상 썸네일',
  'wide-sidewalk': '넓은 길 사진',
};

export default function TeacherActivity1SNS() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadPosts() {
    const data = await api('/api/teacher/activity1/sns-posts');
    setPosts(data.posts || []);
    setLoading(false);
  }

  useEffect(() => {
    loadPosts();
    socket.on('activity1_sns_updated', loadPosts);
    return () => socket.off('activity1_sns_updated', loadPosts);
  }, []);

  const sortedPosts = useMemo(() => [...posts].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)), [posts]);

  return (
    <div className="min-h-screen bg-[#fafafa] px-6 py-5 text-stone-950">
      <div className="mx-auto max-w-5xl space-y-5">
        <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 bg-[#fafafa]/95 py-4 backdrop-blur">
          <div>
            <div className="text-sm font-bold text-rose-600">활동1</div>
            <h1 className="text-4xl font-black">우리반 SNS</h1>
          </div>
          <div className="rounded-full bg-white px-4 py-2 text-lg font-black shadow-sm">게시 {sortedPosts.length}개</div>
        </header>

        {loading && <div className="rounded-lg bg-white p-6 text-center font-bold text-stone-500">불러오는 중입니다</div>}
        {!loading && sortedPosts.length === 0 && <div className="rounded-lg bg-white p-6 text-center font-bold text-stone-500">아직 올라온 글이 없습니다.</div>}

        <section className="mx-auto max-w-2xl space-y-5">
          {sortedPosts.map((post) => {
            const imageSrc = photoMap[post.photo_id];
            return (
              <article key={post.id} className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
                <div className="flex items-center gap-3 border-b border-stone-100 p-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-fuchsia-600 p-[2px]">
                    <div className="grid h-full w-full place-items-center rounded-full bg-white text-sm font-black">{post.student_number}</div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-black">{post.name}</div>
                    <div className="text-xs text-stone-500">{post.student_number}번 학생</div>
                  </div>
                  <div className="text-sm font-black text-rose-600">좋아요 {post.like_count}개</div>
                </div>
                <div>
                  {imageSrc && <img className="max-h-[360px] w-full object-cover" src={imageSrc} alt={photoLabels[post.photo_id] || 'SNS 사진'} />}
                  {!imageSrc && <div className="grid h-48 place-items-center bg-stone-100 px-3 text-center text-sm font-bold text-stone-400">사진 없음</div>}
                  <p className="whitespace-pre-wrap p-4 text-base leading-7">{post.content}</p>
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </div>
  );
}
