export default function YoutubeCard({ card }) {
  return (
    <article className="mx-auto max-w-5xl rounded-lg bg-[#0f0f0f] p-4 text-white shadow-2xl">
      <div className="relative overflow-hidden rounded-lg">
        <img className="aspect-video w-full object-cover" src={card.imageSrc} alt="킥보드 방치 현장을 담은 영상 썸네일" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/10 to-transparent" />
        <div className="absolute left-5 top-5 max-w-sm rounded bg-black/70 px-3 py-2 text-2xl font-black leading-tight md:text-4xl">직접 가봤습니다</div>
        <div className="absolute left-1/2 top-1/2 grid h-14 w-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-2xl bg-red-600">
          <div className="ml-1 h-0 w-0 border-y-[12px] border-l-[20px] border-y-transparent border-l-white" />
        </div>
      </div>
      <h3 className="mt-4 text-2xl font-black leading-tight">{card.title}</h3>
      <p className="mt-2 text-sm font-semibold text-stone-200">{card.channel}</p>
      <p className="text-sm text-stone-400">조회수 {card.views} · 좋아요 {card.likes} · {card.uploadedAt}</p>
      <p className="mt-3 text-stone-300">{card.description}</p>
    </article>
  );
}
