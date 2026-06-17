import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { workerApi } from '../api/api.js';
import {
  Zap, Mail, Lock, Eye, EyeOff, ArrowRight,
  Shield, Brain, Banknote, AlertCircle
} from 'lucide-react';

function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email) {
      setError('Please enter your email address');
      return;
    }
    if (!form.password) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await workerApi.login({ email: form.email, password: form.password });
      login(response.data);
      navigate('/dashboard');
    } catch (err) {
      // Show error message instead of reloading the page
      const msg = err?.response?.data?.message || err?.message || 'Invalid email or password. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-hero">
        {/* Animated floating shapes */}
        <div className="auth-floating-shapes" aria-hidden="true">
          <div className="auth-shape auth-shape-1"></div>
          <div className="auth-shape auth-shape-2"></div>
          <div className="auth-shape auth-shape-3"></div>
          <div className="auth-shape auth-shape-4"></div>
          <div className="auth-shape auth-shape-5"></div>
        </div>

        <div className="auth-hero-content">
          <div className="auth-hero-logo">
            <div className="auth-hero-logo-icon">
              <Zap size={28} />
            </div>
            <h1>GigShield AI</h1>
          </div>
          <p className="auth-hero-tagline">
            AI-powered parametric insurance that protects gig workers from
            environmental disruptions — automatically.
          </p>
          <div className="auth-hero-features">
            <div className="auth-hero-feature">
              <div className="auth-hero-feature-icon blue">
                <Brain size={20} />
              </div>
              <div className="auth-hero-feature-text">
                <h4>AI Risk Prediction</h4>
                <p>Real-time ML models analyze weather and activity data</p>
              </div>
            </div>
            <div className="auth-hero-feature">
              <div className="auth-hero-feature-icon emerald">
                <Banknote size={20} />
              </div>
              <div className="auth-hero-feature-text">
                <h4>Instant Payouts</h4>
                <p>Claims auto-triggered and paid within minutes</p>
              </div>
            </div>
            <div className="auth-hero-feature">
              <div className="auth-hero-feature-icon purple">
                <Shield size={20} />
              </div>
              <div className="auth-hero-feature-text">
                <h4>Parametric Coverage</h4>
                <p>No manual filing — events trigger payouts automatically</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-card">
          <div className="auth-card-header">
            <h2>Welcome back</h2>
            <p>Sign in to your GigShield account</p>
          </div>

          {error && (
            <div className="alert alert-error animate-shake" style={{ marginBottom: '16px', display: 'flex', gap: '8px', color: 'var(--error)', alignItems: 'flex-start' }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="stagger-children">
            <div className="form-group animate-fade-in-up">
              <label className="form-label" htmlFor="login-email">Email Address</label>
              <div className="form-input-wrapper" title="Enter your registered email address">
                <span className="form-input-icon"><Mail size={16} /></span>
                <input
                  id="login-email"
                  className="form-input has-icon"
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              <label className="form-label" htmlFor="login-password" style={{ display: 'flex', justifyContent: 'space-between' }}>
                Password
                <Link to="/forgot-password" style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 500 }}>
                  Forgot Password?
                </Link>
              </label>
              <div className="form-input-wrapper" title="Enter your account password">
                <span className="form-input-icon"><Lock size={16} /></span>
                <input
                  id="login-password"
                  className="form-input has-icon"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className={`btn btn-primary btn-full animate-fade-in-up ${loading ? 'btn-loading' : ''}`}
              disabled={loading}
              style={{ marginTop: '16px', animationDelay: '200ms' }}
            >
              {!loading && <>Sign In <ArrowRight size={16} /></>}
            </button>
          </form>


          <div className="auth-footer animate-fade-in-up" style={{ animationDelay: '300ms', marginTop: '24px' }}>
            Don't have an account?{' '}
            <Link to="/register">Create one</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
