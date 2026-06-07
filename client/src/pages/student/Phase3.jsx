import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CommentBox from '../../components/CommentBox.jsx';
import JournalistProfile from '../../components/JournalistProfile.jsx';
import OutletHeader from '../../components/OutletHeader.jsx';
import PaddletWall from '../../components/PaddletWall.jsx';
import VoteChart from '../../components/VoteChart.jsx';
import { api } from '../../lib/session';
import { socket } from '../../lib/socket';

export default function Phase3() {
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [missionChecked, setMissionChecked] = useState(false);
  const [board, setBoard] = useState(null);
  const [journalist, setJournalist] = useState(null);
  const [reflection, setReflection] = useState({ answer1: '', answer2: '', answer3: '' });

  async function load() {
    const profile = await api('/api/student/profile');
    if (!profile.state.open_phases?.[3]) {
      navigate('/student');
      return;
    }
    const data = await api('/api/student/phase3/article');
    setArticle(data.content);
    const boardData = await api('/api/student/phase3/board');
    setBoard(boardData);
  }

  useEffect(() => {
    load();
    socket.on('new_comment', ({ phase, comment }) => phase === 3 && load());
    socket.on('board_opened', load);
    socket.on('board_revealed', load);
    socket.on('vote_updated', (votes) => setBoard((prev) => prev ? { ...prev, votes } : prev));
    socket.on('guess_submitted', (guess) => setBoard((prev) => prev ? { ...prev, guesses: [guess, ...prev.guesses] } : prev));
    socket.on('guess_checked', load);
    return () => {
      socket.off('new_comment');
      socket.off('board_opened');
      socket.off('board_revealed');
      socket.off('vote_updated');
      socket.off('guess_submitted');
      socket.off('guess_checked');
    };
  }, []);

  async function submitComment(content) {
    await api('/api/student/phase3/comment', { method: 'POST', body: JSON.stringify({ content }) });
  }

  async function vote(value) {
    const result = await api('/api/student/phase3/vote', { method: 'POST', body: JSON.stringify({ vote: value }) });
    setBoard({ ...board, votes: result.votes });
  }

  async function submitGuess(content) {
    await api('/api/student/phase3/guess', { method: 'POST', body: JSON.stringify({ guess_text: content }) });
  }

  async function submitReflection(event) {
    event.preventDefault();
    await api('/api/student/phase3/reflection', { method: 'POST', body: JSON.stringify(reflection) });
    alert('반성 서술을 제출했습니다.');
  }

  if (!article || !board) return <div>불러오는 중...</div>;

  if (!missionChecked) {
    return (
      <section className="mx-auto max-w-3xl rounded-lg border border-amber-300 bg-amber-50 p-6">
        <p className="mb-2 text-sm font-bold text-amber-800">활동3 미션 카드</p>
        <h2 className="text-2xl font-black">{article.outlet.name} 팀 미션</h2>
        <pre className="my-5 whitespace-pre-wrap rounded-lg bg-white p-4 leading-8">{article.mission}</pre>
        <button className="rounded-md bg-stone-950 px-4 py-2 font-bold text-white" onClick={() => setMissionChecked(true)}>확인</button>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between"><h2 className="text-2xl font-black">활동3</h2><button className="rounded-md border px-3 py-2" onClick={() => navigate('/student')}>활동 목록</button></div>
      <OutletHeader outlet={board.article.outlet} />
      <article className="rounded-lg border border-stone-200 bg-white p-5">
        <p className="text-sm text-stone-500">{board.article.article.date}</p>
        <h3 className="mt-2 text-3xl font-black leading-tight">{board.article.article.headline}</h3>
        <p className="mt-2 font-semibold text-stone-600">{board.article.article.subheadline}</p>
        <p className="mt-4 leading-8">{board.article.article.body}</p>
        <button className="mt-4 rounded-md border px-3 py-2" onClick={async () => setJournalist((await api('/api/student/phase3/journalist')).journalist)}>기자 프로필 보기</button>
      </article>

      {!board.state.board_open && (
        <section className="grid gap-4 md:grid-cols-[1fr_1fr]">
          <CommentBox onSubmit={submitComment} placeholder="익명 댓글을 작성하세요" button="익명 등록" />
          <CommentList comments={board.comments} revealed={board.state.revealed} />
        </section>
      )}

      {board.state.board_open && (
        <section className="space-y-4">
          <div className="rounded-lg border border-stone-200 bg-white p-4">
            <h3 className="mb-3 text-lg font-black">상대 팀 기사와 댓글</h3>
            <CommentList comments={board.comments} revealed={board.state.revealed} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-stone-200 bg-white p-4">
              <h3 className="mb-3 text-lg font-black">이 기사는?</h3>
              <div className="flex flex-wrap gap-2">
                <button className="rounded-md border px-3 py-2" onClick={() => vote('trust')}>믿을만함</button>
                <button className="rounded-md border px-3 py-2" onClick={() => vote('suspicious')}>이상함</button>
                <button className="rounded-md border px-3 py-2" onClick={() => vote('unsure')}>모르겠음</button>
              </div>
              <div className="mt-4"><VoteChart votes={board.votes} /></div>
            </div>
            <CommentBox onSubmit={submitGuess} placeholder="누가 어떤 의도로 댓글을 달았을지 추리하세요" button="담벼락 등록" />
          </div>
          <PaddletWall guesses={board.guesses} />
        </section>
      )}

      {board.state.revealed && (
        <form onSubmit={submitReflection} className="rounded-lg border border-emerald-300 bg-emerald-50 p-4">
          <h3 className="mb-3 text-lg font-black">정체 공개 후 반성</h3>
          {['answer1', 'answer2', 'answer3'].map((key, index) => (
            <textarea key={key} className="mb-3 min-h-20 w-full rounded-md border p-3" placeholder={`${index + 1}. 미디어를 볼 때 조심해야 할 점`} value={reflection[key]} onChange={(event) => setReflection({ ...reflection, [key]: event.target.value })} />
          ))}
          <button className="rounded-md bg-stone-950 px-4 py-2 font-bold text-white">제출</button>
        </form>
      )}
      <JournalistProfile journalist={journalist} onClose={() => setJournalist(null)} />
    </div>
  );
}

function CommentList({ comments = [], revealed }) {
  return (
    <div className="space-y-2">
      {comments.map((comment) => (
        <div key={comment.id} className="rounded border border-stone-200 bg-white p-3">
          <div className="mb-1 text-xs font-bold text-stone-500">{revealed ? `${comment.team}조` : '익명 시민'}</div>
          <p>{comment.content}</p>
        </div>
      ))}
    </div>
  );
}
