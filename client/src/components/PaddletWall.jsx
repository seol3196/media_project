export default function PaddletWall({ guesses = [], teacher = false, onMark }) {
  return (
    <div className="columns-1 gap-4 md:columns-2 lg:columns-3">
      {guesses.map((guess) => (
        <article key={guess.id} className={`mb-4 break-inside-avoid rounded-lg border bg-white p-4 shadow-sm ${guess.is_correct ? 'border-emerald-500' : 'border-stone-200'}`}>
          <div className="mb-2 text-sm font-semibold text-stone-500">{guess.student_number}번 {guess.name} {guess.is_correct ? '★' : ''}</div>
          <p className="whitespace-pre-wrap leading-7">{guess.guess_text}</p>
          {teacher && (
            <button className="mt-3 rounded-md border border-stone-300 px-3 py-1 text-sm" onClick={() => onMark?.(guess.id, !guess.is_correct)}>
              {guess.is_correct ? '정답 해제' : '정답 체크'}
            </button>
          )}
        </article>
      ))}
    </div>
  );
}
