export default function SNSCard({ card }) {
  return (
    <article className="mx-auto max-w-md overflow-hidden rounded-[1.75rem] border border-stone-200 bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-fuchsia-600 font-bold text-white">한</div>
          <div><div className="font-bold">{card.handle}</div><div className="text-sm text-stone-500">{card.username} · {card.timeAgo}</div></div>
        </div>
        <div className="text-xl font-black text-stone-500">...</div>
      </div>
      <img className="aspect-square w-full object-cover" src={card.imageSrc} alt="공원 입구 킥보드 방치 사진" />
      <div className="space-y-3 p-4">
        <div className="flex gap-4 text-2xl"><span>♡</span><span>⌁</span><span>↗</span></div>
        <div className="text-sm font-black">좋아요 {card.likes}개</div>
        <p className="text-base leading-7"><span className="font-black">{card.username.replace('@', '')}</span> {card.content}</p>
        <div className="text-sm text-stone-500">댓글 {card.comments}개 모두 보기 · 공유 {card.shares}</div>
      </div>
    </article>
  );
}
