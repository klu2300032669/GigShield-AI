import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { paymentApi, policyApi } from '../api/api.js';
import { CreditCard, CheckCircle2, Loader2, X, Shield, Lock } from 'lucide-react';
import '../index.css';

// Load Stripe with your publishable key
const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder'
);

// Inner checkout form (must be inside <Elements>)
function CheckoutForm({ plan, workerId, onClose, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [step, setStep] = useState(1); // 1: Form, 2: Processing, 3: Success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePay = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError('');
    setStep(2);

    // Confirm the payment with Stripe
    // For UPI, this will redirect the user. We specify a return_url.
    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard?payment_success=true&plan_id=${plan.id}&worker_id=${workerId}`,
      },
      // If it's a card payment, it might not redirect unless 3D Secure is required.
      // We set redirect: 'if_required' to avoid redirecting for standard cards.
      redirect: 'if_required',
    });

    if (stripeError) {
      setError(stripeError.message || 'Payment failed. Please try again.');
      setStep(1);
      setLoading(false);
      return;
    }

    if (paymentIntent && paymentIntent.status === 'succeeded') {
      // Payment confirmed without redirect (e.g., standard card)
      try {
        await policyApi.purchase({ workerId, planId: plan.id });
      } catch (e) {
        console.error("Policy creation failed, but payment succeeded. Webhook will handle it.", e);
      }
      setStep(3);
      setTimeout(() => {
        onSuccess();
      }, 2500);
    } else {
      // Pending or requires action
      setError('Payment requires additional verification or is pending.');
      setStep(1);
    }
    
    setLoading(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-card" style={{ maxWidth: '420px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>

        {step !== 3 && (
          <button className="modal-close" onClick={onClose} disabled={loading}>
            <X size={20} />
          </button>
        )}

        {step === 1 && (
          <form onSubmit={handlePay} className="payment-init">
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(56,189,248,0.15), rgba(139,92,246,0.15))',
                display: 'inline-flex', padding: '1rem', borderRadius: '50%', marginBottom: '1rem'
              }}>
                <CreditCard size={32} color="var(--accent-blue)" />
              </div>
              <h3>Complete Payment</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <Lock size={12} /> Secured by Stripe
              </p>
            </div>

            <div className="payment-summary" style={{
              background: 'var(--bg-lighter)', padding: '1rem',
              borderRadius: '12px', marginBottom: '1.5rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Plan</span>
                <span style={{ fontWeight: 600 }}>{plan.planName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Coverage</span>
                <span>{plan.coverageType}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Billing</span>
                <span>{plan.billingCycle === 'WEEKLY' ? 'Weekly' : 'Monthly'}</span>
              </div>
              <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.8rem 0' }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.15rem' }}>
                <span>Total Due</span>
                <span style={{ color: 'var(--accent-emerald)' }}>₹{plan.premiumAmount}</span>
              </div>
            </div>

            {error && (
              <div className="alert alert-error" style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
                {error}
              </div>
            )}

            {/* Stripe Payment Element (Supports UPI, Card, Google Pay, etc.) */}
            <div style={{ marginBottom: '1.5rem', minHeight: '150px' }}>
              <PaymentElement options={{
                layout: 'tabs',
                defaultValues: {
                  billingDetails: {
                    address: {
                      country: 'IN'
                    }
                  }
                }
              }} />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full btn-glow"
              disabled={loading || !stripe || !elements}
              style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}
            >
              {loading ? (
                <><Loader2 size={18} className="spin" /> Processing...</>
              ) : (
                <><Shield size={16} /> Pay ₹{plan.premiumAmount}</>
              )}
            </button>
          </form>
        )}

        {step === 2 && (
          <div className="payment-processing" style={{ textAlign: 'center', padding: '2.5rem 0' }}>
            <Loader2 size={48} className="spin" color="var(--accent-blue)" style={{ margin: '0 auto 1.5rem' }} />
            <h3>Processing Payment</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Verifying with Stripe — you may be redirected to complete the payment...
            </p>
          </div>
        )}

        {step === 3 && (
          <div className="payment-success" style={{ textAlign: 'center', padding: '2.5rem 0' }}>
            <div style={{
              display: 'inline-flex',
              background: 'rgba(16, 185, 129, 0.12)',
              padding: '1.2rem', borderRadius: '50%', marginBottom: '1.5rem'
            }}>
              <CheckCircle2 size={48} color="var(--accent-green)" />
            </div>
            <h3 style={{ marginBottom: '0.5rem' }}>Payment Successful!</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Your insurance policy is now active and protecting you.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}

// Outer wrapper that provides Stripe context and fetches ClientSecret
function PaymentModal({ plan, workerId, onClose, onSuccess }) {
  const [clientSecret, setClientSecret] = useState('');
  const [initError, setInitError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initPayment = async () => {
      try {
        const intentResponse = await paymentApi.createIntent({
          policyId: plan.id,
          workerId: workerId,
          amount: plan.premiumAmount,
          currency: 'INR',
        });
        
        if (intentResponse?.data?.clientSecret) {
          setClientSecret(intentResponse.data.clientSecret);
        } else {
          setInitError('Could not initialize payment gateway. Please ensure Stripe API keys are configured correctly.');
        }
      } catch (err) {
        setInitError('Failed to connect to payment server. Please verify your connection and Stripe configuration.');
      } finally {
        setIsLoading(false);
      }
    };
    initPayment();
  }, [plan, workerId]);

  if (isLoading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content glass-card" style={{ maxWidth: '400px', textAlign: 'center' }}>
          <Loader2 size={32} className="spin" color="var(--primary)" style={{ margin: '0 auto 1rem' }} />
          <p>Loading secure checkout...</p>
        </div>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="modal-overlay">
        <div className="modal-content glass-card" style={{ maxWidth: '400px', textAlign: 'center' }}>
          <h3 style={{ color: 'var(--danger)', marginBottom: '1rem' }}>Payment Gateway Error</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
            {initError}
          </p>
          <button className="btn btn-outline" onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={{ 
      clientSecret, 
      appearance: { theme: 'night', variables: { colorPrimary: '#38bdf8' } } 
    }}>
      <CheckoutForm
        plan={plan}
        workerId={workerId}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    </Elements>
  );
}

export default PaymentModal;

