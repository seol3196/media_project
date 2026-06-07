export default function OutletHeader({ outlet }) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm text-stone-500">{outlet.logo}</div>
          <h2 className="text-2xl font-black">{outlet.name}</h2>
          <p className="mt-1 text-stone-600">{outlet.slogan}</p>
        </div>
        <div className="max-w-sm rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">{outlet.sponsors}</div>
      </div>
    </div>
  );
}
