import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import BrandLogo from '../components/shared/BrandLogo';
import { fetchFeaturedCharities } from '../services/charityService';
import { getCharityVisual } from '../utils/charityPresentation';

const quickPoints = [
  'Choose a charity at signup',
  'Track scores and join reward draws',
  'Follow winnings and payouts clearly',
];

const confidenceStats = [
  { value: '10%', label: 'minimum charity contribution from each subscriber' },
  { value: '5', label: 'latest golf scores retained for draw eligibility' },
  { value: '2', label: 'simple plans with clear yearly value' },
];

const simpleSteps = [
  { title: 'Choose', text: 'Start by selecting a charity you want to support.' },
  { title: 'Play', text: 'Log your scores and become eligible for prize draws.' },
  { title: 'Track', text: 'See your charity impact, results, and payout status in one place.' },
];

/* Scroll-reveal hook */
function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('visible'); obs.unobserve(el); } },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

function RevealSection({ children, className = '', ...rest }) {
  const ref = useReveal();
  return <div ref={ref} className={`cosmic-reveal ${className}`} {...rest}>{children}</div>;
}

export default function LandingPage() {
  const [featuredCharities, setFeaturedCharities] = useState([]);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    fetchFeaturedCharities()
      .then((charities) => setFeaturedCharities(charities || []))
      .catch(() => setFeaturedCharities([]));
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen">
      {/* ── Transparent cosmic navbar ──────────────────────────── */}
      <header
        className={`fixed top-0 z-50 w-full transition-all duration-500 ${
          scrolled
            ? 'border-b border-nebula-500/15 bg-cosmic-900/80 backdrop-blur-2xl shadow-[0_4px_30px_rgba(5,5,16,0.5)]'
            : 'border-b border-transparent bg-transparent'
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <BrandLogo compact showTagline />
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-outline px-4 py-2 text-sm">Sign In</Link>
            <Link to="/register" className="btn-gold px-4 py-2 text-sm">Get Started</Link>
          </div>
        </div>
      </header>

      {/* ── Hero section ─────────────────────────────────────── */}
      <section className="relative px-4 pb-20 pt-32">
        {/* Cosmic orbs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="hero-orb left-[8%] top-12 h-[340px] w-[340px] bg-nebula-500/10" />
          <div className="hero-orb right-[10%] top-16 h-[280px] w-[280px] bg-stargold-400/8" />
          <div className="hero-orb bottom-10 left-1/2 h-[320px] w-[320px] -translate-x-1/2 bg-nebula-400/5" />
        </div>

        <div className="hero-shell relative mx-auto max-w-6xl overflow-hidden px-6 py-8 md:px-10 md:py-12">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(147,51,234,0.08),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(251,191,36,0.08),transparent_28%)]" />
          <div className="relative grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div className="animate-slide-up">
              <div className="section-kicker mb-5">
                <span className="inline-block h-2 w-2 rounded-full bg-stargold-400 animate-star-twinkle" />
                Charity-first experience
              </div>
              <div className="hero-badge-grid mb-6">
                <div className="spotlight-chip">Purpose-led platform</div>
                <div className="spotlight-chip">Premium member flow</div>
                <div className="spotlight-chip">Fast to trust</div>
              </div>
              <h1 className="max-w-4xl font-display text-5xl font-bold leading-[0.92] text-white md:text-7xl">
                A more refined way to
                <span className="mt-2 block bg-gradient-to-r from-stargold-300 via-white to-nebula-300 bg-clip-text text-transparent">
                  turn every round into visible impact.
                </span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-charcoal-300">
                Golf Charity combines subscriptions, score tracking, draw participation, and cause support in a calmer, more trustworthy experience built for regular use.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link to="/register" className="btn-gold px-8 py-4 text-base">
                  Start Supporting a Charity
                </Link>
                <Link to="/subscription" className="btn-soft px-8 py-4 text-base">
                  View Plans
                </Link>
              </div>

              <div className="mt-10 grid gap-3 sm:grid-cols-3">
                {quickPoints.map((point) => (
                  <div key={point} className="feature-tile">
                    <div className="mb-3 h-2.5 w-12 rounded-full bg-gradient-to-r from-nebula-400 to-stargold-400" />
                    <div className="text-sm leading-relaxed text-charcoal-300">{point}</div>
                  </div>
                ))}
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <div className="info-strip">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-charcoal-500">Experience</div>
                  <div className="mt-2 text-sm text-charcoal-200">Clear status, cleaner dashboards, and less visual clutter.</div>
                </div>
                <div className="info-strip">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-charcoal-500">Trust</div>
                  <div className="mt-2 text-sm text-charcoal-200">Charity choice and contribution remain visible through the journey.</div>
                </div>
                <div className="info-strip">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-charcoal-500">Rhythm</div>
                  <div className="mt-2 text-sm text-charcoal-200">Daily actions like adding scores feel faster and more focused.</div>
                </div>
              </div>
            </div>

            <div className="glass-panel-strong mesh-border p-6 md:p-8 animate-cosmic-fade-in">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <div className="text-xs uppercase tracking-[0.22em] text-charcoal-500">How it works</div>
                  <div className="mt-2 text-2xl font-display font-bold text-white">Simple on purpose</div>
                </div>
                <div className="eyebrow-number">01</div>
              </div>
              <div className="mt-6 space-y-4">
                {simpleSteps.map((step, index) => (
                  <div key={step.title} className="flex gap-4 rounded-2xl border border-white/[0.08] bg-cosmic-900/35 px-4 py-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-nebula-900/60 text-sm font-bold text-nebula-300">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-white">{step.title}</div>
                      <div className="mt-1 text-sm leading-relaxed text-charcoal-400">{step.text}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {confidenceStats.map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-white/[0.08] bg-cosmic-900/30 p-4">
                    <div className="font-display text-3xl font-bold text-white">{stat.value}</div>
                    <div className="mt-2 text-xs leading-relaxed text-charcoal-500">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ribbon ─────────────────────────────────────── */}
      <RevealSection className="px-4 pb-6">
        <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-3">
          <div className="metric-panel-highlight animate-float" style={{ animationDelay: '0s' }}>
            <div className="text-[11px] uppercase tracking-[0.22em] text-charcoal-500">Contribution model</div>
            <div className="mt-3 font-display text-4xl text-white">10%</div>
            <p className="mt-2 text-sm leading-relaxed text-charcoal-400">Minimum share from each subscriber directed toward the selected cause.</p>
          </div>
          <div className="metric-panel-highlight animate-float" style={{ animationDelay: '0.2s' }}>
            <div className="text-[11px] uppercase tracking-[0.22em] text-charcoal-500">Draw readiness</div>
            <div className="mt-3 font-display text-4xl text-white">5 scores</div>
            <p className="mt-2 text-sm leading-relaxed text-charcoal-400">Recent performance stays visible so eligibility feels straightforward and fair.</p>
          </div>
          <div className="metric-panel-highlight animate-float" style={{ animationDelay: '0.4s' }}>
            <div className="text-[11px] uppercase tracking-[0.22em] text-charcoal-500">Plan clarity</div>
            <div className="mt-3 font-display text-4xl text-white">2 tiers</div>
            <p className="mt-2 text-sm leading-relaxed text-charcoal-400">Simple options with fewer decisions and less noise for new members.</p>
          </div>
        </div>
      </RevealSection>

      {/* ── Featured charities ───────────────────────────────── */}
      {featuredCharities.length > 0 && (
        <RevealSection className="cosmic-section px-4 py-16">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 grid gap-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
              <div>
                <div className="section-kicker mb-4">Featured charities</div>
                <p className="max-w-md text-sm leading-relaxed text-charcoal-400">
                  The product leads with purpose, so highlighted causes get the kind of presentation they deserve.
                </p>
              </div>
              <h2 className="font-display text-3xl font-bold text-white md:text-4xl">Causes currently highlighted on the platform</h2>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {featuredCharities.slice(0, 3).map((charity) => {
                const { imageSrc, imageAlt } = getCharityVisual(charity);
                return (
                  <div key={charity._id} className="feature-tile-spotlight mesh-border">
                    <div className="mb-5 overflow-hidden rounded-[22px] border border-white/[0.08] bg-cosmic-900/30">
                      <img
                        src={imageSrc}
                        alt={imageAlt}
                        loading="lazy"
                        decoding="async"
                        className="h-44 w-full object-cover"
                      />
                    </div>
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div className="text-xs uppercase tracking-[0.2em] text-charcoal-500">{charity.category || 'General'}</div>
                      <span className="badge-gold">Spotlight</span>
                    </div>
                    <h3 className="font-display text-2xl font-bold leading-tight text-white">{charity.name}</h3>
                    <p className="mt-4 text-sm leading-7 text-charcoal-400 line-clamp-4">{charity.description}</p>
                    <div className="mt-6 h-px w-full bg-gradient-to-r from-nebula-500/40 to-transparent" />
                  </div>
                );
              })}
            </div>
          </div>
        </RevealSection>
      )}

      {/* ── CTA section ──────────────────────────────────────── */}
      <RevealSection className="cosmic-section px-4 py-20">
        <div className="hero-shell mx-auto max-w-5xl px-6 py-10 text-center md:px-10">
          {/* Cosmic glow accents */}
          <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-nebula-500/8 blur-3xl" />
          <div className="relative">
            <div className="section-kicker mb-4">Clear next step</div>
            <h2 className="font-display text-4xl font-bold text-white md:text-5xl">
              Subscribe, pick a charity, and begin.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-charcoal-300">
              The flow is simple by design. Choose a plan, activate your dashboard, and keep everything visible from impact to winnings.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Link to="/subscription" className="btn-gold px-10 py-4 text-base">Subscribe Now</Link>
              <Link to="/register" className="btn-soft px-10 py-4 text-base">Create Account</Link>
            </div>
          </div>
        </div>
      </RevealSection>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="cosmic-section px-4 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">
          <BrandLogo compact showTagline={false} />
          <p className="text-sm text-charcoal-500">Golf Charity — a cosmic experience for purpose-driven players.</p>
        </div>
      </footer>
    </div>
  );
}
