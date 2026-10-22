"use client";

import Link from "next/link";
import { AnimatePresence, motion, useInView, useMotionValue, useSpring } from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  ExternalLink,
  Heart,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type Charity = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string | null;
  category: string | null;
  website_url: string | null;
  featured: boolean;
  created_at: string;
  raised_paise: number;
  supporters: number;
  contribution_count: number;
};

type CharityEvent = {
  id: string;
  charity_id: string;
  title: string;
  description: string | null;
  event_date: string | null;
  amount_paise: number | null;
};

type ImpactData = {
  totalRaisedPaise: number;
  monthlyRaisedPaise: number;
  activeSupporters: number;
  partnerCharities: number;
  monthlyPreviousPaise: number;
};


function money(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.max(0, paise) / 100);
}

function compactMoney(paise: number) {
  const value = Math.max(0, paise) / 100;
  if (value >= 10_000_000) return `₹${(value / 10_000_000).toFixed(1)}Cr`;
  if (value >= 100_000) return `₹${(value / 100_000).toFixed(1)}L`;
  if (value >= 1_000) return `₹${(value / 1_000).toFixed(1)}K`;
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-70px" }}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function Counter({ value, formatter }: { value: number; formatter: (value: number) => string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const visible = useInView(ref, { once: true, margin: "-70px" });
  const target = useMotionValue(0);
  const spring = useSpring(target, { stiffness: 85, damping: 20 });
  const [display, setDisplay] = useState(formatter(0));

  useEffect(() => {
    if (visible) target.set(value);
  }, [target, value, visible]);

  useEffect(() => spring.on("change", (latest) => setDisplay(formatter(latest))), [formatter, spring]);

  return <span ref={ref}>{display}</span>;
}

function CharityImage({ charity }: { charity: Charity }) {
  if (!charity.image_url) {
    return (
      <div className="grid h-full w-full place-items-center bg-[radial-gradient(circle_at_50%_35%,rgba(73,225,166,.3),transparent_45%),linear-gradient(135deg,#123b30,#071510)]">
        <span className="text-7xl font-semibold tracking-[-.06em] text-emerald-200/80">{charity.name.charAt(0)}</span>
      </div>
    );
  }

  return <img src={charity.image_url} alt={charity.name} loading="lazy" className="h-full w-full object-cover" />;
}

export function CharityDirectoryPremium({ charities, events, impact }: { charities: Charity[]; events: CharityEvent[]; impact: ImpactData }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("featured");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState("overview");

  const categories = useMemo(() => {
    const dynamic = charities.map((charity) => charity.category).filter(Boolean) as string[];
    return Array.from(new Set(dynamic)).sort();
  }, [charities]);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return [...charities]
      .filter((charity) => {
        const haystack = `${charity.name} ${charity.description} ${charity.category ?? ""}`.toLowerCase();
        return (!search || haystack.includes(search)) && (category === "all" || charity.category === category);
      })
      .sort((a, b) => {
        if (sort === "impact") return b.raised_paise - a.raised_paise;
        if (sort === "supporters") return b.supporters - a.supporters;
        if (sort === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        return Number(b.featured) - Number(a.featured) || b.raised_paise - a.raised_paise;
      });
  }, [charities, query, category, sort]);

  const featured = charities.find((charity) => charity.featured) ?? charities[0] ?? null;
  const selected = charities.find((charity) => charity.id === selectedId) ?? null;
  const growth = impact.monthlyPreviousPaise > 0
    ? ((impact.monthlyRaisedPaise - impact.monthlyPreviousPaise) / impact.monthlyPreviousPaise) * 100
    : 0;

  function openProfile(id: string) {
    setSelectedId(id);
    setTab("overview");
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#050a09] text-white selection:bg-emerald-300 selection:text-[#062016]">
      {/* Ambient background lighting keeps the page alive without competing with content. */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-0 overflow-hidden">
        <motion.div className="absolute -left-48 -top-40 h-[34rem] w-[34rem] rounded-full bg-emerald-500/[.13] blur-[120px]" animate={{ x: [0, 80, 0], y: [0, 55, 0], scale: [1, 1.1, 1] }} transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="absolute -right-48 top-[24rem] h-[32rem] w-[32rem] rounded-full bg-teal-400/[.08] blur-[120px]" animate={{ x: [0, -70, 0], y: [0, -50, 0] }} transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }} />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.018)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:linear-gradient(to_bottom,black,transparent_82%)]" />
      </div>

      <header className="relative z-20 border-b border-white/[.07] bg-[#050a09]/75 backdrop-blur-2xl">
        <div className="mx-auto flex min-h-[76px] max-w-7xl items-center justify-between gap-5 px-5 md:px-8">
          <Link href="/" className="group flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-300 font-black text-[#062016] shadow-[0_0_35px_rgba(91,230,178,.16)] transition group-hover:scale-105">G</span>
            <span><span className="block text-[17px] font-extrabold tracking-tight">GoodSwing</span><span className="block text-[9px] font-bold uppercase tracking-[.25em] text-white/35">Play with purpose</span></span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-white/55 md:flex"><Link href="/charities" className="text-white">Causes</Link><Link href="/#how-it-works" className="transition hover:text-white">How it works</Link><Link href="/#rewards" className="transition hover:text-white">Rewards</Link></nav>
          <div className="flex items-center gap-2"><Link href="/login" className="hidden rounded-xl px-4 py-2.5 text-sm font-semibold text-white/70 transition hover:text-white sm:block">Log in</Link><Link href="/signup" className="inline-flex items-center gap-2 rounded-xl bg-emerald-300 px-4 py-2.5 text-sm font-bold text-[#062016] shadow-[0_12px_40px_rgba(73,225,166,.12)] transition hover:-translate-y-0.5 hover:bg-emerald-200">Choose a charity <ArrowRight className="h-4 w-4" /></Link></div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative z-10 mx-auto max-w-7xl px-5 pb-20 pt-16 md:px-8 md:pb-28 md:pt-24">
        <div className="grid items-center gap-14 lg:grid-cols-[.94fr_1.06fr]">
          <Reveal>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/[.06] px-3.5 py-2 text-[10px] font-black uppercase tracking-[.2em] text-emerald-200"><Heart className="h-3.5 w-3.5" /> The heart of GoodSwing</div>
            <h1 className="mt-7 max-w-3xl text-6xl font-semibold leading-[.9] tracking-[-.065em] md:text-8xl">Play With<br /><span className="text-emerald-300">Purpose.</span></h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-white/55 md:text-lg">Every subscription helps fund causes that matter. Choose where your contribution goes and become part of something bigger than the game.</p>
            <div className="mt-9 flex flex-wrap gap-3"><a href="#directory" className="inline-flex items-center gap-2 rounded-xl bg-emerald-300 px-5 py-3.5 text-sm font-bold text-[#062016] transition hover:-translate-y-1 hover:bg-emerald-200">Choose Your Charity <ArrowRight className="h-4 w-4" /></a><a href="#impact" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.03] px-5 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-1 hover:border-white/20 hover:bg-white/[.06]">See Community Impact</a></div>
          </Reveal>

          <Reveal delay={0.12}>
            <div className="relative mx-auto w-full max-w-2xl">
              <div className="absolute -inset-10 rounded-[48px] bg-emerald-400/[.07] blur-3xl" />
              <div className="relative overflow-hidden rounded-[34px] border border-white/10 bg-white/[.045] p-5 shadow-2xl shadow-black/30 backdrop-blur-2xl md:p-7">
                <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-emerald-300/[.08] blur-3xl" /><div className="absolute -bottom-28 -left-20 h-64 w-64 rounded-full bg-teal-300/[.06] blur-3xl" />
                <div className="relative">
                  <div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.22em] text-white/35">Your impact</p><p className="mt-1 text-lg font-semibold tracking-tight">One membership, measurable change.</p></div><span className="rounded-full border border-emerald-300/20 bg-emerald-300/[.07] px-3 py-1.5 text-[10px] font-bold text-emerald-200">LIVE DATA</span></div>
                  {featured ? <div className="mt-7 overflow-hidden rounded-3xl border border-white/10 bg-[#091511]"><div className="relative h-52 overflow-hidden"><div className="h-full transition duration-700 group-hover:scale-105"><CharityImage charity={featured} /></div><div className="absolute inset-0 bg-gradient-to-t from-[#091511] via-transparent to-black/10" /><div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-emerald-200/70">Featured cause</p><h2 className="mt-1 text-2xl font-semibold tracking-tight">{featured.name}</h2></div><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-black/25 backdrop-blur-xl"><Heart className="h-5 w-5 text-emerald-300" /></span></div></div><div className="grid grid-cols-2 divide-x divide-white/10 border-t border-white/10"><div className="p-5"><p className="text-[10px] uppercase tracking-[.16em] text-white/30">Community giving</p><p className="mt-2 text-2xl font-semibold">{compactMoney(featured.raised_paise)}</p></div><div className="p-5"><p className="text-[10px] uppercase tracking-[.16em] text-white/30">Supporters</p><p className="mt-2 text-2xl font-semibold">{featured.supporters.toLocaleString("en-IN")}</p></div></div></div> : <div className="mt-7 grid h-72 place-items-center rounded-3xl border border-dashed border-white/10 bg-white/[.02] text-center text-sm text-white/40">Your first cause is waiting to be discovered.</div>}
                  <div className="mt-5 grid grid-cols-3 gap-3"><div className="rounded-2xl border border-white/10 bg-white/[.025] p-4"><Heart className="h-4 w-4 text-emerald-300" /><p className="mt-5 text-xl font-semibold">{compactMoney(impact.totalRaisedPaise)}</p><p className="mt-1 text-[10px] uppercase tracking-[.12em] text-white/30">raised</p></div><div className="rounded-2xl border border-white/10 bg-white/[.025] p-4"><Users className="h-4 w-4 text-teal-200" /><p className="mt-5 text-xl font-semibold">{impact.activeSupporters.toLocaleString("en-IN")}</p><p className="mt-1 text-[10px] uppercase tracking-[.12em] text-white/30">supporters</p></div><div className="rounded-2xl border border-white/10 bg-white/[.025] p-4"><Sparkles className="h-4 w-4 text-amber-200" /><p className="mt-5 text-xl font-semibold">{impact.partnerCharities}</p><p className="mt-1 text-[10px] uppercase tracking-[.12em] text-white/30">causes</p></div></div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* IMPACT OVERVIEW */}
      <section id="impact" className="relative z-10 border-y border-white/[.07] bg-white/[.018] px-5 py-20 md:px-8 md:py-28">
        <div className="mx-auto max-w-7xl"><Reveal><div className="max-w-2xl"><p className="text-[10px] font-black uppercase tracking-[.2em] text-emerald-300">Our collective impact</p><h2 className="mt-4 text-5xl font-semibold leading-[.94] tracking-[-.06em] md:text-7xl">Small monthly contributions.<br /><span className="text-white/30">Meaningful change at scale.</span></h2><p className="mt-5 text-base leading-7 text-white/50">GoodSwing keeps the journey visible: what the community contributes, which causes are supported, and how much activity is happening right now.</p></div></Reveal>
          <div className="mt-14 grid gap-4 md:grid-cols-4">{[["Total funds raised", impact.totalRaisedPaise, compactMoney], ["This month", impact.monthlyRaisedPaise, compactMoney], ["Active supporters", impact.activeSupporters, (v: number) => Math.round(v).toLocaleString("en-IN")], ["Partner charities", impact.partnerCharities, (v: number) => Math.round(v).toString()]].map(([label, value, formatter], index) => <Reveal key={label as string} delay={index * .06}><div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[.035] p-6 transition duration-500 hover:-translate-y-1 hover:border-emerald-300/20 hover:bg-white/[.05]"><div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-emerald-300/[.05] blur-2xl transition group-hover:bg-emerald-300/[.1]" /><p className="relative text-xs text-white/35">{label as string}</p><p className="relative mt-5 text-3xl font-semibold tracking-tight"><Counter value={value as number} formatter={formatter as (value: number) => string} /></p></div></Reveal>)}</div>
          <Reveal className="mt-5"><div className="grid gap-5 rounded-[32px] border border-white/10 bg-[#08120e] p-6 md:grid-cols-[1.1fr_.9fr] md:p-8"><div><div className="flex items-center justify-between gap-4"><div><p className="text-xs font-semibold text-white/45">Community contribution momentum</p><p className="mt-1 text-sm text-white/25">Current month compared with the previous month.</p></div><span className={`rounded-full px-3 py-1.5 text-xs font-bold ${growth >= 0 ? "bg-emerald-300/10 text-emerald-200" : "bg-amber-300/10 text-amber-200"}`}>{growth >= 0 ? "+" : ""}{growth.toFixed(0)}%</span></div><div className="mt-10 flex h-32 items-end gap-3">{[impact.monthlyPreviousPaise, impact.monthlyPreviousPaise * .72, impact.monthlyPreviousPaise * .86, impact.monthlyRaisedPaise * .68, impact.monthlyRaisedPaise * .82, impact.monthlyRaisedPaise].map((amount, index) => { const height = Math.max(8, (amount / Math.max(impact.monthlyPreviousPaise, impact.monthlyRaisedPaise, 1)) * 100); return <motion.div key={index} initial={{ height: 8 }} whileInView={{ height: `${height}%` }} viewport={{ once: true }} transition={{ duration: .8, delay: index * .08 }} className="flex-1 rounded-t-lg bg-gradient-to-t from-emerald-500/30 to-emerald-200" />; })}</div><div className="mt-3 flex justify-between text-[10px] uppercase tracking-[.16em] text-white/20"><span>Previous</span><span>Now</span></div></div><div className="flex items-center justify-center rounded-3xl border border-white/[.07] bg-white/[.025] p-8 text-center"><div><div className="mx-auto grid h-28 w-28 place-items-center rounded-full border border-emerald-300/20 bg-[radial-gradient(circle,rgba(73,225,166,.16),transparent_66%)]"><div className="text-2xl font-semibold">{impact.partnerCharities}</div></div><p className="mt-5 text-sm font-semibold">Causes with a place in the community</p><p className="mt-1 text-xs leading-5 text-white/30">Every active cause is discoverable before a member chooses where their contribution goes.</p></div></div></div></Reveal>
        </div>
      </section>

      {/* DIRECTORY */}
      <section id="directory" className="relative z-10 mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28"><Reveal><div className="flex flex-col justify-between gap-6 md:flex-row md:items-end"><div className="max-w-2xl"><p className="text-[10px] font-black uppercase tracking-[.2em] text-emerald-300">The directory</p><h2 className="mt-4 text-5xl font-semibold tracking-[-.06em] md:text-7xl">Explore Partner Charities.</h2><p className="mt-5 text-base leading-7 text-white/45">Discover the organizations your membership can support. Search by mission, filter by cause, and choose the story you want to be part of.</p></div><div className="text-sm text-white/30">{filtered.length} of {charities.length} causes</div></div></Reveal>
        <Reveal className="mt-10"><div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/[.025] p-3 md:flex-row"><div className="relative flex-1"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by charity, mission or cause" className="w-full rounded-2xl border border-transparent bg-transparent py-3.5 pl-11 pr-10 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/10 focus:bg-white/[.025]" />{query && <button aria-label="Clear search" onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-white/30 hover:text-white"><X className="h-4 w-4" /></button>}</div><div className="flex gap-2 overflow-x-auto pb-1 md:pb-0"><select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-2xl border border-white/10 bg-[#0b1511] px-4 py-3 text-sm text-white/70 outline-none"><option value="all">All causes</option>{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select><select value={sort} onChange={(event) => setSort(event.target.value)} className="rounded-2xl border border-white/10 bg-[#0b1511] px-4 py-3 text-sm text-white/70 outline-none"><option value="featured">Featured</option><option value="supporters">Most supported</option><option value="newest">Newest</option><option value="impact">Highest impact</option></select></div></div></Reveal>
        {filtered.length > 0 ? <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{filtered.map((charity, index) => <Reveal key={charity.id} delay={(index % 3) * .05}><article className="group overflow-hidden rounded-[28px] border border-white/10 bg-white/[.03] transition duration-500 hover:-translate-y-1 hover:border-emerald-300/25 hover:bg-white/[.045] hover:shadow-[0_30px_80px_rgba(0,0,0,.22)]"><div className="relative h-52 overflow-hidden"><div className="h-full transition duration-700 group-hover:scale-105"><CharityImage charity={charity} /></div><div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/5" />{charity.featured && <span className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.14em] text-emerald-100 backdrop-blur-xl">Featured</span>}<div className="absolute bottom-4 left-4 right-4 flex items-end justify-between"><span className="rounded-full bg-black/30 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.14em] text-white/70 backdrop-blur-xl">{charity.category ?? "Cause"}</span><span className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-black/25 backdrop-blur-xl"><Heart className="h-4 w-4 text-emerald-200" /></span></div></div><div className="p-6"><h3 className="text-2xl font-semibold tracking-tight">{charity.name}</h3><p className="mt-3 line-clamp-3 text-sm leading-6 text-white/40">{charity.description}</p><div className="mt-6 grid grid-cols-2 gap-3"><div className="rounded-2xl border border-white/[.07] bg-white/[.025] p-3"><p className="text-[10px] uppercase tracking-[.13em] text-white/25">Raised</p><p className="mt-1 font-semibold">{compactMoney(charity.raised_paise)}</p></div><div className="rounded-2xl border border-white/[.07] bg-white/[.025] p-3"><p className="text-[10px] uppercase tracking-[.13em] text-white/25">Supporters</p><p className="mt-1 font-semibold">{charity.supporters.toLocaleString("en-IN")}</p></div></div><div className="mt-5 flex items-center justify-between"><button onClick={() => openProfile(charity.id)} className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-200 transition hover:text-emerald-100">Learn more <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></button>{charity.website_url && <a href={charity.website_url} target="_blank" rel="noreferrer" aria-label={`Visit ${charity.name} website`} className="text-white/25 transition hover:text-white"><ExternalLink className="h-4 w-4" /></a>}</div></div></article></Reveal>)}</div> : <div className="mt-8 rounded-3xl border border-dashed border-white/15 bg-white/[.02] p-16 text-center"><Search className="mx-auto h-8 w-8 text-white/20" /><h3 className="mt-5 text-xl font-semibold">No causes found</h3><p className="mt-2 text-sm text-white/35">Try a broader search or clear your filters.</p><button onClick={() => { setQuery(""); setCategory("all"); }} className="mt-5 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white/70 hover:bg-white/[.04]">Reset filters</button></div>}
      </section>

      {/* FEATURED SPOTLIGHT */}
      {featured && <section className="relative z-10 border-y border-white/[.07] bg-[#07100c] px-5 py-20 md:px-8 md:py-28"><div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.08fr_.92fr]"><Reveal className="min-h-[480px] overflow-hidden rounded-[34px] border border-white/10"><div className="relative h-full min-h-[480px]"><div className="absolute inset-0"><CharityImage charity={featured} /></div><div className="absolute inset-0 bg-gradient-to-t from-[#07100c] via-[#07100c]/10 to-transparent" /><div className="absolute bottom-7 left-7 right-7"><span className="rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.16em] text-emerald-100 backdrop-blur-xl">Featured charity</span><h2 className="mt-4 max-w-2xl text-4xl font-semibold tracking-[-.05em] md:text-6xl">{featured.name}</h2></div></div></Reveal><Reveal delay={.1} className="rounded-[34px] border border-white/10 bg-white/[.035] p-7 md:p-10"><p className="text-[10px] font-black uppercase tracking-[.2em] text-emerald-300">Why it matters</p><p className="mt-7 text-xl leading-8 text-white/70">{featured.description}</p><div className="mt-10 grid grid-cols-2 gap-3"><div className="rounded-2xl border border-white/10 bg-white/[.025] p-5"><p className="text-[10px] uppercase tracking-[.15em] text-white/25">Community funds</p><p className="mt-2 text-3xl font-semibold">{compactMoney(featured.raised_paise)}</p></div><div className="rounded-2xl border border-white/10 bg-white/[.025] p-5"><p className="text-[10px] uppercase tracking-[.15em] text-white/25">Supporters</p><p className="mt-2 text-3xl font-semibold">{featured.supporters.toLocaleString("en-IN")}</p></div></div><div className="mt-10 rounded-2xl border border-emerald-300/15 bg-emerald-300/[.05] p-5"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" /><div><p className="font-semibold">Impact you can see.</p><p className="mt-1 text-sm leading-6 text-white/40">GoodSwing keeps charity selection and contribution activity connected to the member experience, so purpose is part of the product—not an afterthought.</p></div></div></div><Link href={`/charities/${featured.slug}`} className="mt-8 inline-flex items-center gap-2 rounded-xl bg-emerald-300 px-5 py-3.5 text-sm font-bold text-[#062016] transition hover:-translate-y-0.5 hover:bg-emerald-200">Support This Charity <ArrowRight className="h-4 w-4" /></Link></Reveal></div></section>}

      {/* PROFILE PREVIEW */}
      <section className="relative z-10 mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28"><Reveal><p className="text-[10px] font-black uppercase tracking-[.2em] text-emerald-300">Go deeper</p><h2 className="mt-4 text-5xl font-semibold tracking-[-.06em] md:text-7xl">See the story behind a cause.</h2></Reveal><div className="mt-12 grid gap-5 lg:grid-cols-[.7fr_1.3fr]"><div className="space-y-2">{charities.slice(0, 6).map((charity) => <button key={charity.id} onClick={() => openProfile(charity.id)} className={`flex w-full items-center gap-4 rounded-2xl border p-3 text-left transition ${selected?.id === charity.id ? "border-emerald-300/25 bg-emerald-300/[.06]" : "border-white/10 bg-white/[.025] hover:bg-white/[.045]"}`}><span className="h-14 w-14 overflow-hidden rounded-xl"><CharityImage charity={charity} /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{charity.name}</span><span className="mt-1 block text-xs text-white/30">{charity.category ?? "Community cause"}</span></span><ChevronDown className={`h-4 w-4 text-white/25 transition ${selected?.id === charity.id ? "-rotate-90 text-emerald-200" : ""}`} /></button>)}</div><div className="min-h-[360px] rounded-[32px] border border-white/10 bg-white/[.03] p-7 md:p-9">{selected ? <><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-emerald-300">Charity profile</p><h3 className="mt-3 text-3xl font-semibold tracking-tight">{selected.name}</h3></div><span className="rounded-full border border-white/10 bg-white/[.03] px-3 py-1.5 text-xs text-white/45">{selected.category ?? "Cause"}</span></div><div className="mt-8 flex gap-2 overflow-x-auto border-b border-white/10">{["overview", "projects", "events", "impact"].map((item) => <button key={item} onClick={() => setTab(item)} className={`border-b-2 px-3 pb-3 text-sm font-semibold capitalize transition ${tab === item ? "border-emerald-300 text-emerald-200" : "border-transparent text-white/30 hover:text-white/60"}`}>{item}</button>)}</div><AnimatePresence mode="wait"><motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: .2 }} className="pt-7">{tab === "overview" && <div className="grid gap-5 md:grid-cols-[1fr_.8fr]"><div><p className="text-sm leading-7 text-white/50">{selected.description}</p>{selected.website_url && <a href={selected.website_url} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-emerald-200">Organization website <ExternalLink className="h-3.5 w-3.5" /></a>}</div><div className="rounded-2xl border border-white/10 bg-black/10 p-5"><p className="text-[10px] uppercase tracking-[.15em] text-white/25">Community signal</p><p className="mt-3 text-3xl font-semibold">{compactMoney(selected.raised_paise)}</p><p className="mt-1 text-xs text-white/30">from {selected.supporters.toLocaleString("en-IN")} supporters</p></div></div>}{tab === "projects" && <div className="rounded-2xl border border-dashed border-white/10 p-7"><p className="text-sm font-semibold">Project updates belong here.</p><p className="mt-2 max-w-xl text-sm leading-6 text-white/35">The current database stores charity descriptions and contribution activity, but does not yet have a project or campaign table. This UI intentionally avoids inventing project data.</p></div>}{tab === "events" && <div className="grid gap-3 md:grid-cols-2">{events.filter((event) => event.charity_id === selected.id).map((event) => <div key={event.id} className="rounded-2xl border border-white/10 bg-black/10 p-5"><div className="flex items-center gap-2 text-xs text-emerald-200"><CalendarDays className="h-4 w-4" />{event.event_date ? new Date(event.event_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Date to be announced"}</div><h4 className="mt-4 font-semibold">{event.title}</h4><p className="mt-2 text-sm leading-6 text-white/35">{event.description ?? "Partner event details will be published here."}</p></div>)}{events.filter((event) => event.charity_id === selected.id).length === 0 && <div className="rounded-2xl border border-dashed border-white/10 p-7 text-sm text-white/35">No upcoming events have been published for this charity yet.</div>}</div>}{tab === "impact" && <div className="grid gap-4 sm:grid-cols-3"><div className="rounded-2xl border border-white/10 bg-black/10 p-5"><Heart className="h-4 w-4 text-emerald-300" /><p className="mt-6 text-2xl font-semibold">{compactMoney(selected.raised_paise)}</p><p className="mt-1 text-xs text-white/30">contributions recorded</p></div><div className="rounded-2xl border border-white/10 bg-black/10 p-5"><Users className="h-4 w-4 text-teal-200" /><p className="mt-6 text-2xl font-semibold">{selected.supporters.toLocaleString("en-IN")}</p><p className="mt-1 text-xs text-white/30">supporters</p></div><div className="rounded-2xl border border-white/10 bg-black/10 p-5"><Sparkles className="h-4 w-4 text-amber-200" /><p className="mt-6 text-2xl font-semibold">{selected.contribution_count.toLocaleString("en-IN")}</p><p className="mt-1 text-xs text-white/30">contributions</p></div></div>}</motion.div></AnimatePresence></> : <div className="grid h-full min-h-[320px] place-items-center text-center"><div><Sparkles className="mx-auto h-8 w-8 text-emerald-300/50" /><h3 className="mt-5 text-xl font-semibold">Choose a cause to explore</h3><p className="mt-2 text-sm text-white/35">Select a charity from the list to open its profile preview.</p></div></div>}</div></div></section>

      {/* TRANSPARENCY */}
      <section className="relative z-10 border-y border-white/[.07] bg-white/[.018] px-5 py-20 md:px-8 md:py-28"><div className="mx-auto max-w-7xl"><Reveal><div className="max-w-2xl"><p className="text-[10px] font-black uppercase tracking-[.2em] text-emerald-300">Transparency</p><h2 className="mt-4 text-5xl font-semibold tracking-[-.06em] md:text-7xl">Where every contribution goes.</h2><p className="mt-5 text-base leading-7 text-white/45">The platform connects membership, charity preference, contribution allocation and community reporting in one visible journey.</p></div></Reveal><div className="mt-14 grid gap-3 md:grid-cols-4">{[{ title: "Subscription", icon: Sparkles, text: "Your active membership powers the GoodSwing ecosystem." }, { title: "Charity contribution", icon: Heart, text: "A minimum 10% can be directed to the cause you choose." }, { title: "Project funding", icon: ShieldCheck, text: "Contribution records remain attached to a specific charity." }, { title: "Community impact", icon: Users, text: "Aggregate activity shows how many people are supporting causes." }].map((step, index) => { const Icon = step.icon; return <Reveal key={step.title} delay={index * .07}><div className="relative h-full rounded-3xl border border-white/10 bg-[#07110d] p-6"><div className="flex items-center justify-between"><span className="text-[10px] font-black tracking-[.18em] text-emerald-300">0{index + 1}</span><Icon className="h-4 w-4 text-white/30" /></div><h3 className="mt-14 text-xl font-semibold">{step.title}</h3><p className="mt-3 text-sm leading-6 text-white/35">{step.text}</p>{index < 3 && <ArrowRight className="absolute -right-3 top-1/2 z-10 hidden h-6 w-6 -translate-y-1/2 rounded-full border border-white/10 bg-[#07110d] p-1 text-emerald-200 md:block" />}</div></Reveal> })}</div><div className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-3 rounded-3xl border border-emerald-300/10 bg-emerald-300/[.035] px-6 py-5 text-xs text-white/40"><span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-emerald-300" /> Active charity allocation records</span><span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-emerald-300" /> Contribution status tracking</span><span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-emerald-300" /> Subscriber-linked impact history</span></div></div></section>

      {/* EVENTS: only published records from charity_events are shown. */}
      {events.length > 0 && <section className="relative z-10 mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28"><Reveal><div className="flex items-end justify-between gap-5"><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-emerald-300">From our partners</p><h2 className="mt-4 text-5xl font-semibold tracking-[-.06em] md:text-7xl">Upcoming events.</h2></div><span className="hidden text-sm text-white/25 sm:block">{events.length} published events</span></div></Reveal><div className="mt-12 flex snap-x gap-4 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{events.map((event, index) => { const charity = charities.find((item) => item.id === event.charity_id); return <Reveal key={event.id} delay={(index % 3) * .05} className="min-w-[300px] snap-start md:min-w-[380px]"><article className="h-full rounded-3xl border border-white/10 bg-white/[.03] p-6 transition hover:-translate-y-1 hover:border-white/20"><div className="flex items-center justify-between"><span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.03] px-3 py-1.5 text-xs text-white/50"><CalendarDays className="h-3.5 w-3.5 text-emerald-300" />{event.event_date ? new Date(event.event_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "TBA"}</span>{event.amount_paise != null && <span className="text-xs font-semibold text-amber-200">{money(event.amount_paise)}</span>}</div><h3 className="mt-10 text-2xl font-semibold tracking-tight">{event.title}</h3><p className="mt-3 text-sm leading-6 text-white/40">{event.description ?? "Partner event details will be published soon."}</p><div className="mt-8 flex items-center justify-between border-t border-white/[.07] pt-5"><span className="text-xs text-white/30">{charity?.name ?? "GoodSwing partner"}</span><span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-200">Explore <ArrowRight className="h-3.5 w-3.5" /></span></div></article></Reveal>})}</div></section>}

      {/* FINAL CTA */}
      <section className="relative z-10 px-5 pb-12 pt-8 md:px-8"><div className="relative mx-auto max-w-7xl overflow-hidden rounded-[36px] border border-emerald-200/15 bg-gradient-to-br from-emerald-300 to-teal-200 p-8 text-[#062016] md:p-14"><motion.div aria-hidden="true" className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/25 blur-3xl" animate={{ scale: [1, 1.12, 1], opacity: [.35, .55, .35] }} transition={{ duration: 8, repeat: Infinity }} /><div className="relative grid gap-10 lg:grid-cols-[1.15fr_.85fr] lg:items-end"><div><p className="text-[10px] font-black uppercase tracking-[.2em] opacity-60">The invitation</p><h2 className="mt-5 max-w-3xl text-5xl font-semibold leading-[.92] tracking-[-.06em] md:text-7xl">Every subscription creates change.</h2></div><div><p className="text-base leading-7 opacity-70">Choose a cause, make purpose part of your membership, and join a community where rewards and impact live together.</p><div className="mt-7 flex flex-wrap gap-3"><Link href="/signup" className="inline-flex items-center gap-2 rounded-xl bg-[#062016] px-5 py-3.5 text-sm font-bold text-white transition hover:-translate-y-0.5">Subscribe & Choose a Charity <ArrowRight className="h-4 w-4" /></Link><Link href="#directory" className="inline-flex items-center gap-2 rounded-xl border border-[#062016]/15 px-5 py-3.5 text-sm font-semibold transition hover:bg-white/20">Browse All Causes</Link></div></div></div></div></section>

      <footer className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-3 px-5 pb-10 pt-2 text-xs text-white/25 md:flex-row md:items-center md:justify-between md:px-8"><span className="font-semibold text-white/50">GoodSwing</span><span>Play. Give. Win.</span><div className="flex gap-5"><Link href="/" className="hover:text-white">Home</Link><Link href="/login" className="hover:text-white">Log in</Link></div></footer>

      {/* Mobile profile sheet. Desktop uses the inline profile panel above. */}
      <AnimatePresence>{selected && <motion.div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-md md:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedId(null)}><motion.div className="max-h-[88vh] w-full overflow-auto rounded-3xl border border-white/10 bg-[#09130f] p-6" initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }} onClick={(event) => event.stopPropagation()}><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-emerald-300">Charity profile</p><h3 className="mt-2 text-2xl font-semibold">{selected.name}</h3></div><button onClick={() => setSelectedId(null)} aria-label="Close charity profile" className="rounded-xl border border-white/10 p-2 text-white/50"><X className="h-4 w-4" /></button></div><div className="mt-6 h-48 overflow-hidden rounded-2xl"><CharityImage charity={selected} /></div><p className="mt-6 text-sm leading-7 text-white/50">{selected.description}</p><div className="mt-6 grid grid-cols-2 gap-3"><div className="rounded-2xl border border-white/10 p-4"><p className="text-xs text-white/30">Raised</p><p className="mt-2 text-xl font-semibold">{compactMoney(selected.raised_paise)}</p></div><div className="rounded-2xl border border-white/10 p-4"><p className="text-xs text-white/30">Supporters</p><p className="mt-2 text-xl font-semibold">{selected.supporters.toLocaleString("en-IN")}</p></div></div><Link href={`/charities/${selected.slug}`} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-300 px-4 py-3 text-sm font-bold text-[#062016]">Open charity <ArrowRight className="h-4 w-4" /></Link></motion.div></motion.div>}</AnimatePresence>
    </main>
  );
}
