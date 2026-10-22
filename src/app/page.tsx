
import Link from "next/link";

const steps = [
  {
    number: "01",
    title: "Join",
    description:
      "Choose a GoodSwing membership and become part of a game built around purpose.",
  },
  {
    number: "02",
    title: "Play",
    description:
      "Keep playing and record your latest scores. Your participation keeps you eligible.",
  },
  {
    number: "03",
    title: "Give",
    description:
      "A portion of your participation supports the charity you choose.",
  },
  {
    number: "04",
    title: "Win",
    description:
      "Eligible members enter the monthly GoodSwing draw for a chance to win.",
  },
];

const charities = [
  {
    name: "Clean Water Collective",
    category: "Water & Sanitation",
    description:
      "Builds wells and filtration systems for communities without reliable access to safe drinking water.",
    initials: "CW",
  },
  {
    name: "Bright Minds Foundation",
    category: "Education",
    description:
      "Funds school supplies, scholarships and learning opportunities for children in underserved communities.",
    initials: "BM",
  },
  {
    name: "Second Roots",
    category: "Environment",
    description:
      "Restores degraded land by planting native trees and supporting local green jobs.",
    initials: "SR",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#171918] text-[#f4f3ee]">
      {/* NAVBAR */}
      <header className="border-b border-white/[0.08]">
        <div className="mx-auto flex h-[78px] max-w-[1440px] items-center justify-between px-6 md:px-10">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#087f4e] text-lg font-bold text-white">
              G
            </span>
            <span className="text-xl font-semibold tracking-tight">
              GoodSwing
            </span>
          </Link>

          <nav className="hidden items-center gap-9 text-[15px] text-white/70 md:flex">
            <Link
              href="/dashboard/charity"
              className="transition hover:text-white"
            >
              Charities
            </Link>
            <a
              href="#how-it-works"
              className="transition hover:text-white"
            >
              How it works
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold transition hover:border-white/30 hover:bg-white/[0.04]"
            >
              Log in
            </Link>

            <Link
              href="/signup"
              className="rounded-xl bg-[#087f4e] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0a925b]"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="mx-auto max-w-[1440px] px-6 pb-24 pt-20 md:px-10 md:pb-32 md:pt-28">
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
          <div>
            <div className="mb-7 inline-flex items-center rounded-full border border-[#087f4e]/30 bg-[#087f4e]/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#78d5a8]">
              Play with purpose
            </div>

            <h1 className="max-w-4xl text-6xl font-medium leading-[0.96] tracking-[-0.055em] md:text-8xl">
              Play your game.
              <br />
              <span className="text-[#70c99e]">Make it matter.</span>
            </h1>

            <p className="mt-8 max-w-2xl text-lg leading-8 text-white/60 md:text-xl">
              GoodSwing turns your participation into a chance to win while
              helping support causes that matter. Play, contribute, and make
              every swing count.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="rounded-xl bg-[#087f4e] px-7 py-4 text-base font-semibold transition hover:bg-[#0a925b]"
              >
                Start playing
              </Link>

              <a
                href="#how-it-works"
                className="rounded-xl border border-white/15 bg-white/[0.02] px-7 py-4 text-base font-semibold transition hover:border-white/30 hover:bg-white/[0.05]"
              >
                See how it works
              </a>
            </div>

            <p className="mt-6 text-sm text-white/35">
              Simple participation. Transparent contributions. Real causes.
            </p>
          </div>

          {/* HERO CARD */}
          <div className="relative overflow-hidden rounded-[30px] bg-[#087f4e] p-8 md:p-12">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-white/[0.07]" />
            <div className="absolute -bottom-32 -right-8 h-80 w-80 rounded-full bg-black/[0.07]" />
            <div className="absolute bottom-10 right-10 h-36 w-36 rounded-full border border-white/[0.06]" />

            <div className="relative">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">
                GoodSwing
              </p>

              <div className="mt-10 text-6xl font-medium leading-[0.9] tracking-[-0.05em] md:text-7xl">
                Play.
                <br />
                Give.
                <br />
                Win.
              </div>

              <p className="mt-10 max-w-md text-base leading-7 text-white/75">
                A membership gives you access to the GoodSwing experience,
                score history, charity participation and monthly draws.
              </p>

              <div className="mt-12 border-t border-white/15 pt-7">
                <div className="text-5xl font-bold tracking-tight">50%</div>
                <div className="mt-1 text-sm text-white/65">
                  pool contribution target
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* IMPACT STRIP */}
      <section className="border-y border-white/[0.08]">
        <div className="mx-auto grid max-w-[1440px] md:grid-cols-3">
          <div className="border-b border-white/[0.08] px-6 py-10 md:border-b-0 md:border-r md:px-10">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/35">
              Contribution target
            </p>
            <p className="mt-3 text-4xl font-medium tracking-tight">50%</p>
            <p className="mt-2 text-sm text-white/45">
              of the participation pool directed toward the prize/impact model
            </p>
          </div>

          <div className="border-b border-white/[0.08] px-6 py-10 md:border-b-0 md:border-r md:px-10">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/35">
              Causes
            </p>
            <p className="mt-3 text-4xl font-medium tracking-tight">6</p>
            <p className="mt-2 text-sm text-white/45">
              causes currently available to support
            </p>
          </div>

          <div className="px-6 py-10 md:px-10">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/35">
              Monthly
            </p>
            <p className="mt-3 text-4xl font-medium tracking-tight">
              Draws
            </p>
            <p className="mt-2 text-sm text-white/45">
              one recurring opportunity for eligible members to win
            </p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section
        id="how-it-works"
        className="mx-auto max-w-[1440px] px-6 py-24 md:px-10 md:py-32"
      >
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#70c99e]">
            How it works
          </p>

          <h2 className="mt-5 text-4xl font-medium tracking-[-0.04em] md:text-6xl">
            Four simple steps.
            <br />
            <span className="text-white/40">One better reason to play.</span>
          </h2>
        </div>

        <div className="mt-16 grid border-t border-white/[0.1] md:grid-cols-4">
          {steps.map((step) => (
            <div
              key={step.number}
              className="border-b border-white/[0.1] py-8 md:border-b-0 md:border-r md:px-7 md:first:pl-0 md:last:border-r-0"
            >
              <span className="text-sm font-semibold text-[#70c99e]">
                {step.number}
              </span>

              <h3 className="mt-12 text-2xl font-medium">{step.title}</h3>

              <p className="mt-4 max-w-xs text-sm leading-6 text-white/45">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED CHARITY */}
      <section className="border-y border-white/[0.08] bg-[#141615]">
        <div className="mx-auto max-w-[1440px] px-6 py-24 md:px-10 md:py-28">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#70c99e]">
                Make an impact
              </p>

              <h2 className="mt-5 text-4xl font-medium tracking-[-0.04em] md:text-6xl">
                Choose a cause
                <br />
                <span className="text-white/40">that matters to you.</span>
              </h2>
            </div>

            <Link
              href="/dashboard/charity"
              className="text-sm font-semibold text-[#70c99e] transition hover:text-white"
            >
              View all charities →
            </Link>
          </div>

          <div className="mt-14 grid gap-4 md:grid-cols-3">
            {charities.map((charity, index) => (
              <Link
                href="/dashboard/charity"
                key={charity.name}
                className="group rounded-2xl border border-white/[0.08] bg-[#1b1e1c] p-7 transition hover:-translate-y-1 hover:border-white/[0.18]"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#087f4e]/15 text-sm font-bold text-[#70c99e]">
                    {charity.initials}
                  </div>

                  <span className="text-xs text-white/25">
                    0{index + 1}
                  </span>
                </div>

                <p className="mt-10 text-xs font-semibold uppercase tracking-[0.15em] text-white/35">
                  {charity.category}
                </p>

                <h3 className="mt-3 text-2xl font-medium tracking-tight">
                  {charity.name}
                </h3>

                <p className="mt-4 text-sm leading-6 text-white/45">
                  {charity.description}
                </p>

                <div className="mt-8 text-sm font-semibold text-[#70c99e] transition group-hover:text-white">
                  Explore charity →
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* PURPOSE SECTION */}
      <section className="mx-auto max-w-[1440px] px-6 py-24 md:px-10 md:py-32">
        <div className="grid items-center gap-16 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#087f4e]/30 bg-[#087f4e]/10 text-2xl font-semibold text-[#70c99e]">
              G
            </div>

            <p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-white/35">
              Play with purpose
            </p>

            <h2 className="mt-5 text-4xl font-medium tracking-[-0.04em] md:text-6xl">
              Your participation
              <br />
              <span className="text-[#70c99e]">can do some good.</span>
            </h2>
          </div>

          <div className="max-w-2xl">
            <p className="text-xl leading-9 text-white/65 md:text-2xl">
              GoodSwing connects participation, giving and the possibility of
              winning in one simple experience.
            </p>

            <div className="mt-10 grid gap-8 border-t border-white/[0.1] pt-8 sm:grid-cols-2">
              <div>
                <p className="text-sm font-semibold">Transparent</p>
                <p className="mt-2 text-sm leading-6 text-white/40">
                  Your charity choice and participation stay visible in your
                  account.
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold">Purpose-driven</p>
                <p className="mt-2 text-sm leading-6 text-white/40">
                  Supporting meaningful causes is built into the experience,
                  not added as an afterthought.
                </p>
              </div>
            </div>

            <Link
              href="/signup"
              className="mt-10 inline-flex rounded-xl bg-[#087f4e] px-7 py-4 text-sm font-semibold transition hover:bg-[#0a925b]"
            >
              Get started
            </Link>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-6 pb-10 md:px-10">
        <div className="mx-auto max-w-[1440px] overflow-hidden rounded-[30px] bg-[#087f4e] px-7 py-16 text-center md:px-12 md:py-24">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/65">
            GoodSwing
          </p>

          <h2 className="mx-auto mt-6 max-w-3xl text-5xl font-medium leading-[0.95] tracking-[-0.05em] md:text-7xl">
            Ready to play with purpose?
          </h2>

          <p className="mx-auto mt-7 max-w-xl text-base leading-7 text-white/70">
            Join GoodSwing, choose a cause, keep playing and take your chance
            in the monthly draw.
          </p>

          <Link
            href="/signup"
            className="mt-9 inline-flex rounded-xl bg-white px-7 py-4 text-sm font-semibold text-[#087f4e] transition hover:bg-white/90"
          >
            Get started
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mx-auto flex max-w-[1440px] flex-col gap-5 px-6 py-10 text-sm text-white/35 md:flex-row md:items-center md:justify-between md:px-10">
        <div className="font-semibold text-white/60">GoodSwing</div>

        <div className="flex gap-6">
          <Link href="/dashboard/charity" className="hover:text-white">
            Charities
          </Link>
          <a href="#how-it-works" className="hover:text-white">
            How it works
          </a>
          <Link href="/login" className="hover:text-white">
            Log in
          </Link>
        </div>

        <div>Play. Give. Win.</div>
      </footer>
    </main>
  );
}
