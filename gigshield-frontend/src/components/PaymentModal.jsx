import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { paymentApi, policyApi } from '../api/api.js';
import { CreditCard, CheckCircle2, Loader2, X, Shield, Lock } from 'lucide-react';
import '../index.css';

// Load Stripe with your publishable key
const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder'
);

// Card element styling to match our dark theme
const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#e2e8f0',
      fontFamily: '"Inter", system-ui, sans-serif',
      fontSize: '15px',
      fontSmoothing: 'antialiased',
      '::placeholder': { color: '#64748b' },
      iconColor: '#38bdf8',
    },
    invalid: {
      color: '#fb7185',
      iconColor: '#fb7185',
    },
  },
  hidePostalCode: true,
};

// Inner checkout form (must be inside <Elements>)
function CheckoutForm({ plan, workerId, onClose, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [step, setStep] = useState(1); // 1: Form, 2: Processing, 3: Success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cardComplete, setCardComplete] = useState(false);

  const handlePay = async () => {
    if (!stripe || !elements) return;

    setLoading(true);
    setError('');

    try {
      // 1. Create PaymentIntent on our backend (calls Stripe API)
      const intentResponse = await paymentApi.createIntent({
        policyId: plan.id,
        workerId: workerId,
        amount: plan.premiumAmount,
        currency: 'INR',
        paymentMethod: 'CARD',
      });

      const { clientSecret, status: intentStatus, errorMessage } = intentResponse?.data || {};

      if (intentStatus === 'FAILED' || !clientSecret) {
        setError(errorMessage || 'Failed to initialize payment. Please try again.');
        setLoading(false);
        return;
      }

      // 2. Show processing state
      setStep(2);

      // 3. Confirm card payment with Stripe (card data goes directly to Stripe, never our server)
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      });

      if (stripeError) {
        setError(stripeError.message || 'Payment failed. Please check your card details.');
        setStep(1);
        setLoading(false);
        return;
      }

      if (paymentIntent.status === 'succeeded') {
        // 4. Payment confirmed — create the policy in our system
        try {
          await policyApi.purchase({ workerId, planId: plan.id });
        } catch {
          // Policy creation might fail but payment is already done
          // The webhook will handle this as a fallback
        }

        setStep(3);
        setTimeout(() => {
          onSuccess();
        }, 2500);
      } else {
        setError('Payment requires additional verification. Please try again.');
        setStep(1);
      }
    } catch (err) {
      setError(err.message || 'Payment failed. Please try again.');
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-card" style={{ maxWidth: '420px', width: '100%' }}>

        {step !== 3 && (
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        )}

        {step === 1 && (
          <div className="payment-init">
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

            {/* Stripe Card Element */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
                Card Details
              </label>
              <div style={{
                background: 'var(--bg-lighter)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '14px 12px',
                transition: 'border-color 0.2s ease',
              }}>
                <CardElement
                  options={CARD_ELEMENT_OPTIONS}
                  onChange={(e) => {
                    setCardComplete(e.complete);
                    if (e.error) setError(e.error.message);
                    else setError('');
                  }}
                />
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '6px' }}>
                Use test card: 4242 4242 4242 4242 · Any future date · Any CVC
              </p>
            </div>

            <button
              className="btn btn-primary btn-full"
              onClick={handlePay}
              disabled={loading || !stripe || !cardComplete}
              style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}
            >
              {loading ? (
                <><Loader2 size={18} className="spin" /> Initializing...</>
              ) : (
                <><Shield size={16} /> Pay ₹{plan.premiumAmount}</>
              )}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="payment-processing" style={{ textAlign: 'center', padding: '2.5rem 0' }}>
            <Loader2 size={48} className="spin" color="var(--accent-blue)" style={{ margin: '0 auto 1.5rem' }} />
            <h3>Processing Payment</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Verifying with Stripe — please do not close this window...
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

// Outer wrapper that provides Stripe context
function PaymentModal({ plan, workerId, onClose, onSuccess }) {
  return (
    <Elements stripe={stripePromise}>
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
