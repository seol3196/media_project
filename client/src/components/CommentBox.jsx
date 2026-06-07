import { useState } from 'react';

export default function CommentBox({ onSubmit, placeholder = '댓글을 입력하세요', button = '등록' }) {
  const [content, setContent] = useState('');
  async function submit(event) {
    event.preventDefault();
    if (!content.trim()) return;
    await onSubmit(content.trim());
    setContent('');
  }
  return (
    <form onSubmit={submit} className="rounded-lg border border-stone-200 bg-white p-4">
      <textarea className="min-h-24 w-full rounded-md border border-stone-300 p-3" placeholder={placeholder} value={content} onChange={(event) => setContent(event.target.value)} />
      <div className="mt-3 text-right">
        <button className="rounded-md bg-stone-950 px-4 py-2 font-bold text-white">{button}</button>
      </div>
    </form>
  );
}
