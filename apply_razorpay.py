import os
import re

filepath = r'c:\Users\DELL\OneDrive\Desktop\PROJECT 2327\gigshield-frontend\src\components\PaymentModal.jsx'
content = '''import { useState, useEffect } from 'react';
import { CreditCard, CheckCircle2, Loader2, X, Shield, Lock, Smartphone } from 'lucide-react';
import { policyApi } from '../api/api.js';
import '../index.css';

// Dynamically load Razorpay SDK
const loadRazorpay = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function PaymentModal({ plan, workerId, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState('upi'); // upi or card

  const handleRazorpay = async (e) => {
    e.preventDefault();
    setLoading(true);

    const res = await loadRazorpay();
    if (!res) {
      alert('Razorpay SDK failed to load. Are you online?');
      setLoading(false);
      return;
    }

    // Amount in paise (multiply by 100)
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY || 'rzp_test_YOUR_TEST_KEY', // Fallback to a dummy key if not present
      amount: Math.round(plan.premiumAmount * 100),
      currency: 'INR',
      name: 'GigShield AI',
      description: plan.planName,
      image: 'https://cdn-icons-png.flaticon.com/512/3665/3665985.png', // Shield icon
      handler: async function (response) {
        // Payment successful
        setStep(2); // Processing internally
        try {
          await policyApi.purchase({ workerId: Number(workerId), planId: Number(plan.id) });
          setStep(3); // Success
          setTimeout(() => {
            if (onSuccess) onSuccess();
          }, 2000);
        } catch (err) {
          alert('Smart Contract creation failed after payment. Contact support.');
          setStep(1);
        }
      },
      prefill: {
        name: 'Gig Worker',
        email: 'worker@example.com',
        contact: '9999999999'
      },
      theme: {
        color: '#10b981' // Emerald color
      }
    };

    const paymentObject = new window.Razorpay(options);
    paymentObject.on('payment.failed', function (response) {
      alert('Payment Failed: ' + response.error.description);
      setLoading(false);
    });
    
    paymentObject.open();
    // We stop our own loading spinner once the Razorpay UI takes over
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      padding: '20px'
    }}>
      <div className="glass-card animate-fade-in-up" onClick={e => e.stopPropagation()} style={{
        background: 'var(--bg-primary)', border: '1px solid var(--border-color)',
        maxWidth: '450px', width: '100%', borderRadius: '16px', overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
      }}>
        <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lock size={18} style={{ color: 'var(--accent-emerald)' }} />
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Razorpay Checkout</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        <div style={{ padding: '24px' }}>
          {step === 1 && (
            <form onSubmit={handleRazorpay}>
              <div style={{ marginBottom: '24px', textAlign: 'center' }}>
                <p style={{ margin: '0 0 8px 0', color: 'var(--text-secondary)' }}>You are purchasing</p>
                <h2 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}>{plan.planName}</h2>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-teal)' }}>₹{plan.premiumAmount}</div>
                <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{plan.billingCycle} billing</p>
              </div>

              <div style={{ padding: '16px', background: 'rgba(56, 189, 248, 0.1)', borderRadius: '8px', border: '1px dashed var(--accent-sky)', marginBottom: '24px', textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--accent-sky)' }}>
                  You will be redirected to the secure <strong>Razorpay</strong> gateway to complete your payment using UPI, Card, or NetBanking.
                </p>
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', background: 'var(--accent-indigo)', borderColor: 'var(--accent-indigo)', padding: '12px' }}>
                {loading ? <Loader2 size={18} className="spin" /> : <Shield size={18} />} Pay ₹{plan.premiumAmount} with Razorpay
              </button>
            </form>
          )}

          {step === 2 && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Loader2 size={48} className="spin" style={{ color: 'var(--accent-indigo)', margin: '0 auto 16px auto' }} />
              <h3 style={{ margin: '0 0 8px 0' }}>Activating Smart Contract...</h3>
              <p style={{ color: 'var(--text-muted)' }}>Writing policy details to the ledger.</p>
            </div>
          )}

          {step === 3 && (
            <div style={{ textAlign: 'center', padding: '40px 0' }} className="animate-fade-in">
              <CheckCircle2 size={64} style={{ color: 'var(--accent-emerald)', margin: '0 auto 16px auto' }} />
              <h2 style={{ margin: '0 0 8px 0', color: 'var(--accent-emerald)' }}>Payment Successful!</h2>
              <p style={{ color: 'var(--text-muted)' }}>Your GigShield policy is now fully active.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
'''

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
