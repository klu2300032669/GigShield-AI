import os
filepath = r'c:\Users\DELL\OneDrive\Desktop\PROJECT 2327\gigshield-frontend\src\components\PaymentModal.jsx'
content = '''import { useState } from 'react';
import { CreditCard, CheckCircle2, Loader2, X, Shield, Lock, Smartphone } from 'lucide-react';
import { policyApi } from '../api/api.js';
import '../index.css';

export default function PaymentModal({ plan, workerId, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState('upi'); // upi or card

  const handlePay = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate network delay & 3D Secure / UPI processing
    setTimeout(async () => {
      setStep(2); // Processing
      
      try {
        await policyApi.purchase({ workerId: Number(workerId), planId: Number(plan.id) });
        
        setTimeout(() => {
          setStep(3); // Success
          if (onSuccess) onSuccess();
        }, 1500);
      } catch (err) {
        setLoading(false);
        setStep(1);
        alert("Payment Failed. Please try again.");
      }
    }, 1500);
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
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Secure Checkout</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        <div style={{ padding: '24px' }}>
          {step === 1 && (
            <form onSubmit={handlePay}>
              <div style={{ marginBottom: '24px', textAlign: 'center' }}>
                <p style={{ margin: '0 0 8px 0', color: 'var(--text-secondary)' }}>You are purchasing</p>
                <h2 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}>{plan.planName}</h2>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-teal)' }}>₹{plan.premiumAmount}</div>
                <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{plan.billingCycle} billing</p>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                <div 
                  onClick={() => setMethod('upi')}
                  style={{ flex: 1, padding: '12px', border: method === 'upi' ? '2px solid var(--accent-indigo)' : '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', textAlign: 'center', background: method === 'upi' ? 'rgba(99, 102, 241, 0.1)' : 'transparent' }}
                >
                  <Smartphone size={24} style={{ margin: '0 auto 8px auto', color: method === 'upi' ? 'var(--accent-indigo)' : 'var(--text-muted)' }} />
                  <div style={{ fontSize: '0.9rem', fontWeight: method === 'upi' ? 700 : 400 }}>UPI</div>
                </div>
                <div 
                  onClick={() => setMethod('card')}
                  style={{ flex: 1, padding: '12px', border: method === 'card' ? '2px solid var(--accent-indigo)' : '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', textAlign: 'center', background: method === 'card' ? 'rgba(99, 102, 241, 0.1)' : 'transparent' }}
                >
                  <CreditCard size={24} style={{ margin: '0 auto 8px auto', color: method === 'card' ? 'var(--accent-indigo)' : 'var(--text-muted)' }} />
                  <div style={{ fontSize: '0.9rem', fontWeight: method === 'card' ? 700 : 400 }}>Card</div>
                </div>
              </div>

              {method === 'card' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                  <input type="text" className="form-input" placeholder="Card Number (e.g. 4242 4242 ...)" required />
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <input type="text" className="form-input" placeholder="MM/YY" required style={{ flex: 1 }} />
                    <input type="text" className="form-input" placeholder="CVC" required style={{ flex: 1 }} />
                  </div>
                </div>
              )}
              {method === 'upi' && (
                <div style={{ marginBottom: '24px' }}>
                  <input type="text" className="form-input" placeholder="Enter UPI ID (e.g. user@okhdfc)" required />
                </div>
              )}

              <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', background: 'var(--accent-indigo)', borderColor: 'var(--accent-indigo)', padding: '12px' }}>
                {loading ? <Loader2 size={18} className="spin" /> : <Shield size={18} />} Pay ₹{plan.premiumAmount}
              </button>
            </form>
          )}

          {step === 2 && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Loader2 size={48} className="spin" style={{ color: 'var(--accent-indigo)', margin: '0 auto 16px auto' }} />
              <h3 style={{ margin: '0 0 8px 0' }}>Processing Payment...</h3>
              <p style={{ color: 'var(--text-muted)' }}>Please do not close this window.</p>
            </div>
          )}

          {step === 3 && (
            <div style={{ textAlign: 'center', padding: '40px 0' }} className="animate-fade-in">
              <CheckCircle2 size={64} style={{ color: 'var(--accent-emerald)', margin: '0 auto 16px auto' }} />
              <h2 style={{ margin: '0 0 8px 0', color: 'var(--accent-emerald)' }}>Payment Successful!</h2>
              <p style={{ color: 'var(--text-muted)' }}>Your GigShield smart contract is now active.</p>
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
