import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Shield, Zap, CloudLightning, ArrowRight, BrainCircuit, Activity } from 'lucide-react';
import '../index.css';

function Landing() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="landing-page" style={{ minHeight: '100vh', background: '#020617', color: '#f8fafc', overflowX: 'hidden' }}>
      
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 5%', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'linear-gradient(135deg, var(--accent-indigo), var(--accent-purple))', padding: '10px', borderRadius: '12px' }}>
            <Shield size={24} style={{ color: '#fff' }} />
          </div>
          <span style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.5px' }}>
            GigShield<span style={{ color: 'var(--accent-purple)' }}>.AI</span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <Link to="/login" className="btn btn-ghost" style={{ color: '#cbd5e1' }}>Sign In</Link>
          <Link to="/register" className="btn btn-primary" style={{ background: 'var(--accent-purple)', borderColor: 'var(--accent-purple)' }}>Get Protected</Link>
        </div>
      </nav>

      <header style={{ padding: '100px 5% 80px', textAlign: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '20%', left: '15%', width: '300px', height: '300px', background: 'var(--accent-indigo)', filter: 'blur(120px)', opacity: 0.15, zIndex: 0 }} />
        <div style={{ position: 'absolute', top: '40%', right: '15%', width: '400px', height: '400px', background: 'var(--accent-teal)', filter: 'blur(150px)', opacity: 0.1, zIndex: 0 }} />
        
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '800px', margin: '0 auto' }}>
          <div className="badge" style={{ background: 'rgba(139, 92, 246, 0.1)', color: 'var(--accent-purple)', border: '1px solid rgba(139, 92, 246, 0.2)', marginBottom: '24px', padding: '8px 16px', fontSize: '0.9rem' }}>
            <BrainCircuit size={14} style={{ display: 'inline', marginRight: '6px' }} /> Powered by Advanced Machine Learning
          </div>
          <h1 style={{ fontSize: '4rem', fontWeight: 800, lineHeight: 1.1, marginBottom: '24px', letterSpacing: '-1.5px' }}>
            Parametric Insurance for the <span className="gradient-text">Gig Economy.</span>
          </h1>
          <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginBottom: '40px', lineHeight: 1.6, maxWidth: '600px', margin: '0 auto 40px' }}>
            Instant, automated payouts for Swiggy, Zomato, and Zepto workers when severe weather strikes. No paperwork, no waiting—just autonomous protection.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-primary" style={{ padding: '16px 32px', fontSize: '1.1rem', borderRadius: '30px' }}>
              Launch App <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </header>

      <section style={{ padding: '80px 5%', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '16px' }}>How it Works</h2>
            <p style={{ color: 'var(--text-muted)' }}>The world's first AI-driven parametric insurance protocol.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
            <div className="glass-card" style={{ padding: '32px', background: '#0f172a' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(56, 189, 248, 0.1)', color: 'var(--accent-sky)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                <CloudLightning size={28} />
              </div>
              <h3 style={{ fontSize: '1.3rem', marginBottom: '12px' }}>Live Oracle Tracking</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>Our nodes constantly monitor Open-Meteo APIs. If rainfall exceeds 30mm or heat crosses 42°C in your zone, the system alerts immediately.</p>
            </div>

            <div className="glass-card" style={{ padding: '32px', background: '#0f172a' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                <Zap size={28} />
              </div>
              <h3 style={{ fontSize: '1.3rem', marginBottom: '12px' }}>Zero-Touch Claims</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>Forget manual paperwork. Our Smart Contracts automatically verify the weather data and execute payouts instantly to your wallet.</p>
            </div>

            <div className="glass-card" style={{ padding: '32px', background: '#0f172a' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(244, 63, 94, 0.1)', color: 'var(--accent-rose)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                <Activity size={28} />
              </div>
              <h3 style={{ fontSize: '1.3rem', marginBottom: '12px' }}>AI Fraud Prevention</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>Powered by XGBoost and Isolation Forests, our AI underwrites every policy and filters out fraudulent claims autonomously.</p>
            </div>
          </div>
        </div>
      </section>

      <footer style={{ padding: '40px 5%', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
          <Shield size={20} />
          <span style={{ fontWeight: 600, color: '#fff' }}>GigShield AI</span>
        </div>
        <p>© 2026 GigShield Project. Built for the Gig Economy.</p>
      </footer>
    </div>
  );
}

export default Landing;
