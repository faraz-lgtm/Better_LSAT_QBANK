import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import {
  ArrowRight,
  Award,
  BarChart2,
  BookOpen,
  CheckCircle,
  ChevronRight,
  ClipboardList,
  FileText,
  Lock,
  PlayCircle,
  Shield,
  Star,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react"

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Reviews', href: '#reviews' },
  { label: 'Free Diagnostic', href: '#diagnostic' },
];

const MICROSTATS = [
  { value: '6,000+', label: 'Question Explanations' },
  { value: 'Official', label: 'LSAC Questions' },
  { value: 'Full-Length', label: 'Practice Tests' },
  { value: 'Score', label: 'Analytics Dashboard' },
];

const FEATURES = [
  {
    icon: FileText,
    title: 'Official LSAC Questions',
    desc: 'Practice with real, licensed LSAC questions — the exact material you\'ll face on test day.',
  },
  {
    icon: PlayCircle,
    title: '6,000+ Video & Written Explanations',
    desc: 'Every question explained in depth. Understand the why, not just the answer.',
  },
  {
    icon: ClipboardList,
    title: 'Full-Length & Section Drills',
    desc: 'Timed full tests, individual section practice, and targeted question drills — structured around your weaknesses.',
  },
  {
    icon: BarChart2,
    title: 'Score Analytics Dashboard',
    desc: 'Track your performance by section, question type, and difficulty. Know exactly where to study next.',
  },
  {
    icon: BookOpen,
    title: 'Structured Course Curriculum',
    desc: 'A complete LSAT curriculum built around the new format — Logical Reasoning, Reading Comprehension, and test-taking strategy.',
  },
  {
    icon: Users,
    title: 'Live Classes',
    desc: 'Live instruction, Q&A sessions, and group prep with expert instructors. Launching soon.',
    badge: 'Coming Soon',
  },
];

const HOW_STEPS = [
  {
    icon: Target,
    num: '01',
    title: 'Take the Free Diagnostic',
    desc: 'See your baseline score and identify your weak sections in 35 minutes.',
  },
  {
    icon: ClipboardList,
    num: '02',
    title: 'Follow Your Study Plan',
    desc: 'Your personalized curriculum focuses time on what actually moves your score.',
  },
  {
    icon: FileText,
    num: '03',
    title: 'Drill with Official Questions',
    desc: 'Practice with real LSAC material. 6,000+ explanations show you exactly how to think through each question.',
  },
  {
    icon: TrendingUp,
    num: '04',
    title: 'Track Your Progress',
    desc: 'Analytics show score improvement over time. Know when you\'re ready to sit.',
  },
];

const TESTIMONIALS = [
  {
    quote: 'The diagnostic was eye-opening. I had no idea my Reading Comp was dragging me down that much. The personalized plan built around my weak spots was exactly what I needed.',
    name: 'Sarah M.',
    improvement: '152 → 167',
    school: 'Now at Columbia Law',
  },
  {
    quote: 'Other platforms just dump questions on you. BetterLSAT actually showed me why I was getting things wrong. The analytics make it crystal clear where to spend your time.',
    name: 'Marcus T.',
    improvement: '148 → 161',
    school: 'Targeting NYU Law',
  },
  {
    quote: 'Started with the free diagnostic, got my score report the same day. 90 days later I hit my target score. The explanations are genuinely the best I\'ve found anywhere.',
    name: 'Priya K.',
    improvement: '155 → 170',
    school: 'Admitted to Harvard Law',
  },
];

const COMPARISON_ROWS = [
  { feature: 'Official LSAC questions', better: true, other: 'Varies' },
  { feature: 'Free diagnostic with score report', better: true, other: false },
  { feature: '6,000+ explained questions', better: true, other: 'Some' },
  { feature: 'Monthly pricing (no lock-in)', better: true, other: false },
  { feature: 'Personalized analytics dashboard', better: true, other: 'Limited' },
  { feature: 'Price', better: '$70/mo', other: '$99–$299/mo' },
];

const CORE_FEATURES = [
  'Full question bank — 6,000+ explanations',
  'Official LSAC questions & full-length tests',
  'Section drills & timed practice',
  'Score analytics & performance tracking',
  'Structured course curriculum',
  'Written & video explanations (videos coming soon)',
  'Personalized study plan from diagnostic',
];

const LIVE_FEATURES = [
  'Everything in Core, plus:',
  'Live weekly classes with LSAT instructors',
  'Live Q&A and group sessions',
  'Priority support',
];

function MarketingHomePage() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const href = (anchor as HTMLAnchorElement).getAttribute('href');
        if (!href) return;
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          setMobileMenuOpen(false);
        }
      });
    });
  }, []);

  return (
    <div className="marketing-home antialiased text-[#0D47A1]" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? "rgba(255,255,255,0.97)" : "rgba(255,255,255,0.0)",
          backdropFilter: scrolled ? "blur(12px)" : "none",
          boxShadow: scrolled ? "0 1px 24px rgba(0,0,0,0.08)" : "none",
        }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between lg:h-16">
            <Link to="/" className="group flex items-center gap-2">
              <img src="/marketing-logo.png" alt="betterLSAT" className="h-auto w-[180px]" />
            </Link>

            <nav className="hidden items-center gap-7 md:flex">
              {NAV_LINKS.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  className="text-base font-medium transition-colors duration-200 hover:opacity-70"
                  style={{ color: "#0D47A1" }}
                >
                  {l.label}
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="hidden text-base font-medium transition-opacity hover:opacity-70 md:inline-flex"
                style={{ color: "#0D47A1" }}
              >
                Log In
              </Link>
              <Link
                to="/intent"
                className="hidden items-center gap-1.5 rounded-md px-3.5 py-1.5 text-sm font-semibold text-white transition-all duration-200 hover:scale-105 hover:opacity-90 active:scale-95 md:inline-flex"
                style={{ background: "#FF6F00" }}
              >
                Start Free Diagnostic <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <button
                type="button"
                className="rounded-lg p-2 md:hidden"
                style={{ color: "#0D47A1" }}
                onClick={() => setMobileMenuOpen((v) => !v)}
                aria-label="Toggle menu"
              >
                <div className="space-y-1.5">
                  <span className={`block w-6 h-0.5 bg-current transition-all ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
                  <span className={`block w-6 h-0.5 bg-current transition-all ${mobileMenuOpen ? 'opacity-0' : ''}`} />
                  <span className={`block w-6 h-0.5 bg-current transition-all ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
                </div>
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-4 border-t" style={{ borderColor: '#E5E7EB' }}>
              <nav className="flex flex-col gap-1 pt-3">
                {NAV_LINKS.map(l => (
                  <a
                    key={l.label}
                    href={l.href}
                    className="px-3 py-2.5 rounded-lg text-base font-medium hover:bg-gray-50 transition-colors"
                    style={{ color: '#0D47A1' }}
                  >
                    {l.label}
                  </a>
                ))}
                <Link
                  to="/intent"
                  className="mt-2 flex items-center justify-center gap-1.5 rounded-md px-3.5 py-2 text-sm font-semibold text-white"
                  style={{ background: "#FF6F00" }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Start Free Diagnostic <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  to="/login"
                  className="mt-1 px-3 py-2.5 text-center text-base font-medium"
                  style={{ color: "#0D47A1" }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Log In
                </Link>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* ── HERO ── */}
      <section
        className="relative flex min-h-screen flex-col justify-center overflow-hidden pt-20"
        style={{ background: "#FFFFFF" }}
      >
        {/* Background geometric shapes */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-5"
            style={{ background: '#0D47A1' }}
          />
          <div
            className="absolute top-1/3 -left-20 w-72 h-72 rounded-full opacity-5"
            style={{ background: '#FF6F00' }}
          />
          <div
            className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full opacity-4"
            style={{ background: '#0D47A1' }}
          />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="flex max-w-xl flex-col text-left lg:max-w-none">
              <div
                className="mb-5 inline-flex w-fit items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold"
                style={{ background: "#FFF3E8", color: "#FF6F00" }}
              >
                <Zap className="h-3.5 w-3.5" aria-hidden />
                Free Diagnostic — No Credit Card Required
              </div>

              <h1
                className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-[3.5rem]"
                style={{ color: "#0D47A1", lineHeight: 1.12 }}
              >
                The LSAT Prep
                <br />
                Platform Built to Get
                <br />
                You a <span style={{ color: "#FF6F00" }}>Better Score</span>
              </h1>

              <p
                className="mt-6 max-w-lg text-lg sm:text-xl"
                style={{ color: "#6B7280", lineHeight: 1.6 }}
              >
                6,000+ explained questions. Official LSAC tests. Adaptive analytics. A system designed around how you
                actually improve.
              </p>

              <div className="mt-7 w-full max-w-full">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-3.5">
                  <Link
                    to="/intent"
                    className="inline-flex h-12 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-6 text-base font-semibold leading-none text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98] sm:h-[3.25rem] sm:px-7"
                    style={{ background: "#FF6F00", boxShadow: "0 4px 24px rgba(255,111,0,0.35)" }}
                  >
                    <span>Take Your Free Diagnostic Test</span>
                    <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                  </Link>
                  <a
                    href="#how-it-works"
                    className="inline-flex h-12 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg border px-6 text-base font-semibold leading-none transition-all duration-200 hover:bg-gray-50 active:scale-[0.98] sm:h-[3.25rem] sm:px-7"
                    style={{ color: "#0D47A1", borderColor: "#0D47A1", borderWidth: 1.5 }}
                  >
                    See How It Works
                  </a>
                </div>

                <p
                  className="text-sm"
                  style={{ color: "#9CA3AF", lineHeight: 1.5, marginTop: 28, marginBottom: 8 }}
                >
                  No credit card required · Takes 35 minutes · Get your score instantly
                </p>
              </div>

              <div className="mt-10 grid w-full grid-cols-2 gap-x-4 gap-y-8 sm:mt-12 sm:grid-cols-4 sm:gap-x-6">
                {MICROSTATS.map((s) => (
                  <div key={s.label} className="min-w-0 text-left sm:text-center">
                    <div
                      className="text-xl font-bold whitespace-nowrap sm:text-[1.375rem]"
                      style={{ color: "#0D47A1", lineHeight: 1.25 }}
                    >
                      {s.value}
                    </div>
                    <div className="mt-1 text-xs" style={{ color: "#6B7280", lineHeight: 1.4 }}>
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero visual */}
            <div className="relative">
              <div
                className="rounded-2xl overflow-hidden shadow-2xl"
                style={{ boxShadow: '0 24px 80px rgba(27,42,74,0.18)' }}
              >
                {/* Mock dashboard */}
                <div className="p-0" style={{ background: '#0D47A1' }}>
                  {/* Dashboard header */}
                  <div className="px-5 py-3 flex items-center gap-2 border-b border-white/10">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400/70" />
                      <div className="w-3 h-3 rounded-full bg-yellow-400/70" />
                      <div className="w-3 h-3 rounded-full bg-green-400/70" />
                    </div>
                    <span className="text-xs text-white/40 ml-2 font-medium">betterLSAT.com — Score Dashboard</span>
                  </div>

                  <div className="p-5 space-y-4">
                    {/* Score overview */}
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Baseline Score', val: '152', delta: null },
                        { label: 'Current Score', val: '163', delta: '+11' },
                        { label: 'Target Score', val: '170', delta: null },
                      ].map(item => (
                        <div key={item.label} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.07)' }}>
                          <div className="text-xs mb-1 font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>{item.label}</div>
                          <div className="flex items-end gap-1.5">
                            <span className="text-2xl font-bold text-white">{item.val}</span>
                            {item.delta && (
                              <span className="text-xs font-semibold pb-0.5" style={{ color: '#FF6F00' }}>{item.delta}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Section breakdown bars */}
                    <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.07)' }}>
                      <div className="text-xs font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.6)' }}>Section Breakdown</div>
                      {[
                        { name: 'Logical Reasoning', pct: 82, color: '#FF6F00' },
                        { name: 'Reading Comprehension', pct: 68, color: '#3B82F6' },
                        { name: 'Analytical Reasoning', pct: 74, color: '#F59E0B' },
                      ].map(s => (
                        <div key={s.name} className="mb-3 last:mb-0">
                          <div className="flex justify-between text-xs mb-1">
                            <span style={{ color: 'rgba(255,255,255,0.7)' }}>{s.name}</span>
                            <span className="font-semibold text-white">{s.pct}%</span>
                          </div>
                          <div className="h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
                            <div
                              className="h-2 rounded-full transition-all"
                              style={{ width: `${s.pct}%`, background: s.color }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Recent activity */}
                    <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.07)' }}>
                      <div className="text-xs font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.6)' }}>Recent Practice</div>
                      {[
                        { label: 'PrepTest 92 — Full', score: '28/35', tag: 'LR' },
                        { label: 'Assumption Questions Drill', score: '14/15', tag: 'LR' },
                        { label: 'RC Passage Set 4', score: '22/27', tag: 'RC' },
                      ].map(r => (
                        <div key={r.label} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                          <div className="flex items-center gap-2">
                            <span
                              className="text-xs font-semibold px-1.5 py-0.5 rounded"
                              style={{ background: 'rgba(255,111,0,0.2)', color: '#FF6F00' }}
                            >{r.tag}</span>
                            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>{r.label}</span>
                          </div>
                          <span className="text-xs font-semibold text-white">{r.score}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating badge */}
              <div
                className="absolute -bottom-4 -left-4 rounded-2xl px-4 py-3 shadow-xl"
                style={{ background: '#FFFFFF', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#FFF3E8' }}>
                    <TrendingUp className="w-4 h-4" style={{ color: '#FF6F00' }} />
                  </div>
                  <div>
                    <div className="text-xs font-semibold" style={{ color: '#0D47A1' }}>Avg. Improvement</div>
                    <div className="text-sm font-bold" style={{ color: '#FF6F00' }}>+11 points</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── DIAGNOSTIC FUNNEL STRIP ── */}
      <section id="diagnostic" className="py-20 lg:py-24" style={{ background: "#0D47A1" }}>
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center px-4 text-center sm:px-6 lg:px-8">
          <h2
            className="max-w-[44rem] text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-[3.25rem]"
            style={{ lineHeight: 1.15 }}
          >
            Not Sure Where to Start?
            <br />
            Find Out in 35 Minutes.
          </h2>

          <p
            className="mt-5 max-w-[36rem] text-base sm:text-lg"
            style={{ color: "rgba(255,255,255,0.65)", lineHeight: 1.65 }}
          >
            Take our free diagnostic test. Get your baseline score, see exactly where you&apos;re losing points, and
            receive a personalized study plan — before you spend a dollar.
          </p>

          <div className="mt-14 flex w-full max-w-4xl flex-col items-center gap-10 sm:mt-16 sm:flex-row sm:items-start sm:justify-between">
            {[
              {
                icon: ClipboardList,
                step: "Step 1",
                title: "Take the Diagnostic",
                desc: "Free, 35-minute LSAT-style test covering all question types.",
              },
              {
                icon: BarChart2,
                step: "Step 2",
                title: "Get Your Score Report",
                desc: "Section breakdown with weak areas identified and scored.",
              },
              {
                icon: Target,
                step: "Step 3",
                title: "Follow Your Plan",
                desc: "Personalized study path built around your score goal.",
              },
            ].flatMap((s, i, arr) => {
              const step = (
                <div key={s.title} className="flex max-w-[14.5rem] flex-col items-center text-center sm:max-w-none sm:flex-1">
                  <div
                    className="mb-4 flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl"
                    style={{
                      background: "rgba(255,111,0,0.15)",
                      border: "1px solid rgba(255,111,0,0.3)",
                    }}
                  >
                    <s.icon className="h-7 w-7" style={{ color: "#FF6F00" }} aria-hidden />
                  </div>
                  <div
                    className="mb-1.5 text-[11px] font-semibold tracking-[0.14em] uppercase"
                    style={{ color: "rgba(255,255,255,0.4)" }}
                  >
                    {s.step}
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-white" style={{ lineHeight: 1.3 }}>
                    {s.title}
                  </h3>
                  <p
                    className="text-sm"
                    style={{ color: "rgba(255,255,255,0.6)", lineHeight: 1.55 }}
                  >
                    {s.desc}
                  </p>
                </div>
              )

              if (i >= arr.length - 1) return [step]

              return [
                step,
                <div
                  key={`chevron-${s.title}`}
                  className="mt-5 hidden shrink-0 sm:flex"
                  aria-hidden
                >
                  <ChevronRight className="h-5 w-5 text-white opacity-30" />
                </div>,
              ]
            })}
          </div>

          <Link
            to="/intent"
            className="marketing-diagnostic-pulse mt-14 inline-flex items-center gap-2 rounded-lg px-10 py-4 text-base font-bold text-white transition-all duration-200 hover:scale-105 hover:opacity-90 active:scale-95 sm:mt-16"
            style={{ background: "#FF6F00", boxShadow: "0 4px 32px rgba(255,111,0,0.4)" }}
          >
            Start Free Diagnostic <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-20 lg:py-28" style={{ background: '#FFFFFF' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold mb-4"
              style={{ background: '#FFF3E8', color: '#0D47A1' }}
            >
              <Zap className="w-3 h-3" /> Platform Features
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4" style={{ color: '#0D47A1' }}>
              Everything You Need to Hit<br className="hidden sm:block" /> Your Target Score
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(f => (
              <div
                key={f.title}
                className="relative p-6 rounded-2xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group"
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
                }}
              >
                {f.badge && (
                  <span
                    className="absolute top-4 right-4 text-xs font-semibold px-2.5 py-1 rounded-lg"
                    style={{ background: '#FFBC7D', color: '#7C3A00' }}
                  >
                    {f.badge}
                  </span>
                )}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110"
                  style={{ background: '#FFF3E8' }}
                >
                  <f.icon className="w-6 h-6" style={{ color: '#FF6F00' }} />
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: '#0D47A1' }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-20 lg:py-28" style={{ background: "#F7F8FA" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div
            className="mb-14 flex w-full flex-col items-center sm:mb-16"
            style={{ textAlign: "center" }}
          >
            <h2
              className="w-full text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl"
              style={{ color: "#0D47A1", lineHeight: 1.2, textAlign: "center" }}
            >
              Simple, Transparent Pricing
            </h2>
            <p
              className="mt-4 w-full max-w-xl text-base sm:text-lg"
              style={{ color: "#6B7280", lineHeight: 1.6, textAlign: "center" }}
            >
              The most affordable monthly LSAT platform with official LSAC content. Cancel anytime.
            </p>
          </div>

          <div className="mx-auto grid max-w-4xl items-stretch gap-6 md:grid-cols-2 md:gap-8">
            {/* Core plan */}
            <div
              className="flex h-full flex-col rounded-2xl bg-white p-7 sm:p-8"
              style={{ boxShadow: "0 2px 24px rgba(0,0,0,0.08)" }}
            >
              <div className="mb-6">
                <h3 className="text-xl font-bold" style={{ color: "#0D47A1", lineHeight: 1.3 }}>
                  Core
                </h3>
                <p className="mt-1 text-sm" style={{ color: "#6B7280", lineHeight: 1.5 }}>
                  Everything you need to improve your score
                </p>
                <div className="mt-5 flex items-end gap-1">
                  <span className="text-5xl font-extrabold" style={{ color: "#0D47A1", lineHeight: 1 }}>
                    $70
                  </span>
                  <span className="pb-1.5 text-lg" style={{ color: "#9CA3AF", lineHeight: 1 }}>
                    /month
                  </span>
                </div>
              </div>

              <ul className="mb-8 flex flex-1 flex-col gap-3">
                {CORE_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <CheckCircle className="mt-0.5 h-5 w-5 shrink-0" style={{ color: "#FF6F00" }} aria-hidden />
                    <span className="text-sm" style={{ color: "#374151", lineHeight: 1.5 }}>
                      {f}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto">
                <Link
                  to="/intent"
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg text-sm font-bold leading-none text-white transition-opacity hover:opacity-90"
                  style={{ background: "#FF6F00" }}
                >
                  <span>Start Free Diagnostic</span>
                  <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                </Link>
                <p className="text-center text-xs" style={{ color: "#9CA3AF", lineHeight: 1.5, marginTop: 20 }}>
                  No credit card required to start
                </p>
              </div>
            </div>

            {/* Live plan */}
            <div
              className="relative flex h-full flex-col rounded-2xl bg-white p-7 sm:p-8"
              style={{
                boxShadow: "0 2px 24px rgba(0,0,0,0.08)",
                border: "2px solid #0D47A1",
              }}
            >
              <div
                className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-md px-4 py-1 text-xs font-bold whitespace-nowrap text-white"
                style={{ background: "#0D47A1" }}
              >
                Most Comprehensive
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-bold" style={{ color: "#0D47A1", lineHeight: 1.3 }}>
                  Live
                </h3>
                <p className="mt-1 text-sm" style={{ color: "#6B7280", lineHeight: 1.5 }}>
                  For students who want live instruction
                </p>
                <div className="mt-5 flex items-end gap-1">
                  <span className="text-5xl font-extrabold" style={{ color: "#0D47A1", lineHeight: 1 }}>
                    $129
                  </span>
                  <span className="pb-1.5 text-lg" style={{ color: "#9CA3AF", lineHeight: 1 }}>
                    /month
                  </span>
                </div>
              </div>

              <ul className="mb-8 flex flex-1 flex-col gap-3">
                {LIVE_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <CheckCircle className="mt-0.5 h-5 w-5 shrink-0" style={{ color: "#FF6F00" }} aria-hidden />
                    <span className="text-sm font-medium" style={{ color: "#374151", lineHeight: 1.5 }}>
                      {f}
                    </span>
                  </li>
                ))}
                <li className="flex items-start gap-3">
                  <Lock className="mt-0.5 h-5 w-5 shrink-0" style={{ color: "#D97706" }} aria-hidden />
                  <span className="text-sm" style={{ color: "#6B7280", lineHeight: 1.5 }}>
                    Live classes launching soon — lock in pricing now
                  </span>
                </li>
              </ul>

              <div className="mt-auto">
                <Link
                  to="/signup"
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg text-sm font-bold leading-none text-white transition-opacity hover:opacity-90"
                  style={{ background: "#0D47A1" }}
                >
                  <span>Join Waitlist</span>
                  <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                </Link>
                <p className="text-center text-xs" style={{ color: "#9CA3AF", lineHeight: 1.5, marginTop: 20 }}>
                  Lock in $129/month before launch price increases
                </p>
              </div>
            </div>
          </div>

          <p
            className="text-center text-sm"
            style={{ color: "#9CA3AF", lineHeight: 1.6, marginTop: 28 }}
          >
            Cancel anytime · Billed monthly · Secure checkout · Used by students targeting Harvard Law, Columbia, NYU,
            and more
          </p>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-20 lg:py-28" style={{ background: '#FFFFFF' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4" style={{ color: '#0D47A1' }}>
              A System Built Around<br className="hidden sm:block" /> How the LSAT Works
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {HOW_STEPS.map((s, i) => (
              <div key={s.title} className="relative flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: '#FFF3E8' }}
                  >
                    <s.icon className="w-6 h-6" style={{ color: '#FF6F00' }} />
                  </div>
                  <span className="text-4xl font-black opacity-10" style={{ color: '#0D47A1' }}>{s.num}</span>
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: '#0D47A1' }}>{s.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>{s.desc}</p>

                {i < 3 && (
                  <div
                    className="hidden lg:block absolute top-6 left-full w-8 h-0.5 ml-0"
                    style={{ background: 'linear-gradient(to right, #E5E7EB, transparent)' }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="reviews" className="py-20 lg:py-28" style={{ background: '#F7F8FA' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4" style={{ color: '#0D47A1' }}>
              Students Who Took the Diagnostic<br className="hidden sm:block" /> and Never Looked Back
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 mb-14">
            {TESTIMONIALS.map(t => (
              <div
                key={t.name}
                className="p-6 rounded-2xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                style={{ background: '#FFFFFF', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}
              >
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" style={{ color: '#F59E0B' }} />
                  ))}
                </div>
                <p className="text-sm leading-relaxed mb-6" style={{ color: '#374151' }}>"{t.quote}"</p>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold" style={{ color: '#0D47A1' }}>{t.name}</div>
                    <div className="text-xs" style={{ color: '#6B7280' }}>{t.school}</div>
                  </div>
                  <div
                    className="text-sm font-bold px-3 py-1 rounded-lg"
                    style={{ background: '#FFF3E8', color: '#FF6F00' }}
                  >
                    {t.improvement}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div
            className="rounded-2xl p-8 grid sm:grid-cols-3 gap-8 text-center"
            style={{ background: '#0D47A1' }}
          >
            {[
              { value: '+11 points', label: 'Average score improvement' },
              { value: '94%', label: 'Students who complete the diagnostic start a study plan' },
              { value: '6,000+', label: 'Questions explained in depth' },
            ].map(s => (
              <div key={s.label} className="border-b sm:border-b-0 sm:border-r last:border-0 pb-6 sm:pb-0 sm:pr-6 last:pr-0" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                <div className="text-3xl font-extrabold mb-1" style={{ color: '#FF6F00' }}>{s.value}</div>
                <div className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPARISON TABLE ── */}
      <section className="py-20 lg:py-28" style={{ background: '#FFFFFF' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4" style={{ color: '#0D47A1' }}>
              Why BetterLSAT?
            </h2>
          </div>

          <div className="rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 24px rgba(0,0,0,0.08)' }}>
            <table className="w-full">
              <thead>
                <tr style={{ background: '#0D47A1' }}>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-white/60">Feature</th>
                  <th className="px-6 py-4 text-center">
                    <span className="text-sm font-bold text-white">BetterLSAT</span>
                  </th>
                  <th className="px-6 py-4 text-center">
                    <span className="text-sm font-medium text-white/50">Other Platforms</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row, i) => (
                  <tr
                    key={row.feature}
                    className="border-b last:border-0 transition-colors hover:bg-gray-50"
                    style={{ borderColor: '#F3F4F6', background: i % 2 === 0 ? '#FFFFFF' : '#FAFAFA' }}
                  >
                    <td className="px-6 py-4 text-sm font-medium" style={{ color: '#374151' }}>{row.feature}</td>
                    <td className="px-6 py-4 text-center">
                      {row.better === true ? (
                        <CheckCircle className="w-5 h-5 mx-auto" style={{ color: '#FF6F00' }} />
                      ) : (
                        <span className="text-sm font-bold" style={{ color: '#FF6F00' }}>{row.better}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {row.other === false ? (
                        <span className="text-lg" style={{ color: '#D1D5DB' }}>✕</span>
                      ) : (
                        <span className="text-sm" style={{ color: '#9CA3AF' }}>{row.other}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-20 lg:py-28" style={{ background: "#0D47A1" }}>
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2
            className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl"
            style={{ lineHeight: 1.2 }}
          >
            Find Out Where You Stand — For Free
          </h2>
          <p
            className="text-lg"
            style={{ color: "rgba(255,255,255,0.65)", lineHeight: 1.6, marginTop: 16 }}
          >
            35 minutes. Your baseline score. A plan to improve it. No credit card needed.
          </p>

          <Link
            to="/intent"
            className="marketing-diagnostic-pulse inline-flex items-center gap-3 rounded-lg px-10 py-5 text-base font-bold leading-none text-white transition-all duration-200 hover:opacity-90 active:scale-95"
            style={{
              background: "#FF6F00",
              boxShadow: "0 4px 40px rgba(255,111,0,0.45)",
              marginTop: 40,
              marginBottom: 40,
            }}
          >
            Take Your Free Diagnostic Test <ArrowRight className="h-5 w-5" />
          </Link>

          <div className="flex flex-wrap justify-center gap-6">
            {[
              { icon: Shield, text: "Secure" },
              { icon: Award, text: "LSAC Licensed" },
              { icon: CheckCircle, text: "Cancel Anytime" },
            ].map((b) => (
              <div key={b.text} className="flex items-center gap-2">
                <b.icon className="h-4 w-4" style={{ color: "rgba(255,255,255,0.4)" }} aria-hidden />
                <span className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
                  {b.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#1e1e1e' }} className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <div className="mb-2 flex items-center justify-center gap-2 md:justify-start">
                <img src="/marketing-logo.png" alt="betterLSAT" className="h-8 w-auto brightness-0 invert" />
              </div>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>The smarter way to prep.</p>
            </div>

            <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
              <a href="#features" className="text-sm transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.45)" }}>
                About
              </a>
              <a href="#pricing" className="text-sm transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.45)" }}>
                Pricing
              </a>
              <Link to="/intent" className="text-sm transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.45)" }}>
                Diagnostic
              </Link>
              <Link to="/login" className="text-sm transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.45)" }}>
                Contact
              </Link>
              <a href="#pricing" className="text-sm transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.45)" }}>
                Privacy Policy
              </a>
              <a href="#pricing" className="text-sm transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.45)" }}>
                Terms
              </a>
            </nav>
          </div>

          <div className="mt-8 pt-8 border-t text-center" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
              © 2026 BetterLSAT. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export { MarketingHomePage }
