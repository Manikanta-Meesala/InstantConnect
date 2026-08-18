import React, { useState } from 'react';
import { User, Camera, Trash2, Volume2, VolumeX, Moon, Sun, Lock, KeyRound, QrCode, X, Check, ShieldCheck, Smartphone, AlertCircle } from 'lucide-react';
import { generateQRCodeSVG } from '../utils/qrcode';
import { validatePasswordComplexity } from '../utils/getotp';

export default function UserProfileModal({ currentUser, onClose, onUpdateProfile, theme, toggleTheme }) {
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'notifications' | 'theme' | 'security' | 'qrcode'
  
  // Profile Form state
  const [displayName, setDisplayName] = useState(currentUser.displayName || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl || '');
  
  // Sound Notification state
  const [soundEnabled, setSoundEnabled] = useState(currentUser.soundEnabled ?? true);
  
  // Password Change state
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');
  
  // General Profile Feedback
  const [profileSuccess, setProfileSuccess] = useState('');

  const passCheck = validatePasswordComplexity(newPass);

  // File Upload Handler (Image -> Data URL)
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAvatarUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setAvatarUrl('');
  };

  const handleSaveProfile = (e) => {
    e?.preventDefault();
    onUpdateProfile({
      ...currentUser,
      displayName: displayName.trim() || currentUser.displayName,
      avatarUrl: avatarUrl,
      soundEnabled: soundEnabled
    });
    setProfileSuccess('Profile details updated successfully!');
    setTimeout(() => setProfileSuccess(''), 3000);
  };

  const handleToggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    onUpdateProfile({
      ...currentUser,
      soundEnabled: nextVal
    });

    if (nextVal) {
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5 chime
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
      } catch (ignored) {}
    }
  };

  const handleChangePasswordSubmit = (e) => {
    e?.preventDefault();
    setPassError('');
    setPassSuccess('');

    // Check stored user password or registered users
    const users = JSON.parse(localStorage.getItem('registered_users') || '{}');
    const cleanPhone = currentUser.phoneNumber.replace(/\s+/g, '');
    const userRecord = users[cleanPhone] || currentUser;

    if (userRecord.password && userRecord.password !== currentPass.trim()) {
      setPassError('Current password is incorrect.');
      return;
    }

    if (!passCheck.isValid) {
      setPassError('New password does not meet security complexity requirements.');
      return;
    }

    if (newPass !== confirmPass) {
      setPassError('New passwords do not match. Please re-enter.');
      return;
    }

    // Update password in local storage & user record
    users[cleanPhone] = {
      ...userRecord,
      password: newPass.trim()
    };
    localStorage.setItem('registered_users', JSON.stringify(users));

    onUpdateProfile({
      ...currentUser,
      password: newPass.trim()
    });

    setCurrentPass('');
    setNewPass('');
    setConfirmPass('');
    setPassSuccess('Account password updated successfully!');
    setTimeout(() => setPassSuccess(''), 4000);
  };

  // QR Code URL & SVG string
  const qrConnectUrl = `${window.location.origin}${window.location.pathname}#connect?phone=${encodeURIComponent(currentUser.phoneNumber)}`;
  const qrSvgMarkup = generateQRCodeSVG(qrConnectUrl, { size: 220, color: '#4f46e5' });

  return (
    <div className="modal-overlay">
      <div className="modal-card glass-panel animate-scale user-profile-modal-card">
        <div className="modal-header" style={{ marginBottom: '14px' }}>
          <div className="modal-title-row">
            <User size={22} className="modal-icon text-primary" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Profile & Account Settings</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="profile-modal-tabs">
          <button
            type="button"
            className={`profile-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={15} /> Profile
          </button>
          <button
            type="button"
            className={`profile-tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <Volume2 size={15} /> Sound
          </button>
          <button
            type="button"
            className={`profile-tab-btn ${activeTab === 'theme' ? 'active' : ''}`}
            onClick={() => setActiveTab('theme')}
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />} Theme
          </button>
          <button
            type="button"
            className={`profile-tab-btn ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <Lock size={15} /> Password
          </button>
          <button
            type="button"
            className={`profile-tab-btn ${activeTab === 'qrcode' ? 'active' : ''}`}
            onClick={() => setActiveTab('qrcode')}
          >
            <QrCode size={15} /> My QR
          </button>
        </div>

        {/* Tab Content 1: PROFILE DETAILS & PHOTO UPLOAD */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="profile-tab-content">
            <div className="avatar-upload-section">
              <div className="avatar-preview-box">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="avatar-img-preview" />
                ) : (
                  <div className="avatar-initials-fallback">
                    {displayName ? displayName[0].toUpperCase() : '⚡'}
                  </div>
                )}

                <label className="avatar-camera-btn" title="Upload Photo">
                  <Camera size={16} />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>

              <div className="avatar-actions-wrap">
                <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                  <Camera size={14} /> Upload New Photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                </label>
                {avatarUrl && (
                  <button type="button" className="btn btn-danger-ghost btn-sm" onClick={handleRemovePhoto}>
                    <Trash2 size={14} /> Remove Photo
                  </button>
                )}
              </div>
            </div>

            {profileSuccess && <div className="auth-success-badge">{profileSuccess}</div>}

            <div className="form-group" style={{ marginTop: '16px' }}>
              <label className="form-label">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="text-input"
                placeholder="Enter your name"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Mobile Number</label>
              <div className="read-only-phone-field">
                <Smartphone size={16} className="text-muted" />
                <span>{currentUser.phoneNumber}</span>
                <span className="badge badge-green" style={{ marginLeft: 'auto', fontSize: '0.75rem' }}>
                  <ShieldCheck size={12} /> Verified
                </span>
              </div>
            </div>

            <div className="modal-footer" style={{ marginTop: '20px' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                <Check size={16} /> Save Profile Changes
              </button>
            </div>
          </form>
        )}

        {/* Tab Content 2: SOUND NOTIFICATION SETTINGS */}
        {activeTab === 'notifications' && (
          <div className="profile-tab-content">
            <div className="settings-toggle-card glass-panel">
              <div className="settings-toggle-info">
                <div className="toggle-icon-wrap" style={{ color: soundEnabled ? 'var(--primary)' : 'var(--text-muted)' }}>
                  {soundEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
                </div>
                <div>
                  <h4>Notification Sound Effects</h4>
                  <p>Play chime audio alert when new instant messages arrive.</p>
                </div>
              </div>
              <button
                type="button"
                className={`switch-toggle-btn ${soundEnabled ? 'on' : 'off'}`}
                onClick={handleToggleSound}
              >
                <div className="switch-handle" />
              </button>
            </div>

            <div className="sound-status-hint" style={{ marginTop: '16px', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Status: <strong style={{ color: soundEnabled ? '#10b981' : '#ef4444' }}>{soundEnabled ? 'Sound Active 🔊' : 'Muted 🔇'}</strong>
            </div>

            <div className="modal-footer" style={{ marginTop: '24px' }}>
              <button type="button" className="btn btn-primary" onClick={onClose}>
                Done
              </button>
            </div>
          </div>
        )}

        {/* Tab Content 3: THEME CONTROLS */}
        {activeTab === 'theme' && (
          <div className="profile-tab-content">
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '12px' }}>Choose Interface Theme</h4>
            <div className="theme-selector-grid">
              <button
                type="button"
                className={`theme-option-card ${theme === 'dark' ? 'selected' : ''}`}
                onClick={() => theme !== 'dark' && toggleTheme()}
              >
                <Moon size={28} className="text-gold" />
                <div className="theme-option-text">
                  <h5>Dark Mode</h5>
                  <span>Sleek glassmorphism with high contrast</span>
                </div>
              </button>

              <button
                type="button"
                className={`theme-option-card ${theme === 'light' ? 'selected' : ''}`}
                onClick={() => theme !== 'light' && toggleTheme()}
              >
                <Sun size={28} className="text-indigo" />
                <div className="theme-option-text">
                  <h5>Light Mode</h5>
                  <span>Clean and vibrant light layout</span>
                </div>
              </button>
            </div>

            <div className="modal-footer" style={{ marginTop: '24px' }}>
              <button type="button" className="btn btn-primary" onClick={onClose}>
                Done
              </button>
            </div>
          </div>
        )}

        {/* Tab Content 4: PASSWORD MANAGEMENT */}
        {activeTab === 'security' && (
          <form onSubmit={handleChangePasswordSubmit} className="profile-tab-content">
            {passError && <div className="auth-error-badge">{passError}</div>}
            {passSuccess && <div className="auth-success-badge">{passSuccess}</div>}

            <div className="form-group">
              <label className="form-label"><KeyRound size={16} /> Current Password</label>
              <input
                type="password"
                value={currentPass}
                onChange={(e) => setCurrentPass(e.target.value)}
                className="text-input"
                placeholder="Enter current password"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label"><Lock size={16} /> New Password</label>
              <input
                type="password"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                className="text-input"
                placeholder="Enter new password"
                required
              />

              <div className="password-checklist" style={{ marginTop: '8px' }}>
                <div className={`checklist-item ${passCheck.hasMinLength ? 'pass' : 'fail'}`}>
                  {passCheck.hasMinLength ? <Check size={12} /> : <AlertCircle size={12} />} 8+ Chars
                </div>
                <div className={`checklist-item ${passCheck.hasUppercase ? 'pass' : 'fail'}`}>
                  {passCheck.hasUppercase ? <Check size={12} /> : <AlertCircle size={12} />} 1 Uppercase
                </div>
                <div className={`checklist-item ${passCheck.hasLowercase ? 'pass' : 'fail'}`}>
                  {passCheck.hasLowercase ? <Check size={12} /> : <AlertCircle size={12} />} 1 Lowercase
                </div>
                <div className={`checklist-item ${passCheck.hasNumber ? 'pass' : 'fail'}`}>
                  {passCheck.hasNumber ? <Check size={12} /> : <AlertCircle size={12} />} 1 Number
                </div>
                <div className={`checklist-item ${passCheck.hasSpecialChar ? 'pass' : 'fail'}`}>
                  {passCheck.hasSpecialChar ? <Check size={12} /> : <AlertCircle size={12} />} 1 Special Char
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label"><ShieldCheck size={16} /> Confirm New Password</label>
              <input
                type="password"
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                className="text-input"
                placeholder="Re-enter new password"
                required
              />
            </div>

            <div className="modal-footer" style={{ marginTop: '20px' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={!passCheck.isValid || !currentPass}>
                Update Password
              </button>
            </div>
          </form>
        )}

        {/* Tab Content 5: MY QR CODE */}
        {activeTab === 'qrcode' && (
          <div className="profile-tab-content" style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
              Scan this QR code from any mobile camera to instantly start a temporary chat with <strong>{currentUser.displayName || currentUser.phoneNumber}</strong>.
            </p>

            <div
              className="qr-card-preview"
              style={{
                display: 'inline-block',
                padding: '16px',
                background: '#ffffff',
                borderRadius: '16px',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.2)',
                margin: '0 auto 16px auto'
              }}
              dangerouslySetInnerHTML={{ __html: qrSvgMarkup }}
            />

            <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 600 }}>
              {currentUser.phoneNumber}
            </div>

            <div className="modal-footer" style={{ marginTop: '20px', justifyContent: 'center' }}>
              <button type="button" className="btn btn-primary" onClick={onClose}>
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
