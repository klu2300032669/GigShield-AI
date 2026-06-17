import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { policyApi } from '../api/api.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import {
  Shield, CloudRain, Flame, Wind, CheckCircle2,
  Star, AlertCircle, Loader2
} from 'lucide-react';
import PaymentModal from '../components/PaymentModal.jsx';

function Plans() {
  const { worker } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  
  // Advanced View States
  const [viewMode, setViewMode] = useState('grid');
  const [filterCoverage, setFilterCoverage] = useState('ANY');
  const [sortBy, setSortBy] = useState('popular');
  const [expandedPlanId, setExpandedPlanId] = useState(null);

  useEffect(() => { fetchPlans(); }, []);

  const fetchPlans = async () => {
    try {
      const response = await policyApi.getPlans();
      setPlans(response.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseClick = (plan) => {
    setSelectedPlanForPayment(plan);
    setSuccessMsg('');
    setError('');
  };

  const handlePaymentSuccess = () => {
    setSelectedPlanForPayment(null);
    setSuccessMsg('Policy purchased successfully! Check your policies page.');
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  const getCoverageIcon = (type) => {
    switch (type) {
      case 'RAIN': return <CloudRain size={22} />;
      case 'HEAT': return <Flame size={22} />;
      case 'POLLUTION': return <Wind size={22} />;
      case 'ALL': return <Shield size={22} />;
      default: return <Shield size={22} />;
    }
  };

  const getCoverageClass = (type) => {
    switch (type) {
      case 'RAIN': return 'rain';
      case 'HEAT': return 'heat';
      case 'POLLUTION': return 'pollution';
      case 'ALL': return 'all';
      default: return '';
    }
  };

  const formatCurrency = (val) => {
    if (!val) return '₹0';
    return '₹' + Number(val).toLocaleString('en-IN', { maximumFractionDigits: 0 });
  };

  const getFeatures = (plan) => {
    const features = [
      `${plan.coverageType === 'ALL' ? 'All weather' : plan.coverageType.charAt(0) + plan.coverageType.slice(1).toLowerCase()} event coverage`,
      `Up to ${formatCurrency(plan.maxPayout)} payout`,
      `${plan.billingCycle === 'WEEKLY' ? 'Weekly' : 'Monthly'} billing cycle`,
      'AI-powered risk assessment',
      'Automatic claim triggering',
    ];
    if (plan.coverageType === 'ALL') features.push('Combined protection');
    return features;
  };

  const processedPlans = [...plans]
    .filter(p => filterCoverage === 'ANY' || p.coverageType === filterCoverage)
    .sort((a, b) => {
      if (sortBy === 'price_asc') return a.premiumAmount - b.premiumAmount;
      if (sortBy === 'price_desc') return b.premiumAmount - a.premiumAmount;
      if (sortBy === 'payout_desc') return b.maxPayout - a.maxPayout;
      // Default: popular first
      const aPop = a.coverageType === 'ALL' && a.billingCycle === 'MONTHLY' ? 1 : 0;
      const bPop = b.coverageType === 'ALL' && b.billingCycle === 'MONTHLY' ? 1 : 0;
      return bPop - aPop;
    });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
        <div>
          <h1 className="animate-fade-in-up">
            <div className="page-header-icon" style={{ background: 'var(--accent-blue-glow)', color: 'var(--info)' }}>
              <Shield size={20} />
            </div>
            Insurance Plans
          </h1>
          <p className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>Choose the right protection for your gig income</p>
        </div>

        {/* Controls */}
        <div className="plans-controls animate-fade-in-up" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', animationDelay: '200ms' }}>
          <select 
            className="form-input" 
            style={{ width: 'auto', padding: '8px 12px', height: 'auto', fontSize: '0.85rem' }}
            value={filterCoverage}
            onChange={(e) => setFilterCoverage(e.target.value)}
          >
            <option value="ANY">All Coverage</option>
            <option value="ALL">Comprehensive</option>
            <option value="RAIN">Rain Only</option>
            <option value="HEAT">Heat Only</option>
          </select>

          <select 
            className="form-input" 
            style={{ width: 'auto', padding: '8px 12px', height: 'auto', fontSize: '0.85rem' }}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="popular">Recommended</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="payout_desc">Max Payout</option>
          </select>

          <div className="filter-tabs" style={{ margin: 0 }}>
            <button className={`filter-tab ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')} style={{ background: viewMode === 'grid' ? 'var(--bg-card)' : 'transparent', color: viewMode === 'grid' ? 'var(--text-primary)' : 'var(--text-secondary)' }}>Grid</button>
            <button className={`filter-tab ${viewMode === 'table' ? 'active' : ''}`} onClick={() => setViewMode('table')} style={{ background: viewMode === 'table' ? 'var(--bg-card)' : 'transparent', color: viewMode === 'table' ? 'var(--text-primary)' : 'var(--text-secondary)' }}>Table</button>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-error animate-fade-in"><AlertCircle size={16} /> {error}</div>}
      {successMsg && <div className="alert alert-success animate-fade-in"><CheckCircle2 size={16} /> {successMsg}</div>}

      {viewMode === 'grid' ? (
        <div className="cards-grid stagger-children">
          {processedPlans.map((plan) => {
          const isPopular = plan.coverageType === 'ALL' && plan.billingCycle === 'MONTHLY';
          return (
            <div key={plan.id} className={`plan-card ${getCoverageClass(plan.coverageType)} ${isPopular ? 'popular' : ''}`}>
              <div className="plan-card-header">
                {isPopular && <div className="plan-popular-badge"><Star size={10} /> Most Popular</div>}
                <div className={`plan-icon ${getCoverageClass(plan.coverageType)}`}>
                  {getCoverageIcon(plan.coverageType)}
                </div>
                <div className="plan-name">{plan.planName}</div>
                <div className="plan-description">{plan.description}</div>
              </div>

              <div className="plan-card-body">
                <div className="plan-price">
                  <span className="plan-price-amount">{formatCurrency(plan.premiumAmount)}</span>
                  <span className="plan-price-period">/{plan.billingCycle === 'WEEKLY' ? 'week' : 'month'}</span>
                </div>
                {plan.originalPremiumAmount && plan.originalPremiumAmount !== plan.premiumAmount && (
                  <div style={{ textAlign: 'center', marginTop: '4px' }}>
                    <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {formatCurrency(plan.originalPremiumAmount)}
                    </span>
                    <span style={{ 
                      marginLeft: '8px', 
                      fontSize: '0.7rem', 
                      fontWeight: 600,
                      padding: '2px 8px', 
                      borderRadius: '12px',
                      background: plan.premiumAmount > plan.originalPremiumAmount 
                        ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
                      color: plan.premiumAmount > plan.originalPremiumAmount 
                        ? 'var(--danger)' : 'var(--success)'
                    }}>
                      {plan.premiumAmount > plan.originalPremiumAmount ? '⬆ Surge' : '⬇ Discount'}
                    </span>
                  </div>
                )}
                {plan.pricingReasoning && plan.pricingReasoning !== 'Standard baseline risk.' && (
                  <div style={{ 
                    marginTop: '8px', padding: '8px 12px', 
                    background: 'var(--bg-glass)', 
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)', 
                    fontSize: '0.75rem', 
                    color: 'var(--text-color)',
                    textAlign: 'left',
                    lineHeight: 1.4,
                    display: 'flex',
                    gap: '6px',
                    alignItems: 'flex-start'
                  }}>
                    <span style={{ fontSize: '1rem' }}>🧠</span> 
                    <span style={{ opacity: 0.9 }}><strong>AI Reasoning:</strong> {plan.pricingReasoning}</span>
                  </div>
                )}

                <ul className="plan-features">
                  {getFeatures(plan).map((feature, i) => (
                    <li key={i} className="plan-feature">
                      <CheckCircle2 size={14} className="plan-feature-icon" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  className={`btn ${isPopular ? 'btn-primary btn-glow' : 'btn-outline'} btn-full`}
                  onClick={() => handlePurchaseClick(plan)}
                  style={{ marginTop: 'auto' }}
                >
                  Get This Plan
                </button>
                <div 
                  style={{ textAlign: 'center', marginTop: '12px', fontSize: '0.8rem', color: 'var(--primary)', cursor: 'pointer' }}
                  onClick={() => setExpandedPlanId(expandedPlanId === plan.id ? null : plan.id)}
                >
                  {expandedPlanId === plan.id ? 'Hide Details' : 'View Details'}
                </div>
                {expandedPlanId === plan.id && (
                  <div className="animate-fade-in-up" style={{ marginTop: '16px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <p style={{ margin: 0, marginBottom: '8px' }}><strong>Deductible:</strong> ₹0</p>
                    <p style={{ margin: 0, marginBottom: '8px' }}><strong>Waiting Period:</strong> None</p>
                    <p style={{ margin: 0 }}><strong>Policy Term:</strong> {plan.billingCycle === 'WEEKLY' ? '7 Days' : '30 Days'} Auto-renewing</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      ) : (
        <div className="table-container animate-fade-in-up" style={{ marginTop: 'var(--space-md)' }}>
          <table className="data-table">
            <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-card)' }}>
              <tr>
                <th>Plan Name</th>
                <th>Coverage</th>
                <th>Premium</th>
                <th>Max Payout</th>
                <th>Billing</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {processedPlans.map(plan => {
                const isPopular = plan.coverageType === 'ALL' && plan.billingCycle === 'MONTHLY';
                return (
                  <tr key={plan.id}>
                    <td style={{ fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {getCoverageIcon(plan.coverageType)}
                        {plan.planName}
                        {isPopular && <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>Popular</span>}
                      </div>
                    </td>
                    <td><span className={`badge badge-info`}>{plan.coverageType}</span></td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatCurrency(plan.premiumAmount)}</td>
                    <td>{formatCurrency(plan.maxPayout)}</td>
                    <td>{plan.billingCycle}</td>
                    <td>
                      <button className="btn btn-sm btn-primary" onClick={() => handlePurchaseClick(plan)}>Select</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {plans.length === 0 && (
        <div className="glass-card empty-state">
          <div className="empty-state-icon"><Shield size={28} /></div>
          <h3>No plans available yet</h3>
          <p>Insurance plans will appear here once configured</p>
        </div>
      )}

      {selectedPlanForPayment && (
        <PaymentModal 
          plan={selectedPlanForPayment} 
          workerId={worker.id}
          onClose={() => setSelectedPlanForPayment(null)}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {/* FAQ Accordion */}
      <FAQSection />
    </div>
  );
}

const FAQ_ITEMS = [
  {
    q: 'How does parametric insurance work?',
    a: 'Unlike traditional insurance, parametric insurance pays out automatically when a predefined event occurs — like rainfall exceeding 50mm in your city. No claim forms, no waiting. The AI engine monitors real-time data and triggers payouts instantly.',
  },
  {
    q: 'How quickly will I receive my payout?',
    a: 'Once a qualifying event is detected and verified by our AI system, payouts are typically processed within 24–48 hours directly to your registered UPI account.',
  },
  {
    q: 'Can I have multiple plans active at the same time?',
    a: 'Yes! You can hold multiple active policies — for example, a Rain plan and a Heat plan simultaneously — for combined protection across different weather events.',
  },
  {
    q: 'What happens if I cancel a policy early?',
    a: 'You can cancel an active policy at any time. However, premiums already paid are non-refundable. The cancellation takes effect immediately and no future claims will be triggered.',
  },
  {
    q: 'Is my payment secure?',
    a: 'Absolutely. All payments are processed through Stripe, a PCI-DSS Level 1 compliant payment provider. GigShield never stores your card details.',
  },
];

function FAQSection() {
  const [openIdx, setOpenIdx] = useState(null);
  return (
    <div style={{ marginTop: 'var(--space-4xl)' }}>
      <div className="section-header" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="section-title" style={{ fontSize: '1.2rem' }}>
          Frequently Asked Questions
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {FAQ_ITEMS.map((item, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={idx}
              className="glass-card"
              style={{
                padding: 0,
                overflow: 'hidden',
                transition: 'border-color 0.2s ease',
                borderColor: isOpen ? 'rgba(16,185,129,0.3)' : 'var(--border-color)',
              }}
            >
              <button
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                aria-expanded={isOpen}
                aria-controls={`faq-answer-${idx}`}
                id={`faq-question-${idx}`}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-primary)',
                  fontFamily: 'inherit',
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  textAlign: 'left',
                  gap: 12,
                }}
              >
                <span>{item.q}</span>
                <span
                  style={{
                    flexShrink: 0,
                    color: isOpen ? 'var(--accent-emerald)' : 'var(--text-muted)',
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.25s ease, color 0.2s ease',
                    display: 'flex',
                    fontSize: '1.1rem',
                    lineHeight: 1,
                  }}
                  aria-hidden="true"
                >
                  ▾
                </span>
              </button>
              <div
                id={`faq-answer-${idx}`}
                role="region"
                aria-labelledby={`faq-question-${idx}`}
                style={{
                  maxHeight: isOpen ? '300px' : '0',
                  overflow: 'hidden',
                  transition: 'max-height 0.3s cubic-bezier(0.4,0,0.2,1)',
                }}
              >
                <p style={{
                  padding: '0 20px 16px',
                  color: 'var(--text-secondary)',
                  fontSize: '0.88rem',
                  lineHeight: 1.7,
                  margin: 0,
                }}>
                  {item.a}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Plans;
