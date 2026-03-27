import React, { useState } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import AppLayout from '../components/shared/AppLayout';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const plans = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: 'Rs 999',
    period: '/month',
    description: 'Flexible access with charity support and reward draws.',
    features: [
      'Choose your charity',
      'Track scores',
      'Enter reward draws',
      'Monitor winnings',
    ],
    highlight: false,
  },
  {
    id: 'yearly',
    name: 'Yearly',
    price: 'Rs 8,999',
    period: '/year',
    description: 'Better value with uninterrupted support all year.',
    features: [
      'Everything in Monthly',
      'Lower yearly cost',
      'Continuous impact',
      'Clear yearly commitment',
    ],
    highlight: true,
    badge: 'Best Value',
  },
];

const planSignals = [
  'Charity selection stays visible in your account',
  'Reward participation remains tied to your latest scores',
  'Winnings, verification, and payout status stay transparent',
];

export default function SubscriptionPage() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(null);

  const handleSubscribe = async (plan) => {
    setLoading(plan);
    try {
      await api.post('/users/subscribe', { plan });
      await refreshUser();
      toast.success(`Welcome to the ${plan} plan`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Subscription failed');
    } finally {
      setLoading(null);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription?')) return;
    setLoading('cancel');
    try {
      await api.post('/users/cancel-subscription');
      await refreshUser();
      toast.success('Subscription cancelled');
    } catch {
      toast.error('Failed to cancel subscription');
    } finally {
      setLoading(null);
    }
  };

  const isActive = user?.subscription_status === 'active';

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl space-y-8 animate-slide-up">
        <div className="glass-panel mesh-border overflow-hidden p-8 md:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div className="max-w-3xl">
              <div className="section-kicker mb-4">Subscription</div>
              <h1 className="page-title !text-5xl">Pick a simple plan and activate the full experience.</h1>
              <p className="mt-4 text-lg text-charcoal-300">
                Subscribe once, choose your charity, and keep your scores, draws, impact, and winnings in one place.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {planSignals.map((signal) => (
                <div key={signal} className="rounded-2xl border border-charcoal-800/70 bg-charcoal-950/35 px-4 py-4 text-sm leading-relaxed text-charcoal-300">
                  {signal}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-3xl">
          <div className="section-kicker mb-4">Subscription</div>
          <h2 className="page-title">Choose the pace that fits your support.</h2>
          <p className="mt-3 text-base text-charcoal-400">
            The layout is intentionally simpler now, but the visual hierarchy is stronger so the decision feels clearer.
          </p>
        </div>

        {isActive && (
          <div className="glass-panel border border-forest-800/40 bg-forest-900/10 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="badge-active">
                  <span className="h-2 w-2 rounded-full bg-forest-500 animate-pulse-slow" />
                  Active
                </span>
                <h2 className="mt-3 font-display text-2xl font-bold capitalize text-white">{user.plan} plan</h2>
                {user.subscription_end && (
                  <p className="mt-1 text-sm text-charcoal-400">
                    Renewal date: {format(new Date(user.subscription_end), 'MMMM d, yyyy')}
                  </p>
                )}
              </div>
              <button onClick={handleCancel} disabled={loading === 'cancel'} className="btn-danger">
                {loading === 'cancel' ? 'Cancelling...' : 'Cancel Subscription'}
              </button>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {plans.map((plan) => {
            const isCurrent = isActive && user.plan === plan.id;

            return (
              <div
                key={plan.id}
                className={`relative overflow-hidden rounded-[32px] border p-8 backdrop-blur-sm transition-all duration-300 ${
                  plan.highlight
                    ? 'border-gold-700/60 bg-gradient-to-br from-gold-900/20 via-charcoal-900/85 to-forest-950/80 shadow-[0_20px_60px_rgba(197,162,13,0.08)]'
                    : 'border-charcoal-800/80 bg-charcoal-900/60'
                } ${isCurrent ? 'ring-2 ring-forest-600' : 'hover:-translate-y-1 hover:border-charcoal-700'}`}
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/[0.04] to-transparent" />
                {plan.badge && (
                  <div className="absolute -top-3 left-8">
                    <span className="badge-gold">{plan.badge}</span>
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute -top-3 right-8">
                    <span className="badge-active">Current Plan</span>
                  </div>
                )}

                <div className="relative">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <div className="eyebrow-number">{plan.id === 'monthly' ? 'M' : 'Y'}</div>
                    <div className="text-right text-xs uppercase tracking-[0.24em] text-charcoal-500">
                      {plan.highlight ? 'Priority plan' : 'Flexible plan'}
                    </div>
                  </div>

                  <h2 className="font-display text-3xl font-bold text-white">{plan.name}</h2>
                  <p className="mt-2 text-charcoal-400">{plan.description}</p>
                </div>

                <div className="mt-6 flex items-end gap-2">
                  <span className="font-display text-5xl font-bold text-white">{plan.price}</span>
                  <span className="mb-2 text-sm text-charcoal-400">{plan.period}</span>
                </div>

                <ul className="mt-8 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-charcoal-300">
                      <span className="mt-1 h-2.5 w-2.5 rounded-full bg-forest-400" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={!!loading || isCurrent}
                  className={`mt-8 w-full ${plan.highlight ? 'btn-gold' : 'btn-primary'} ${isCurrent ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  {loading === plan.id
                    ? 'Processing...'
                    : isCurrent
                    ? 'Current Plan'
                    : isActive
                    ? `Switch to ${plan.name}`
                    : `Choose ${plan.name}`}
                </button>
              </div>
            );
          })}
        </div>

        <div className="story-panel p-5 text-center">
          <p className="text-sm text-charcoal-400">
            This remains a simulated payment flow, but the presentation is now more premium and easier to scan.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
