import Link from "next/link";
import { ArrowRight, Heart, ShieldCheck, Sparkles } from "lucide-react";

import { login } from "@/app/auth/actions";
import { SubmitButton } from "@/components/auth/submit-button";
import { FadeIn } from "@/components/ui/fade-in";

/**
 * Login Page
 *
 * GoodSwing's login screen uses the same visual language as the
 * member dashboard:
 *
 * - Deep charcoal background
 * - GoodSwing green
 * - Bright mint accents
 * - Warm yellow brand mark
 * - Large editorial-style typography
 * - Rounded cards with subtle borders
 *
 * Authentication itself is handled by the existing `login`
 * server action. This file only controls the UI.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
  }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="min-h-screen bg-[#f7f6ef] text-[#171915] lg:grid lg:grid-cols-2">
      {/* =========================================================
          LEFT BRAND PANEL
          Hidden on smaller screens to keep the form compact.
      ========================================================= */}
      <section className="relative hidden min-h-screen overflow-hidden bg-[#0f4d32] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
        {/* Decorative background shapes */}
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[#27e0a3]/10 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-40 -left-32 h-[28rem] w-[28rem] rounded-full bg-[#f4cc5b]/10 blur-3xl" />

        <div className="pointer-events-none absolute right-20 top-1/2 h-40 w-40 rounded-full border border-white/5" />

        {/* Brand */}
        <Link
          href="/"
          className="relative flex w-fit items-center gap-3 text-xl font-extrabold tracking-tight transition-opacity hover:opacity-80"
        >
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#f4cc5b] text-lg font-black text-[#0f4d32] shadow-lg">
            G
          </span>

          <span>GoodSwing</span>
        </Link>

        {/* Main brand message */}
        <FadeIn className="relative max-w-xl">
          <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#27e0a3]/10">
            <Heart className="h-6 w-6 text-[#27e0a3]" />
          </div>

          <p className="mb-5 text-xs font-bold uppercase tracking-[0.28em] text-[#27e0a3]">
            GoodSwing membership
          </p>

          <h2 className="text-5xl font-black leading-[1.05] tracking-[-0.04em] xl:text-6xl">
            Play your game.
            <br />
            <span className="text-[#27e0a3]">Make it matter.</span>
          </h2>

          <p className="mt-7 max-w-lg text-base leading-7 text-white/70 xl:text-lg">
            Log your scores, support a cause you care about, and become
            eligible for the monthly GoodSwing prize draw.
          </p>

          {/* Small feature row */}
          <div className="mt-10 grid max-w-lg grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <Sparkles className="mb-3 h-5 w-5 text-[#f4cc5b]" />

              <p className="text-sm font-bold">Play with purpose</p>

              <p className="mt-1 text-xs leading-5 text-white/50">
                Your membership gives back.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <ShieldCheck className="mb-3 h-5 w-5 text-[#27e0a3]" />

              <p className="text-sm font-bold">One simple membership</p>

              <p className="mt-1 text-xs leading-5 text-white/50">
                Everything connected in one place.
              </p>
            </div>
          </div>
        </FadeIn>

        {/* Footer */}
        <p className="relative text-xs text-white/40">
          © {new Date().getFullYear()} GoodSwing
        </p>
      </section>

      {/* =========================================================
          RIGHT LOGIN PANEL
      ========================================================= */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7f6ef] px-6 py-12 sm:px-10">
        {/* Subtle decorative glow */}
        <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-[#27e0a3]/10 blur-3xl" />

        <FadeIn className="relative w-full max-w-md">
          {/* Mobile logo */}
          <Link
            href="/"
            className="mb-12 flex w-fit items-center gap-3 lg:hidden"
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f4cc5b] font-black text-[#0f4d32]">
              G
            </span>

            <span className="text-xl font-extrabold tracking-tight">
              GoodSwing
            </span>
          </Link>

          {/* Eyebrow */}
          <div className="mb-5 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#16b879]" />

            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#087c4b]">
              GoodSwing membership
            </p>
          </div>

          {/* Heading */}
          <h1 className="text-4xl font-black tracking-[-0.035em] text-[#171915] sm:text-5xl">
            Welcome back.
          </h1>

          <p className="mt-3 max-w-sm text-sm leading-6 text-[#686b64]">
            Log in to continue playing, supporting causes, and following your
            GoodSwing journey.
          </p>

          {/* Error message */}
          {error && (
            <div
              role="alert"
              className="mt-7 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
            >
              {error}
            </div>
          )}

          {/* Login form */}
          <form action={login} className="mt-8 space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-bold text-[#272923]"
              >
                Email address
              </label>

              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full rounded-2xl border border-[#d4d5cc] bg-white px-4 py-3.5 text-[#171915] shadow-sm outline-none transition placeholder:text-[#9a9c94] hover:border-[#aaaDA4] focus:border-[#16b879] focus:ring-4 focus:ring-[#16b879]/10"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-bold text-[#272923]"
              >
                Password
              </label>

              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="Your password"
                className="w-full rounded-2xl border border-[#d4d5cc] bg-white px-4 py-3.5 text-[#171915] shadow-sm outline-none transition placeholder:text-[#9a9c94] hover:border-[#aaaDA4] focus:border-[#16b879] focus:ring-4 focus:ring-[#16b879]/10"
              />
            </div>

            {/* Submit */}
            <SubmitButton>
              <span>Log in</span>
              <ArrowRight className="h-4 w-4" />
            </SubmitButton>
          </form>

          {/* Signup CTA */}
          <div className="mt-8 border-t border-[#d9d9d1] pt-7 text-center">
            <p className="text-sm text-[#686b64]">
              New to GoodSwing?{" "}
              <Link
                href="/signup"
                className="font-bold text-[#087c4b] transition-colors hover:text-[#005f39] hover:underline"
              >
                Create an account
              </Link>
            </p>
          </div>
        </FadeIn>
      </section>
    </main>
  );
}