import Link from "next/link";
import {
  ArrowRight,
  Heart,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { signup } from "@/app/auth/actions";
import { FadeIn } from "@/components/ui/fade-in";

/**
 * Signup Page
 *
 * Creates a new GoodSwing account.
 *
 * The actual account creation is still handled by the existing
 * `signup` server action. This component is only responsible
 * for presenting the signup experience.
 */
type SignupPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function SignupPage({
  searchParams,
}: SignupPageProps) {
  const params = await searchParams;
  const error = params.error;

  return (
    <main className="min-h-screen bg-[#f7f6ef] text-[#171915] lg:grid lg:grid-cols-2">
      {/* =========================================================
          LEFT BRAND PANEL
      ========================================================= */}
      <section className="relative hidden min-h-screen overflow-hidden bg-[#0f4d32] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
        {/* Decorative shapes */}
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[#27e0a3]/10 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-40 -left-32 h-[28rem] w-[28rem] rounded-full bg-[#f4cc5b]/10 blur-3xl" />

        <div className="pointer-events-none absolute bottom-40 right-20 h-44 w-44 rounded-full border border-white/5" />

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

        {/* Main message */}
        <FadeIn className="relative max-w-xl">
          <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#27e0a3]/10">
            <Heart className="h-6 w-6 text-[#27e0a3]" />
          </div>

          <p className="mb-5 text-xs font-bold uppercase tracking-[0.28em] text-[#27e0a3]">
            Join the club
          </p>

          <h2 className="text-5xl font-black leading-[1.05] tracking-[-0.04em] xl:text-6xl">
            Your game.
            <br />
            <span className="text-[#27e0a3]">Your impact.</span>
          </h2>

          <p className="mt-7 max-w-lg text-base leading-7 text-white/70 xl:text-lg">
            Create your GoodSwing account, choose a membership, support a
            cause, and start working towards your monthly prize draw entry.
          </p>

          {/* Feature cards */}
          <div className="mt-10 grid max-w-lg grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <Sparkles className="mb-3 h-5 w-5 text-[#f4cc5b]" />

              <p className="text-sm font-bold">Play your game</p>

              <p className="mt-1 text-xs leading-5 text-white/50">
                Track your Stableford scores.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <Heart className="mb-3 h-5 w-5 text-[#27e0a3]" />

              <p className="text-sm font-bold">Make it matter</p>

              <p className="mt-1 text-xs leading-5 text-white/50">
                Support a cause you care about.
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
          RIGHT SIGNUP PANEL
      ========================================================= */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7f6ef] px-6 py-10 sm:px-10">
        {/* Decorative glow */}
        <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-[#27e0a3]/10 blur-3xl" />

        <FadeIn className="relative w-full max-w-md">
          {/* Mobile logo */}
          <Link
            href="/"
            className="mb-10 flex w-fit items-center gap-3 lg:hidden"
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
              Start playing with purpose
            </p>
          </div>

          {/* Heading */}
          <h1 className="text-4xl font-black tracking-[-0.035em] text-[#171915] sm:text-5xl">
            Join GoodSwing.
          </h1>

          <p className="mt-3 max-w-sm text-sm leading-6 text-[#686b64]">
            Create your account and start your journey as a GoodSwing member.
          </p>

          {/* Error */}
          {error && (
            <div
              role="alert"
              className="mt-7 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
            >
              {error}
            </div>
          )}

          {/* Signup form */}
          <form action={signup} className="mt-8 space-y-5">
            {/* Full name */}
            <div>
              <label
                htmlFor="fullName"
                className="mb-2 block text-sm font-bold text-[#272923]"
              >
                Full name
              </label>

              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                autoComplete="name"
                placeholder="Your full name"
                className="w-full rounded-2xl border border-[#d4d5cc] bg-white px-4 py-3.5 text-[#171915] shadow-sm outline-none transition placeholder:text-[#9a9c94] hover:border-[#aaaDA4] focus:border-[#16b879] focus:ring-4 focus:ring-[#16b879]/10"
              />
            </div>

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
                minLength={6}
                autoComplete="new-password"
                placeholder="At least 6 characters"
                className="w-full rounded-2xl border border-[#d4d5cc] bg-white px-4 py-3.5 text-[#171915] shadow-sm outline-none transition placeholder:text-[#9a9c94] hover:border-[#aaaDA4] focus:border-[#16b879] focus:ring-4 focus:ring-[#16b879]/10"
              />

              <p className="mt-2 text-xs text-[#85877f]">
                Use at least 6 characters.
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0f4d32] px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#0f4d32]/10 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#0a3d27] hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-[#16b879]/20 active:translate-y-0"
            >
              <span>Create account</span>

              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </button>
          </form>

          {/* Trust message */}
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-[#dcded5] bg-white/60 p-4">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#087c4b]" />

            <p className="text-xs leading-5 text-[#686b64]">
              Your GoodSwing account keeps your membership, scores, cause
              preference and draw activity connected in one place.
            </p>
          </div>

          {/* Login CTA */}
          <div className="mt-7 border-t border-[#d9d9d1] pt-6 text-center">
            <p className="text-sm text-[#686b64]">
              Already a member?{" "}
              <Link
                href="/login"
                className="font-bold text-[#087c4b] transition-colors hover:text-[#005f39] hover:underline"
              >
                Log in
              </Link>
            </p>
          </div>
        </FadeIn>
      </section>
    </main>
  );
}