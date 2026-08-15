import React, { useState } from 'react';
import { Smartphone, KeyRound, ArrowRight, ShieldCheck, Lock, MailCheck } from 'lucide-react';
import AppLogo from './AppLogo';

export default function AuthModal({ onLogin, apiBase }) {
  const [authMethod, setAuthMethod] = useState('otp'); // 'otp' | 'password'
  const [step, setStep] = useState(1); // 1: Phone, 2: OTP Verification
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fullPhone = `${countryCode} ${phoneNumber.trim()}`;

  const handleSendOtp = async (e) => {
    e?.preventDefault();
    if (!phoneNumber.trim() || phoneNumber.trim().length < 5) {
      setError('Please enter a valid phone number');
      return;
    }
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await fetch(`${apiBase}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: fullPhone }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(data.message || `Verification code sent to ${fullPhone} via SMS.`);
        setStep(2);
      } else {
        setError(data.message || 'Failed to send OTP');
      }
    } catch (err) {
      setError('Connection error. Please check network/backend status.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (otpCode) => {
    if (!otpCode || otpCode.length < 6) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${apiBase}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: fullPhone, otp: otpCode }),
      });
      const data = await res.json();
      if (data.success) {
        onLogin({ phoneNumber: data.phoneNumber, displayName: data.displayName });
      } else {
        setError(data.message || 'Invalid OTP code. Please enter the code sent to your SMS.');
      }
    } catch (err) {
      setError('Failed to connect to authentication server.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e) => {
    e?.preventDefault();
    if (!phoneNumber.trim() || phoneNumber.trim().length < 5) {
      setError('Please enter a valid phone number');
      return;
    }
    if (!password || password.trim().length < 3) {
      setError('Please enter your password');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${apiBase}/auth/login-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: fullPhone, password: password.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        onLogin({ phoneNumber: data.phoneNumber, displayName: data.displayName });
      } else {
        setError(data.message || 'Incorrect mobile number or password');
      }
    } catch (err) {
      setError('Connection error. Could not authenticate.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }

    if (newOtp.every(digit => digit !== '')) {
      handleVerifyOtp(newOtp.join(''));
    }
  };

  return (
    <div className="auth-overlay">
      <div className="auth-card glass-panel animate-scale">
        <div className="auth-brand">
          <div className="brand-logo" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #6366f1, #3b82f6)', padding: '12px', borderRadius: '16px', color: '#fff', marginBottom: '12px', boxShadow: '0 8px 24px rgba(99, 102, 241, 0.35)' }}>
            <AppLogo size={42} color="#ffffff" />
          </div>
          <h2>InstantConnect</h2>
          <p className="brand-tagline">Connect.Chat.Clear</p>
        </div>

        {/* Authentication Mode Tabs */}
        <div className="auth-mode-tabs" style={{ display: 'flex', gap: '8px', marginBottom: '16px', background: 'rgba(255, 255, 255, 0.05)', padding: '4px', borderRadius: '12px' }}>
          <button
            type="button"
            className={`tab-btn ${authMethod === 'otp' ? 'active' : ''}`}
            style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: authMethod === 'otp' ? 'var(--primary)' : 'transparent', color: authMethod === 'otp' ? '#fff' : 'var(--text-muted)', fontWeight: 600, cursor: 'pointer' }}
            onClick={() => { setAuthMethod('otp'); setStep(1); setError(''); }}
          >
            <Smartphone size={15} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> SMS OTP
          </button>
          <button
            type="button"
            className={`tab-btn ${authMethod === 'password' ? 'active' : ''}`}
            style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: authMethod === 'password' ? 'var(--primary)' : 'transparent', color: authMethod === 'password' ? '#fff' : 'var(--text-muted)', fontWeight: 600, cursor: 'pointer' }}
            onClick={() => { setAuthMethod('password'); setError(''); }}
          >
            <Lock size={15} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> Password
          </button>
        </div>

        {error && <div className="auth-error-badge">{error}</div>}
        {successMsg && <div className="auth-success-badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '8px 12px', borderRadius: '8px', marginBottom: '12px', fontSize: '0.875rem' }}>{successMsg}</div>}

        {authMethod === 'otp' ? (
          step === 1 ? (
            <form onSubmit={handleSendOtp} className="auth-form">
              <div className="form-group">
                <label className="form-label">
                  <Smartphone size={16} /> Enter Mobile Number
                </label>
                <div className="phone-input-row">
                  <select 
                    value={countryCode} 
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="country-select"
                  >
                    <option value="+91">🇮🇳 +91</option>
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+44">🇬🇧 +44</option>
                    <option value="+971">🇦🇪 +971</option>
                  </select>
                  <input
                    type="tel"
                    placeholder="e.g. 98765 43210"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="phone-input"
                    autoFocus
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? 'Sending SMS OTP...' : <>Send SMS Verification Code <ArrowRight size={18} /></>}
              </button>
            </form>
          ) : (
            <div className="auth-form">
              <div className="otp-info">
                <MailCheck size={20} className="otp-icon" style={{ color: 'var(--primary)' }} />
                <div>
                  <p className="otp-sent-text">SMS code sent to <strong>{fullPhone}</strong></p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Check your mobile SMS messages and enter the 6-digit code below.
                  </p>
                </div>
              </div>

              <div className="otp-inputs" style={{ marginTop: '16px', marginBottom: '16px' }}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-input-${idx}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    className="otp-field"
                    autoFocus={idx === 0}
                  />
                ))}
              </div>

              <div className="auth-actions-row">
                <button type="button" className="btn-link" onClick={() => setStep(1)}>
                  Change Number
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={() => handleVerifyOtp(otp.join(''))}
                  disabled={loading || otp.join('').length < 6}
                >
                  {loading ? 'Verifying OTP...' : 'Verify & Login'}
                </button>
              </div>
            </div>
          )
        ) : (
          <form onSubmit={handlePasswordLogin} className="auth-form">
            <div className="form-group">
              <label className="form-label">
                <Smartphone size={16} /> Mobile Number
              </label>
              <div className="phone-input-row">
                <select 
                  value={countryCode} 
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="country-select"
                >
                  <option value="+91">🇮🇳 +91</option>
                  <option value="+1">🇺🇸 +1</option>
                  <option value="+44">🇬🇧 +44</option>
                  <option value="+971">🇦🇪 +971</option>
                </select>
                <input
                  type="tel"
                  placeholder="e.g. 98765 43210"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="phone-input"
                  autoFocus
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                <Lock size={16} /> Account Password
              </label>
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-input"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Authenticating...' : <>Login with Password <ArrowRight size={18} /></>}
            </button>
          </form>
        )}

        <div className="auth-footer-privacy" style={{ marginTop: '16px' }}>
          <ShieldCheck size={14} /> Direct P2P Instant Messaging. Accounts & chats stored per mobile number.
        </div>
      </div>
    </div>
  );
}

