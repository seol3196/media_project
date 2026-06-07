export default function NewspaperCard({ card }) {
  return (
    <article className="mx-auto max-w-4xl rounded-sm border border-stone-300 bg-[#fffdf6] p-5 font-serif shadow-xl md:p-8">
      <div className="border-b-2 border-stone-900 pb-3 text-center text-3xl font-bold tracking-wide">{card.outlet}</div>
      <div className="grid gap-6 pt-5 md:grid-cols-[1.1fr_0.9fr]">
        <div>
          <h3 className="text-4xl font-black leading-tight text-stone-950">{card.headline}</h3>
          <p className="mt-3 text-sm text-stone-500">{card.byline} · {card.date}</p>
          <p className="mt-5 leading-8 text-stone-800">{card.body}</p>
        </div>
        <figure>
          <img className="aspect-[4/3] w-full object-cover grayscale" src={card.imageSrc} alt={card.imageAlt} />
          <figcaption className="mt-2 border-t border-stone-300 pt-2 text-xs text-stone-500">{card.imageAlt}</figcaption>
        </figure>
      </div>
    </article>
  );
}
