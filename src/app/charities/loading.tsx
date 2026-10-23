

export default function CharitiesLoading() {
  return (
    <main className="min-h-screen bg-[#070b0a] text-white">
      <div className="mx-auto max-w-7xl px-5 py-12 md:px-8">
        {/* Heading */}
        <div>
          <div className="h-3 w-20 animate-pulse rounded bg-white/10" />

          <div className="mt-4 h-12 w-72 animate-pulse rounded-xl bg-white/10" />

          <div className="mt-4 h-4 w-[32rem] max-w-full animate-pulse rounded bg-white/5" />
        </div>

        {/* Search skeleton */}
        <div className="mt-8 h-12 w-full animate-pulse rounded-2xl bg-white/5" />

        {/* Charity cards */}
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-3xl border border-white/10 bg-white/[.025]"
            >
              {/* Image */}
              <div className="h-52 animate-pulse bg-white/5" />

              {/* Content */}
              <div className="p-6">
                <div className="h-5 w-40 animate-pulse rounded bg-white/10" />

                <div className="mt-3 h-3 w-full animate-pulse rounded bg-white/5" />

                <div className="mt-2 h-3 w-4/5 animate-pulse rounded bg-white/5" />

                <div className="mt-6 h-10 w-28 animate-pulse rounded-xl bg-white/10" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}