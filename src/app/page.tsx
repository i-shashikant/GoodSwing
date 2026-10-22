import Link from "next/link";
import {
  ArrowRight,
  Check,
  Heart,
  Trophy,
} from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Navigation */}
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Link
          href="/"
          className="text-xl font-semibold tracking-tight"
        >
          GoodSwing
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-xl px-4 py-2 text-sm font-medium transition hover:bg-muted"
          >
            Log in
          </Link>

          <Link
            href="/signup"
            className="rounded-xl bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:opacity-90"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 pb-24 pt-20">
        <div className="max-w-4xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm text-muted-foreground">
            <Heart className="h-4 w-4" />
            Golf with a purpose
          </div>

          <h1 className="text-5xl font-semibold tracking-tight sm:text-7xl">
            Play your game.
            <br />
            Make an impact.
          </h1>

          <p className="mt-7 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
            GoodSwing brings together your golf, monthly rewards,
            and the causes you care about — turning participation
            into something that gives back.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-foreground px-6 py-3.5 font-medium text-background transition hover:opacity-90"
            >
              Start playing
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/login"
              className="rounded-xl border px-6 py-3.5 font-medium transition hover:bg-muted"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-y">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-muted-foreground">
              HOW IT WORKS
            </p>

            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              Simple for players.
              <br />
              Meaningful for causes.
            </h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                number: "01",
                title: "Join",
                text: "Choose a GoodSwing plan and become eligible for the monthly draw.",
              },
              {
                number: "02",
                title: "Play",
                text: "Keep your recent golf scores up to date so your participation stays current.",
              },
              {
                number: "03",
                title: "Give back",
                text: "Choose a charity and help turn GoodSwing participation into real-world impact.",
              },
            ].map((item) => (
              <div
                key={item.number}
                className="rounded-2xl border p-7"
              >
                <p className="text-sm font-medium text-muted-foreground">
                  {item.number}
                </p>

                <h3 className="mt-8 text-2xl font-semibold">
                  {item.title}
                </h3>

                <p className="mt-3 leading-7 text-muted-foreground">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border p-7">
            <Trophy className="h-6 w-6" />

            <h3 className="mt-8 text-xl font-semibold">
              Monthly rewards
            </h3>

            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Eligible members can participate in GoodSwing's
              scheduled prize draws.
            </p>
          </div>

          <div className="rounded-2xl border p-7">
            <Heart className="h-6 w-6" />

            <h3 className="mt-8 text-xl font-semibold">
              Choose your cause
            </h3>

            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Support a charity that aligns with what matters to
              you.
            </p>
          </div>

          <div className="rounded-2xl border p-7">
            <Check className="h-6 w-6" />

            <h3 className="mt-8 text-xl font-semibold">
              Built for transparency
            </h3>

            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Participation, winners, and charitable contributions
              are recorded and managed through the platform.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="rounded-3xl border p-8 sm:p-12">
            <h2 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
              Your next round can do more.
            </h2>

            <p className="mt-4 max-w-xl leading-7 text-muted-foreground">
              Join GoodSwing and make your game part of something
              bigger.
            </p>

            <Link
              href="/signup"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-foreground px-6 py-3.5 font-medium text-background transition hover:opacity-90"
            >
              Create your account
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t px-6 py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} GoodSwing
      </footer>
    </main>
  );
}