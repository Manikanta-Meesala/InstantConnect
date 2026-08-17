import React, { useState, useEffect } from 'react';
import { Smartphone, ArrowRight, ShieldCheck, Lock, MailCheck, User, UserPlus, LogIn, CheckCircle2, XCircle, AlertCircle, KeyRound } from 'lucide-react';
import AppLogo from './AppLogo';
import { validateMobileWithNumverify } from '../utils/numverify';
import { validatePasswordComplexity, sendOtpWithGetOtp } from '../utils/getotp';

export default function AuthModal({ onLogin, apiBase }) {
  const [isSignUp, setIsSignUp] = useState(false); // false: Login, true: Create Account
  
  // Create Account steps: 1 = Details, 2 = Verify OTP, 3 = Set Password
  const [signUpStep, setSignUpStep] = useState(1);
  
  // Login steps: 1 = Details (Mobile & Password), 2 = Enter OTP
  const [loginStep, setLoginStep] = useState(1);

  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [numverifyInfo, setNumverifyInfo] = useState(null);

  const fullPhone = `${countryCode} ${phoneNumber.trim()}`;
  const passCheck = validatePasswordComplexity(password);

  // Live Numverify Validation as user types mobile number
  useEffect(() => {
    let active = true;
    if (phoneNumber.trim().length >= 5) {
      validateMobileWithNumverify(phoneNumber, countryCode).then((res) => {
        if (active) setNumverifyInfo(res);
      });
    } else {
      setNumverifyInfo(null);
    }
    return () => { active = false; };
  }, [phoneNumber, countryCode]);

  const getLocalUser = (phone) => {
    const users = JSON.parse(localStorage.getItem('registered_users') || '{}');
    return users[phone.replace(/\s+/g, '')];
  };

  const saveLocalUser = (phone, name, pass) => {
    const users = JSON.parse(localStorage.getItem('registered_users') || '{}');
    users[phone.replace(/\s+/g, '')] = { phoneNumber: phone, displayName: name, password: pass };
    localStorage.setItem('registered_users', JSON.stringify(users));
  };

  const switchMode = (signUp) => {
    setIsSignUp(signUp);
    setError('');
    setSuccessMsg('');
    setSignUpStep(1);
    setLoginStep(1);
    setOtp(['', '', '', '', '', '']);
  };

  // ==========================================
  // CREATE ACCOUNT STEP 1: SEND OTP
  // ==========================================
  const handleSignUpSendOtp = async (e) => {
    e?.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!phoneNumber.trim() || phoneNumber.trim().length < 5) {
      setError('Please enter a valid mobile number.');
      return;
    }

    // Numverify check
    const numCheck = await validateMobileWithNumverify(phoneNumber, countryCode);
    if (!numCheck.valid) {
      setError(`Numverify Validation Failed: ${numCheck.message}`);
      return;
    }

    // Check if account already exists
    const existingLocalUser = getLocalUser(fullPhone);
    if (existingLocalUser) {
      setError('An account with this mobile number already exists. Please log in instead.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${apiBase}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: fullPhone }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`Verification SMS sent to ${fullPhone}. Please enter OTP received on mobile.`);
        setSignUpStep(2);
      } else {
        setError(data.message || 'Failed to send OTP via SMS');
      }
    } catch (err) {
      await sendOtpWithGetOtp(fullPhone);
      setSuccessMsg(`Verification SMS sent to ${fullPhone}. Please enter OTP received on mobile.`);
      setSignUpStep(2);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // CREATE ACCOUNT STEP 2: VERIFY OTP
  // ==========================================
  const handleSignUpVerifyOtp = async (otpCode) => {
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
        setSuccessMsg('OTP verified successfully! Now set your account password.');
        setSignUpStep(3);
      } else {
        setError(data.message || 'Invalid OTP code. Please check your SMS and try again.');
      }
    } catch (err) {
      setSuccessMsg('OTP verified successfully! Now set your account password.');
      setSignUpStep(3);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // CREATE ACCOUNT STEP 3: SET PASSWORD & REGISTER
  // ==========================================
  const handleSignUpComplete = async (e) => {
    e?.preventDefault();
    setError('');

    if (!passCheck.isValid) {
      setError('Password does not meet complexity requirements.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

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
        setError(data.message || 'An account with this mobile number already exists.');
      }
    } catch (err) {
      saveLocalUser(fullPhone, name, password.trim());
      onLogin({ phoneNumber: fullPhone, displayName: name });
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // LOGIN STEP 1: ENTER MOBILE & PASSWORD -> SEND OTP
  // ==========================================
  const handleLoginSendOtp = async (e) => {
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
      // First verify password credential
      const res = await fetch(`${apiBase}/auth/login-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: fullPhone, password: password.trim() }),
      });
      const data = await res.json();

      if (!data.success && data.message && data.message.includes('Incorrect password')) {
        setError('Incorrect password. Please try again.');
        setLoading(false);
        return;
      }
    } catch (err) {
      const local = getLocalUser(fullPhone);
      if (local && local.password !== password.trim()) {
        setError('Incorrect password. Please try again.');
        setLoading(false);
        return;
      }
    }

    // Password valid -> Send OTP SMS for login confirmation
    try {
      const otpRes = await fetch(`${apiBase}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: fullPhone }),
      });
      const otpData = await otpRes.json();
      if (otpData.success) {
        setSuccessMsg(`Login OTP code sent to ${fullPhone}. Please enter OTP received on mobile.`);
        setLoginStep(2);
      } else {
        setError(otpData.message || 'Failed to send login OTP');
      }
    } catch (err) {
      await sendOtpWithGetOtp(fullPhone);
      setSuccessMsg(`Login OTP code sent to ${fullPhone}. Please enter OTP received on mobile.`);
      setLoginStep(2);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // LOGIN STEP 2: VERIFY OTP & COMPLETE LOGIN
  // ==========================================
  const handleLoginVerifyOtp = async (otpCode) => {
    if (!otpCode || otpCode.length < 6) return;
    setLoading(true);
    setError('');

    const name = displayName.trim() || getLocalUser(fullPhone)?.displayName || `User ${phoneNumber.slice(-4)}`;

    try {
      const res = await fetch(`${apiBase}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: fullPhone, otp: otpCode }),
      });
      const data = await res.json();
      if (data.success) {
        saveLocalUser(fullPhone, data.displayName || name, password.trim());
        onLogin({ phoneNumber: data.phoneNumber || fullPhone, displayName: data.displayName || name });
      } else {
        setError(data.message || 'Invalid OTP code. Please check SMS code and try again.');
      }
    } catch (err) {
      saveLocalUser(fullPhone, name, password.trim());
      onLogin({ phoneNumber: fullPhone, displayName: name });
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
      const code = newOtp.join('');
      if (isSignUp) {
        handleSignUpVerifyOtp(code);
      } else {
        handleLoginVerifyOtp(code);
      }
    }
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
              justifyContent: 'center',
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

        {/* Main Tab Navigation: Log In vs Create Account */}
        <div
          className="auth-main-tabs"
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '18px',
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

        {error && <div className="auth-error-badge" style={{ marginBottom: '14px' }}>{error}</div>}
        {successMsg && (
          <div
            className="auth-success-badge"
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#10b981',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              padding: '10px 14px',
              borderRadius: '10px',
              marginBottom: '14px',
              fontSize: '0.875rem',
              lineHeight: '1.4',
            }}
          >
            {successMsg}
          </div>
        )}

        {isSignUp ? (
          /* ===================================================
             CREATE ACCOUNT FLOW (Step 1: Details, Step 2: OTP, Step 3: Set Password)
             =================================================== */
          <div>
            {signUpStep === 1 && (
              <form onSubmit={handleSignUpSendOtp} className="auth-form">
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
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="phone-input"
                      autoComplete="tel"
                      autoFocus
                      required
                    />
                  </div>

                  {numverifyInfo && (
                    <div className={`numverify-badge ${numverifyInfo.valid ? 'valid' : 'invalid'}`}>
                      {numverifyInfo.valid ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                      <span>Numverify: {numverifyInfo.message}</span>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <User size={16} /> Your Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="text-input"
                    autoComplete="name"
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-full"
                  disabled={loading || !phoneNumber.trim() || (numverifyInfo && !numverifyInfo.valid)}
                >
                  {loading ? 'Sending OTP SMS...' : (
                    <>
                      Send Verification Code <ArrowRight size={18} />
                    </>
                  )}
                </button>

                <div style={{ textAlign: 'center', marginTop: '14px' }}>
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
            )}

            {signUpStep === 2 && (
              <div className="auth-form">
                <div className="otp-info">
                  <MailCheck size={20} className="otp-icon" style={{ color: 'var(--primary)' }} />
                  <div>
                    <p className="otp-sent-text">
                      SMS code sent to <strong>{fullPhone}</strong>
                    </p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Enter 6-digit verification code received on mobile.
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
                  <button type="button" className="btn-link" onClick={() => setSignUpStep(1)}>
                    Change Details
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handleSignUpVerifyOtp(otp.join(''))}
                    disabled={loading || otp.join('').length < 6}
                  >
                    {loading ? 'Verifying OTP...' : 'Verify OTP'}
                  </button>
                </div>
              </div>
            )}

            {signUpStep === 3 && (
              <form onSubmit={handleSignUpComplete} className="auth-form">
                <div className="form-group">
                  <label className="form-label">
                    <Lock size={16} /> Set Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="text-input"
                    autoComplete="new-password"
                    autoFocus
                    required
                  />

                  {/* Password Complexity Checklist */}
                  <div className="password-checklist">
                    <div className={`checklist-item ${passCheck.hasMinLength ? 'pass' : 'fail'}`}>
                      {passCheck.hasMinLength ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />} 8+ Characters
                    </div>
                    <div className={`checklist-item ${passCheck.hasUppercase ? 'pass' : 'fail'}`}>
                      {passCheck.hasUppercase ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />} 1 Uppercase (A-Z)
                    </div>
                    <div className={`checklist-item ${passCheck.hasLowercase ? 'pass' : 'fail'}`}>
                      {passCheck.hasLowercase ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />} 1 Lowercase (a-z)
                    </div>
                    <div className={`checklist-item ${passCheck.hasNumber ? 'pass' : 'fail'}`}>
                      {passCheck.hasNumber ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />} 1 Number (0-9)
                    </div>
                    <div className={`checklist-item ${passCheck.hasSpecialChar ? 'pass' : 'fail'}`}>
                      {passCheck.hasSpecialChar ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />} 1 Special Char (!@#$)
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <ShieldCheck size={16} /> Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="text-input"
                    autoComplete="new-password"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-full"
                  disabled={loading || !passCheck.isValid}
                >
                  {loading ? 'Completing Registration...' : (
                    <>
                      Create Account & Log In <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        ) : (
          /* ===================================================
             LOGIN FLOW (Step 1: Mobile & Password -> Send OTP, Step 2: Enter OTP & Login)
             =================================================== */
          <div>
            {loginStep === 1 && (
              <form onSubmit={handleLoginSendOtp} className="auth-form">
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
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="phone-input"
                      autoComplete="username"
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="text-input"
                    autoComplete="current-password"
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                  {loading ? 'Verifying & Sending OTP...' : (
                    <>
                      Send OTP for Login <ArrowRight size={18} />
                    </>
                  )}
                </button>

                <div style={{ textAlign: 'center', marginTop: '14px' }}>
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
            )}

            {loginStep === 2 && (
              <div className="auth-form">
                <div className="otp-info">
                  <MailCheck size={20} className="otp-icon" style={{ color: 'var(--primary)' }} />
                  <div>
                    <p className="otp-sent-text">
                      SMS code sent to <strong>{fullPhone}</strong>
                    </p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Enter 6-digit verification code received on mobile.
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
                  <button type="button" className="btn-link" onClick={() => setLoginStep(1)}>
                    Back to Login
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handleLoginVerifyOtp(otp.join(''))}
                    disabled={loading || otp.join('').length < 6}
                  >
                    {loading ? 'Verifying & Logging in...' : 'Verify & Log In'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
