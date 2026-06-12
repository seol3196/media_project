import { useEffect, useState } from 'react';
import { api } from '../../lib/session';
import { socket } from '../../lib/socket';
import malatangLunchImage from '../../assets/phase3/malatang-lunch.png';
import uniformChoiceImage from '../../assets/phase3/uniform-choice.png';
import dodgeballGymImage from '../../assets/phase3/dodgeball-gym.png';
import rewardStickersImage from '../../assets/phase3/reward-stickers.png';
import festivalStageImage from '../../assets/phase3/festival-stage.png';
import milkCartonsImage from '../../assets/phase3/milk-cartons.png';

const introScreens = [
  { title: '댓글전쟁', body: '댓글이 댓글 분위기를 어떻게 움직이는지 직접 체험합니다.' },
  { title: '활동 안내', body: '여러분은 모둠별로 하나의 게시글에 댓글을 작성할 예정이며, 각 모둠에는 미션이 주어집니다. 미션에 따라 댓글 흐름을 조작하세요.' },
  { title: '댓글조작 잘하는 방법', body: '1. 진짜 학생처럼 자연스럽게 말하기\n2. 반대 의견을 가볍게 보이게 만들기\n3. 모두가 같은 생각인 것처럼 분위기 만들기' },
  { title: '마지막 안내', body: '마지막 활동에서는 조작된 댓글을 찾습니다. 조작 댓글인 게 최대한 들키지 않도록 댓글과 댓글 사이에 자연스럽게 숨어야 합니다.' },
];

const platformProfiles = {
  A: {
    type: 'instagram',
    badge: 'SNS',
    handle: '@hanbit_school_life',
    name: '한빛초 급식로그',
    avatar: '급',
    accent: 'from-fuchsia-500 via-rose-500 to-amber-400',
  },
  B: {
    type: 'x',
    badge: '실시간 SNS',
    handle: '@hanbit_news',
    name: '한빛소식',
    avatar: 'H',
  },
  C: {
    type: 'youtube',
    badge: '유튜브',
    handle: '한빛 학교생활 TV',
    name: '한빛 학교생활 TV',
    avatar: '▶',
  },
  D: {
    type: 'community',
    badge: '커뮤니티',
    handle: '익명하늘이',
    name: '한빛초 6학년 게시판',
    avatar: '익',
  },
  E: {
    type: 'news',
    badge: '기사',
    handle: '한빛데일리 교육부',
    name: '한빛데일리',
    avatar: 'N',
  },
  F: {
    type: 'petition',
    badge: '청원',
    handle: '한빛 시민청원',
    name: '한빛 시민청원',
    avatar: '청',
  },
};

const postImages = {
  A: { src: malatangLunchImage, alt: '급식 트레이 위 마라탕 사진' },
  B: { src: uniformChoiceImage, alt: '책상 위 교복과 후드티 사진' },
  C: { src: dodgeballGymImage, alt: '체육관 바닥 위 피구공 사진' },
  D: { src: rewardStickersImage, alt: '교실 책상 위 칭찬 스티커 사진' },
  E: { src: festivalStageImage, alt: '빈 학교 무대와 마이크 사진' },
  F: { src: milkCartonsImage, alt: '급식실 책상 위 우유갑 사진' },
};

export default function TeacherActivity3Board() {
  const [data, setData] = useState(null);
  const [showMissions, setShowMissions] = useState(false);

  async function load() {
    setData(await api('/api/teacher/activity3/state'));
  }

  useEffect(() => {
    load();
    socket.on('activity3_updated', load);
    return () => socket.off('activity3_updated', load);
  }, []);

  async function intro(direction) {
    setData(await api('/api/teacher/activity3/intro', { method: 'POST', body: JSON.stringify({ direction }) }));
  }

  async function setStage(stage) {
    setData(await api('/api/teacher/activity3/stage', { method: 'POST', body: JSON.stringify({ stage }) }));
  }

  async function huntMove(direction) {
    setData(await api('/api/teacher/activity3/hunt-move', { method: 'POST', body: JSON.stringify({ direction }) }));
  }

  async function reveal() {
    setData(await api('/api/teacher/activity3/reveal', { method: 'POST', body: '{}' }));
  }

  if (!data) return <div className="min-h-screen bg-stone-950 p-6 text-white">불러오는 중...</div>;
  const { state } = data;
  const introScreen = introScreens[state.intro_step] || introScreens[0];
  const allTeamsDone = data.team_status.every((team) => team.complete);
  const allCommentsDone = data.comment_progress.every((student) => student.count >= student.required);
  const allSelected = data.hunt_status.every((student) => student.done);

  return (
    <div className="min-h-screen bg-stone-950 p-6 text-white">
      <div className="mx-auto max-w-6xl space-y-5">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-4">
          <div>
            <p className="font-bold text-white/60">활동3</p>
            <h1 className="text-4xl font-black">댓글전쟁 대시보드</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            {state.stage !== 'intro' && state.stage !== 'results' && <button className="rounded-md border border-white/30 px-4 py-3 font-black text-white" onClick={() => setStage('intro')}>이전 설명</button>}
            {state.stage === 'manipulation' && <button className="rounded-md bg-white px-4 py-3 font-black text-stone-950" onClick={() => setStage('comment')}>{allTeamsDone ? '댓글 달러 가기' : '끝내고 댓글 달러 가기'}</button>}
            {state.stage === 'comment' && <button className="rounded-md bg-white px-4 py-3 font-black text-stone-950" onClick={() => setStage('hunt')}>{allCommentsDone ? '조작된 댓글 찾기' : '활동 완료하고 찾기'}</button>}
            {state.stage === 'hunt' && state.hunt_index > 0 && <button className="rounded-md border border-white/30 px-4 py-3 font-black text-white" onClick={() => huntMove('previous')}>이전 게시물</button>}
            {state.stage === 'hunt' && state.hunt_index < data.posts.length - 1 && <button className="rounded-md bg-white px-4 py-3 font-black text-stone-950" onClick={() => huntMove('next')}>{allSelected ? '다음 게시물' : '끝내고 다음 게시물'}</button>}
            {state.stage === 'hunt' && state.hunt_index === data.posts.length - 1 && <button className="rounded-md bg-rose-500 px-4 py-3 font-black text-white" onClick={reveal}>정답 공개하기</button>}
            {state.stage === 'results' && <button className="rounded-md bg-white px-4 py-3 font-black text-stone-950" onClick={() => window.close()}>끝내기</button>}
          </div>
        </header>

        {state.stage === 'intro' && (
          <section className="grid min-h-[520px] place-items-center rounded-lg bg-white p-8 text-center text-stone-950">
            <div className="max-w-3xl">
              <h2 className="text-6xl font-black">{introScreen.title}</h2>
              <p className="mt-8 whitespace-pre-wrap text-2xl font-bold leading-10 text-stone-700">{introScreen.body}</p>
              <div className="mt-10 flex justify-center gap-2">
                {state.intro_step > 0 && <button className="rounded-md border px-5 py-3 font-black" onClick={() => intro('previous')}>이전</button>}
                {state.intro_step < introScreens.length - 1 && <button className="rounded-md bg-stone-950 px-5 py-3 font-black text-white" onClick={() => intro('next')}>다음</button>}
                {state.intro_step === introScreens.length - 1 && <button className="rounded-md bg-rose-500 px-5 py-3 font-black text-white" onClick={() => setStage('manipulation')}>댓글조작 시작하기</button>}
              </div>
            </div>
          </section>
        )}

        {state.stage === 'manipulation' && (
          <section className="rounded-lg bg-white p-6 text-stone-950">
            <h2 className="mb-4 text-3xl font-black">모둠별 활동 현황</h2>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {data.team_status.map((team) => (
                <article key={team.team} className="rounded-lg border border-stone-200 p-4">
                  <h3 className="text-xl font-black">{team.team}조</h3>
                  <p className="mt-2 line-clamp-2 text-sm font-bold text-stone-600">{team.title}</p>
                  <p className="mt-3 font-bold">댓글 {team.commented}/{team.members} · 준비 {team.ready}/{team.members}</p>
                  <div className={`mt-3 rounded-full px-3 py-1 text-center text-sm font-black ${team.complete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{team.complete ? '완료됨' : '진행중'}</div>
                </article>
              ))}
            </div>
          </section>
        )}

        {state.stage === 'comment' && (
          <section className="rounded-lg bg-white p-6 text-stone-950">
            <h2 className="mb-4 text-3xl font-black">학생별 댓글 진행 현황</h2>
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {data.comment_progress.map((student) => (
                <div key={student.id} className="rounded-lg border border-stone-200 p-3 font-bold">{student.student_number}번 {student.name} · {student.count}/{student.required}</div>
              ))}
            </div>
          </section>
        )}

        {state.stage === 'hunt' && (
          <section className="grid gap-5 lg:grid-cols-[1fr_320px]">
            <div className="rounded-lg bg-white p-6 text-stone-950">
              <PostCard post={data.hunt_post} />
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 font-bold leading-7">우리 모둠이 조작한 게시글에선 조작된 댓글을 맞혀도 점수가 없습니다. 친구들이 의심하지 않도록 조작 댓글과 조작이 아닌 댓글을 섞어서 선택하세요.</div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {data.hunt_comments.map((comment) => <div key={comment.id} className="rounded-lg border border-stone-200 p-4">{comment.nickname || '익명'}: {comment.content}</div>)}
              </div>
            </div>
            <aside className="rounded-lg bg-white p-5 text-stone-950">
              <h3 className="mb-3 text-xl font-black">선택 현황</h3>
              <div className="space-y-2">
                {data.hunt_status.map((student) => <div key={student.id} className="rounded border p-2 text-sm font-bold">{student.student_number}번 {student.name} · {student.done ? '선택완료' : '선택중'}</div>)}
              </div>
            </aside>
          </section>
        )}

        {state.stage === 'results' && (
          <section className="rounded-lg bg-white p-6 text-stone-950">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-3xl font-black">정답 공개</h2>
              <button className="rounded-md border px-4 py-2 font-bold" onClick={() => setShowMissions(!showMissions)}>조작 미션 확인하기</button>
            </div>
            {showMissions && <div className="mb-5 grid gap-3 md:grid-cols-2">{data.posts.map((post) => <div key={post.team} className="rounded-lg bg-amber-50 p-4"><b>{post.team}조:</b><p className="mt-2 whitespace-pre-wrap">{post.mission}</p></div>)}</div>}
            <div className="grid gap-4 md:grid-cols-2">
              {data.posts.map((post) => (
                <article key={post.team} className="rounded-lg border border-stone-200 p-4">
                  <h3 className="mb-2 text-xl font-black">{post.team}조 · {post.title}</h3>
                  <p><b>숨은 이권:</b> {post.secret}</p>
                  <p><b>미는 방향:</b> {post.direction}</p>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function PostCard({ post }) {
  const profile = platformProfiles[post.team] || platformProfiles.A;
  const bodyLines = splitBody(post.body);

  if (profile.type === 'instagram') return <InstagramPost post={post} profile={profile} bodyLines={bodyLines} />;
  if (profile.type === 'x') return <XPost post={post} profile={profile} bodyLines={bodyLines} />;
  if (profile.type === 'youtube') return <YoutubePost post={post} profile={profile} bodyLines={bodyLines} />;
  if (profile.type === 'community') return <CommunityPost post={post} profile={profile} bodyLines={bodyLines} />;
  if (profile.type === 'news') return <NewsPost post={post} profile={profile} bodyLines={bodyLines} />;
  if (profile.type === 'petition') return <PetitionPost post={post} profile={profile} bodyLines={bodyLines} />;
  return <BasicPost post={post} bodyLines={bodyLines} />;
}

function InstagramPost({ post, profile, bodyLines }) {
  const image = getPostImage(post);
  return (
    <article className="mx-auto max-w-xl overflow-hidden rounded-[1.75rem] border border-stone-200 bg-white shadow-2xl">
      <PlatformLabel profile={profile} />
      <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
        <Identity profile={profile} gradient />
        <span className="text-2xl leading-none">...</span>
      </div>
      <div className={`bg-gradient-to-br ${profile.accent} p-1`}>
        <div className="bg-white">
          <img className="aspect-square w-full object-cover" src={image.src} alt={image.alt} />
        </div>
      </div>
      <div className="space-y-3 p-5">
        <div className="flex gap-4 text-2xl"><span>♡</span><span>댓글</span><span>공유</span></div>
        <p className="text-sm font-black text-stone-900">{post.meta}</p>
        <h2 className="text-2xl font-black leading-tight">{post.title}</h2>
        <BodyLines lines={bodyLines} />
      </div>
    </article>
  );
}

function XPost({ post, profile, bodyLines }) {
  const image = getPostImage(post);
  return (
    <article className="mx-auto max-w-2xl rounded-2xl border border-stone-200 bg-white p-5 shadow-2xl">
      <PlatformLabel profile={profile} />
      <div className="flex gap-3">
        <Avatar profile={profile} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1">
            <span className="font-black">{profile.name}</span>
            <span className="text-stone-500">{profile.handle}</span>
            <span className="text-stone-400">· 방금</span>
          </div>
          <h2 className="mt-3 text-3xl font-black leading-tight">{post.title}</h2>
          <BodyLines lines={bodyLines} className="mt-3 text-[1.05rem]" />
          <img className="mt-4 aspect-video w-full rounded-2xl border border-stone-200 object-cover" src={image.src} alt={image.alt} />
          <div className="mt-5 grid grid-cols-4 border-t border-stone-100 pt-3 text-sm font-bold text-stone-500">
            <span>댓글</span><span>재게시</span><span>좋아요</span><span>공유</span>
          </div>
          <p className="mt-2 text-sm font-bold text-stone-500">{post.meta}</p>
        </div>
      </div>
    </article>
  );
}

function YoutubePost({ post, profile, bodyLines }) {
  const image = getPostImage(post);
  return (
    <article className="mx-auto max-w-4xl overflow-hidden rounded-xl bg-[#0f0f0f] text-white shadow-2xl">
      <PlatformLabel profile={profile} dark />
      <div className="relative grid aspect-video place-items-center overflow-hidden bg-stone-900">
        <img className="absolute inset-0 h-full w-full object-cover opacity-70" src={image.src} alt={image.alt} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/15" />
        <div className="absolute left-4 top-4 rounded bg-red-600 px-3 py-1 text-sm font-black">실시간 토론</div>
        <div className="relative grid h-16 w-24 place-items-center rounded-2xl bg-red-600 shadow-2xl">
          <div className="ml-1 h-0 w-0 border-y-[13px] border-l-[22px] border-y-transparent border-l-white" />
        </div>
        <h2 className="absolute bottom-5 left-5 right-5 text-3xl font-black leading-tight md:text-5xl">{post.title}</h2>
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

function CommunityPost({ post, profile, bodyLines }) {
  const image = getPostImage(post);
  return (
    <article className="mx-auto max-w-3xl overflow-hidden rounded-lg border border-sky-200 bg-white shadow-2xl">
      <PlatformLabel profile={profile} />
      <div className="border-b border-sky-100 bg-sky-50 px-5 py-3">
        <div className="text-sm font-black text-sky-700">{profile.name}</div>
        <h2 className="mt-2 text-3xl font-black leading-tight text-stone-950">{post.title}</h2>
      </div>
      <div className="grid grid-cols-[96px_1fr] gap-4 p-5">
        <div className="rounded-md border border-stone-200 bg-stone-50 p-3 text-center">
          <Avatar profile={profile} centered />
          <p className="mt-2 text-xs font-bold text-stone-500">{post.author}</p>
        </div>
        <div>
          <p className="mb-3 text-sm font-bold text-stone-500">{post.meta}</p>
          <img className="mb-4 aspect-video w-full rounded-lg border border-stone-200 object-cover" src={image.src} alt={image.alt} />
          <BodyLines lines={bodyLines} />
        </div>
      </div>
    </article>
  );
}

function NewsPost({ post, profile, bodyLines }) {
  const image = getPostImage(post);
  return (
    <article className="mx-auto max-w-4xl rounded-sm border border-stone-300 bg-[#fffdf6] p-6 font-serif shadow-2xl md:p-8">
      <PlatformLabel profile={profile} />
      <div className="border-b-2 border-stone-950 pb-3 text-center text-3xl font-black tracking-wide">{profile.name}</div>
      <p className="mt-4 text-sm font-bold text-stone-500">{post.mediaType} · {post.format}</p>
      <h2 className="mt-2 text-4xl font-black leading-tight text-stone-950">{post.title}</h2>
      <p className="mt-3 text-sm font-bold text-stone-500">{post.author} · {post.meta}</p>
      <img className="mt-5 aspect-video w-full border border-stone-300 object-cover" src={image.src} alt={image.alt} />
      <BodyLines lines={bodyLines} className="mt-5 text-stone-800" />
    </article>
  );
}

function PetitionPost({ post, profile, bodyLines }) {
  const image = getPostImage(post);
  return (
    <article className="mx-auto max-w-3xl overflow-hidden rounded-lg border border-emerald-200 bg-white shadow-2xl">
      <PlatformLabel profile={profile} />
      <div className="bg-emerald-700 px-5 py-4 text-white">
        <p className="text-sm font-black">{profile.name}</p>
        <h2 className="mt-2 text-3xl font-black leading-tight">{post.title}</h2>
      </div>
      <div className="grid gap-5 p-5 md:grid-cols-[1fr_220px]">
        <div>
          <p className="mb-3 text-sm font-bold text-stone-500">{post.author}</p>
          <img className="mb-4 aspect-video w-full rounded-lg border border-emerald-100 object-cover" src={image.src} alt={image.alt} />
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

function BasicPost({ post, bodyLines }) {
  return (
    <article>
      <p className="text-sm font-bold text-stone-500">{post.mediaType} · {post.format} · {post.author}</p>
      <h2 className="mt-2 text-3xl font-black leading-tight">{post.title}</h2>
      <p className="mt-2 text-sm font-bold text-stone-500">{post.meta}</p>
      <BodyLines lines={bodyLines} className="mt-4" />
    </article>
  );
}

function getPostImage(post) {
  return postImages[post.team] || postImages.A;
}

function PlatformLabel({ profile, dark = false }) {
  return (
    <div className={`flex items-center justify-between px-5 py-3 text-sm font-black ${dark ? 'text-white/75' : 'text-stone-500'}`}>
      <span>{profile.handle}</span>
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

function splitBody(body = '') {
  return String(body).split('\n').map((line) => line.trim());
}

function extractNumber(value = '') {
  const match = String(value).match(/[\d,]+/);
  return match?.[0];
}
