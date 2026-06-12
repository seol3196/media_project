import { useEffect, useState } from 'react';
import { api } from '../../lib/session';
import { socket } from '../../lib/socket';

const mediaLabels = {
  newspaper: '신문',
  broadcast: '방송',
  sns: 'SNS',
  youtube: '유튜브',
};

const q1Answers = {
  newspaper: ['제목', '글', '사진'],
  broadcast: ['제목', '영상', '글'],
  sns: ['글', '사진', '해시태그', '좋아요'],
  youtube: ['제목', '글', '영상', '썸네일', '조회수', '좋아요'],
};

const q2Answers = {
  newspaper: '글과 사진으로 자세히 전달한다',
  broadcast: '영상과 글로 빠르게 전달한다',
  sns: '사람들이 쉽게 반응하고 공유한다',
  youtube: '제목과 썸네일로 관심을 끈다',
};

export default function TeacherActivity1Board() {
  const [state, setState] = useState({ step: 1, revealed: {}, counts: { 1: 0, 2: 0, 3: 0 } });
  const [showSolutions, setShowSolutions] = useState(false);

  async function load() {
    setState(await api('/api/teacher/activity1/state'));
  }

  useEffect(() => {
    load();
    socket.on('activity1_state_changed', setState);
    return () => socket.off('activity1_state_changed');
  }, []);

  useEffect(() => {
    setShowSolutions(false);
  }, [state.step]);

  async function revealAll(question, answers) {
    let nextState = state;
    for (const key of Object.keys(answers)) {
      nextState = await api('/api/teacher/activity1/reveal', { method: 'POST', body: JSON.stringify({ question, key }) });
    }
    setState(nextState);
    setShowSolutions(true);
  }

  async function hideAnswer(question) {
    setState(await api('/api/teacher/activity1/hide', { method: 'POST', body: JSON.stringify({ question }) }));
    setShowSolutions(false);
  }

  async function nextProblem() {
    setState(await api('/api/teacher/activity1/next', { method: 'POST', body: '{}' }));
  }

  async function previousProblem() {
    setState(await api('/api/teacher/activity1/previous', { method: 'POST', body: '{}' }));
  }

  function openTeacherWindow(path, name) {
    const opened = window.open(path, name);
    if (opened) {
      opened.focus();
      return;
    }
    alert('새 창을 열 수 없습니다. 브라우저의 팝업 차단 설정을 확인해주세요.');
  }

  return (
    <div className="min-h-screen bg-stone-950 p-6 text-white">
      <div className="mx-auto max-w-6xl space-y-5">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-4">
          <div>
            <h1 className="text-4xl font-black">활동1 같이 확인하기</h1>
          </div>
          <div className="flex gap-2">
            {state.step > 1 && <button className="rounded-md border border-white/30 px-4 py-3 font-black text-white" onClick={previousProblem}>이전 문제</button>}
            {state.step < 4 && <button className="rounded-md bg-white px-4 py-3 font-black text-stone-950" onClick={nextProblem}>다음 문제 풀기</button>}
          </div>
        </header>

        <section className="rounded-lg bg-white p-6 text-stone-950">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-3xl font-black">문제 {state.step}</h2>
            <span className="rounded-full bg-stone-100 px-4 py-2 font-bold">제출 {state.counts?.[state.step] || 0}명</span>
          </div>
          {state.step === 1 && (
            <QuestionReveal
              title="이 매체가 사용한 전달 방식은 무엇인가요?"
              showSolutions={showSolutions || Boolean(state.revealed?.['1']?.length)}
              answers={q1Answers}
              onReveal={() => revealAll(1, q1Answers)}
              onHide={() => hideAnswer(1)}
              renderAnswer={(value) => value.join(', ')}
            />
          )}
          {state.step === 2 && (
            <QuestionReveal
              title="각 매체의 특징을 알맞게 연결하세요."
              showSolutions={showSolutions || Boolean(state.revealed?.['2']?.length)}
              answers={q2Answers}
              onReveal={() => revealAll(2, q2Answers)}
              onHide={() => hideAnswer(2)}
              renderAnswer={(value) => value}
            />
          )}
          {state.step === 3 && (
            <div className="rounded-lg border border-stone-200 p-6">
              <h3 className="mb-3 text-2xl font-black">가장 정확해 보이는 매체와 마음을 가장 흔드는 매체를 골라 보고, 각각을 선택한 이유를 적어 보세요.</h3>
              <button
                type="button"
                className="inline-flex rounded-md bg-amber-400 px-5 py-4 text-xl font-black text-stone-950"
                onClick={() => openTeacherWindow('/teacher/activity1-padlet', 'activity1-padlet')}
              >
                답변 살펴보기
              </button>
            </div>
          )}
          {state.step === 4 && (
            <div className="rounded-lg border border-stone-200 p-6">
              <h3 className="mb-3 text-2xl font-black">실제로 SNS 게시글을 올려보세요.</h3>
              <p className="text-lg leading-8 text-stone-700">학생들이 사진을 선택하고 짧은 글을 게시하면 우리반 SNS에서 서로의 글을 볼 수 있습니다.</p>
              <button
                type="button"
                className="mt-5 inline-flex rounded-md bg-rose-500 px-5 py-4 text-xl font-black text-white"
                onClick={() => openTeacherWindow('/teacher/activity1-sns', 'activity1-sns')}
              >
                우리반 SNS 보기
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function QuestionReveal({ title, showSolutions, answers, onReveal, onHide, renderAnswer }) {
  return (
    <div>
      <div className="rounded-lg border border-stone-200 p-6">
        <h3 className="text-3xl font-black">{title}</h3>
        {!showSolutions && (
          <button className="mt-6 rounded-md bg-stone-950 px-5 py-4 text-xl font-black text-white" onClick={onReveal}>정답 확인</button>
        )}
        {showSolutions && (
          <button className="mt-6 rounded-md border border-stone-300 bg-white px-5 py-4 text-xl font-black text-stone-950" onClick={onHide}>정답 감추기</button>
        )}
      </div>
      {showSolutions && (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {Object.entries(answers).map(([key, answer]) => (
            <article key={key} className="rounded-lg border border-stone-200 p-5">
              <h4 className="mb-3 text-xl font-black">{mediaLabels[key]}</h4>
              <div className="min-h-16 rounded-md bg-emerald-50 p-4 text-lg font-bold text-emerald-800">
                {renderAnswer(answer)}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
