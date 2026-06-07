import { useEffect, useState } from 'react';
import { api } from '../../lib/session';
import { socket } from '../../lib/socket';
import NewspaperCard from '../../components/media/NewspaperCard.jsx';
import BroadcastCard from '../../components/media/BroadcastCard.jsx';
import SNSCard from '../../components/media/SNSCard.jsx';
import YoutubeCard from '../../components/media/YoutubeCard.jsx';
import newspaperImage from '../../assets/phase1/newspaper-kickboards.jpg';
import broadcastImage from '../../assets/phase1/broadcast-kickboards.jpg';
import snsImage from '../../assets/phase1/sns-kickboards.jpg';
import youtubeImage from '../../assets/phase1/youtube-thumbnail.png';

const renderers = { newspaper: NewspaperCard, broadcast: BroadcastCard, sns: SNSCard, youtube: YoutubeCard };
const mediaImages = { newspaper: newspaperImage, broadcast: broadcastImage, sns: snsImage, youtube: youtubeImage };
const mediaLabels = { newspaper: '신문', broadcast: '방송', sns: 'SNS', youtube: '유튜브' };

export default function TeacherActivity2Board() {
  const [state, setState] = useState({ step: 1, total: 4, counts: {} });
  const [post, setPost] = useState(null);

  async function load() {
    const data = await api('/api/teacher/activity2/state');
    setState(data.state);
    setPost(data.post);
  }

  useEffect(() => {
    load();
    socket.on('activity2_state_changed', load);
    socket.on('activity2_revisions_updated', load);
    return () => {
      socket.off('activity2_state_changed', load);
      socket.off('activity2_revisions_updated', load);
    };
  }, []);

  async function nextPost() {
    const data = await api('/api/teacher/activity2/next', { method: 'POST', body: '{}' });
    setState(data.state);
    setPost(data.post);
  }

  async function previousPost() {
    const data = await api('/api/teacher/activity2/previous', { method: 'POST', body: '{}' });
    setState(data.state);
    setPost(data.post);
  }

  async function revealAnswer() {
    const data = await api('/api/teacher/activity2/reveal', { method: 'POST', body: '{}' });
    setState(data.state);
    setPost(data.post);
  }

  function openRevisions() {
    const opened = window.open(`/teacher/activity2-revisions?post=${post.id}`, '_blank', 'width=1400,height=900,noreferrer');
    if (opened) opened.focus();
    else window.location.href = `/teacher/activity2-revisions?post=${post.id}`;
  }

  if (!post) return <div className="min-h-screen bg-stone-950 p-6 text-white">불러오는 중...</div>;
  const Card = renderers[post.type];
  const displayPost = { ...post, imageSrc: mediaImages[post.type] };
  const discussionComments = post.discussionComments || [];
  const isRevealed = Boolean(state.revealed?.[post.id]);

  return (
    <div className="min-h-screen bg-stone-950 p-6 text-white">
      <div className="mx-auto max-w-6xl space-y-5">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-4">
          <div>
            <p className="font-bold text-white/60">{mediaLabels[post.type]} 게시물 {state.step} / {state.total}</p>
            <h1 className="text-4xl font-black">활동2 댓글 고쳐 쓰기</h1>
          </div>
          <div className="flex gap-2">
            {state.step > 1 && <button className="rounded-md border border-white/30 px-4 py-3 font-black text-white" onClick={previousPost}>이전 게시물</button>}
            {state.step < state.total && <button className="rounded-md bg-white px-4 py-3 font-black text-stone-950" onClick={nextPost}>다음 게시물</button>}
          </div>
        </header>

        <section className="rounded-lg bg-white p-5 text-stone-950">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-black">댓글에서 고쳐야 할 부분을 찾아봅시다.</h2>
            <button className="rounded-md bg-rose-500 px-4 py-3 text-lg font-black text-white" onClick={openRevisions}>
              수정된 댓글 보기 {state.counts?.[post.id] || 0}
            </button>
            {!isRevealed && <button className="rounded-md bg-stone-950 px-4 py-3 text-lg font-black text-white" onClick={revealAnswer}>정답보기</button>}
          </div>
          <Card card={displayPost} />
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {discussionComments.map((comment) => (
              <article key={comment.id} className={`rounded-lg border p-4 ${comment.needsRevision && isRevealed ? 'border-rose-300 bg-rose-50' : 'border-stone-200 bg-white'}`}>
                <p className="leading-7">{comment.text}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
