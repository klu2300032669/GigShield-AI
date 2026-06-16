import { useState } from 'react';
import { paymentApi, policyApi } from '../api/api.js';
import { CreditCard, CheckCircle2, Loader2, X } from 'lucide-react';
import '../index.css';

function PaymentModal({ plan, workerId, onClose, onSuccess }) {
  const [step, setStep] = useState(1); // 1: Init, 2: Processing, 3: Success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePay = async () => {
    setLoading(true);
    setError('');

    try {
      // 1. Create Payment Intent (Mock external call)
      await paymentApi.createIntent({
        policyId: plan.id, // For a real flow, a policy might not exist yet before payment
        workerId: workerId,
        amount: plan.premiumAmount,
        currency: 'INR',
        paymentMethod: 'CARD'
      });

      // Simulated payment delay of 1.5 seconds
      setStep(2);
      setTimeout(async () => {
        try {
          // 2. Actually purchase the policy on our backend
          await policyApi.purchase({ workerId, planId: plan.id });
          setStep(3);
          setTimeout(() => {
            onSuccess();
          }, 2000);
        } catch (err) {
          setError(err.message || 'Failed to complete policy purchase.');
          setStep(1);
        } finally {
          setLoading(false);
        }
      }, 1500);

    } catch (err) {
      setError(err.message || 'Failed to initialize payment.');
      setLoading(false);
      setStep(1);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-card" style={{ maxWidth: '400px', width: '100%' }}>
        
        {step !== 3 && (
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        )}

        {step === 1 && (
          <div className="payment-init">
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ background: 'var(--bg-lighter)', display: 'inline-flex', padding: '1rem', borderRadius: '50%', marginBottom: '1rem' }}>
                <CreditCard size={32} color="var(--accent-blue)" />
              </div>
              <h3>Complete Payment</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Secure checkout via Stripe</p>
            </div>

            <div className="payment-summary" style={{ background: 'var(--bg-lighter)', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Plan</span>
                <span style={{ fontWeight: 500 }}>{plan.planName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Billing</span>
                <span>{plan.billingCycle === 'WEEKLY' ? 'Weekly' : 'Monthly'}</span>
              </div>
              <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.8rem 0' }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '1.1rem' }}>
                <span>Total Due</span>
                <span style={{ color: 'var(--accent-blue)' }}>₹{plan.premiumAmount}</span>
              </div>
            </div>

            {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

            {/* Skeleton Card Input */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Card Details</label>
              <div className="form-input" style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}>
                <CreditCard size={18} style={{ marginRight: '0.5rem' }} />
                •••• •••• •••• 4242
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.8rem' }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Expiry</label>
                  <div className="form-input" style={{ color: 'var(--text-muted)' }}>MM / YY</div>
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label">CVC</label>
                  <div className="form-input" style={{ color: 'var(--text-muted)' }}>123</div>
                </div>
              </div>
            </div>

            <button 
              className="btn btn-primary btn-full" 
              onClick={handlePay}
              disabled={loading}
              style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}
            >
              {loading ? <><Loader2 size={18} className="spin" /> Initializing...</> : `Pay ₹${plan.premiumAmount}`}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="payment-processing" style={{ textAlign: 'center', padding: '2rem 0' }}>
            <Loader2 size={48} className="spin" color="var(--accent-blue)" style={{ margin: '0 auto 1.5rem' }} />
            <h3>Processing Payment</h3>
            <p style={{ color: 'var(--text-muted)' }}>Please do not close this window...</p>
          </div>
        )}

        {step === 3 && (
          <div className="payment-success" style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div style={{ display: 'inline-flex', background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '50%', marginBottom: '1.5rem' }}>
              <CheckCircle2 size={48} color="var(--accent-green)" />
            </div>
            <h3 style={{ marginBottom: '0.5rem' }}>Payment Successful!</h3>
            <p style={{ color: 'var(--text-muted)' }}>Your policy is now active.</p>
          </div>
        )}

      </div>
    </div>
  );
}

export default PaymentModal;
