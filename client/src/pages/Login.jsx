import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, saveSession } from '../lib/session';

const mediaStreamItems = [
  { text: '속보 · 우리 학교 급식에 마라탕 등장', top: '6%', duration: '23s', delay: '-9s', color: '#EF9F27' },
  { text: '#실화냐 #급식혁명 #마라탕', top: '10%', duration: '19s', delay: '-15s', color: '#5DCAA5' },
  { text: '"이거 진짜임? 출처가 어디야"', top: '14%', duration: '28s', delay: '-4s', color: '#85B7EB' },
  { text: '조회수 38만 · 좋아요 1.8천', top: '18%', duration: '21s', delay: '-18s', color: '#F0997B' },
  { text: '"우리 반도 난리났음 ㅋㅋㅋ"', top: '22%', duration: '31s', delay: '-11s', color: '#ED93B1' },
  { text: '단독 · 학생 댓글 들끓는다', top: '26%', duration: '24s', delay: '-21s', color: '#FAC775' },
  { text: '댓글 247 · 공유 512', top: '30%', duration: '18s', delay: '-6s', color: '#9FE1CB' },
  { text: '"다들 속고 있는 거 아님?"', top: '34%', duration: '29s', delay: '-26s', color: '#B5D4F4' },
  { text: '#가짜뉴스 #팩트체크 #진실', top: '38%', duration: '20s', delay: '-13s', color: '#EF9F27' },
  { text: '실시간 검색어 1위', top: '42%', duration: '32s', delay: '-8s', color: '#5DCAA5' },
  { text: '"내가 봤는데 그거 아니던데"', top: '46%', duration: '25s', delay: '-19s', color: '#85B7EB' },
  { text: '좋아요 폭발 · 댓글 전쟁 중', top: '50%', duration: '22s', delay: '-2s', color: '#F0997B' },
  { text: '긴급 설문 · 찬성 51% 반대 49%', top: '54%', duration: '30s', delay: '-23s', color: '#ED93B1' },
  { text: '"친구가 그러는데 이미 결정됐대"', top: '58%', duration: '19s', delay: '-7s', color: '#FAC775' },
  { text: '#알고리즘 #추천폭주 #댓글조작', top: '62%', duration: '27s', delay: '-16s', color: '#9FE1CB' },
  { text: '공유 1,204 · 저장 89', top: '66%', duration: '21s', delay: '-12s', color: '#B5D4F4' },
  { text: '"기사 제목만 보면 완전 다른 얘기잖아"', top: '70%', duration: '32s', delay: '-28s', color: '#EF9F27' },
  { text: '방금 올라온 영상 · 조회수 급상승', top: '74%', duration: '24s', delay: '-5s', color: '#5DCAA5' },
  { text: '#팩트인지_느낌인지 #확인필수', top: '78%', duration: '29s', delay: '-17s', color: '#85B7EB' },
  { text: '댓글창 과열 · 신고 접수 증가', top: '82%', duration: '18s', delay: '-10s', color: '#F0997B' },
  { text: '"이 말투 너무 광고 같은데?"', top: '86%', duration: '26s', delay: '-22s', color: '#ED93B1' },
  { text: '속보 이후 12분 만에 900개 댓글', top: '90%', duration: '20s', delay: '-14s', color: '#FAC775' },
  { text: '#출처확인 #댓글흐름 #민주주의', top: '94%', duration: '31s', delay: '-25s', color: '#9FE1CB' },
  { text: '추천 피드가 같은 얘기만 보여준다', top: '98%', duration: '23s', delay: '-3s', color: '#B5D4F4' },
];

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
    <main className="min-h-screen bg-[#14110d]">
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-8 px-4 py-8 md:grid-cols-[minmax(0,1fr)_420px]">
        <section className="relative isolate min-h-[520px] overflow-hidden rounded-lg bg-[#14110d] px-6 py-10 text-white shadow-2xl md:min-h-[680px] md:px-10">
          <div className="media-rush-layer" aria-hidden="true">
            {mediaStreamItems.map((item, index) => (
              <span
                key={`${item.text}-${index}`}
                className="media-rush-line"
                style={{
                  '--line-top': item.top,
                  '--line-duration': item.duration,
                  '--line-delay': item.delay,
                  '--line-color': item.color,
                }}
              >
                {item.text}
              </span>
            ))}
          </div>
          <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#14110d] via-[#14110d]/80 to-[#14110d]/30" />
          <div className="relative z-20 flex min-h-[440px] flex-col justify-center md:min-h-[600px]">
            <p className="mb-3 text-sm font-black text-amber-300">민주주의와 미디어</p>
            <h1 className="max-w-xl text-5xl font-black leading-tight text-white md:text-7xl">미디어 세계</h1>
            <p className="mt-5 max-w-xl text-xl font-bold leading-9 text-stone-100 md:text-2xl">
              쏟아지는 정보 속에서, 무엇을 믿을 것인가
            </p>
          </div>
        </section>
        <form onSubmit={submit} className="relative z-20 rounded-lg border border-stone-200 bg-white p-5 shadow-2xl">
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
