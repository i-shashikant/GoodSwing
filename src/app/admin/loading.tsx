
export default function AdminLoading() {
  return (
    <main className="admin-main">
      <div className="admin-container">
        {/* Page heading */}
        <div>
          <div className="h-3 w-24 animate-pulse rounded bg-white/10" />

          <div className="mt-4 h-10 w-64 animate-pulse rounded-xl bg-white/10" />

          <div className="mt-3 h-4 w-96 max-w-full animate-pulse rounded bg-white/5" />
        </div>

        {/* Admin statistics */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="rounded-2xl border border-white/10 bg-white/[.025] p-5"
            >
              <div className="h-3 w-20 animate-pulse rounded bg-white/10" />

              <div className="mt-5 h-8 w-24 animate-pulse rounded-lg bg-white/10" />
            </div>
          ))}
        </div>

        {/* Main admin table/card */}
        <div className="mt-6 rounded-3xl border border-white/10 bg-white/[.025] p-6">
          <div className="h-4 w-32 animate-pulse rounded bg-white/10" />

          <div className="mt-6 space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-16 animate-pulse rounded-2xl bg-white/5"
              />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}