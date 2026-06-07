export default function SNSCard({ card }) {
  return (
    <article className="mx-auto max-w-md rounded-[2rem] border border-stone-200 bg-white p-4 shadow-2xl">
      <div className="mb-4 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-full bg-amber-100 font-bold">한</div>
        <div><div className="font-bold">{card.handle}</div><div className="text-sm text-stone-500">{card.username} · {card.timeAgo}</div></div>
      </div>
      <img className="mb-4 aspect-[4/5] w-full rounded-2xl object-cover" src={card.imageSrc} alt="공원 입구 킥보드 방치 사진" />
      <p className="text-lg leading-8">{card.content}</p>
      <div className="mt-5 flex gap-5 border-t pt-3 text-sm text-stone-600">
        <span>좋아요 {card.likes}</span><span>댓글 {card.comments}</span><span>공유 {card.shares}</span>
      </div>
    </article>
  );
}
