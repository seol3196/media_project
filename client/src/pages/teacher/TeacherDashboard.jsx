import { useEffect, useState } from 'react';
import { api, getUser } from '../../lib/session';
import RosterUpload from './RosterUpload.jsx';
import Phase1Monitor from './Phase1Monitor.jsx';
import Phase2Monitor from './Phase2Monitor.jsx';
import Phase3Monitor from './Phase3Monitor.jsx';

const activitySummaries = {
  1: '매체별 전달 방식과 특징을 비교합니다.',
  2: '댓글을 읽고 토론에 도움이 되는 반응을 구분합니다.',
  3: '여론 조작 역할극과 추리 활동을 진행합니다.',
};

export default function TeacherDashboard() {
  const classCode = getUser()?.class_code || '6-2';
  const [phase, setPhase] = useState(0);
  const [openPhases, setOpenPhases] = useState({ 1: false, 2: false, 3: false });
  const [students, setStudents] = useState([]);
  const [p1, setP1] = useState([]);
  const [p2, setP2] = useState({ comments: [], classifications: [] });
  const [p3, setP3] = useState({ comments: [], votes: [], guesses: [], reflections: [] });
  const [editingStudents, setEditingStudents] = useState({});
  const [activity3TeamCount, setActivity3TeamCount] = useState(2);

  async function refresh() {
    const [{ phase: currentPhase, open_phases }, studentData, phase1, phase2, phase3, activity3] = await Promise.all([
      api(`/api/auth/phase?class_code=${encodeURIComponent(classCode)}`),
      api('/api/teacher/students'),
      api('/api/teacher/phase1'),
      api('/api/teacher/phase2'),
      api('/api/teacher/phase3'),
      api('/api/teacher/activity3/state'),
    ]);
    setPhase(currentPhase);
    setOpenPhases(open_phases);
    setStudents(studentData.students);
    setP1(phase1.responses);
    setP2(phase2);
    setP3(phase3);
    setActivity3TeamCount(activity3.state.team_count);
  }

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 5000);
    return () => clearInterval(timer);
  }, []);

  async function togglePhase(nextPhase, open) {
    const result = await api('/api/teacher/toggle-phase', { method: 'POST', body: JSON.stringify({ phase: nextPhase, open }) });
    setPhase(result.state.phase);
    setOpenPhases(result.state.open_phases);
  }

  async function assignTeams() {
    const result = await api('/api/teacher/assign-teams', { method: 'POST', body: '{}' });
    setStudents(result.students);
  }

  async function updateStudent(studentId) {
    const draft = editingStudents[studentId];
    if (!draft) return;
    const result = await api('/api/teacher/update-student', {
      method: 'POST',
      body: JSON.stringify({ student_id: studentId, student_number: draft.student_number, name: draft.name, team: draft.team }),
    });
    setStudents(result.students);
    setEditingStudents((prev) => {
      const next = { ...prev };
      delete next[studentId];
      return next;
    });
  }

  async function markCorrect(guess_id, is_correct) {
    await api('/api/teacher/mark-correct', { method: 'POST', body: JSON.stringify({ guess_id, is_correct }) });
    refresh();
  }

  function openActivity1Board() {
    const board = window.open('/teacher/activity1-board', 'activity1-board', 'width=1400,height=900');
    if (board) {
      board.focus();
      return;
    }
    window.location.href = '/teacher/activity1-board';
  }

  function openActivity2Board() {
    const board = window.open('/teacher/activity2-board', 'activity2-board', 'width=1400,height=900');
    if (board) {
      board.focus();
      return;
    }
    window.location.href = '/teacher/activity2-board';
  }

  function openActivity3Board() {
    const board = window.open('/teacher/activity3-board', 'activity3-board', 'width=1400,height=900');
    if (board) {
      board.focus();
      return;
    }
    window.location.href = '/teacher/activity3-board';
  }

  async function setTeamCount(count) {
    const result = await api('/api/teacher/activity3/team-count', { method: 'POST', body: JSON.stringify({ count }) });
    setActivity3TeamCount(result.state.team_count);
    refresh();
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-[1fr_320px]">
        <div className="rounded-lg border border-stone-200 bg-white p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-stone-500">활동 공개 상태</p>
              <h2 className="text-3xl font-black">{phase === 0 ? '열린 활동 없음' : `활동${phase} 최근 열림`}</h2>
            </div>
          </div>
          <div className="mb-4 grid gap-2 md:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="rounded-md border border-stone-200 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-bold">활동{item}</span>
                  <span className={`rounded-full px-2 py-1 text-xs font-bold ${openPhases[item] ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-500'}`}>
                    {openPhases[item] ? '열림' : '닫힘'}
                  </span>
                </div>
                <p className="mb-3 min-h-10 text-sm leading-5 text-stone-600">{activitySummaries[item]}</p>
                {item === 1 && (
                  <button type="button" className="mb-2 w-full rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-900" onClick={openActivity1Board}>
                    활동 대시보드
                  </button>
                )}
                {item === 2 && (
                  <button type="button" className="mb-2 w-full rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-900" onClick={openActivity2Board}>
                    활동 대시보드
                  </button>
                )}
                {item === 3 && (
                  <button type="button" className="mb-2 w-full rounded-md border border-sky-300 bg-sky-50 px-3 py-2 text-sm font-bold text-sky-900" onClick={openActivity3Board}>
                    활동 대시보드
                  </button>
                )}
                <button
                  className={`w-full rounded-md px-3 py-2 text-sm font-bold ${openPhases[item] ? 'border border-stone-300 text-stone-700' : 'bg-stone-950 text-white'}`}
                  onClick={() => togglePhase(item, !openPhases[item])}
                >
                  {openPhases[item] ? '닫기' : `활동${item} 열기`}
                </button>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {openPhases[3] && (
              <>
                <label className="flex items-center gap-2 rounded-md border px-3 py-2">
                  <span className="text-sm font-bold">모둠 수</span>
                  <select className="rounded border px-2 py-1" value={activity3TeamCount} onChange={(event) => setTeamCount(Number(event.target.value))}>
                    {[2, 3, 4, 5, 6].map((count) => <option key={count} value={count}>{count}개</option>)}
                  </select>
                </label>
                <button className="rounded-md border px-3 py-2" onClick={() => setTeamCount(activity3TeamCount)}>모둠 자동 배정</button>
              </>
            )}
            <button className="rounded-md border px-3 py-2" onClick={refresh}>새로고침</button>
          </div>
        </div>
        <RosterUpload onUploaded={setStudents} />
      </section>

      <section className="rounded-lg border border-stone-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-black">학생 현황</h2>
          <span className="text-sm text-stone-600">접속 {students.filter((s) => s.is_active).length} / {students.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead><tr className="border-b"><th className="py-2">번호</th><th>이름</th><th>조</th><th>접속</th><th>활동1</th><th>활동2</th><th>활동3</th><th></th></tr></thead>
            <tbody>
              {students.map((student) => {
                const draft = editingStudents[student.id];
                return (
                  <tr key={student.id} className="border-b last:border-0">
                    <td className="py-2">
                      {draft ? (
                        <input
                          className="w-16 rounded border border-stone-300 px-2 py-1"
                          value={draft.student_number}
                          onChange={(event) => setEditingStudents({ ...editingStudents, [student.id]: { ...draft, student_number: event.target.value } })}
                        />
                      ) : student.student_number}
                    </td>
                    <td>
                      {draft ? (
                        <input
                          className="w-28 rounded border border-stone-300 px-2 py-1"
                          value={draft.name}
                          onChange={(event) => setEditingStudents({ ...editingStudents, [student.id]: { ...draft, name: event.target.value } })}
                        />
                      ) : student.name}
                    </td>
                    <td>
                      {draft ? (
                        <select
                          className="rounded border border-stone-300 px-2 py-1"
                          value={draft.team || ''}
                          onChange={(event) => setEditingStudents({ ...editingStudents, [student.id]: { ...draft, team: event.target.value } })}
                        >
                          <option value="">-</option>
                          {['A', 'B', 'C', 'D', 'E', 'F'].map((team) => <option key={team} value={team}>{team}</option>)}
                        </select>
                      ) : student.team || '-'}
                    </td><td>{student.is_active ? '접속' : '-'}</td>
                    <td>{student.phase1_done ? '제출' : '-'}</td><td>{student.phase2_done ? '참여' : '-'}</td><td>{student.phase3_done ? '제출' : '-'}</td>
                    <td className="whitespace-nowrap">
                      {draft ? (
                        <div className="flex gap-1">
                          <button className="rounded border px-2 py-1" onClick={() => updateStudent(student.id)}>저장</button>
                          <button className="rounded border px-2 py-1" onClick={() => setEditingStudents((prev) => {
                            const next = { ...prev };
                            delete next[student.id];
                            return next;
                          })}>취소</button>
                        </div>
                      ) : (
                        <button className="rounded border px-2 py-1" onClick={() => setEditingStudents({ ...editingStudents, [student.id]: { student_number: student.student_number, name: student.name, team: student.team || '' } })}>수정</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <Phase1Monitor data={p1} />
        <Phase2Monitor data={p2} />
        <Phase3Monitor data={p3} onMark={markCorrect} />
      </div>
    </div>
  );
}
