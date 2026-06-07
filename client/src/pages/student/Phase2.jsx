import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

export default function Phase2() {
  const [post, setPost] = useState(null);
  const [state, setState] = useState({ step: 1, total: 4 });
  const [revisionText, setRevisionText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [editing, setEditing] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const navigate = useNavigate();

  async function load() {
    const profile = await api('/api/student/profile');
    if (!profile.state.open_phases?.[2]) {
      navigate('/student');
      return;
    }
    const data = await api('/api/student/activity2/state');
    setPost(data.post);
    setState(data.state);
    setRevisionText(data.revision?.revised_text || '');
    setSubmitted(Boolean(data.submitted));
    setIsRevealed(Boolean(data.is_revealed));
    setEditing(Boolean(data.is_revealed) && !data.submitted);
  }

  useEffect(() => {
    load();
    socket.on('activity2_state_changed', load);
    return () => socket.off('activity2_state_changed', load);
  }, [navigate]);

  async function submitRevision() {
    if (!revisionText.trim()) {
      alert('수정한 댓글을 입력해주세요.');
      return;
    }
    await api('/api/student/activity2/revision', {
      method: 'POST',
      body: JSON.stringify({ post_id: post.id, revised_text: revisionText }),
    });
    setSubmitted(true);
    setEditing(false);
    alert('제출했습니다.');
  }

  if (!post) return <div>불러오는 중...</div>;
  const Card = renderers[post.type];
  const displayPost = { ...post, imageSrc: mediaImages[post.type] };
  const discussionComments = post.discussionComments || [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-stone-500">게시물 {state.step} / {state.total}</p>
          <h2 className="text-2xl font-black">활동2</h2>
        </div>
        <button className="rounded-md border px-3 py-2" onClick={() => navigate('/student')}>활동 목록</button>
      </div>

      <Card card={displayPost} />

      <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
        <h3 className="mb-4 text-xl font-black">{mediaLabels[post.type]} 게시물 댓글</h3>
        <div className="space-y-3">
          {discussionComments.map((comment) => (
            <article key={comment.id} className={`rounded-lg border p-4 ${comment.needsRevision && isRevealed ? 'border-rose-200 bg-rose-50' : 'border-stone-200 bg-white'}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <p className="leading-7 text-stone-900">{comment.text}</p>
                {comment.needsRevision && isRevealed && !editing && <button className="rounded-md bg-rose-500 px-3 py-2 text-sm font-bold text-white" onClick={() => setEditing(true)}>수정</button>}
              </div>
              {comment.needsRevision && isRevealed && editing && (
                <div className="mt-4 space-y-2">
                  <textarea
                    className="min-h-24 w-full rounded-md border border-rose-200 bg-white p-3 leading-7"
                    maxLength={220}
                    placeholder="상대방을 존중하고 근거가 드러나도록 댓글을 고쳐 써보세요."
                    value={revisionText}
                    onChange={(event) => setRevisionText(event.target.value)}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-500">{revisionText.length}/220</span>
                    <button className="rounded-md bg-stone-950 px-4 py-2 font-bold text-white" onClick={submitRevision}>제출</button>
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap gap-2 rounded-lg border border-stone-200 bg-white p-4">
        <button
          disabled={!submitted}
          className="rounded-md bg-stone-950 px-4 py-2 font-bold text-white disabled:bg-stone-300"
          onClick={() => navigate(`/student/activity2-revisions?post=${post.id}`)}
        >
          다른 학생 댓글 보기
        </button>
        <div className="py-2 text-sm font-bold text-stone-500">선생님이 다음 게시물을 열면 화면이 자동으로 바뀝니다.</div>
        {!isRevealed && <div className="py-2 text-sm font-bold text-rose-600">선생님이 수정할 댓글을 공개하면 수정할 수 있습니다.</div>}
      </div>
    </div>
  );
}
