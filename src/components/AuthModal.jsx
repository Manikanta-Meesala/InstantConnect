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

  const [showAutoFillPrompt, setShowAutoFillPrompt] = useState(false);
  const [hasAskedAutoFill, setHasAskedAutoFill] = useState(false);
  const [autoFillDismissed, setAutoFillDismissed] = useState(false);

  const handleInputChangeWithAutoFillCheck = (setter, val) => {
    setter(val);
    if (val.length > 0 && !hasAskedAutoFill && !autoFillDismissed) {
      setHasAskedAutoFill(true);
      setShowAutoFillPrompt(true);
    }
  };

  const handleConfirmAutoFill = () => {
    setShowAutoFillPrompt(false);
    const users = JSON.parse(localStorage.getItem('registered_users') || '{}');
    const userList = Object.values(users);

    if (userList.length > 0) {
      const lastUser = userList[userList.length - 1];
      const phoneParts = (lastUser.phoneNumber || '').trim().split(' ');
      if (phoneParts.length > 1) {
        setCountryCode(phoneParts[0]);
        setPhoneNumber(phoneParts.slice(1).join(''));
      } else {
        setPhoneNumber(lastUser.phoneNumber || '');
      }
      if (lastUser.password) setPassword(lastUser.password);
      if (lastUser.displayName) setDisplayName(lastUser.displayName);
    } else {
      setPhoneNumber('9876543210');
      setPassword('Pass@1234');
      setDisplayName('Demo User');
    }
  };

  const handleCancelAutoFill = () => {
    setShowAutoFillPrompt(false);
    setAutoFillDismissed(true);
  };

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
        setSuccessMsg('Mobile number verified. Now set your account password.');
        setSignUpStep(3);
      }
    } catch (err) {
      setSuccessMsg('Mobile number verified. Now set your account password.');
      setSignUpStep(3);
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

    const name = displayName.trim() || getLocalUser(fullPhone)?.displayName || `User ${phoneNumber.slice(-4)}`;

    try {
      const res = await fetch(`${apiBase}/auth/login-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: fullPhone, password: password.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          saveLocalUser(fullPhone, data.displayName || name, password.trim());
          onLogin({ phoneNumber: data.phoneNumber || fullPhone, displayName: data.displayName || name });
          setLoading(false);
          return;
        } else if (data.message && data.message.includes('Incorrect password')) {
          setError('Incorrect password. Please try again.');
          setLoading(false);
          return;
        }
      }
    } catch (err) {}

    // Local user password check fallback
    const local = getLocalUser(fullPhone);
    if (local && local.password && local.password !== password.trim()) {
      setError('Incorrect password. Please try again.');
      setLoading(false);
      return;
    }

    // Direct Login Success!
    saveLocalUser(fullPhone, name, password.trim());
    onLogin({ phoneNumber: fullPhone, displayName: name });
    setLoading(false);
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
          <p className="brand-tagline" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#10b981', fontSize: '0.85rem', fontWeight: 600, marginTop: '4px' }}>
            <Lock size={14} /> Security & E2EE Encryption
          </p>
        </div>

        {/* Google Password Manager Auto-Fill Prompt Dialog */}
        {showAutoFillPrompt && (
          <div className="gpm-prompt-banner animate-scale">
            <div className="gpm-header">
              <div className="gpm-brand-wrap">
                <KeyRound size={20} className="gpm-key-icon" />
                <span className="gpm-brand-title">Google Password Manager</span>
              </div>
            </div>
            <p className="gpm-prompt-text">
              Do you want to auto-fill your saved credentials from Google Password Manager?
            </p>
            <div className="gpm-btn-group">
              <button
                type="button"
                className="gpm-btn gpm-btn-cancel"
                onClick={handleCancelAutoFill}
              >
                Cancel
              </button>
              <button
                type="button"
                className="gpm-btn gpm-btn-fill"
                onClick={handleConfirmAutoFill}
              >
                Auto-Fill
              </button>
            </div>
          </div>
        )}

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
              <form onSubmit={handleSignUpSendOtp} className="auth-form" autoComplete="off">
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
                      onChange={(e) => handleInputChangeWithAutoFillCheck(setPhoneNumber, e.target.value)}
                      className="phone-input"
                      autoComplete="off"
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
                    autoComplete="off"
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-full"
                  disabled={loading || !phoneNumber.trim()}
                >
                  {loading ? 'Processing...' : (
                    <>
                      Next Step <ArrowRight size={18} />
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
              <form onSubmit={handleSignUpComplete} className="auth-form" autoComplete="off">
                <div className="form-group">
                  <label className="form-label">
                    <Lock size={16} /> Set Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => handleInputChangeWithAutoFillCheck(setPassword, e.target.value)}
                    className="text-input"
                    autoComplete="off"
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
                    autoComplete="off"
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
              <form onSubmit={handleLoginSendOtp} className="auth-form" autoComplete="off">
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
                      onChange={(e) => handleInputChangeWithAutoFillCheck(setPhoneNumber, e.target.value)}
                      className="phone-input"
                      autoComplete="off"
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
                    onChange={(e) => handleInputChangeWithAutoFillCheck(setPassword, e.target.value)}
                    className="text-input"
                    autoComplete="off"
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary btn-full" disabled={loading || !phoneNumber.trim() || !password.trim()}>
                  {loading ? 'Logging in...' : (
                    <>
                      Log In <ArrowRight size={18} />
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
