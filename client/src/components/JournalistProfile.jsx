export default function JournalistProfile({ journalist, onClose }) {
  if (!journalist) return null;
  return (
    <div className="fixed inset-0 z-20 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl" onClick={(event) => event.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-2xl font-black">{journalist.name}</h3>
          <button className="rounded-md border px-3 py-1" onClick={onClose}>닫기</button>
        </div>
        <p className="font-semibold text-stone-700">{journalist.title} · {journalist.sns}</p>
        <blockquote className="my-4 rounded-md bg-stone-100 p-3">{journalist.quote}</blockquote>
        <h4 className="mb-2 font-bold">경력</h4>
        <ul className="mb-4 list-disc pl-5">{journalist.career.map((item) => <li key={item}>{item}</li>)}</ul>
        <h4 className="mb-2 font-bold">수상</h4>
        <ul className="list-disc pl-5">{journalist.awards.map((item) => <li key={item}>{item}</li>)}</ul>
      </div>
    </div>
  );
}
