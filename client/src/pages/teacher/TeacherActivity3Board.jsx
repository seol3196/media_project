import { useEffect, useState } from 'react';
import { api } from '../../lib/session';
import { socket } from '../../lib/socket';

const introScreens = [
  { title: '여론전쟁', body: '댓글이 여론을 어떻게 움직이는지 직접 체험합니다.' },
  { title: '활동 안내', body: '여러분은 모둠별로 하나의 게시글에 댓글을 작성할 예정이며, 각 모둠에는 미션이 주어집니다. 미션에 따라 여론을 조작하세요.' },
  { title: '여론조작 잘하는 방법', body: '1. 진짜 학생처럼 자연스럽게 말하기\n2. 반대 의견을 가볍게 보이게 만들기\n3. 모두가 같은 생각인 것처럼 분위기 만들기' },
  { title: '마지막 안내', body: '마지막 활동에서는 조작된 댓글을 찾습니다. 조작 댓글인 게 최대한 들키지 않도록 댓글과 댓글 사이에 자연스럽게 숨어야 합니다.' },
];

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
            <h1 className="text-4xl font-black">여론전쟁 대시보드</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            {state.stage !== 'intro' && <button className="rounded-md border border-white/30 px-4 py-3 font-black text-white" onClick={() => setStage('intro')}>이전 설명</button>}
            {state.stage === 'manipulation' && <button className="rounded-md bg-white px-4 py-3 font-black text-stone-950" onClick={() => setStage('comment')}>{allTeamsDone ? '댓글 달러 가기' : '끝내고 댓글 달러 가기'}</button>}
            {state.stage === 'comment' && <button className="rounded-md bg-white px-4 py-3 font-black text-stone-950" onClick={() => setStage('hunt')}>{allCommentsDone ? '조작된 댓글 찾기' : '활동 완료하고 찾기'}</button>}
            {state.stage === 'hunt' && state.hunt_index > 0 && <button className="rounded-md border border-white/30 px-4 py-3 font-black text-white" onClick={() => huntMove('previous')}>이전 게시물</button>}
            {state.stage === 'hunt' && state.hunt_index < data.posts.length - 1 && <button className="rounded-md bg-white px-4 py-3 font-black text-stone-950" onClick={() => huntMove('next')}>{allSelected ? '다음 게시물' : '끝내고 다음 게시물'}</button>}
            {state.stage === 'hunt' && state.hunt_index === data.posts.length - 1 && <button className="rounded-md bg-rose-500 px-4 py-3 font-black text-white" onClick={reveal}>정답 공개하기</button>}
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
                {state.intro_step === introScreens.length - 1 && <button className="rounded-md bg-rose-500 px-5 py-3 font-black text-white" onClick={() => setStage('manipulation')}>여론조작 시작하기</button>}
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
  return (
    <article>
      <p className="text-sm font-bold text-stone-500">{post.mediaType} · {post.format} · {post.author}</p>
      <h2 className="mt-2 text-3xl font-black leading-tight">{post.title}</h2>
      <p className="mt-2 text-sm font-bold text-stone-500">{post.meta}</p>
      <p className="mt-4 whitespace-pre-wrap leading-8">{post.body}</p>
    </article>
  );
}
