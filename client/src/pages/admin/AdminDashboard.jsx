import { useEffect, useState } from 'react';
import { api } from '../../lib/session';

export default function AdminDashboard() {
  const [classes, setClasses] = useState([]);
  const [classCode, setClassCode] = useState('');
  const [error, setError] = useState('');

  async function loadClasses() {
    const data = await api('/api/admin/classes');
    setClasses(data.classes || []);
  }

  useEffect(() => {
    loadClasses();
  }, []);

  async function createClass(event) {
    event.preventDefault();
    setError('');
    try {
      const data = await api('/api/admin/classes', { method: 'POST', body: JSON.stringify({ class_code: classCode }) });
      setClasses([data.class, ...classes]);
      setClassCode('');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <header>
        <p className="text-sm font-bold text-amber-700">관리자</p>
        <h2 className="text-3xl font-black">교사 반코드 발급</h2>
      </header>

      <form onSubmit={createClass} className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <label className="block">
          <span className="mb-2 block text-sm font-bold text-stone-700">반 코드</span>
          <input
            className="w-full rounded-md border border-stone-300 px-3 py-2"
            placeholder="비워두면 자동 발급"
            value={classCode}
            onChange={(event) => setClassCode(event.target.value)}
          />
        </label>
        {error && <div className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{error}</div>}
        <button className="mt-4 rounded-md bg-stone-950 px-4 py-3 font-bold text-white">반코드 발급</button>
      </form>

      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-xl font-black">발급된 반코드</h3>
        <div className="overflow-hidden rounded-lg border border-stone-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-100 text-stone-600">
              <tr>
                <th className="px-3 py-2">반 코드</th>
                <th className="px-3 py-2">학생 수</th>
                <th className="px-3 py-2">발급일</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((item) => (
                <tr key={item.class_code} className="border-t border-stone-100">
                  <td className="px-3 py-3 font-black">{item.class_code}</td>
                  <td className="px-3 py-3">{item.student_count || 0}</td>
                  <td className="px-3 py-3 text-stone-500">{item.created_at || '-'}</td>
                </tr>
              ))}
              {classes.length === 0 && (
                <tr>
                  <td className="px-3 py-5 text-center text-stone-500" colSpan="3">발급된 반코드가 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
