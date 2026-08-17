import React, { useState } from 'react';
import { Smartphone, KeyRound, ArrowRight, ShieldCheck, Lock, MailCheck, User, UserPlus, LogIn } from 'lucide-react';
import AppLogo from './AppLogo';

export default function AuthModal({ onLogin, apiBase }) {
  const [isSignUp, setIsSignUp] = useState(false); // false: Login, true: Create Account
  const [authMethod, setAuthMethod] = useState('password'); // 'password' | 'otp'
  const [step, setStep] = useState(1); // 1: Input details, 2: OTP Verification
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fullPhone = `${countryCode} ${phoneNumber.trim()}`;

  // Local user helper for offline / demo mode
  const getLocalUser = (phone) => {
    const users = JSON.parse(localStorage.getItem('registered_users') || '{}');
    return users[phone];
  };

  const saveLocalUser = (phone, name, pass) => {
    const users = JSON.parse(localStorage.getItem('registered_users') || '{}');
    users[phone] = { phoneNumber: phone, displayName: name, password: pass };
    localStorage.setItem('registered_users', JSON.stringify(users));
  };

  const handleRegister = async (e) => {
    e?.preventDefault();
    if (!phoneNumber.trim() || phoneNumber.trim().length < 5) {
      setError('Please enter a valid mobile number');
      return;
    }
    if (!password || password.trim().length < 3) {
      setError('Password must be at least 3 characters long');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setError('');
    setSuccessMsg('');
    setLoading(true);

    const name = displayName.trim() || `User ${phoneNumber.slice(-4)}`;

    try {
      const res = await fetch(`${apiBase}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: fullPhone,
          displayName: name,
          password: password.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        saveLocalUser(fullPhone, data.displayName || name, password.trim());
        onLogin({ phoneNumber: data.phoneNumber || fullPhone, displayName: data.displayName || name });
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      // Fallback for offline mode
      saveLocalUser(fullPhone, name, password.trim());
      onLogin({ phoneNumber: fullPhone, displayName: name });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e) => {
    e?.preventDefault();
    if (!phoneNumber.trim() || phoneNumber.trim().length < 5) {
      setError('Please enter a valid mobile number');
      return;
    }
    if (!password || password.trim().length < 1) {
      setError('Please enter your password');
      return;
    }
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await fetch(`${apiBase}/auth/login-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: fullPhone, password: password.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        saveLocalUser(fullPhone, data.displayName, password.trim());
        onLogin({ phoneNumber: data.phoneNumber, displayName: data.displayName });
      } else {
        setError(data.message || 'Incorrect mobile number or password');
      }
    } catch (err) {
      // Offline local check fallback
      const local = getLocalUser(fullPhone);
      if (local && local.password === password.trim()) {
        onLogin({ phoneNumber: local.phoneNumber, displayName: local.displayName });
      } else if (local && local.password !== password.trim()) {
        setError('Incorrect password. Please try again.');
      } else {
        // Auto-login fallback if backend offline
        onLogin({ phoneNumber: fullPhone, displayName: `User ${phoneNumber.slice(-4)}` });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e) => {
    e?.preventDefault();
    if (!phoneNumber.trim() || phoneNumber.trim().length < 5) {
      setError('Please enter a valid mobile number');
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
      // Fallback demo OTP message when offline / deployed without backend reachable
      setSuccessMsg(`[Demo Mode] Verification code for ${fullPhone} is 123456`);
      setStep(2);
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
        setError(data.message || 'Invalid OTP code. Please check SMS code and try again.');
      }
    } catch (err) {
      // Demo fallback if 123456 or any code entered
      if (otpCode === '123456' || otpCode.length === 6) {
        onLogin({ phoneNumber: fullPhone, displayName: `User ${phoneNumber.slice(-4)}` });
      } else {
        setError('Failed to connect to authentication server.');
      }
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

  const switchMode = (signUp) => {
    setIsSignUp(signUp);
    setError('');
    setSuccessMsg('');
    setStep(1);
  };

  return (
    <div className="auth-overlay">
      <div className="auth-card glass-panel animate-scale">
        <div className="auth-brand">
          <div
            className="brand-logo"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justify: 'center',
              background: 'linear-gradient(135deg, #6366f1, #3b82f6)',
              padding: '12px',
              borderRadius: '16px',
              color: '#fff',
              marginBottom: '12px',
              boxShadow: '0 8px 24px rgba(99, 102, 241, 0.35)',
            }}
          >
            <AppLogo size={42} color="#ffffff" />
          </div>
          <h2>InstantConnect</h2>
          <p className="brand-tagline">Connect.Chat.Clear</p>
        </div>

        {/* Navigation Mode Header: Sign Up vs Login */}
        <div
          className="auth-main-tabs"
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '16px',
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '4px',
            borderRadius: '12px',
          }}
        >
          <button
            type="button"
            className={`tab-btn ${!isSignUp ? 'active' : ''}`}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '8px',
              border: 'none',
              background: !isSignUp ? 'var(--primary)' : 'transparent',
              color: !isSignUp ? '#fff' : 'var(--text-muted)',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
            onClick={() => switchMode(false)}
          >
            <LogIn size={16} /> Log In
          </button>
          <button
            type="button"
            className={`tab-btn ${isSignUp ? 'active' : ''}`}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '8px',
              border: 'none',
              background: isSignUp ? 'var(--primary)' : 'transparent',
              color: isSignUp ? '#fff' : 'var(--text-muted)',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
            onClick={() => switchMode(true)}
          >
            <UserPlus size={16} /> Create Account
          </button>
        </div>

        {error && <div className="auth-error-badge">{error}</div>}
        {successMsg && (
          <div
            className="auth-success-badge"
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#10b981',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              padding: '10px 14px',
              borderRadius: '8px',
              marginBottom: '12px',
              fontSize: '0.875rem',
              lineHeight: '1.4',
            }}
          >
            {successMsg}
          </div>
        )}

        {isSignUp ? (
          /* CREATE ACCOUNT / SIGN UP FORM */
          <form onSubmit={handleRegister} className="auth-form">
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
                <User size={16} /> Your Name (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Manikanta"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="text-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <Lock size={16} /> Set Password
              </label>
              <input
                type="password"
                placeholder="Create account password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <ShieldCheck size={16} /> Confirm Password
              </label>
              <input
                type="password"
                placeholder="Confirm account password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="text-input"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Creating Account...' : (
                <>
                  Create Account & Log In <ArrowRight size={18} />
                </>
              )}
            </button>

            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <button
                type="button"
                className="btn-link"
                style={{ fontSize: '0.85rem' }}
                onClick={() => switchMode(false)}
              >
                Already have an account? <strong>Log In</strong>
              </button>
            </div>
          </form>
        ) : (
          /* LOGIN FORM (Password or SMS OTP) */
          <div>
            {/* Sub-tabs for Login method */}
            <div
              style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '16px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                paddingBottom: '8px',
              }}
            >
              <button
                type="button"
                style={{
                  flex: 1,
                  padding: '6px 12px',
                  background: authMethod === 'password' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                  border: authMethod === 'password' ? '1px solid var(--primary)' : '1px solid transparent',
                  borderRadius: '6px',
                  color: authMethod === 'password' ? '#fff' : 'var(--text-muted)',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
                onClick={() => {
                  setAuthMethod('password');
                  setStep(1);
                  setError('');
                }}
              >
                <Lock size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Password Login
              </button>
              <button
                type="button"
                style={{
                  flex: 1,
                  padding: '6px 12px',
                  background: authMethod === 'otp' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                  border: authMethod === 'otp' ? '1px solid var(--primary)' : '1px solid transparent',
                  borderRadius: '6px',
                  color: authMethod === 'otp' ? '#fff' : 'var(--text-muted)',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
                onClick={() => {
                  setAuthMethod('otp');
                  setStep(1);
                  setError('');
                }}
              >
                <Smartphone size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> SMS OTP
              </button>
            </div>

            {authMethod === 'password' ? (
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
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="text-input"
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                  {loading ? 'Authenticating...' : (
                    <>
                      Login with Password <ArrowRight size={18} />
                    </>
                  )}
                </button>

                <div style={{ textAlign: 'center', marginTop: '12px' }}>
                  <button
                    type="button"
                    className="btn-link"
                    style={{ fontSize: '0.85rem' }}
                    onClick={() => switchMode(true)}
                  >
                    Don't have an account? <strong>Sign Up</strong>
                  </button>
                </div>
              </form>
            ) : step === 1 ? (
              <form onSubmit={handleSendOtp} className="auth-form">
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

                <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                  {loading ? 'Sending SMS OTP...' : (
                    <>
                      Send SMS Verification Code <ArrowRight size={18} />
                    </>
                  )}
                </button>

                <div style={{ textAlign: 'center', marginTop: '12px' }}>
                  <button
                    type="button"
                    className="btn-link"
                    style={{ fontSize: '0.85rem' }}
                    onClick={() => switchMode(true)}
                  >
                    Don't have an account? <strong>Sign Up</strong>
                  </button>
                </div>
              </form>
            ) : (
              <div className="auth-form">
                <div className="otp-info">
                  <MailCheck size={20} className="otp-icon" style={{ color: 'var(--primary)' }} />
                  <div>
                    <p className="otp-sent-text">
                      SMS code sent to <strong>{fullPhone}</strong>
                    </p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Check your SMS or use the demo OTP shown above.
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
            )}
          </div>
        )}

        <div className="auth-footer-privacy" style={{ marginTop: '16px' }}>
          <ShieldCheck size={14} /> Direct P2P Instant Messaging. Accounts & chats stored per mobile number.
        </div>
      </div>
    </div>
  );
}
