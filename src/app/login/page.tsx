import Link from "next/link";
import { Heart } from "lucide-react";
import { login } from "@/app/auth/actions";
import { SubmitButton } from "@/components/auth/submit-button";
import { FadeIn } from "@/components/ui/fade-in";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <section className="relative hidden overflow-hidden bg-[#0f4d32] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl" />

        <Link href="/" className="relative flex items-center gap-2 text-xl font-extrabold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-white text-[#0f4d32]">G</span>
          GoodSwing
        </Link>

        <FadeIn className="relative max-w-md">
          <Heart className="mb-6 h-8 w-8 text-emerald-300" />
          <h2 className="text-4xl font-semibold leading-tight tracking-tight">
            Every round you play helps someone else win.
          </h2>
          <p className="mt-4 text-emerald-100/80">
            Log your scores, enter the monthly draw, and send a share of every
            subscription to a cause you care about.
          </p>
        </FadeIn>

        <p className="relative text-xs text-emerald-100/60">© GoodSwing</p>
      </section>

      {/* Form panel */}
      <section className="flex items-center justify-center bg-[#f7f7f2] px-6 py-12">
        <FadeIn className="w-full max-w-sm">
          <h1 className="text-3xl font-semibold tracking-tight">Welcome back.</h1>
          <p className="mt-2 text-sm text-neutral-500">Log in to continue.</p>

          {error && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form action={login} className="mt-8 space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 outline-none transition focus:border-[#176b45] focus:ring-4 focus:ring-emerald-700/10"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="Your password"
                className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 outline-none transition focus:border-[#176b45] focus:ring-4 focus:ring-emerald-700/10"
              />
            </div>

            <SubmitButton>Log in</SubmitButton>
          </form>

          <p className="mt-6 text-center text-sm text-neutral-500">
            New here?{" "}
            <Link href="/signup" className="font-semibold text-[#176b45] hover:underline">
              Create an account
            </Link>
          </p>
        </FadeIn>
      </section>
    </main>
  );
}