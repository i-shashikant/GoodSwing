/**
 * GoodSwing Dashboard Loading State
 *
 * Next.js automatically displays this component while the dashboard
 * server components are loading.
 *
 * This is especially useful for GoodSwing because dashboard pages
 * perform Supabase requests before their final UI can be rendered.
 *
 * Instead of showing a blank/old page while those requests are running,
 * the user immediately sees the dashboard structure.
 */

export default function DashboardLoading() {
  return (
    <main className="min-h-screen bg-[#070b0a] text-white">
      <div className="mx-auto max-w-7xl px-5 py-8 md:px-8">
        {/* Dashboard heading skeleton */}
        <div className="mb-8">
          <div className="h-3 w-24 animate-pulse rounded bg-white/10" />

          <div className="mt-4 h-10 w-64 animate-pulse rounded-xl bg-white/10" />

          <div className="mt-3 h-4 w-80 max-w-full animate-pulse rounded bg-white/5" />
        </div>

        {/* Main statistics skeletons */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="rounded-2xl border border-white/10 bg-white/[.025] p-5"
            >
              <div className="h-3 w-20 animate-pulse rounded bg-white/10" />

              <div className="mt-5 h-8 w-28 animate-pulse rounded-lg bg-white/10" />

              <div className="mt-3 h-3 w-24 animate-pulse rounded bg-white/5" />
            </div>
          ))}
        </div>

        {/* Main content skeleton */}
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Large content card */}
          <div className="rounded-3xl border border-white/10 bg-white/[.025] p-6 lg:col-span-2">
            <div className="h-4 w-32 animate-pulse rounded bg-white/10" />

            <div className="mt-6 space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-2xl border border-white/5 p-4"
                >
                  <div>
                    <div className="h-4 w-32 animate-pulse rounded bg-white/10" />
                    <div className="mt-2 h-3 w-24 animate-pulse rounded bg-white/5" />
                  </div>

                  <div className="h-7 w-20 animate-pulse rounded-lg bg-white/10" />
                </div>
              ))}
            </div>
          </div>

          {/* Side card */}
          <div className="rounded-3xl border border-white/10 bg-white/[.025] p-6">
            <div className="h-4 w-28 animate-pulse rounded bg-white/10" />

            <div className="mt-6 space-y-5">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index}>
                  <div className="h-3 w-20 animate-pulse rounded bg-white/5" />
                  <div className="mt-2 h-5 w-36 animate-pulse rounded bg-white/10" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Lower content skeleton */}
        <div className="mt-6 rounded-3xl border border-white/10 bg-white/[.025] p-6">
          <div className="h-4 w-36 animate-pulse rounded bg-white/10" />

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-28 animate-pulse rounded-2xl bg-white/5"
              />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}