import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, saveSession } from '../lib/session';

export default function Login() {
  const [tab, setTab] = useState('student');
  const [form, setForm] = useState({ class_code: '6-2', username: '', password: '', student_number: '', name: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function submit(event) {
    event.preventDefault();
    setError('');
    try {
      const path = tab === 'admin' ? '/api/auth/admin-login' : tab === 'teacher' ? '/api/auth/teacher-login' : '/api/auth/student-login';
      const data = await api(path, { method: 'POST', body: JSON.stringify(form) });
      saveSession(data.token, data.user);
      navigate(tab === 'admin' ? '/admin' : tab === 'teacher' ? '/teacher' : '/student');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f7f2]">
      <div className="mx-auto grid min-h-screen max-w-5xl items-center gap-8 px-4 py-8 md:grid-cols-[1fr_420px]">
        <section>
          <p className="mb-3 text-sm font-semibold text-amber-700">민주주의와 미디어 체험 웹 앱</p>
          <h1 className="max-w-xl text-4xl font-black leading-tight text-stone-950 md:text-5xl">우리가 만드는 미디어 세상</h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-stone-700">
            한빛시 킥보드 조례를 둘러싼 기사, 댓글, 여론 조작 역할극을 통해 미디어 정보를 비판적으로 살펴봅니다.
          </p>
        </section>
        <form onSubmit={submit} className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <div className="mb-5 grid grid-cols-3 rounded-md bg-stone-100 p-1">
            {['student', 'teacher', 'admin'].map((item) => (
              <button
                type="button"
                key={item}
                onClick={() => setTab(item)}
                className={`rounded px-3 py-2 font-semibold ${tab === item ? 'bg-white text-stone-950 shadow-sm' : 'text-stone-500'}`}
              >
                {item === 'student' ? '학생' : item === 'teacher' ? '교사' : '관리자'}
              </button>
            ))}
          </div>
          {tab === 'admin' ? (
            <>
              <label className="mb-3 block">
                <span className="mb-1 block text-sm font-semibold">아이디</span>
                <input className="w-full rounded-md border border-stone-300 px-3 py-2" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
              </label>
              <label className="mb-3 block">
                <span className="mb-1 block text-sm font-semibold">비밀번호</span>
                <input type="password" className="w-full rounded-md border border-stone-300 px-3 py-2" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </label>
            </>
          ) : tab === 'teacher' ? (
            <label className="mb-3 block">
              <span className="mb-1 block text-sm font-semibold">반 코드</span>
              <input className="w-full rounded-md border border-stone-300 px-3 py-2" value={form.class_code} onChange={(e) => setForm({ ...form, class_code: e.target.value })} />
            </label>
          ) : (
            <>
              <label className="mb-3 block">
                <span className="mb-1 block text-sm font-semibold">반 코드</span>
                <input className="w-full rounded-md border border-stone-300 px-3 py-2" value={form.class_code} onChange={(e) => setForm({ ...form, class_code: e.target.value })} />
              </label>
              <label className="mb-3 block">
                <span className="mb-1 block text-sm font-semibold">번호</span>
                <input className="w-full rounded-md border border-stone-300 px-3 py-2" value={form.student_number} onChange={(e) => setForm({ ...form, student_number: e.target.value })} />
              </label>
              <label className="mb-3 block">
                <span className="mb-1 block text-sm font-semibold">이름</span>
                <input className="w-full rounded-md border border-stone-300 px-3 py-2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </label>
            </>
          )}
          {error && <div className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          <button className="w-full rounded-md bg-stone-950 px-4 py-3 font-bold text-white hover:bg-stone-800">입장</button>
          {tab === 'teacher' && <p className="mt-3 text-xs text-stone-500">관리자가 발급한 반 코드로 입장합니다.</p>}
        </form>
      </div>
    </main>
  );
}
