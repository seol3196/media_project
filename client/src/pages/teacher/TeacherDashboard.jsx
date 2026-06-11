import { useEffect, useState } from 'react';
import { api, getUser } from '../../lib/session';
import RosterUpload from './RosterUpload.jsx';

const activitySummaries = {
  1: '매체별 전달 방식과 특징을 비교합니다.',
  2: '댓글을 읽고 토론에 도움이 되는 반응을 구분합니다.',
  3: '댓글 조작 역할극과 추리 활동을 진행합니다.',
};

const activityDetails = {
  1: [
    '신문, 방송, SNS, 유튜브 형식의 같은 사건 자료를 학생들이 살펴봅니다.',
    '매체마다 주로 쓰는 전달 방식과 특징을 체크하고 연결합니다.',
    '가장 정확해 보이는 매체와 가장 관심을 끄는 매체를 고르고 이유를 씁니다.',
    '마지막에는 학생들이 직접 SNS 게시물을 만들어 보고 우리 반 피드에서 서로의 글을 확인합니다.',
  ],
  2: [
    '활동1에서 봤던 네 가지 게시물에 댓글 5개씩이 붙어 있습니다.',
    '교사가 정답보기를 누르면 고쳐야 할 댓글이 공개되고, 학생들은 그 댓글을 더 좋은 댓글로 바꿔 씁니다.',
    '학생이 제출하면 다른 학생 댓글 보기가 열리고, 교사는 수정된 댓글 보기 창에서 포스트잇처럼 모아 볼 수 있습니다.',
    '핵심은 비난하거나 단정하는 댓글을 사실 확인, 존중, 해결책이 담긴 댓글로 바꾸는 것입니다.',
  ],
  3: [
    '학생들은 모둠별로 서로 다른 게시글을 맡아 미션에 맞는 조작 댓글을 작성합니다.',
    '그 뒤 다른 게시글에 일반 댓글을 달고, 마지막에는 어떤 댓글이 조작 댓글인지 추리합니다.',
    '교사용 활동 대시보드에서 설명, 댓글 작성, 일반 댓글, 조작 댓글 찾기, 정답 공개 단계를 진행합니다.',
    '댓글이 사람들의 판단과 분위기에 어떤 영향을 주는지 체험하고 돌아보는 활동입니다.',
  ],
};

export default function TeacherDashboard() {
  const classCode = getUser()?.class_code || '6-2';
  const [phase, setPhase] = useState(0);
  const [openPhases, setOpenPhases] = useState({ 1: false, 2: false, 3: false });
  const [students, setStudents] = useState([]);
  const [editingStudents, setEditingStudents] = useState({});
  const [activity3TeamCount, setActivity3TeamCount] = useState(2);
  const [resetTarget, setResetTarget] = useState('1');
  const [expandedActivity, setExpandedActivity] = useState(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);

  async function refresh() {
    const [{ phase: currentPhase, open_phases }, studentData, activity3] = await Promise.all([
      api(`/api/auth/phase?class_code=${encodeURIComponent(classCode)}`),
      api('/api/teacher/students'),
      api('/api/teacher/activity3/state'),
    ]);
    setPhase(currentPhase);
    setOpenPhases(open_phases);
    setStudents(studentData.students);
    setSelectedStudentIds((prev) => prev.filter((id) => studentData.students.some((student) => student.id === id)));
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

  async function resetActivity(activity) {
    if (!window.confirm(`활동${activity}에서 학생들이 작업한 내용을 초기화할까요?`)) return;
    await api('/api/teacher/reset-activity', { method: 'POST', body: JSON.stringify({ phase: activity }) });
    refresh();
  }

  async function resetAllActivities() {
    if (!window.confirm('전체 활동의 학생 작업 내용과 진행 상태를 모두 초기화할까요?')) return;
    await api('/api/teacher/reset-all-activities', { method: 'POST', body: '{}' });
    refresh();
  }

  async function resetBySelectedTarget() {
    if (resetTarget === 'all') {
      await resetAllActivities();
      return;
    }
    await resetActivity(Number(resetTarget));
  }

  async function resetStudentActivities(student) {
    if (!window.confirm(`${student.student_number}번 ${student.name} 학생의 모든 활동 기록을 초기화할까요?`)) return;
    const result = await api('/api/teacher/reset-student-activities', { method: 'POST', body: JSON.stringify({ student_id: student.id }) });
    setStudents(result.students);
    refresh();
  }

  function toggleStudentSelection(studentId) {
    setSelectedStudentIds((prev) => (
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    ));
  }

  function toggleAllStudents(checked) {
    setSelectedStudentIds(checked ? students.map((student) => student.id) : []);
  }

  async function deleteSelectedStudents() {
    if (selectedStudentIds.length === 0) {
      alert('삭제할 학생을 선택해주세요.');
      return;
    }
    if (!window.confirm(`선택한 학생 ${selectedStudentIds.length}명을 삭제할까요? 학생 활동 기록도 함께 삭제됩니다.`)) return;
    const result = await api('/api/teacher/delete-students', { method: 'POST', body: JSON.stringify({ student_ids: selectedStudentIds }) });
    setStudents(result.students);
    setSelectedStudentIds([]);
    refresh();
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="rounded-lg border border-stone-200 bg-white p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-stone-500">활동 공개 상태</p>
              <h2 className="text-3xl font-black">{phase === 0 ? '열린 활동 없음' : `활동${phase} 최근 열림`}</h2>
            </div>
            <button className="rounded-md border px-3 py-2" onClick={refresh}>새로고침</button>
          </div>
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-red-100 bg-red-50 p-3">
            <label className="flex items-center gap-2">
              <span className="text-sm font-black text-red-800">초기화 대상</span>
              <select className="rounded-md border border-red-200 bg-white px-3 py-2 font-bold text-red-900" value={resetTarget} onChange={(event) => setResetTarget(event.target.value)}>
                <option value="1">활동1</option>
                <option value="2">활동2</option>
                <option value="3">활동3</option>
                <option value="all">모든 활동</option>
              </select>
            </label>
            <button className="rounded-md border border-red-300 bg-white px-4 py-2 font-black text-red-700" onClick={resetBySelectedTarget}>초기화</button>
          </div>
          <div className="mb-4 space-y-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="rounded-md border border-stone-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-xl font-black">활동{item}</span>
                      <span className={`rounded-full px-2 py-1 text-xs font-bold ${openPhases[item] ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-500'}`}>
                        {openPhases[item] ? '열림' : '닫힘'}
                      </span>
                    </div>
                    <p className="text-sm leading-6 text-stone-600">{activitySummaries[item]}</p>
                  </div>
                  <button
                    className="rounded-md border border-stone-300 px-3 py-2 text-sm font-bold text-stone-700"
                    onClick={() => setExpandedActivity(expandedActivity === item ? null : item)}
                  >
                    활동 설명 보기
                  </button>
                </div>
                {expandedActivity === item && (
                  <div className="mt-3 rounded-md bg-stone-50 p-3">
                    <ul className="space-y-2 text-sm leading-6 text-stone-700">
                      {activityDetails[item].map((detail) => <li key={detail}>- {detail}</li>)}
                    </ul>
                  </div>
                )}
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {item === 1 && (
                    <button type="button" className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-900" onClick={openActivity1Board}>
                      활동 대시보드
                    </button>
                  )}
                  {item === 2 && (
                    <button type="button" className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-900" onClick={openActivity2Board}>
                      활동 대시보드
                    </button>
                  )}
                  {item === 3 && (
                    <button type="button" className="rounded-md border border-sky-300 bg-sky-50 px-3 py-2 text-sm font-bold text-sky-900" onClick={openActivity3Board}>
                      활동 대시보드
                    </button>
                  )}
                  <button
                    className={`rounded-md px-3 py-2 text-sm font-bold ${openPhases[item] ? 'border border-stone-300 text-stone-700' : 'bg-stone-950 text-white'}`}
                    onClick={() => togglePhase(item, !openPhases[item])}
                  >
                    {openPhases[item] ? '활동 닫기' : `활동${item} 열기`}
                  </button>
                </div>
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
          </div>
        </div>
        <RosterUpload onUploaded={setStudents} />
      </section>

      <section className="rounded-lg border border-stone-200 bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black">학생 현황</h2>
            <p className="text-sm text-stone-600">접속 {students.filter((s) => s.is_active).length} / {students.length}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-stone-500">선택 {selectedStudentIds.length}명</span>
            <button className="rounded-md border border-red-300 bg-red-50 px-3 py-2 font-bold text-red-700 disabled:opacity-40" disabled={selectedStudentIds.length === 0} onClick={deleteSelectedStudents}>선택 학생 삭제</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2">
                  <input
                    type="checkbox"
                    checked={students.length > 0 && selectedStudentIds.length === students.length}
                    onChange={(event) => toggleAllStudents(event.target.checked)}
                    aria-label="전체 학생 선택"
                  />
                </th>
                <th>번호</th><th>이름</th><th>조</th><th>접속</th><th>활동1</th><th>활동2</th><th>활동3</th><th></th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => {
                const draft = editingStudents[student.id];
                return (
                  <tr key={student.id} className="border-b last:border-0">
                    <td className="py-2">
                      <input
                        type="checkbox"
                        checked={selectedStudentIds.includes(student.id)}
                        onChange={() => toggleStudentSelection(student.id)}
                        aria-label={`${student.name} 선택`}
                      />
                    </td>
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
                        <div className="flex gap-1">
                          <button className="rounded border px-2 py-1" onClick={() => setEditingStudents({ ...editingStudents, [student.id]: { student_number: student.student_number, name: student.name, team: student.team || '' } })}>수정</button>
                          <button className="rounded border border-red-200 bg-red-50 px-2 py-1 text-red-700" onClick={() => resetStudentActivities(student)}>활동 초기화</button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
