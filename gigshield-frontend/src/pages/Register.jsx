import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useLocation } from '../context/LocationContext.jsx';
import { workerApi, otpApi } from '../api/api.js';
import {
  Zap, User, Mail, Lock, Phone, MapPin, Briefcase,
  Eye, EyeOff, ArrowRight, Shield, Brain, Banknote,
  AlertCircle, CheckCircle2, KeyRound, Loader2,
  Navigation, Signal
} from 'lucide-react';

function Register() {
  const { city: detectedCity, isDetecting, detectLocation, locationError, accuracy, accuracyLevel, permissionState } = useLocation();

  const [form, setForm] = useState({
    fullName: '', email: '', password: '',
    phone: '', platformName: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Password strength
  const getPasswordStrength = (password) => {
    let score = 0;
    const checks = {
      length: password.length >= 8,
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
      upper: /[A-Z]/.test(password),
    };
    if (checks.length) score++;
    if (checks.number) score++;
    if (checks.special) score++;
    if (checks.upper) score++;
    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['', '#ef4444', '#f59e0b', '#3b82f6', '#10b981'];
    return { score, label: labels[score], color: colors[score], checks };
  };
  const pwStrength = getPasswordStrength(form.password);

  // OTP States
  const [step, setStep] = useState('register'); // 'register' | 'otp'
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [registeredWorker, setRegisteredWorker] = useState(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const [fieldErrors, setFieldErrors] = useState({});

  // Auto-detect location when component mounts
  useEffect(() => {
    if (permissionState === 'prompt' || !detectedCity) {
      detectLocation();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const validateField = (name, value) => {
    let err = '';
    if (name === 'fullName' && value && value.trim().length < 2) err = 'Full name must be at least 2 characters.';
    if (name === 'email' && value && !/^[^@]+@[^@]+\.[^@]+$/.test(value)) err = 'Enter a valid email address.';
    if (name === 'password' && value && value.length < 8) err = 'Password must be at least 8 characters.';
    if (name === 'phone' && value && !/^[0-9+\-\s]{7,15}$/.test(value)) err = 'Enter a valid phone number (7-15 digits).';
    return err;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setError('');
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setFieldErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.password || !form.phone) {
      setError('Please fill in all required fields');
      return;
    }
    // Run all validation before submit
    const errors = {};
    ['fullName','email','password','phone'].forEach(f => {
      const e = validateField(f, form[f]);
      if (e) errors[f] = e;
    });
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError('Please fix the errors above before continuing.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // Register with auto-detected city
      const registrationData = {
        ...form,
        city: detectedCity || 'Mumbai',
      };
      const response = await workerApi.register(registrationData);
      setRegisteredWorker(response.data);

      // Send OTP to the email
      await otpApi.sendOtp({ email: form.email });
      setStep('otp');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }
    setOtpLoading(true);
    setError('');
    try {
      await workerApi.verifyEmail({ email: form.email, otpCode });
      login({ ...registeredWorker, emailVerified: true });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'OTP verification failed');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setOtpLoading(true);
    setError('');
    try {
      await otpApi.sendOtp({ email: form.email });
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setOtpLoading(false);
    }
  };

  const getAccuracyColor = () => {
    if (accuracyLevel === 'High') return 'var(--accent-emerald)';
    if (accuracyLevel === 'Medium') return 'var(--accent-amber)';
    return 'var(--accent-coral)';
  };

  return (
    <div className="auth-layout">
      <div className="auth-hero">
        <div className="auth-hero-content">
          <div className="auth-hero-logo">
            <div className="auth-hero-logo-icon">
              <Zap size={28} />
            </div>
            <h1>GigShield AI</h1>
          </div>
          <p className="auth-hero-tagline">
            Join thousands of gig workers who protect their income with
            AI-powered parametric insurance.
          </p>
          <div className="auth-hero-features">
            <div className="auth-hero-feature">
              <div className="auth-hero-feature-icon blue">
                <Brain size={20} />
              </div>
              <div className="auth-hero-feature-text">
                <h4>AI Risk Prediction</h4>
                <p>Scikit-learn models predict income disruption risk</p>
              </div>
            </div>
            <div className="auth-hero-feature">
              <div className="auth-hero-feature-icon emerald">
                <Banknote size={20} />
              </div>
              <div className="auth-hero-feature-text">
                <h4>Instant Payouts</h4>
                <p>Approved claims paid out automatically via UPI</p>
              </div>
            </div>
            <div className="auth-hero-feature">
              <div className="auth-hero-feature-icon purple">
                <Shield size={20} />
              </div>
              <div className="auth-hero-feature-text">
                <h4>Full Coverage</h4>
                <p>Rain, heat, and pollution — all covered</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-card">
          {step === 'register' ? (
            <>
              <div className="auth-card-header">
                <h2>Create your account</h2>
                <p>Get protected with AI-powered insurance</p>
              </div>

              {error && (
                <div className="alert alert-error animate-shake">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              {/* Location Detection Status */}
              <div className="location-detection-card animate-fade-in-up">
                <div className="location-detection-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MapPin size={16} style={{ color: 'var(--accent-emerald)' }} />
                    <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>Location Detection</span>
                  </div>
                  {!isDetecting && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={detectLocation}
                      style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                    >
                      <Navigation size={12} /> Refresh
                    </button>
                  )}
                </div>

                {isDetecting ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
                    <Loader2 size={14} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent-teal)' }} />
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Detecting your location...</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <CheckCircle2 size={14} style={{ color: 'var(--accent-emerald)' }} />
                        <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {detectedCity}
                        </span>
                        <span className="location-verified-badge">
                          <Shield size={10} /> Verified
                        </span>
                      </div>
                      {accuracy && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Signal size={12} style={{ color: getAccuracyColor() }} />
                          <span style={{ fontSize: '0.72rem', color: getAccuracyColor(), fontWeight: 600 }}>
                            {accuracyLevel}
                          </span>
                        </div>
                      )}
                    </div>
                    {locationError && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <AlertCircle size={12} /> {locationError}
                      </div>
                    )}
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                      Your city is auto-detected for insurance coverage. No manual entry needed.
                    </p>
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} className="stagger-children">
                <div className="form-group animate-fade-in-up">
                  <label className="form-label" htmlFor="reg-name">Full Name *</label>
                  <div className="form-input-wrapper" title="Enter your official full name">
                    <span className="form-input-icon"><User size={16} aria-hidden="true" /></span>
                    <input
                      id="reg-name"
                      className={`form-input has-icon${fieldErrors.fullName ? ' error' : ''}`}
                      type="text"
                      name="fullName" placeholder="e.g. Rajesh Kumar"
                      value={form.fullName} onChange={handleChange} onBlur={handleBlur}
                      aria-describedby={fieldErrors.fullName ? 'err-fullName' : undefined}
                      aria-invalid={!!fieldErrors.fullName}
                    />
                  </div>
                  {fieldErrors.fullName && <p id="err-fullName" className="form-error" role="alert"><AlertCircle size={12} aria-hidden="true" /> {fieldErrors.fullName}</p>}
                </div>

                <div className="form-group animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                  <label className="form-label" htmlFor="reg-email">Email Address *</label>
                  <div className="form-input-wrapper" title="We will send an OTP to verify your email">
                    <span className="form-input-icon"><Mail size={16} aria-hidden="true" /></span>
                    <input
                      id="reg-email"
                      className={`form-input has-icon${fieldErrors.email ? ' error' : ''}`}
                      type="email"
                      name="email" placeholder="you@example.com"
                      value={form.email} onChange={handleChange} onBlur={handleBlur}
                      aria-describedby={fieldErrors.email ? 'err-email' : undefined}
                      aria-invalid={!!fieldErrors.email}
                    />
                  </div>
                  {fieldErrors.email && <p id="err-email" className="form-error" role="alert"><AlertCircle size={12} aria-hidden="true" /> {fieldErrors.email}</p>}
                </div>

                <div className="form-row animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="reg-password">Password *</label>
                    <div className="form-input-wrapper" title="Create a strong password (min 8 chars, 1 number, 1 special)">
                      <span className="form-input-icon"><Lock size={16} /></span>
                      <input
                        id="reg-password" className="form-input has-icon"
                        type={showPassword ? 'text' : 'password'}
                        name="password" placeholder="Min 8 chars, special"
                        value={form.password} onChange={handleChange}
                      />
                      <button type="button" className="password-toggle"
                        onClick={() => setShowPassword(!showPassword)} tabIndex={-1}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}>
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {form.password && (
                      <div className="animate-fade-in" style={{ marginTop: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.1)' }}>
                            <div style={{ width: `${pwStrength.score * 25}%`, height: '100%', borderRadius: '2px', background: pwStrength.color, transition: 'all 0.3s ease' }} />
                          </div>
                          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: pwStrength.color, minWidth: '40px' }}>{pwStrength.label}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                          {[['length', '8+ chars'], ['number', '1 number'], ['special', '1 special'], ['upper', '1 uppercase']].map(([key, lbl]) => (
                            <span key={key} style={{ fontSize: '0.7rem', color: pwStrength.checks[key] ? 'var(--accent-emerald)' : 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '3px', transition: 'color 0.2s' }}>
                              {pwStrength.checks[key] ? '✓' : '○'} {lbl}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="reg-phone">Phone *</label>
                    <div className="form-input-wrapper" title="Your active mobile number for payout alerts">
                      <span className="form-input-icon"><Phone size={16} aria-hidden="true" /></span>
                      <input
                        id="reg-phone"
                        className={`form-input has-icon${fieldErrors.phone ? ' error' : ''}`}
                        type="tel"
                        name="phone" placeholder="+91 98765 43210"
                        value={form.phone} onChange={handleChange} onBlur={handleBlur}
                        aria-describedby={fieldErrors.phone ? 'err-phone' : undefined}
                        aria-invalid={!!fieldErrors.phone}
                      />
                    </div>
                    {fieldErrors.phone && <p id="err-phone" className="form-error" role="alert"><AlertCircle size={12} aria-hidden="true" /> {fieldErrors.phone}</p>}
                  </div>
                </div>

                <div className="form-group animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                  <label className="form-label" htmlFor="reg-platform">Platform (optional)</label>
                  <div className="form-input-wrapper" title="Which service do you deliver for?">
                    <span className="form-input-icon"><Briefcase size={16} /></span>
                    <input
                      id="reg-platform" className="form-input has-icon" type="text"
                      name="platformName" placeholder="e.g. Swiggy, Zomato, Uber"
                      value={form.platformName} onChange={handleChange}
                    />
                  </div>
                </div>

                <button
                  type="submit" className={`btn btn-primary btn-full animate-fade-in-up ${loading ? 'btn-loading' : ''}`}
                  disabled={loading} style={{ marginTop: '12px', animationDelay: '400ms' }}
                >
                  {!loading && <>Create Account <ArrowRight size={16} /></>}
                </button>
              </form>

              <div className="auth-footer animate-fade-in-up" style={{ animationDelay: '500ms' }}>
                Already have an account?{' '}
                <Link to="/login">Sign in</Link>
              </div>
            </>
          ) : (
            <>
              <div className="auth-card-header">
                <h2>Verify your email</h2>
                <p>Enter the 6-digit OTP sent to <strong>{form.email}</strong></p>
              </div>

              {error && (
                <div className="alert alert-error animate-shake">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              <div className="otp-section">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--space-md)' }}>
                  <KeyRound size={18} style={{ color: 'var(--accent-emerald)' }} />
                  <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>OTP Verification</span>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
                  For demo purposes, the OTP is returned in the API response and logged to the backend console.
                </p>

                <form onSubmit={handleVerifyOtp}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="otp-input">Enter OTP Code</label>
                    <div className="otp-input-group">
                      <input
                        id="otp-input"
                        className="form-input"
                        type="text"
                        maxLength={6}
                        placeholder="000000"
                        value={otpCode}
                        onChange={(e) => { setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                        style={{ fontSize: '1.2rem', fontWeight: 700, letterSpacing: '8px', textAlign: 'center' }}
                      />
                    </div>
                  </div>

                  <button
                    type="submit" className="btn btn-primary btn-full"
                    disabled={otpLoading || otpCode.length !== 6}
                  >
                    {otpLoading ? (
                      <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Verifying...</>
                    ) : (
                      <><CheckCircle2 size={16} /> Verify & Continue</>
                    )}
                  </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: 'var(--space-md)' }}>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={handleResendOtp}
                    disabled={otpLoading}
                    style={{ fontSize: '0.82rem' }}
                  >
                    Didn't receive? Resend OTP
                  </button>
                </div>
              </div>

              <div className="auth-footer" style={{ marginTop: 'var(--space-lg)' }}>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => { setStep('register'); setError(''); setOtpCode(''); }}
                >
                  ← Back to registration
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Register;
