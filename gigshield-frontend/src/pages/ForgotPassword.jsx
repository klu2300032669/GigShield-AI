import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { workerApi, otpApi } from '../api/api.js';
import {
  Zap, Mail, Lock, Eye, EyeOff, ArrowRight,
  CheckCircle, AlertCircle
} from 'lucide-react';

function ForgotPassword() {
  const [step, setStep] = useState(1); // 1 = Request OTP, 2 = Verify & Reset
  const [email, setEmail] = useState('');
  const [form, setForm] = useState({ otpCode: '', newPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    setLoading(true);
    setError('');
    
    try {
      await otpApi.sendOtp({ email });
      setSuccess('OTP sent to your email. Please check your inbox.');
      setStep(2);
    } catch (err) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!form.otpCode || !form.newPassword) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await workerApi.resetPassword({
        email: email,
        otpCode: form.otpCode,
        newPassword: form.newPassword
      });
      setSuccess('Password reset successfully! You can now log in.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  return (
    <div className="auth-layout" style={{ justifyContent: 'center' }}>
      <div className="auth-form-side" style={{ flex: 'none', width: '100%', maxWidth: '500px' }}>
        <div className="auth-card">
          <div className="auth-card-header text-center" style={{ textAlign: 'center' }}>
            <div className="auth-hero-logo" style={{ justifyContent: 'center', marginBottom: '1.5rem' }}>
              <div className="auth-hero-logo-icon">
                <Zap size={28} />
              </div>
              <h1>GigShield AI</h1>
            </div>
            <h2>Reset Password</h2>
            <p>
              {step === 1
                ? 'Enter your email to receive a secure OTP code.'
                : 'Enter the OTP code and your new password.'}
            </p>
          </div>

          {error && (
            <div className="alert alert-error">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success">
              <CheckCircle size={16} />
              {success}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleSendOtp}>
              <div className="form-group">
                <label className="form-label" htmlFor="reset-email">Email Address</label>
                <div className="form-input-wrapper">
                  <span className="form-input-icon"><Mail size={16} /></span>
                  <input
                    id="reset-email"
                    className="form-input has-icon"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    autoComplete="email"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full"
                disabled={loading}
                style={{ marginTop: '12px' }}
              >
                {loading ? 'Sending OTP...' : (
                  <>Send OTP <ArrowRight size={16} /></>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword}>
              <div className="form-group">
                <label className="form-label" htmlFor="reset-otp">6-Digit OTP Code</label>
                <div className="form-input-wrapper">
                  <span className="form-input-icon"><Lock size={16} /></span>
                  <input
                    id="reset-otp"
                    className="form-input has-icon"
                    type="text"
                    name="otpCode"
                    placeholder="e.g. 123456"
                    value={form.otpCode}
                    onChange={handleChange}
                    maxLength="6"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reset-new-password">New Password</label>
                <div className="form-input-wrapper">
                  <span className="form-input-icon"><Lock size={16} /></span>
                  <input
                    id="reset-new-password"
                    className="form-input has-icon"
                    type={showPassword ? 'text' : 'password'}
                    name="newPassword"
                    placeholder="Enter new password"
                    value={form.newPassword}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                  Min 8 characters, at least 1 number and 1 special character
                </small>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full"
                disabled={loading}
                style={{ marginTop: '12px' }}
              >
                {loading ? 'Resetting Password...' : (
                  <>Reset Password <CheckCircle size={16} /></>
                )}
              </button>

              <button
                type="button"
                className="btn btn-outline btn-full"
                onClick={() => setStep(1)}
                disabled={loading}
                style={{ marginTop: '12px', width: '100%', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                Back to Email Input
              </button>
            </form>
          )}

          <div className="auth-footer" style={{ textAlign: 'center', marginTop: '24px' }}>
            Remember your password?{' '}
            <Link to="/login">Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
