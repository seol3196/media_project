import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/session';
import { socket } from '../../lib/socket';
import malatangLunchImage from '../../assets/phase3/malatang-lunch.png';

const stageLabels = {
  intro: '대기',
  manipulation: '여론 조작하기',
  comment: '댓글 달기',
  hunt: '조작 댓글 찾기',
  results: '결과 확인',
};

const platformProfiles = {
  A: {
    type: 'instagram',
    app: 'Hanbitgram',
    badge: 'SNS',
    handle: '@hanbit_school_life',
    name: '한빛초 급식로그',
    avatar: '급',
    accent: 'from-fuchsia-500 via-rose-500 to-amber-400',
  },
  B: {
    type: 'x',
    app: 'X',
    badge: '실시간 SNS',
    handle: '@hanbit_news',
    name: '한빛소식',
    avatar: 'H',
  },
  C: {
    type: 'youtube',
    app: 'YouTube',
    badge: '영상',
    handle: '한빛 학교생활 TV',
    name: '한빛 학교생활 TV',
    avatar: '▶',
  },
  D: {
    type: 'community',
    app: '한빛톡',
    badge: '커뮤니티',
    handle: '익명하늘이',
    name: '한빛초 6학년 게시판',
    avatar: '익',
  },
  E: {
    type: 'news',
    app: '한빛데일리',
    badge: '뉴스 기사',
    handle: '한빛데일리 교육부',
    name: '한빛데일리',
    avatar: 'N',
  },
  F: {
    type: 'petition',
    app: '한빛시민청원',
    badge: '온라인 청원',
    handle: '한빛 시민청원',
    name: '한빛 시민청원',
    avatar: '청',
  },
};

const teamFallback = ['A', 'B', 'C', 'D', 'E', 'F'];

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
    alert('댓글이 등록되었습니다.');
    load();
  }

  async function ready() {
    await api('/api/student/activity3/ready', { method: 'POST', body: '{}' });
    load();
  }

  async function submitNormalComment(postId) {
    const content = normalDrafts[postId] || data.my_normal_comments?.[postId] || '';
    await api('/api/student/activity3/normal-comment', { method: 'POST', body: JSON.stringify({ post_id: postId, content }) });
    alert('댓글이 등록되었습니다.');
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
    alert('선택이 완료되었습니다.');
    load();
  }

  const visibleAvailablePosts = useMemo(() => {
    if (!data) return [];
    const offset = data.student?.id ? data.student.id % Math.max(1, data.available_posts.length) : 0;
    return [...data.available_posts.slice(offset), ...data.available_posts.slice(0, offset)];
  }, [data]);

  if (!data) return <div className="rounded-lg border border-stone-200 bg-white p-6 font-bold">불러오는 중...</div>;
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
        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            <PostCard post={data.team_post} label={`${data.team}조 게시글`} />
            <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
              <label className="mb-2 block text-sm font-black text-stone-700">조작 댓글 작성</label>
              <textarea className="min-h-32 w-full rounded-md border p-3" placeholder="미션에 맞춰 조작 댓글을 작성하세요." value={missionComment} onChange={(event) => setMissionComment(event.target.value)} />
              <button className="mt-3 w-full rounded-md bg-stone-950 px-4 py-3 font-bold text-white" onClick={submitMissionComment}>댓글 등록</button>
            </div>
          </div>
          <aside className="space-y-4">
            <button className="w-full animate-pulse rounded-lg bg-amber-300 px-4 py-4 text-xl font-black text-stone-950" onClick={() => setMissionOpen(!missionOpen)}>미션 쪽지</button>
            {missionOpen && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <h3 className="font-black">{data.team_post.missionTitle}</h3>
                <p className="mt-3 whitespace-pre-wrap leading-7">{data.team_post.mission}</p>
              </div>
            )}
            <button disabled={!readyEnabled} className="w-full rounded-md border px-4 py-3 font-bold disabled:text-stone-300" onClick={ready}>준비완료</button>
            {data.ready && <div className="rounded-md bg-emerald-50 p-3 font-bold text-emerald-700">준비완료 상태입니다.</div>}
          </aside>
        </section>
      )}

      {stage === 'comment' && (
        <section className="space-y-4">
          <div className="rounded-lg border border-stone-200 bg-white p-4">
            <h3 className="text-xl font-black">다른 모둠 게시물에 댓글을 다세요</h3>
            <p className="mt-2 text-sm font-bold text-stone-500">찬성 또는 반대 입장을 드러내야 합니다. 내가 조작한 게시물은 목록에 나오지 않습니다.</p>
          </div>
          {!commentPostTeam && (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {visibleAvailablePosts.map((post, index) => (
                <button key={post.team} className="group rounded-lg border border-stone-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg" onClick={() => setCommentPostTeam(post.team)}>
                  <PostPreview post={post} index={index} done={Boolean(data.my_normal_comments?.[post.team])} />
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
  const profile = getPlatformProfile(post);
  const bodyLines = splitBody(post.body);

  if (profile.type === 'news') return <NewsPost post={post} profile={profile} label={label} compact={compact} bodyLines={bodyLines} />;
  if (profile.type === 'youtube') return <YoutubePost post={post} profile={profile} label={label} compact={compact} bodyLines={bodyLines} />;
  if (profile.type === 'community') return <CommunityPost post={post} profile={profile} label={label} compact={compact} bodyLines={bodyLines} />;
  if (profile.type === 'petition') return <PetitionPost post={post} profile={profile} label={label} compact={compact} bodyLines={bodyLines} />;
  if (profile.type === 'x') return <XPost post={post} profile={profile} label={label} compact={compact} bodyLines={bodyLines} />;
  return <InstagramPost post={post} profile={profile} label={label} compact={compact} bodyLines={bodyLines} />;
}

function InstagramPost({ post, profile, label, compact, bodyLines }) {
  return (
    <article className={`mx-auto max-w-xl overflow-hidden rounded-[1.75rem] border border-stone-200 bg-white shadow-xl ${compact ? '' : 'min-h-80'}`}>
      <PlatformLabel label={label} profile={profile} />
      <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
        <Identity profile={profile} gradient />
        <span className="text-2xl leading-none">...</span>
      </div>
      <div className={`bg-gradient-to-br ${profile.accent} p-1`}>
        <div className="bg-white">
          <img className="aspect-square w-full object-cover" src={malatangLunchImage} alt="급식 트레이 위 마라탕 사진" />
        </div>
      </div>
      <div className="space-y-3 p-5">
        <div className="flex gap-4 text-2xl"><span>♡</span><span>💬</span><span>↗</span></div>
        <p className="text-sm font-black text-stone-900">{post.meta}</p>
        <h3 className="text-xl font-black leading-tight">{post.title}</h3>
        <BodyLines lines={bodyLines} />
      </div>
    </article>
  );
}

function XPost({ post, profile, label, bodyLines }) {
  return (
    <article className="mx-auto max-w-2xl rounded-2xl border border-stone-200 bg-white p-5 shadow-xl">
      <PlatformLabel label={label} profile={profile} />
      <div className="flex gap-3">
        <Avatar profile={profile} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1">
            <span className="font-black">{profile.name}</span>
            <span className="text-stone-500">{profile.handle}</span>
            <span className="text-stone-400">· 방금</span>
          </div>
          <h3 className="mt-3 text-2xl font-black leading-tight">{post.title}</h3>
          <BodyLines lines={bodyLines} className="mt-3 text-[1.05rem]" />
          <div className="mt-5 grid grid-cols-4 border-t border-stone-100 pt-3 text-sm font-bold text-stone-500">
            <span>댓글</span><span>재게시</span><span>좋아요</span><span>공유</span>
          </div>
          <p className="mt-2 text-sm font-bold text-stone-500">{post.meta}</p>
        </div>
      </div>
    </article>
  );
}

function YoutubePost({ post, profile, label, bodyLines }) {
  return (
    <article className="mx-auto max-w-4xl overflow-hidden rounded-xl bg-[#0f0f0f] text-white shadow-2xl">
      <PlatformLabel label={label} profile={profile} dark />
      <div className="relative grid aspect-video place-items-center bg-gradient-to-br from-stone-900 via-stone-800 to-red-950 p-6">
        <div className="absolute left-4 top-4 rounded bg-red-600 px-3 py-1 text-sm font-black">LIVE 토론</div>
        <div className="grid h-16 w-24 place-items-center rounded-2xl bg-red-600 shadow-2xl">
          <div className="ml-1 h-0 w-0 border-y-[13px] border-l-[22px] border-y-transparent border-l-white" />
        </div>
        <h3 className="absolute bottom-5 left-5 right-5 text-3xl font-black leading-tight md:text-5xl">{post.title}</h3>
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <Identity profile={profile} dark />
          <button className="rounded-full bg-white px-4 py-2 text-sm font-black text-stone-950">구독</button>
        </div>
        <p className="mt-3 text-sm font-bold text-stone-400">{post.meta}</p>
        <div className="mt-4 rounded-xl bg-white/10 p-4">
          <BodyLines lines={bodyLines} className="text-stone-100" />
        </div>
      </div>
    </article>
  );
}

function CommunityPost({ post, profile, label, bodyLines }) {
  return (
    <article className="mx-auto max-w-3xl overflow-hidden rounded-lg border border-sky-200 bg-white shadow-xl">
      <PlatformLabel label={label} profile={profile} />
      <div className="border-b border-sky-100 bg-sky-50 px-5 py-3">
        <div className="text-sm font-black text-sky-700">{profile.name}</div>
        <h3 className="mt-2 text-2xl font-black leading-tight text-stone-950">{post.title}</h3>
      </div>
      <div className="grid grid-cols-[96px_1fr] gap-4 p-5">
        <div className="rounded-md border border-stone-200 bg-stone-50 p-3 text-center">
          <Avatar profile={profile} centered />
          <p className="mt-2 text-xs font-bold text-stone-500">{post.author}</p>
        </div>
        <div>
          <p className="mb-3 text-sm font-bold text-stone-500">{post.meta}</p>
          <BodyLines lines={bodyLines} />
        </div>
      </div>
    </article>
  );
}

function NewsPost({ post, profile, label, compact, bodyLines }) {
  return (
    <article className={`mx-auto max-w-4xl rounded-sm border border-stone-300 bg-[#fffdf6] p-5 font-serif shadow-xl md:p-8 ${compact ? '' : 'min-h-80'}`}>
      <PlatformLabel label={label} profile={profile} />
      <div className="border-b-2 border-stone-950 pb-3 text-center text-3xl font-black tracking-wide">{profile.name}</div>
      <div className="mt-4">
        <div>
          <p className="text-sm font-bold text-stone-500">{post.mediaType} · {post.format}</p>
          <h3 className="mt-2 text-4xl font-black leading-tight text-stone-950">{post.title}</h3>
          <p className="mt-3 text-sm font-bold text-stone-500">{post.author} · {post.meta}</p>
          <BodyLines lines={bodyLines} className="mt-5 text-stone-800" />
        </div>
      </div>
    </article>
  );
}

function PetitionPost({ post, profile, label, bodyLines }) {
  return (
    <article className="mx-auto max-w-3xl overflow-hidden rounded-lg border border-emerald-200 bg-white shadow-xl">
      <PlatformLabel label={label} profile={profile} />
      <div className="bg-emerald-700 px-5 py-4 text-white">
        <p className="text-sm font-black">{profile.name}</p>
        <h3 className="mt-2 text-3xl font-black leading-tight">{post.title}</h3>
      </div>
      <div className="grid gap-5 p-5 md:grid-cols-[1fr_220px]">
        <div>
          <p className="mb-3 text-sm font-bold text-stone-500">{post.author}</p>
          <BodyLines lines={bodyLines} />
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-black text-emerald-800">현재 동의</p>
          <p className="mt-1 text-4xl font-black text-emerald-900">{extractNumber(post.meta) || '1,847'}</p>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-emerald-100">
            <div className="h-full w-3/4 rounded-full bg-emerald-600" />
          </div>
          <button className="mt-4 w-full rounded-md bg-emerald-700 px-4 py-3 font-black text-white">동의하기</button>
        </div>
      </div>
    </article>
  );
}

function PostPreview({ post, index, done }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-black text-stone-600">게시물 {index + 1}</span>
        {done && <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">댓글 쓰기 완료</span>}
      </div>
      <div className="mt-4 grid h-24 place-items-center rounded-md border border-dashed border-stone-300 bg-stone-50 text-2xl font-black text-stone-400">
        ?
      </div>
    </div>
  );
}

function PlatformLabel({ label, profile, dark = false }) {
  if (!label) return null;
  return (
    <div className={`flex items-center justify-between px-5 py-3 text-sm font-black ${dark ? 'text-white/75' : 'text-stone-500'}`}>
      <span>{label}</span>
      <span className={`rounded-full px-3 py-1 ${dark ? 'bg-white/10 text-white' : 'bg-stone-100 text-stone-700'}`}>{profile.badge}</span>
    </div>
  );
}

function Identity({ profile, gradient = false, dark = false }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar profile={profile} gradient={gradient} />
      <div>
        <div className={`font-black ${dark ? 'text-white' : 'text-stone-950'}`}>{profile.name}</div>
        <div className={`text-sm ${dark ? 'text-stone-400' : 'text-stone-500'}`}>{profile.handle}</div>
      </div>
    </div>
  );
}

function Avatar({ profile, gradient = false, centered = false }) {
  const className = gradient
    ? `grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br ${profile.accent} text-sm font-black text-white`
    : 'grid h-11 w-11 place-items-center rounded-full bg-stone-950 text-sm font-black text-white';
  return <div className={`${className} ${centered ? 'mx-auto' : ''}`}>{profile.avatar}</div>;
}

function BodyLines({ lines, className = '' }) {
  return (
    <div className={`whitespace-pre-wrap leading-8 ${className}`}>
      {lines.map((line, index) => line ? <p key={index} className="mb-3 last:mb-0">{line}</p> : <div key={index} className="h-2" />)}
    </div>
  );
}

function getPlatformProfile(post) {
  if (platformProfiles[post.team]) return platformProfiles[post.team];
  const index = Math.max(0, teamFallback.indexOf(post.team));
  return platformProfiles[teamFallback[index % teamFallback.length]];
}

function splitBody(body = '') {
  return String(body).split('\n').map((line) => line.trim());
}

function extractNumber(value = '') {
  const match = String(value).match(/[\d,]+/);
  return match?.[0];
}

function previewSurface(type) {
  if (type === 'youtube') return 'bg-[#0f0f0f] text-white';
  if (type === 'news') return 'bg-[#fffdf6] text-stone-800 border border-stone-200 font-serif';
  if (type === 'petition') return 'bg-emerald-50 text-emerald-900 border border-emerald-100';
  if (type === 'community') return 'bg-sky-50 text-sky-900 border border-sky-100';
  if (type === 'x') return 'bg-white text-stone-950 border border-stone-200';
  return 'bg-gradient-to-br from-fuchsia-500 via-rose-500 to-amber-400 text-white';
}
