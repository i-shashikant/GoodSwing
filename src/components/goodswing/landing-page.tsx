
"use client";

/**
 * GoodSwing Landing Page
 *
 * This component is responsible for the public-facing homepage.
 *
 * Main responsibilities:
 * - Display GoodSwing branding and navigation
 * - Show the main hero section
 * - Display platform statistics
 * - Explain how GoodSwing works
 * - Showcase supported charities
 * - Display the rewards / prize-pool section
 * - Provide responsive mobile navigation
 * - Add lightweight Framer Motion animations
 *
 * Important:
 * - Charity information comes from the database through props.
 * - No charity data is hardcoded into the component.
 * - The page is client-side because it uses React state,
 *   memoization, motion values, and browser interactions.
 */

import Link from "next/link";

import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";

import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Check,
  ChevronRight,
  CircleDollarSign,
  Heart,
  LockKeyhole,
  Menu,
  Search,
  Sparkles,
  Trophy,
  Users,
  X,
} from "lucide-react";

import {
  useMemo,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";

import { Button } from "@/components/ui/button";
import { Calligraphy } from "@/components/ui/calligraphy";

/**
 * Shape of a charity received by this page.
 *
 * The actual charity records are fetched by the parent/server
 * component and passed into LandingPage as props.
 */
type Charity = {
  id: string;
  name: string;
  category?: string | null;
  description?: string | null;
};

/**
 * Props required by the landing page.
 *
 * These values are calculated from the application's database
 * and displayed as platform statistics.
 */
type LandingPageProps = {
  charities: Charity[];
  charityCount: number;
  activeSubscribers: number;
  prizePool: number;
  donated: number;
};

/**
 * Shared fade-up animation.
 *
 * `as const` is important here.
 *
 * Without it, TypeScript can infer the easing values as
 * `number[]`, while Framer Motion expects a specific easing
 * tuple/function type.
 *
 * Keeping the animation in one object allows us to reuse
 * the same animation throughout the page.
 */
const fadeUp = {
  hidden: {
    opacity: 0,
    y: 28,
  },

  visible: {
    opacity: 1,
    y: 0,

    transition: {
      duration: 0.65,

      // Cubic-bezier easing:
      // [x1, y1, x2, y2]
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

/**
 * Animated number counter.
 *
 * The component does not implement a complicated counter animation.
 * Instead, Framer Motion animates opacity and vertical position
 * when the number enters the viewport.
 */
function Counter({ value }: { value: number }) {
  return (
    <motion.span
      initial={{
        opacity: 0,
        y: 10,
      }}
      whileInView={{
        opacity: 1,
        y: 0,
      }}
      viewport={{
        once: true,
      }}
      transition={{
        duration: 0.6,
      }}
    >
      {value.toLocaleString("en-IN")}
    </motion.span>
  );
}

/**
 * MagneticButton
 *
 * A reusable CTA button with a subtle magnetic interaction.
 *
 * The cursor position relative to the button is calculated
 * and used to slightly move the button.
 */
function MagneticButton({
  href,
  children,
  variant = "default",
}: {
  href: string;
  children: ReactNode;
  variant?: "default" | "outline";
}) {
  /**
   * Raw cursor offsets.
   *
   * These values are updated when the mouse moves over
   * the button.
   */
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  /**
   * Springs make the movement feel smooth rather than
   * immediately jumping to the cursor position.
   */
  const sx = useSpring(x, {
    stiffness: 260,
    damping: 18,
  });

  const sy = useSpring(y, {
    stiffness: 260,
    damping: 18,
  });

  /**
   * Calculate the cursor's position relative to the
   * center of the button.
   */
  const move = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();

    x.set(
      (e.clientX - (rect.left + rect.width / 2)) * 0.12,
    );

    y.set(
      (e.clientY - (rect.top + rect.height / 2)) * 0.12,
    );
  };

  /**
   * Reset the magnetic effect when the cursor leaves.
   */
  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      style={{
        x: sx,
        y: sy,
      }}
      whileHover={{
        scale: 1.02,
      }}
      whileTap={{
        scale: 0.98,
      }}
    >
      <Link
        href={href}
        onMouseMove={move}
        onMouseLeave={reset}
      >
        <Button
          variant={variant}
          className={
            variant === "outline"
              ? "border-white/10 bg-white/[.03] text-white hover:bg-white/[.07]"
              : "bg-emerald-300 text-[#06130e] hover:bg-emerald-200"
          }
        >
          {children}
        </Button>
      </Link>
    </motion.div>
  );
}

/**
 * AmbientBackground
 *
 * Decorative background layer used to give the landing page
 * a subtle premium/glassmorphism appearance.
 *
 * It contains no application logic.
 */
function AmbientBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Large emerald glow on the top-left */}
      <div className="absolute -left-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-emerald-400/10 blur-3xl" />

      {/* Secondary glow on the bottom-right */}
      <div className="absolute -bottom-40 -right-40 h-[32rem] w-[32rem] rounded-full bg-emerald-300/5 blur-3xl" />
    </div>
  );
}

/**
 * Small decorative handwritten/calligraphy text component.
 */
function Callout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <span className="font-medium italic text-emerald-200">
      {children}
    </span>
  );
}

/**
 * Main GoodSwing landing page.
 */
export function LandingPage({
  charities,
  charityCount,
  activeSubscribers,
  prizePool,
  donated,
}: LandingPageProps) {
  /**
   * Search text used to filter charities.
   */
  const [query, setQuery] = useState("");

  /**
   * Controls the mobile navigation menu.
   */
  const [mobileOpen, setMobileOpen] = useState(false);

  /**
   * Filter charities whenever the search query changes.
   *
   * useMemo avoids recalculating the list unnecessarily
   * when unrelated component state changes.
   */
  const filtered = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();

    return charities.filter((charity) => {
      const searchableText =
        `${charity.name} ${charity.category ?? ""}`.toLowerCase();

      return searchableText.includes(normalizedQuery);
    });
  }, [charities, query]);

  /**
   * Cards displayed in the "Why GoodSwing" / feature area.
   *
   * The icon component is stored alongside the copy so
   * the rendering code remains compact.
   */
  const featureCards: Array<
    [
      ComponentType<{ className?: string }>,
      string,
      string,
    ]
  > = [
    [
      BarChart3,
      "Score tracking",
      "Your latest five rounds, organized and ready.",
    ],
    [
      Trophy,
      "Monthly draws",
      "Transparent participation and reward tiers.",
    ],
    [
      LockKeyhole,
      "Secure payments",
      "A clean subscription flow built around trusted checkout.",
    ],
  ];

  return (
    <main className="min-h-screen overflow-hidden bg-[#070b0a] text-white selection:bg-emerald-300 selection:text-[#06130e]">
      {/* Decorative background */}
      <AmbientBackground />

      {/* =========================================================
          NAVIGATION
          ========================================================= */}
      <header className="sticky top-0 z-50 border-b border-white/[.07] bg-[#070b0a]/80 backdrop-blur-2xl">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 md:px-8">
          {/* GoodSwing logo */}
          <Link
            href="/"
            className="group flex items-center gap-3"
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl border border-emerald-300/20 bg-emerald-300 text-lg font-black text-[#06130e] shadow-[0_0_30px_rgba(52,211,153,.15)] transition group-hover:rotate-3">
              G
            </span>

            <span>
              <span className="block text-[17px] font-bold tracking-tight">
                GoodSwing
              </span>

              <span className="block text-[9px] font-bold uppercase tracking-[.24em] text-white/35">
                play with purpose
              </span>
            </span>
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden items-center gap-8 text-sm text-white/55 md:flex">
            <Link
              href="/charities"
              className="transition hover:text-white"
            >
              Causes
            </Link>

            <a
              href="#how-it-works"
              className="transition hover:text-white"
            >
              How it works
            </a>

            <a
              href="#rewards"
              className="transition hover:text-white"
            >
              Rewards
            </a>
          </nav>

          {/* Desktop actions */}
          <div className="hidden items-center gap-2 md:flex">
            <Link href="/login">
              <Button
                variant="ghost"
                className="text-white/70 hover:bg-white/5 hover:text-white"
              >
                Log in
              </Button>
            </Link>

            <MagneticButton href="/signup">
              Start Your Journey
              <ArrowRight className="h-4 w-4" />
            </MagneticButton>
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            aria-label="Toggle menu"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 md:hidden"
          >
            {mobileOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile navigation */}
        {mobileOpen && (
          <div className="border-t border-white/10 bg-[#070b0a] px-5 py-5 md:hidden">
            <div className="flex flex-col gap-4 text-sm text-white/70">
              <Link
                href="/charities"
                onClick={() => setMobileOpen(false)}
              >
                Causes
              </Link>

              <a
                href="#how-it-works"
                onClick={() => setMobileOpen(false)}
              >
                How it works
              </a>

              <a
                href="#rewards"
                onClick={() => setMobileOpen(false)}
              >
                Rewards
              </a>

              <Link href="/login">
                Log in
              </Link>

              <Link
                href="/signup"
                className="rounded-xl bg-emerald-300 px-4 py-3 font-bold text-[#06130e]"
              >
                Start Your Journey
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* =========================================================
          HERO SECTION
          ========================================================= */}
      <section className="relative mx-auto max-w-7xl px-5 pb-24 pt-16 md:px-8 md:pb-32 md:pt-24">
        {/* Decorative glow */}
        <div className="absolute -left-40 top-0 h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl" />

        <div className="grid items-center gap-14 lg:grid-cols-[.94fr_1.06fr]">
          {/* Hero copy */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="relative z-10"
          >
            {/* Small eyebrow */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-300/[.06] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.2em] text-emerald-200">
              <Sparkles className="h-3.5 w-3.5" />
              Membership with a reason
            </div>

            {/* Main headline */}
            <h1 className="max-w-3xl text-6xl font-semibold leading-[.91] tracking-[-.065em] sm:text-7xl lg:text-[86px]">
              Play Better.
              <br />

              <span className="text-emerald-300">
                Win Together.
              </span>

              <br />

              <Calligraphy>
                Change Lives.
              </Calligraphy>
            </h1>

            {/* Supporting copy */}
            <p className="mt-7 max-w-xl text-base leading-7 text-white/55 md:text-lg">
              Track your golf performance, enter monthly prize
              draws, and support a charity you care about with
              every subscription.
            </p>

            {/* Hero CTAs */}
            <div className="mt-8 flex flex-wrap gap-3">
              <MagneticButton href="/signup">
                Start Your Journey
                <ArrowRight className="h-4 w-4" />
              </MagneticButton>

              <MagneticButton
                href="/charities"
                variant="outline"
              >
                Explore Charities
                <Heart className="h-4 w-4" />
              </MagneticButton>
            </div>

            {/* Trust indicators */}
            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-xs text-white/35">
              <span className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-300" />
                10% minimum charity contribution
              </span>

              <span className="flex items-center gap-2">
                <LockKeyhole className="h-3.5 w-3.5" />
                Secure payments
              </span>
            </div>
          </motion.div>

          {/* Hero visual / stats card */}
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.94,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            transition={{
              duration: 0.8,
              delay: 0.1,
            }}
            className="relative"
          >
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[.035] p-6 shadow-2xl backdrop-blur-xl md:p-8">
              {/* Card glow */}
              <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-emerald-300/10 blur-3xl" />

              <div className="relative">
                {/* Card header */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[.2em] text-white/30">
                      The GoodSwing loop
                    </p>

                    <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                      Play. Give. Win.
                    </h2>
                  </div>

                  <span className="grid h-11 w-11 place-items-center rounded-2xl border border-emerald-300/20 bg-emerald-300/10 text-emerald-200">
                    <BadgeCheck className="h-5 w-5" />
                  </span>
                </div>

                {/* Loop steps */}
                <div className="mt-8 grid gap-3">
                  {[
                    {
                      icon: BarChart3,
                      title: "Track",
                      text: "Record your Stableford scores.",
                    },
                    {
                      icon: Heart,
                      title: "Give",
                      text: "Choose a cause that matters.",
                    },
                    {
                      icon: Trophy,
                      title: "Win",
                      text: "Enter the monthly prize draw.",
                    },
                  ].map(
                    ({
                      icon: Icon,
                      title,
                      text,
                    }) => (
                      <motion.div
                        key={title}
                        whileHover={{
                          x: 4,
                        }}
                        className="flex items-center gap-4 rounded-2xl border border-white/[.07] bg-black/10 p-4"
                      >
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/5">
                          <Icon className="h-4 w-4 text-emerald-200" />
                        </span>

                        <div>
                          <p className="text-sm font-semibold">
                            {title}
                          </p>

                          <p className="mt-1 text-xs text-white/40">
                            {text}
                          </p>
                        </div>
                      </motion.div>
                    ),
                  )}
                </div>

                {/* Hero stats */}
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/[.07] bg-white/[.025] p-4">
                    <p className="text-[9px] font-bold uppercase tracking-[.16em] text-white/30">
                      Causes
                    </p>

                    <p className="mt-2 text-2xl font-semibold">
                      <Counter value={charityCount} />
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/[.07] bg-white/[.025] p-4">
                    <p className="text-[9px] font-bold uppercase tracking-[.16em] text-white/30">
                      Members
                    </p>

                    <p className="mt-2 text-2xl font-semibold">
                      <Counter value={activeSubscribers} />
                    </p>
                  </div>
                </div>

                {/* Closing message */}
                <div className="relative z-10 mt-5 flex items-center gap-3 rounded-2xl border border-emerald-300/10 bg-emerald-300/[.045] px-4 py-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-300/10 text-emerald-200">
                    <Sparkles className="h-4 w-4" />
                  </span>

                  <div>
                    <p className="text-xs font-semibold text-white/80">
                      Your membership has a destination.
                    </p>

                    <p className="mt-0.5 text-[11px] text-white/35">
                      Choose a cause. Build the pool. Be part of
                      the community.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* =========================================================
          PLATFORM STATISTICS
          ========================================================= */}
      <section className="border-y border-white/[.07] bg-white/[.015]">
        <div className="mx-auto grid max-w-7xl md:grid-cols-4">
          {[
            [
              "Charities",
              charityCount,
              "causes available",
              Heart,
            ],
            [
              "Members",
              activeSubscribers,
              "active subscribers",
              Users,
            ],
            [
              "Prize pool",
              prizePool,
              "monthly rewards",
              Trophy,
            ],
            [
              "Impact",
              donated,
              "contributions tracked",
              CircleDollarSign,
            ],
          ].map(
            ([label, value, note, Icon], index) => {
              const I = Icon as ComponentType<{
                className?: string;
              }>;

              return (
                <motion.div
                  key={String(label)}
                  initial={{
                    opacity: 0,
                    y: 15,
                  }}
                  whileInView={{
                    opacity: 1,
                    y: 0,
                  }}
                  viewport={{
                    once: true,
                  }}
                  transition={{
                    delay: index * 0.08,
                  }}
                  className="border-b border-white/[.07] px-5 py-8 last:border-0 md:border-b-0 md:border-r md:px-8 md:last:border-r-0"
                >
                  <I className="h-4 w-4 text-emerald-300" />

                  <p className="mt-5 text-[10px] font-bold uppercase tracking-[.18em] text-white/30">
                    {String(label)}
                  </p>

                  <p className="mt-2 text-3xl font-semibold tracking-tight">
                    {label === "Prize pool" ||
                    label === "Impact" ? (
                      <>
                        ₹
                        <Counter
                          value={Number(value)}
                        />
                      </>
                    ) : (
                      <Counter value={Number(value)} />
                    )}
                  </p>

                  <p className="mt-1 text-xs text-white/35">
                    {String(note)}
                  </p>
                </motion.div>
              );
            },
          )}
        </div>
      </section>

      {/* =========================================================
          HOW IT WORKS
          ========================================================= */}
      <section
        id="how-it-works"
        className="mx-auto max-w-7xl px-5 py-24 md:px-8 md:py-32"
      >
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{
            once: true,
          }}
        >
          <p className="eyebrow">
            How it works
          </p>

          <h2 className="mt-4 max-w-3xl text-5xl font-semibold leading-[.94] tracking-[-.055em] md:text-7xl">
            Three simple actions.
            <br />

            <span className="text-white/25">
              One bigger reason to return.
            </span>
          </h2>
        </motion.div>

        {/* Three-step process */}
        <div className="mt-16 grid gap-4 md:grid-cols-3">
          {[
            [
              "01",
              BarChart3,
              "Track Your Scores",
              "Enter your latest Stableford scores and build a living performance profile.",
            ],
            [
              "02",
              Trophy,
              "Join Monthly Draws",
              "Every active subscriber is entered into the monthly prize pool.",
            ],
            [
              "03",
              Heart,
              "Support A Cause",
              "Choose a charity and direct a portion of your subscription toward meaningful impact.",
            ],
          ].map(
            ([number, Icon, title, body], index) => {
              const I = Icon as ComponentType<{
                className?: string;
              }>;

              return (
                <motion.article
                  key={String(number)}
                  initial={{
                    opacity: 0,
                    y: 20,
                  }}
                  whileInView={{
                    opacity: 1,
                    y: 0,
                  }}
                  viewport={{
                    once: true,
                  }}
                  transition={{
                    delay: index * 0.1,
                  }}
                  whileHover={{
                    y: -8,
                  }}
                  className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[.035] p-7 backdrop-blur-xl"
                >
                  {/* Decorative card glow */}
                  <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-emerald-300/5 blur-2xl transition group-hover:bg-emerald-300/10" />

                  <div className="relative flex items-center justify-between">
                    <span className="text-xs font-black tracking-[.18em] text-emerald-300">
                      {String(number)}
                    </span>

                    <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/5">
                      <I className="h-5 w-5 text-emerald-200" />
                    </span>
                  </div>

                  <h3 className="relative mt-16 text-2xl font-semibold tracking-tight">
                    {String(title)}
                  </h3>

                  <p className="relative mt-3 text-sm leading-6 text-white/45">
                    {String(body)}
                  </p>

                  <div className="relative mt-8 flex items-center gap-2 text-sm font-semibold text-white/55 transition group-hover:text-emerald-300">
                    Explore
                    <ChevronRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </div>
                </motion.article>
              );
            },
          )}
        </div>
      </section>

      {/* =========================================================
          IMPACT SECTION
          ========================================================= */}
      <section className="relative overflow-hidden border-y border-white/[.07] bg-[#0a1713] px-5 py-24 md:px-8 md:py-32">
        {/* Background glow */}
        <div className="absolute -right-40 top-0 h-96 w-96 rounded-full bg-emerald-300/10 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl gap-14 lg:grid-cols-[.85fr_1.15fr] lg:items-center">
          {/* Impact copy */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{
              once: true,
            }}
          >
            <p className="eyebrow">
              Impact first
            </p>

            <h2 className="mt-4 text-5xl font-semibold leading-[.94] tracking-[-.055em] md:text-7xl">
              Your membership has{" "}
              <Calligraphy>
                somewhere to go.
              </Calligraphy>
            </h2>

            <p className="mt-7 max-w-xl text-base leading-7 text-white/50">
              Charitable giving isn't a footer note. It is
              part of the loop: choose your cause, see your
              contribution, and know that your participation
              is connected to something beyond the game.
            </p>

            <Link
              href="/charities"
              className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-emerald-300"
            >
              Meet the causes
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>

          {/* Impact statistics */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Donations */}
            <motion.div
              whileHover={{
                scale: 1.02,
              }}
              className="rounded-3xl border border-white/10 bg-white/[.04] p-7"
            >
              <Heart className="h-5 w-5 text-rose-300" />

              <p className="mt-16 text-4xl font-semibold">
                ₹
                <Counter value={donated} />
              </p>

              <p className="mt-2 text-sm text-white/40">
                contributions tracked
              </p>
            </motion.div>

            {/* Members */}
            <motion.div
              whileHover={{
                scale: 1.02,
              }}
              className="rounded-3xl border border-white/10 bg-white/[.04] p-7"
            >
              <Users className="h-5 w-5 text-emerald-300" />

              <p className="mt-16 text-4xl font-semibold">
                <Counter value={activeSubscribers} />
              </p>

              <p className="mt-2 text-sm text-white/40">
                members in the community
              </p>
            </motion.div>

            {/* Prize pool */}
            <motion.div
              whileHover={{
                scale: 1.02,
              }}
              className="sm:col-span-2 rounded-3xl border border-emerald-300/15 bg-gradient-to-br from-emerald-300/[.1] to-transparent p-7"
            >
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[.18em] text-emerald-200/70">
                    Current prize pool
                  </p>

                  <p className="mt-4 text-5xl font-semibold tracking-tight">
                    ₹
                    <Counter value={prizePool} />
                  </p>

                  <p className="mt-2 max-w-md text-sm leading-6 text-white/40">
                    Active members participate in monthly
                    draws while supporting causes they care
                    about.
                  </p>
                </div>

                <span className="hidden h-12 w-12 shrink-0 place-items-center rounded-2xl border border-emerald-300/20 bg-emerald-300/10 text-emerald-200 sm:grid">
                  <Trophy className="h-5 w-5" />
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* =========================================================
          CHARITIES
          ========================================================= */}
      <section
        id="charities"
        className="mx-auto max-w-7xl px-5 py-24 md:px-8 md:py-32"
      >
        {/* Section heading */}
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div>
            <p className="eyebrow">
              Choose your cause
            </p>

            <h2 className="mt-4 text-5xl font-semibold leading-[.94] tracking-[-.055em] md:text-7xl">
              Play for something
              <br />

              <span className="text-white/25">
                bigger than the score.
              </span>
            </h2>
          </div>

          <p className="max-w-md text-sm leading-6 text-white/40">
            Browse the causes available through GoodSwing.
            Your membership can contribute toward the charity
            you choose.
          </p>
        </div>

        {/* Charity search */}
        <div className="mt-12 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.025] px-4 py-3">
          <Search className="h-4 w-4 text-white/35" />

          <input
            type="search"
            value={query}
            onChange={(event) =>
              setQuery(event.target.value)
            }
            placeholder="Search causes..."
            aria-label="Search causes"
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25"
          />
        </div>

        {/* Charity cards */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((charity, index) => (
            <motion.article
              key={charity.id}
              initial={{
                opacity: 0,
                y: 18,
              }}
              whileInView={{
                opacity: 1,
                y: 0,
              }}
              viewport={{
                once: true,
              }}
              transition={{
                delay: Math.min(index * 0.05, 0.3),
              }}
              whileHover={{
                y: -5,
              }}
              className="group rounded-3xl border border-white/10 bg-white/[.025] p-6 transition hover:border-emerald-300/20"
            >
              {/* Charity icon */}
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-300/10 text-emerald-200">
                <Heart className="h-5 w-5" />
              </div>

              {/* Charity information */}
              <h3 className="mt-8 text-xl font-semibold tracking-tight">
                {charity.name}
              </h3>

              {charity.category && (
                <p className="mt-2 text-[10px] font-bold uppercase tracking-[.18em] text-emerald-300/70">
                  {charity.category}
                </p>
              )}

              {charity.description && (
                <p className="mt-4 line-clamp-3 text-sm leading-6 text-white/40">
                  {charity.description}
                </p>
              )}

              {/* Charity action */}
              <Link
                href={`/charities/${charity.id}`}
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white/60 transition group-hover:text-emerald-300"
              >
                View cause
                <ChevronRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </Link>
            </motion.article>
          ))}
        </div>

        {/* Empty search state */}
        {filtered.length === 0 && (
          <div className="mt-8 rounded-3xl border border-white/10 bg-white/[.025] p-10 text-center">
            <Search className="mx-auto h-6 w-6 text-white/25" />

            <p className="mt-4 text-sm font-semibold text-white/70">
              No causes found
            </p>

            <p className="mt-1 text-sm text-white/35">
              Try a different search term.
            </p>
          </div>
        )}
      </section>

      {/* =========================================================
          REWARDS / FINAL CTA
          ========================================================= */}
      <section
        id="rewards"
        className="relative overflow-hidden border-t border-white/[.07] px-5 py-24 md:px-8 md:py-32"
      >
        {/* Background decoration */}
        <div className="absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-emerald-300/10 blur-3xl" />

        <div className="relative mx-auto max-w-4xl text-center">
          <p className="eyebrow">
            Rewards with purpose
          </p>

          <h2 className="mt-4 text-5xl font-semibold leading-[.94] tracking-[-.055em] md:text-7xl">
            Your next round
            <br />

            <span className="text-emerald-300">
              could mean more.
            </span>
          </h2>

          <p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-white/45 md:text-lg">
            Join GoodSwing to track your game, support a
            cause you care about, and participate in monthly
            prize draws.
          </p>

          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <MagneticButton href="/signup">
              Join GoodSwing
              <ArrowRight className="h-4 w-4" />
            </MagneticButton>

            <MagneticButton
              href="/charities"
              variant="outline"
            >
              Explore Causes
              <Heart className="h-4 w-4" />
            </MagneticButton>
          </div>
        </div>
      </section>

      {/* =========================================================
          FOOTER
          ========================================================= */}
      <footer className="border-t border-white/[.07] px-5 py-10 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 text-xs text-white/30 md:flex-row md:items-center md:justify-between">
          {/* Brand */}
          <div>
            <p className="font-semibold text-white/60">
              GoodSwing
            </p>

            <p className="mt-1">
              Play better. Win together. Change lives.
            </p>
          </div>

          {/* Footer navigation */}
          <div className="flex flex-wrap gap-5">
            <Link
              href="/charities"
              className="transition hover:text-white"
            >
              Causes
            </Link>

            <Link
              href="/login"
              className="transition hover:text-white"
            >
              Log in
            </Link>

            <Link
              href="/signup"
              className="transition hover:text-white"
            >
              Sign up
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
