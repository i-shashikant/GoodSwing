"use client";

import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ArrowRight, BadgeCheck, BarChart3, Check, ChevronRight, CircleDollarSign, Heart, LockKeyhole, Menu, Search, Sparkles, Trophy, Users, X } from "lucide-react";
import { useMemo, useState, type ComponentType, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Calligraphy } from "@/components/ui/calligraphy";

type Charity = { id: string; name: string; slug: string; description: string | null; category: string | null; image_url: string | null; featured: boolean };
type LandingPageProps = { charities: Charity[]; charityCount: number; activeSubscribers: number; prizePool: number; donated: number };

const fadeUp = { hidden: { opacity: 0, y: 28 }, visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } } };

function Counter({ value }: { value: number }) {
  return <motion.span initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>{value.toLocaleString("en-IN")}</motion.span>;
}

function MagneticButton({ href, children, variant = "default" }: { href: string; children: ReactNode; variant?: "default" | "outline" }) {
  const x = useMotionValue(0), y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 260, damping: 18 }), sy = useSpring(y, { stiffness: 260, damping: 18 });
  const move = (e: React.MouseEvent<HTMLAnchorElement>) => { const r = e.currentTarget.getBoundingClientRect(); x.set((e.clientX - (r.left + r.width / 2)) * 0.12); y.set((e.clientY - (r.top + r.height / 2)) * 0.12); };
  return <motion.div style={{ x: sx, y: sy }} whileTap={{ scale: 0.97 }}><Link href={href} onMouseMove={move} onMouseLeave={() => { x.set(0); y.set(0); }} className={variant === "default" ? "inline-flex h-12 items-center gap-2 rounded-xl bg-emerald-400 px-5 text-sm font-bold text-[#06130e] shadow-[0_12px_40px_rgba(52,211,153,.18)] transition hover:bg-emerald-300" : "inline-flex h-12 items-center gap-2 rounded-xl border border-white/15 bg-white/[.04] px-5 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/[.08]"}>{children}</Link></motion.div>;
}

function FloatingStat({ className, children }: { className: string; children: ReactNode }) {
  return <motion.div className={`absolute rounded-2xl border border-white/10 bg-white/[.07] px-4 py-3 shadow-2xl shadow-black/20 backdrop-blur-xl ${className}`} animate={{ y: [0, -8, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>{children}</motion.div>;
}

function AmbientBackground() {
  // Keep the ambient layer decorative only. It never captures pointer events and
  // stays behind the page content so it cannot interfere with navigation.
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <motion.div
        className="absolute -left-32 top-[-10%] h-[34rem] w-[34rem] rounded-full bg-emerald-500/[.11] blur-[110px]"
        animate={{ x: [0, 90, 0], y: [0, 50, 0], scale: [1, 1.12, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-[-12%] top-[8%] h-[30rem] w-[30rem] rounded-full bg-teal-300/[.07] blur-[100px]"
        animate={{ x: [0, -70, 0], y: [0, 80, 0], scale: [1.05, 0.94, 1.05] }}
        transition={{ duration: 21, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[-18%] left-[34%] h-[34rem] w-[34rem] rounded-full bg-emerald-400/[.06] blur-[120px]"
        animate={{ x: [0, 80, 0], y: [0, -55, 0] }}
        transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,.035),transparent_30%),linear-gradient(180deg,#070b0a_0%,#08110e_46%,#070b0a_100%)]" />
      <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.025)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:linear-gradient(to_bottom,black,transparent_72%)]" />
    </div>
  );
}

function HeroVisual({ charities, charityCount, activeSubscribers, prizePool, donated }: { charities: Charity[]; charityCount: number; activeSubscribers: number; prizePool: number; donated: number }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-1, 1], [4, -4]);
  const rotateY = useTransform(mouseX, [-1, 1], [-4, 4]);
  const featuredCharity = charities.find((charity) => charity.featured) ?? charities[0];

  return (
    <motion.div
      className="relative mx-auto w-full max-w-[590px] [perspective:1200px]"
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        mouseX.set(((event.clientX - rect.left) / rect.width) * 2 - 1);
        mouseY.set(((event.clientY - rect.top) / rect.height) * 2 - 1);
      }}
      onMouseLeave={() => {
        mouseX.set(0);
        mouseY.set(0);
      }}
    >
      <motion.div
        style={{ rotateX, rotateY }}
        className="relative min-h-[560px] overflow-hidden rounded-[40px] border border-white/10 bg-[#0b1814]/90 p-6 shadow-[0_30px_100px_rgba(0,0,0,.45)] backdrop-blur-xl md:p-8"
      >
        {/* Local glow gives the card a soft, organic light source without using imagery. */}
        <motion.div
          aria-hidden="true"
          className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-emerald-300/[.12] blur-[90px]"
          animate={{ scale: [1, 1.18, 1], opacity: [0.5, 0.85, 0.5] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.2em] text-white/35">Your impact</p>
            <p className="mt-2 text-sm font-medium text-white/70">One membership, three outcomes.</p>
          </div>
          <span className="rounded-full border border-emerald-300/15 bg-emerald-300/[.06] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[.16em] text-emerald-200/70">
            Live community
          </span>
        </div>

        <div className="relative z-10 mt-8 overflow-hidden rounded-[30px] border border-white/10 bg-black/20">
          <div className="relative h-52 overflow-hidden">
            {featuredCharity?.image_url ? (
              <img
                src={featuredCharity.image_url}
                alt=""
                loading="eager"
                className="h-full w-full object-cover opacity-70 transition duration-700"
              />
            ) : (
              <div className="grid h-full place-items-center bg-gradient-to-br from-emerald-400/20 via-emerald-300/5 to-transparent">
                <Heart className="h-12 w-12 text-emerald-200/70" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b1814] via-[#0b1814]/25 to-transparent" />
            <div className="absolute bottom-5 left-5 right-5">
              <p className="text-[9px] font-bold uppercase tracking-[.18em] text-emerald-200/60">Featured cause</p>
              <h3 className="mt-1 text-2xl font-semibold tracking-tight text-white">
                {featuredCharity?.name ?? "Causes making a difference"}
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-px bg-white/10">
            <div className="bg-[#0b1814]/95 p-5">
              <p className="text-[9px] font-bold uppercase tracking-[.16em] text-white/30">Community giving</p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-white">₹{donated.toLocaleString("en-IN")}</p>
              <p className="mt-1 text-xs text-white/35">tracked contributions</p>
            </div>
            <div className="bg-[#0b1814]/95 p-5">
              <p className="text-[9px] font-bold uppercase tracking-[.16em] text-white/30">People behind it</p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-white">{activeSubscribers.toLocaleString("en-IN")}</p>
              <p className="mt-1 text-xs text-white/35">active members</p>
            </div>
          </div>
        </div>

        {/* The three outcomes are connected visually rather than presented as a generic analytics chart. */}
        <div className="relative z-10 mt-5 grid grid-cols-3 gap-2">
          {[
            { label: "Give", value: `₹${donated.toLocaleString("en-IN")}`, icon: Heart, tone: "text-rose-200" },
            { label: "Causes", value: charityCount.toLocaleString("en-IN"), icon: Users, tone: "text-emerald-200" },
            { label: "Rewards", value: `₹${prizePool.toLocaleString("en-IN")}`, icon: Trophy, tone: "text-[#f0c95b]" },
          ].map(({ label, value, icon: Icon, tone }) => (
            <motion.div
              key={label}
              whileHover={{ y: -4 }}
              className="rounded-2xl border border-white/10 bg-white/[.035] p-4"
            >
              <Icon className={`h-4 w-4 ${tone}`} />
              <p className="mt-5 text-[9px] font-bold uppercase tracking-[.16em] text-white/30">{label}</p>
              <p className="mt-1 truncate text-sm font-semibold text-white/80">{value}</p>
            </motion.div>
          ))}
        </div>

        <div className="relative z-10 mt-5 flex items-center gap-3 rounded-2xl border border-emerald-300/10 bg-emerald-300/[.045] px-4 py-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-300/10 text-emerald-200">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xs font-semibold text-white/80">Your membership has a destination.</p>
            <p className="mt-0.5 text-[11px] text-white/35">Choose a cause. Build the pool. Be part of the community.</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
export function LandingPage({ charities, charityCount, activeSubscribers, prizePool, donated }: LandingPageProps) {
  const [query, setQuery] = useState(""), [mobileOpen, setMobileOpen] = useState(false);
  const filtered = useMemo(() => charities.filter((c) => `${c.name} ${c.category ?? ""}`.toLowerCase().includes(query.toLowerCase())), [charities, query]);
  const featureCards: Array<[ComponentType<{ className?: string }>, string, string]> = [[BarChart3, "Score tracking", "Your latest five rounds, organized and ready."], [Trophy, "Monthly draws", "Transparent participation and reward tiers."], [LockKeyhole, "Secure payments", "A clean subscription flow built around trusted checkout."]];

  return <main className="min-h-screen overflow-hidden bg-[#070b0a] text-white selection:bg-emerald-300 selection:text-[#06130e]">
    <AmbientBackground />
    <header className="sticky top-0 z-50 border-b border-white/[.07] bg-[#070b0a]/80 backdrop-blur-2xl"><div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 md:px-8"><Link href="/" className="group flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl border border-emerald-300/20 bg-emerald-300 text-lg font-black text-[#06130e] shadow-[0_0_30px_rgba(52,211,153,.15)] transition group-hover:rotate-3">G</span><span><span className="block text-[17px] font-bold tracking-tight">GoodSwing</span><span className="block text-[9px] font-bold uppercase tracking-[.24em] text-white/35">play with purpose</span></span></Link><nav className="hidden items-center gap-8 text-sm text-white/55 md:flex"><Link href="/charities" className="transition hover:text-white">Causes</Link><a href="#how-it-works" className="transition hover:text-white">How it works</a><a href="#rewards" className="transition hover:text-white">Rewards</a></nav><div className="hidden items-center gap-2 md:flex"><Link href="/login"><Button variant="ghost" className="text-white/70 hover:bg-white/5 hover:text-white">Log in</Button></Link><MagneticButton href="/signup">Start Your Journey <ArrowRight className="h-4 w-4" /></MagneticButton></div><button aria-label="Toggle menu" onClick={() => setMobileOpen(!mobileOpen)} className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 md:hidden">{mobileOpen ? <X /> : <Menu />}</button></div>{mobileOpen && <div className="border-t border-white/10 bg-[#070b0a] px-5 py-5 md:hidden"><div className="flex flex-col gap-4 text-sm text-white/70"><Link href="/charities" onClick={() => setMobileOpen(false)}>Causes</Link><a href="#how-it-works" onClick={() => setMobileOpen(false)}>How it works</a><a href="#rewards" onClick={() => setMobileOpen(false)}>Rewards</a><Link href="/login">Log in</Link><Link href="/signup" className="rounded-xl bg-emerald-300 px-4 py-3 font-bold text-[#06130e]">Start Your Journey</Link></div></div>}</header>

    <section className="relative mx-auto max-w-7xl px-5 pb-24 pt-16 md:px-8 md:pb-32 md:pt-24"><div className="absolute -left-40 top-0 h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl" /><div className="grid items-center gap-14 lg:grid-cols-[.94fr_1.06fr]"><motion.div variants={fadeUp} initial="hidden" animate="visible" className="relative z-10"><div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-300/[.06] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.2em] text-emerald-200"><Sparkles className="h-3.5 w-3.5" /> Membership with a reason</div><h1 className="max-w-3xl text-6xl font-semibold leading-[.91] tracking-[-.065em] sm:text-7xl lg:text-[86px]">Play Better.<br /><span className="text-emerald-300">Win Together.</span><br /><Calligraphy>Change Lives.</Calligraphy></h1><p className="mt-7 max-w-xl text-base leading-7 text-white/55 md:text-lg">Track your golf performance, enter monthly prize draws, and support a charity you care about with every subscription.</p><div className="mt-8 flex flex-wrap gap-3"><MagneticButton href="/signup">Start Your Journey <ArrowRight className="h-4 w-4" /></MagneticButton><MagneticButton href="/charities" variant="outline">Explore Charities <Heart className="h-4 w-4" /></MagneticButton></div><div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-xs text-white/35"><span className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-300" />10% minimum charity contribution</span><span className="flex items-center gap-2"><LockKeyhole className="h-3.5 w-3.5" />Secure payments</span></div></motion.div><motion.div initial={{ opacity: 0, scale: .94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .8, delay: .15 }}><HeroVisual charities={charities} charityCount={charityCount} activeSubscribers={activeSubscribers} prizePool={prizePool} donated={donated} /></motion.div></div></section>

    <section className="border-y border-white/[.07] bg-white/[.018]"><div className="mx-auto grid max-w-7xl md:grid-cols-4">{[["Community", activeSubscribers, "active members", Users], ["Causes", charityCount, "active charities", Heart], ["Prize pool", prizePool, "current pool", Trophy], ["Impact", donated, "contributions tracked", CircleDollarSign]].map(([label, value, note, Icon], i) => { const I = Icon as ComponentType<{ className?: string }>; return <motion.div key={String(label)} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * .08 }} className="border-b border-white/[.07] px-5 py-8 last:border-0 md:border-b-0 md:border-r md:px-8 md:last:border-r-0"><I className="h-4 w-4 text-emerald-300" /><p className="mt-5 text-[10px] font-bold uppercase tracking-[.18em] text-white/30">{String(label)}</p><p className="mt-2 text-3xl font-semibold tracking-tight">{label === "Prize pool" || label === "Impact" ? <>₹<Counter value={Number(value)} /></> : <Counter value={Number(value)} />}</p><p className="mt-1 text-xs text-white/35">{String(note)}</p></motion.div>; })}</div></section>

    <section id="how-it-works" className="mx-auto max-w-7xl px-5 py-24 md:px-8 md:py-32"><motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}><p className="eyebrow">How it works</p><h2 className="mt-4 max-w-3xl text-5xl font-semibold leading-[.94] tracking-[-.055em] md:text-7xl">Three simple actions.<br /><span className="text-white/25">One bigger reason to return.</span></h2></motion.div><div className="mt-16 grid gap-4 md:grid-cols-3">{[["01", BarChart3, "Track Your Scores", "Enter your latest Stableford scores and build a living performance profile."], ["02", Trophy, "Join Monthly Draws", "Every active subscriber is entered into the monthly prize pool."], ["03", Heart, "Support A Cause", "Choose a charity and direct a portion of your subscription toward meaningful impact."]].map(([n, Icon, title, body], i) => { const I = Icon as ComponentType<{ className?: string }>; return <motion.article key={String(n)} initial={{ opacity:0, y:25 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay:i*.1 }} whileHover={{ y:-8 }} className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[.035] p-7 backdrop-blur-xl"><div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-emerald-300/5 blur-2xl transition group-hover:bg-emerald-300/10" /><div className="relative flex items-center justify-between"><span className="text-xs font-black tracking-[.18em] text-emerald-300">{String(n)}</span><span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/5"><I className="h-5 w-5 text-emerald-200" /></span></div><h3 className="relative mt-16 text-2xl font-semibold tracking-tight">{String(title)}</h3><p className="relative mt-3 text-sm leading-6 text-white/45">{String(body)}</p><div className="relative mt-8 flex items-center gap-2 text-sm font-semibold text-white/55 transition group-hover:text-emerald-300">Explore <ChevronRight className="h-4 w-4 transition group-hover:translate-x-1" /></div></motion.article>; })}</div></section>

    <section className="relative overflow-hidden border-y border-white/[.07] bg-[#0a1713] px-5 py-24 md:px-8 md:py-32"><div className="absolute -right-40 top-0 h-96 w-96 rounded-full bg-emerald-300/10 blur-3xl" /><div className="relative mx-auto grid max-w-7xl gap-14 lg:grid-cols-[.85fr_1.15fr] lg:items-center"><motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once:true }}><p className="eyebrow">Impact first</p><h2 className="mt-4 text-5xl font-semibold leading-[.94] tracking-[-.055em] md:text-7xl">Your membership has <Calligraphy>somewhere to go.</Calligraphy></h2><p className="mt-7 max-w-xl text-base leading-7 text-white/50">Charitable giving isn't a footer note. It is part of the loop: choose your cause, see your contribution, and know that your participation is connected to something beyond the game.</p><Link href="/charities" className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-emerald-300">Meet the causes <ArrowRight className="h-4 w-4" /></Link></motion.div><div className="grid gap-4 sm:grid-cols-2"><motion.div whileHover={{ scale:1.02 }} className="rounded-3xl border border-white/10 bg-white/[.04] p-7"><Heart className="h-5 w-5 text-rose-300" /><p className="mt-16 text-4xl font-semibold">₹<Counter value={donated} /></p><p className="mt-2 text-sm text-white/40">contributions tracked</p></motion.div><motion.div whileHover={{ scale:1.02 }} className="rounded-3xl border border-white/10 bg-white/[.04] p-7"><Users className="h-5 w-5 text-emerald-300" /><p className="mt-16 text-4xl font-semibold"><Counter value={activeSubscribers} /></p><p className="mt-2 text-sm text-white/40">members in the community</p></motion.div><motion.div className="sm:col-span-2 rounded-3xl border border-emerald-300/15 bg-gradient-to-br from-emerald-300/[.1] to-transparent p-7"><div className="flex items-start justify-between gap-6"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-emerald-200/60">A cause you can see</p><p className="mt-3 max-w-xl text-2xl font-semibold tracking-tight">Every subscriber chooses where their charitable contribution goes.</p></div><BadgeCheck className="h-7 w-7 shrink-0 text-emerald-300" /></div></motion.div></div></div></section>

    <section id="rewards" className="mx-auto max-w-7xl px-5 py-24 md:px-8 md:py-32"><div className="flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#f0c95b]">Monthly reward engine</p><h2 className="mt-4 text-5xl font-semibold leading-[.94] tracking-[-.055em] md:text-7xl">A draw worth<br /><span className="text-white/25">coming back for.</span></h2></div><p className="max-w-md text-sm leading-6 text-white/40">The prize pool is calculated from active subscribers. Match more numbers, unlock a larger share.</p></div><div className="mt-14 overflow-hidden rounded-[32px] border border-white/10 bg-white/[.035] shadow-2xl shadow-black/20"><div className="border-b border-white/10 px-6 py-5 md:px-8"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-white/30">Current prize pool</p><p className="mt-1 text-5xl font-semibold tracking-[-.05em] text-white">₹<motion.span key={prizePool} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:.5 }}>{prizePool.toLocaleString("en-IN")}</motion.span></p></div><div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/[.06] px-4 py-3 text-right"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-emerald-200/50">Next draw</p><p className="mt-1 font-semibold text-emerald-200">Every month</p></div></div></div><div className="grid md:grid-cols-3">{[[5,"5 Number Match",40,true],[4,"4 Number Match",35,false],[3,"3 Number Match",25,false]].map(([match,title,pct,roll],i)=><motion.div key={String(match)} whileHover={{ backgroundColor:"rgba(255,255,255,.045)" }} className={`p-7 md:p-9 ${i<2?"border-b md:border-b-0 md:border-r border-white/10":""}`}><div className="flex items-center justify-between"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#f0c95b]/10 text-[#f0c95b]">{String(match)}</span>{Boolean(roll) && <span className="rounded-full bg-[#f0c95b]/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-[#f0c95b]">Jackpot</span>}</div><h3 className="mt-12 text-xl font-semibold">{String(title)}</h3><div className="mt-6 flex items-end gap-2"><span className="text-5xl font-semibold">{String(pct)}%</span><span className="pb-1 text-xs text-white/30">of pool</span></div><div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10"><motion.div initial={{ width:0 }} whileInView={{ width:`${Number(pct)}%` }} viewport={{ once:true }} transition={{ duration:1 }} className="h-full rounded-full bg-[#f0c95b]" /></div><p className="mt-5 text-sm leading-6 text-white/40">{Boolean(roll) ? "Carries forward when unclaimed." : "Split equally among winners in this tier."}</p></motion.div>)}</div></div></section>

    <section className="border-y border-white/[.07] bg-white/[.018] px-5 py-24 md:px-8 md:py-28"><div className="mx-auto max-w-7xl"><div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="eyebrow">Featured charities</p><h2 className="mt-4 text-5xl font-semibold tracking-[-.055em] md:text-7xl">Good starts <Calligraphy>here.</Calligraphy></h2></div><Link href="/charities" className="flex items-center gap-2 text-sm font-semibold text-white/50 hover:text-emerald-300">View directory <ArrowRight className="h-4 w-4" /></Link></div><div className="mt-10 flex max-w-xl items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-3"><Search className="h-4 w-4 text-white/30" /><input aria-label="Search charities" value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search causes..." className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25" /></div><div className="mt-8 grid gap-5 md:grid-cols-3">{filtered.map((charity,i)=><motion.article key={charity.id} initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*.08}} whileHover={{y:-7}} className="group overflow-hidden rounded-3xl border border-white/10 bg-[#0c1210]"><div className="relative h-52 overflow-hidden">{charity.image_url ? <img src={charity.image_url} alt={charity.name} loading="lazy" className="h-full w-full object-cover opacity-80 transition duration-700 group-hover:scale-105 group-hover:opacity-100" /> : <div className="grid h-full place-items-center bg-gradient-to-br from-emerald-400/20 to-white/5 text-6xl font-semibold text-emerald-200">{charity.name.charAt(0)}</div>}<div className="absolute inset-0 bg-gradient-to-t from-[#0c1210] to-transparent" /><span className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[9px] font-bold uppercase tracking-[.15em] text-white/60 backdrop-blur">{charity.category ?? "Cause"}</span></div><div className="p-6"><h3 className="text-2xl font-semibold tracking-tight">{charity.name}</h3><p className="mt-3 line-clamp-3 text-sm leading-6 text-white/40">{charity.description}</p><Link href={`/charities/${charity.slug}`} className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-emerald-300">Learn more <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></Link></div></motion.article>)}</div>{filtered.length===0 && <div className="mt-8 rounded-3xl border border-dashed border-white/10 p-10 text-center text-sm text-white/40">No causes match that search.</div>}</div></section>

    <section className="mx-auto max-w-7xl px-5 py-24 md:px-8 md:py-32"><div className="grid gap-4 md:grid-cols-3">{featureCards.map(([Icon,title,body]) => <motion.div key={title} whileHover={{y:-5}} className="rounded-3xl border border-white/10 bg-white/[.025] p-7"><Icon className="h-5 w-5 text-emerald-300"/><p className="mt-12 text-xl font-semibold">{title}</p><p className="mt-2 text-sm leading-6 text-white/40">{body}</p><span className="mt-7 inline-flex rounded-full border border-white/10 px-3 py-1 text-[9px] font-bold uppercase tracking-[.15em] text-white/35">Built in</span></motion.div>)}</div></section>

    <section className="px-5 pb-8 md:px-8"><div className="relative mx-auto max-w-7xl overflow-hidden rounded-[36px] border border-emerald-300/15 bg-gradient-to-br from-emerald-400/20 via-[#10231c] to-[#0a0f0d] px-7 py-20 text-center md:px-12 md:py-28"><div className="absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-emerald-300/10 blur-3xl"/><div className="relative"><p className="text-[10px] font-bold uppercase tracking-[.2em] text-emerald-200/60">The invitation</p><h2 className="mx-auto mt-5 max-w-4xl text-5xl font-semibold leading-[.94] tracking-[-.06em] md:text-8xl">Turn Every Round Into <Calligraphy>Real Impact.</Calligraphy></h2><p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-white/45">Join a growing community transforming performance into purpose — with a chance to win along the way.</p><div className="mt-9 flex justify-center"><MagneticButton href="/signup">Subscribe Now <ArrowRight className="h-4 w-4" /></MagneticButton></div></div></div></section>
    <footer className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-10 text-xs text-white/30 md:flex-row md:items-center md:justify-between md:px-8"><span className="font-semibold text-white/60">GoodSwing</span><span>Play. Give. Win.</span><div className="flex gap-5"><Link href="/charities" className="hover:text-white">Causes</Link><Link href="/login" className="hover:text-white">Log in</Link><Link href="/signup" className="hover:text-white">Subscribe</Link></div></footer>
  </main>;
}
