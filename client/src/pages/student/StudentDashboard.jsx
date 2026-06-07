import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, getUser } from '../../lib/session';
import { socket } from '../../lib/socket';

const activities = [
  {
    phase: 1,
    title: '활동1',
    path: '/student/phase1',
  },
  {
    phase: 2,
    title: '활동2',
    path: '/student/phase2',
  },
  {
    phase: 3,
    title: '활동3',
    path: '/student/phase3',
  },
];

export default function StudentDashboard() {
  const user = getUser();
  const classCode = user?.student?.class_code || '6-2';
  const [state, setState] = useState({ open_phases: { 1: false, 2: false, 3: false } });

  async function load() {
    const data = await api(`/api/auth/phase?class_code=${encodeURIComponent(classCode)}`);
    setState(data);
  }

  useEffect(() => {
    load();
    socket.on('phase_status_changed', setState);
    return () => socket.off('phase_status_changed');
  }, []);

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-stone-200 bg-white p-5">
        <p className="text-sm text-stone-500">{user?.student?.student_number}번 {user?.student?.name}</p>
        <h2 className="mt-1 text-3xl font-black">활동 대시보드</h2>
        <p className="mt-3 text-stone-600">선생님이 연 활동만 시작할 수 있습니다.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {activities.map((activity) => {
          const isOpen = Boolean(state.open_phases?.[activity.phase]);
          return (
            <article key={activity.phase} className={`rounded-lg border bg-white p-5 ${isOpen ? 'border-emerald-300' : 'border-stone-200 opacity-70'}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-stone-500">{activity.title}</span>
                <span className={`rounded-full px-2 py-1 text-xs font-bold ${isOpen ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-500'}`}>
                  {isOpen ? '열림' : '닫힘'}
                </span>
              </div>
              {isOpen ? (
                <Link className="mt-5 block rounded-md bg-stone-950 px-4 py-3 text-center font-bold text-white" to={activity.path}>
                  {activity.title} 시작하기
                </Link>
              ) : (
                <button className="mt-5 w-full rounded-md border border-stone-300 px-4 py-3 font-bold text-stone-400" disabled>
                  아직 열리지 않았습니다
                </button>
              )}
            </article>
          );
        })}
      </section>
    </div>
  );
}
