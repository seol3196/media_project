export default function NewspaperCard({ card }) {
  return (
    <article className="mx-auto max-w-4xl rounded-sm border border-stone-300 bg-[#fffdf6] p-5 font-serif shadow-xl md:p-8">
      <div className="border-y-2 border-stone-900 py-3 text-center">
        <div className="text-4xl font-black tracking-wide">{card.outlet}</div>
        <div className="mt-1 flex justify-between border-t border-stone-300 pt-2 text-xs text-stone-500">
          <span>사회면</span><span>{card.date}</span><span>제1284호</span>
        </div>
      </div>
      <div className="grid gap-6 pt-5 md:grid-cols-[1.05fr_0.95fr]">
        <div>
          <h3 className="text-4xl font-black leading-tight text-stone-950">{card.headline}</h3>
          <p className="mt-3 text-sm text-stone-500">{card.byline} · {card.date}</p>
          <p className="mt-5 columns-1 leading-8 text-stone-800 md:columns-2">{card.body}</p>
          <div className="mt-5 border-l-4 border-stone-900 bg-stone-100 p-3 text-sm font-bold leading-6 text-stone-700">시민 통행 불편이 커지면서 시는 관련 조례 마련을 검토하고 있다.</div>
        </div>
        <figure>
          <img className="aspect-[4/3] w-full border border-stone-300 object-cover grayscale" src={card.imageSrc} alt={card.imageAlt} />
          <figcaption className="mt-2 border-t border-stone-300 pt-2 text-xs text-stone-500">{card.imageAlt}</figcaption>
        </figure>
      </div>
    </article>
  );
}
