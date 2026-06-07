import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/session';
import { socket } from '../../lib/socket';

const stageLabels = {
  intro: '대기',
  manipulation: '여론 조작하기',
  comment: '댓글 달기',
  hunt: '조작 댓글 찾기',
  results: '결과 확인',
};

export default function Phase3() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [missionOpen, setMissionOpen] = useState(false);
  const [missionComment, setMissionComment] = useState('');
  const [normalDrafts, setNormalDrafts] = useState({});
  const [commentPostTeam, setCommentPostTeam] = useState(null);
  const [selected, setSelected] = useState([]);

  async function load() {
    const profile = await api('/api/student/profile');
    if (!profile.state.open_phases?.[3]) {
      navigate('/student');
      return;
    }
    const next = await api('/api/student/activity3/state');
    setData(next);
    setMissionComment(next.mission_comment?.content || '');
    setSelected(next.current_selection || []);
  }

  useEffect(() => {
    load();
    socket.on('activity3_updated', load);
    return () => socket.off('activity3_updated', load);
  }, [navigate]);

  async function submitMissionComment() {
    await api('/api/student/activity3/mission-comment', { method: 'POST', body: JSON.stringify({ content: missionComment }) });
    alert('댓글을 등록했습니다.');
    load();
  }

  async function ready() {
    await api('/api/student/activity3/ready', { method: 'POST', body: '{}' });
    load();
  }

  async function submitNormalComment(postId) {
    const content = normalDrafts[postId] || data.my_normal_comments?.[postId] || '';
    await api('/api/student/activity3/normal-comment', { method: 'POST', body: JSON.stringify({ post_id: postId, content }) });
    alert('댓글을 등록했습니다.');
    load();
  }

  function toggleComment(commentId) {
    setSelected((prev) => {
      if (prev.includes(commentId)) return prev.filter((id) => id !== commentId);
      if (prev.length >= 4) {
        alert('최대 4개까지 선택할 수 있습니다.');
        return prev;
      }
      return [...prev, commentId];
    });
  }

  async function submitSelection() {
    await api('/api/student/activity3/selection', { method: 'POST', body: JSON.stringify({ post_id: data.hunt_post.team, selected_comment_ids: selected }) });
    alert('선택을 완료했습니다.');
    load();
  }

  const visibleAvailablePosts = useMemo(() => {
    if (!data) return [];
    const offset = data.student?.id ? data.student.id % Math.max(1, data.available_posts.length) : 0;
    return [...data.available_posts.slice(offset), ...data.available_posts.slice(0, offset)];
  }, [data]);

  if (!data) return <div>불러오는 중...</div>;
  const stage = data.state.stage;
  const readyEnabled = Boolean(data.mission_comment) && !data.ready;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-stone-500">활동3 · {stageLabels[stage]}</p>
          <h2 className="text-3xl font-black">여론전쟁</h2>
        </div>
        <button className="rounded-md border px-3 py-2" onClick={() => navigate('/student')}>활동 목록</button>
      </header>

      {stage === 'intro' && (
        <section className="rounded-lg border border-stone-200 bg-white p-6">
          <h3 className="text-2xl font-black">선생님이 활동을 시작하면 게시글이 열립니다.</h3>
          <p className="mt-3 leading-7 text-stone-600">이번 활동에서는 댓글이 여론을 어떻게 움직이는지 직접 체험합니다.</p>
        </section>
      )}

      {stage === 'manipulation' && (
        <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <PostCard post={data.team_post} label={`${data.team}조 게시글`} />
          <aside className="space-y-4">
            <button className="w-full animate-pulse rounded-lg bg-amber-300 px-4 py-4 text-xl font-black text-stone-950" onClick={() => setMissionOpen(!missionOpen)}>누군가에게 온 쪽지</button>
            {missionOpen && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <h3 className="font-black">{data.team_post.missionTitle}</h3>
                <p className="mt-3 whitespace-pre-wrap leading-7">{data.team_post.mission}</p>
              </div>
            )}
            <textarea className="min-h-32 w-full rounded-md border p-3" placeholder="미션에 맞춰 조작 댓글을 작성하세요." value={missionComment} onChange={(event) => setMissionComment(event.target.value)} />
            <button className="w-full rounded-md bg-stone-950 px-4 py-3 font-bold text-white" onClick={submitMissionComment}>댓글 등록</button>
            <button disabled={!readyEnabled} className="w-full rounded-md border px-4 py-3 font-bold disabled:text-stone-300" onClick={ready}>준비완료</button>
            {data.ready && <div className="rounded-md bg-emerald-50 p-3 font-bold text-emerald-700">준비완료 상태입니다.</div>}
          </aside>
        </section>
      )}

      {stage === 'comment' && (
        <section className="space-y-4">
          <div className="rounded-lg border border-stone-200 bg-white p-4">
            <h3 className="text-xl font-black">다른 모둠 게시물에 댓글을 다세요.</h3>
            <p className="mt-2 text-sm font-bold text-stone-500">찬성 또는 반대 입장이 드러나야 합니다. 내가 조작한 게시물은 목록에 나오지 않습니다.</p>
          </div>
          {!commentPostTeam && (
            <div className="grid gap-3 md:grid-cols-2">
              {visibleAvailablePosts.map((post, index) => (
                <button key={post.team} className="rounded-lg border border-stone-200 bg-white p-5 text-left" onClick={() => setCommentPostTeam(post.team)}>
                  <div className="flex items-center justify-between">
                    <h4 className="text-xl font-black">게시물 {index + 1}</h4>
                    {data.my_normal_comments?.[post.team] && <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-700">댓글달기 완료</span>}
                  </div>
                  <p className="mt-3 text-sm font-bold text-stone-500">클릭해서 게시물 보기</p>
                </button>
              ))}
            </div>
          )}
          {commentPostTeam && (() => {
            const post = visibleAvailablePosts.find((item) => item.team === commentPostTeam);
            const value = normalDrafts[post.team] ?? data.my_normal_comments?.[post.team] ?? '';
            return (
              <article className="rounded-lg border border-stone-200 bg-white p-4">
                <button className="mb-3 rounded-md border px-3 py-2 font-bold" onClick={() => setCommentPostTeam(null)}>목록 보기</button>
                <PostCard post={post} compact />
                <textarea className="mt-3 min-h-24 w-full rounded-md border p-3" placeholder="찬성 또는 반대 입장을 담아 댓글을 쓰세요." value={value} onChange={(event) => setNormalDrafts({ ...normalDrafts, [post.team]: event.target.value })} />
                <button className="mt-2 rounded-md bg-stone-950 px-4 py-2 font-bold text-white" onClick={() => submitNormalComment(post.team)}>{data.my_normal_comments?.[post.team] ? '수정하기' : '댓글 등록'}</button>
              </article>
            );
          })()}
        </section>
      )}

      {stage === 'hunt' && (
        <section className="space-y-4">
          <PostCard post={data.hunt_post} label="선생님이 공개한 게시글" />
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 font-bold leading-7">
            우리 모둠이 조작한 게시글에선 조작된 댓글을 맞혀도 점수가 없습니다. 친구들이 의심하지 않도록 조작 댓글과 조작이 아닌 댓글을 섞어서 선택하세요.
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {data.hunt_comments.map((comment) => (
              <button key={comment.id} className={`rounded-lg border bg-white p-4 text-left leading-7 ${selected.includes(comment.id) ? 'border-emerald-500 ring-2 ring-emerald-300' : 'border-stone-200'}`} onClick={() => toggleComment(comment.id)}>
                <div className="mb-1 text-sm font-black text-stone-500">{comment.nickname || '익명'}</div>
                {comment.content}
              </button>
            ))}
          </div>
          <button className="rounded-md bg-stone-950 px-4 py-3 font-bold text-white" onClick={submitSelection}>선택완료 ({selected.length}/3~4)</button>
        </section>
      )}

      {stage === 'results' && (
        <section className="space-y-4">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-sm font-bold text-emerald-700">내 총점</p>
            <h3 className="text-4xl font-black text-emerald-900">{data.score}점</h3>
          </div>
          {data.posts.map((post) => (
            <article key={post.team} className="rounded-lg border border-stone-200 bg-white p-4">
              <h4 className="mb-3 text-xl font-black">{post.team}조 · {post.title}</h4>
              <div className="grid gap-3 md:grid-cols-2">
                {data.all_comments.filter((comment) => comment.post_id === post.team).map((comment) => (
                  <div key={comment.id} className={`rounded-lg border p-4 ${comment.is_manipulated ? 'border-rose-500 bg-rose-50' : 'border-stone-200'} ${comment.selected_by_me ? 'ring-2 ring-emerald-400' : ''}`}>
                    <div className="mb-1 text-sm font-black text-stone-500">{comment.nickname || '익명'} {comment.is_manipulated ? '· 조작 댓글' : ''}</div>
                    <p className="leading-7">{comment.content}</p>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

function PostCard({ post, label, compact = false }) {
  return (
    <article className={`rounded-lg border border-stone-200 bg-white p-5 shadow-sm ${compact ? '' : 'min-h-80'}`}>
      {label && <p className="mb-2 text-sm font-bold text-amber-700">{label}</p>}
      <div className="mb-2 text-sm font-bold text-stone-500">{post.mediaType} · {post.format} · {post.author}</div>
      <h3 className={`${compact ? 'text-xl' : 'text-3xl'} font-black leading-tight`}>{post.title}</h3>
      <p className="mt-2 text-sm font-bold text-stone-500">{post.meta}</p>
      <p className="mt-4 whitespace-pre-wrap leading-8 text-stone-800">{post.body}</p>
    </article>
  );
}
