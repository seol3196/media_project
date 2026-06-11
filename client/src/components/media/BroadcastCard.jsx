export default function BroadcastCard({ card }) {
  return (
    <article className="mx-auto max-w-5xl overflow-hidden rounded-lg bg-[#10131a] text-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-white/10 bg-[#171b24] px-4 py-3">
        <div className="rounded bg-red-600 px-3 py-1 text-sm font-black">{card.outlet}</div>
        <div className="text-xs font-bold text-slate-300">LIVE · 현장 리포트</div>
      </div>
      <div className="relative">
        <img className="aspect-video w-full object-cover opacity-85" src={card.imageSrc} alt="공원 입구에 방치된 킥보드 현장 화면" />
        <div className="absolute left-4 top-4 rounded-sm bg-black/70 px-3 py-1 text-sm font-black">한빛시 중앙공원</div>
        <div className="absolute bottom-10 left-0 right-0 bg-black/70 px-5 py-4">
          <h3 className="text-2xl font-black leading-tight md:text-4xl">{card.headline}</h3>
        </div>
      </div>
      <div className="flex items-center gap-3 bg-red-600 px-4 py-2 text-sm font-bold"><span className="rounded bg-white px-2 py-1 text-red-600">속보</span><span>{card.ticker.replace('속보 | ', '')}</span></div>
      <div className="border-t border-white/10 p-5 leading-8 text-slate-100">{card.script}</div>
    </article>
  );
}
