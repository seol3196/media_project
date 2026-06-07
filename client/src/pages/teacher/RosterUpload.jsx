import Papa from 'papaparse';
import { useState } from 'react';
import { api } from '../../lib/session';

export default function RosterUpload({ onUploaded }) {
  const [text, setText] = useState('');
  const [message, setMessage] = useState('');

  function parseRosterText(value) {
    return value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line, index) => {
        const normalized = line.replace(/\t/g, ',');
        const parts = normalized.split(',').map((item) => item.trim()).filter(Boolean);
        if (parts.length === 1) return { 번호: String(index + 1), 이름: parts[0] };
        const [studentNumber, ...nameParts] = parts;
        return { 번호: studentNumber, 이름: nameParts.join(' ').trim() };
      })
      .filter((row) => row['번호'] && row['이름'] && row['이름'] !== '이름');
  }

  async function uploadRows(rows) {
    if (rows.length === 0) {
      setMessage('등록할 명단이 없습니다. 이름을 한 줄에 한 명씩 입력해주세요.');
      return;
    }
    const result = await api('/api/teacher/upload-roster', { method: 'POST', body: JSON.stringify({ rows, replace: true }) });
    onUploaded(result.students);
    setMessage(`${result.students.length}명을 등록했습니다.`);
  }

  async function handleFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async ({ data }) => {
        uploadRows(data);
      },
    });
  }

  async function handlePasteSubmit(event) {
    event.preventDefault();
    await uploadRows(parseRosterText(text));
  }

  return (
    <div className="rounded-lg border border-stone-200 bg-white p-4">
      <h2 className="mb-2 text-lg font-black">명단 등록</h2>
      <p className="mb-3 text-sm text-stone-600">이름을 한 줄에 한 명씩 붙여넣으면 입력순으로 번호가 붙습니다. 등록하면 기존 명단을 덮어씁니다.</p>
      <form onSubmit={handlePasteSubmit}>
        <textarea
          className="min-h-32 w-full rounded-md border border-stone-300 p-3 text-sm"
          placeholder={'김학생\n이학생\n박학생'}
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button className="rounded-md bg-stone-950 px-4 py-2 text-sm font-bold text-white">명단 등록</button>
          <label className="rounded-md border border-stone-300 px-4 py-2 text-sm hover:bg-stone-100">
            CSV 파일 선택
            <input className="hidden" type="file" accept=".csv,text/csv" onChange={handleFile} />
          </label>
        </div>
      </form>
      {message && <p className="mt-3 text-sm text-stone-600">{message}</p>}
    </div>
  );
}
