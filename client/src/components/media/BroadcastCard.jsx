export default function BroadcastCard({ card }) {
  return (
    <article className="mx-auto max-w-5xl overflow-hidden rounded-lg bg-slate-950 text-white shadow-2xl">
      <div className="relative">
        <img className="aspect-video w-full object-cover opacity-85" src={card.imageSrc} alt="공원 입구에 방치된 킥보드 현장 화면" />
        <div className="absolute left-0 top-0 bg-red-600 px-4 py-2 text-sm font-black">{card.outlet}</div>
        <div className="absolute bottom-10 left-0 right-0 bg-black/70 px-5 py-4">
          <h3 className="text-2xl font-black leading-tight md:text-4xl">{card.headline}</h3>
        </div>
      </div>
      <div className="bg-red-600 px-4 py-2 text-sm font-bold">{card.ticker}</div>
      <div className="border-t border-white/10 p-5 leading-8 text-slate-100">{card.script}</div>
    </article>
  );
}
