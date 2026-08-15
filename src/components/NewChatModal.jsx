import React, { useState, useEffect, useRef } from 'react';
import { X, QrCode, Phone, UserPlus, Sparkles, Copy, Check, Camera, ExternalLink } from 'lucide-react';
import { generateQRCodeSVG } from '../utils/qrcode';

export default function NewChatModal({ onClose, onCreateChat, currentUser }) {
  const [activeTab, setActiveTab] = useState('phone'); // 'phone', 'qr', 'scan'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [initialMessage, setInitialMessage] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [scannedUrlInput, setScannedUrlInput] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const fullUserPhone = currentUser?.phoneNumber || '+91 98765 43210';
  const shareableUrl = `${window.location.origin}${window.location.pathname}#connect?phone=${encodeURIComponent(fullUserPhone)}`;
  const qrSvgMarkup = generateQRCodeSVG(shareableUrl, { size: 200, color: '#0f172a', bgColor: '#ffffff' });

  const quickDemoContacts = [
    { name: 'Mani', phone: '+91 63009 98877', avatar: '👨‍💻' },
    { name: 'Rahul', phone: '+91 98765 11223', avatar: '☕' },
    { name: 'Priya', phone: '+91 91234 44556', avatar: '🎨' },
    { name: 'Alex', phone: '+91 99887 22334', avatar: '🚀' },
  ];

  const handleStartPhoneChat = (e) => {
    e?.preventDefault();
    if (!phoneNumber.trim()) return;
    const fullPeerPhone = `${countryCode} ${phoneNumber.trim()}`;
    onCreateChat(fullPeerPhone, initialMessage || 'Hello! InstantConnect chat started.');
  };

  const handleQuickConnect = (contact) => {
    onCreateChat(contact.phone, `Hi ${contact.name}! Connected via InstantConnect.`);
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(shareableUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Camera stream handling for scanning
  const startCamera = async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch (err) {
      setCameraError('Camera access unavailable. You can paste your friend\'s QR link or mobile number below.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (activeTab === 'scan') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [activeTab]);

  const handleProcessScannedInput = (e) => {
    e?.preventDefault();
    if (!scannedUrlInput.trim()) return;

    let phoneExtracted = scannedUrlInput.trim();
    if (scannedUrlInput.includes('phone=')) {
      const match = scannedUrlInput.match(/phone=([^&]+)/);
      if (match && match[1]) {
        phoneExtracted = decodeURIComponent(match[1]);
      }
    }

    onCreateChat(phoneExtracted, 'Connected via QR Code scan!');
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card glass-panel animate-scale">
        <div className="modal-header">
          <div className="modal-title-row">
            <UserPlus size={20} className="modal-icon" />
            <h3>Start New Instant Chat</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-tabs">
          <button
            className={`tab-btn ${activeTab === 'phone' ? 'active' : ''}`}
            onClick={() => setActiveTab('phone')}
          >
            <Phone size={16} /> Mobile Number
          </button>
          <button
            className={`tab-btn ${activeTab === 'qr' ? 'active' : ''}`}
            onClick={() => setActiveTab('qr')}
          >
            <QrCode size={16} /> My QR Code
          </button>
          <button
            className={`tab-btn ${activeTab === 'scan' ? 'active' : ''}`}
            onClick={() => setActiveTab('scan')}
          >
            <Camera size={16} /> Scan Friend QR
          </button>
        </div>

        {activeTab === 'phone' && (
          <form onSubmit={handleStartPhoneChat} className="modal-body">
            <div className="form-group">
              <label className="form-label">Recipient Mobile Number</label>
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
              <label className="form-label">Initial Message (Optional)</label>
              <input
                type="text"
                placeholder="Say Hi..."
                value={initialMessage}
                onChange={(e) => setInitialMessage(e.target.value)}
                className="text-input"
              />
            </div>

            <div className="quick-connect-section">
              <label className="form-label">Or Quick Connect Demo Contact:</label>
              <div className="quick-contact-grid">
                {quickDemoContacts.map((contact) => (
                  <button
                    key={contact.phone}
                    type="button"
                    className="quick-contact-card"
                    onClick={() => handleQuickConnect(contact)}
                  >
                    <span className="contact-emoji">{contact.avatar}</span>
                    <span className="contact-name">{contact.name}</span>
                    <span className="contact-phone">{contact.phone}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={!phoneNumber.trim()}>
                Start Chat
              </button>
            </div>
          </form>
        )}

        {activeTab === 'qr' && (
          <div className="modal-body qr-modal-body">
            <div className="qr-container glass-panel" style={{ textAlign: 'center', padding: '1.5rem' }}>
              <div
                className="qr-code-box"
                style={{
                  display: 'inline-block',
                  background: '#ffffff',
                  padding: '16px',
                  borderRadius: '16px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
                }}
              >
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=10&data=${encodeURIComponent(shareableUrl)}`}
                  alt={`QR Code for ${fullUserPhone}`}
                  style={{ width: '220px', height: '220px', display: 'block', borderRadius: '8px' }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
                <div
                  style={{ display: 'none' }}
                  dangerouslySetInnerHTML={{ __html: qrSvgMarkup }}
                />
              </div>
              <p className="qr-phone-text" style={{ marginTop: '1rem', fontWeight: 600 }}>
                Scan to Chat with <strong>{fullUserPhone}</strong>
              </p>
              <p style={{ fontSize: '0.825rem', opacity: 0.7, marginTop: '0.25rem' }}>
                Scan with any smartphone camera (iOS / Android) or QR reader to launch chat instantly.
              </p>
            </div>

            <div className="qr-actions" style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={handleCopyLink}
              >
                {copiedLink ? <Check size={16} /> : <Copy size={16} />}
                {copiedLink ? 'Link Copied!' : 'Copy Direct Link'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'scan' && (
          <div className="modal-body scan-modal-body">
            <div className="camera-viewfinder glass-panel" style={{ textAlign: 'center', padding: '1rem' }}>
              {cameraActive ? (
                <div style={{ position: 'relative', width: '100%', maxHeight: '220px', overflow: 'hidden', borderRadius: '12px' }}>
                  <video ref={videoRef} autoPlay playsInline style={{ width: '100%', borderRadius: '12px' }} />
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '140px',
                    height: '140px',
                    border: '2px dashed var(--accent-primary, #6366f1)',
                    borderRadius: '12px',
                    pointerEvents: 'none'
                  }} />
                </div>
              ) : (
                <div style={{ padding: '1.5rem', color: 'var(--text-muted)' }}>
                  <Camera size={40} style={{ opacity: 0.6, marginBottom: '0.5rem' }} />
                  <p>{cameraError || 'Initializing Camera...'}</p>
                </div>
              )}
            </div>

            <form onSubmit={handleProcessScannedInput} style={{ marginTop: '1rem' }}>
              <label className="form-label">Paste Friend's QR Link or Phone Number:</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="Paste URL or phone number e.g. +91 98765 43210"
                  value={scannedUrlInput}
                  onChange={(e) => setScannedUrlInput(e.target.value)}
                  className="text-input"
                  style={{ flex: 1 }}
                />
                <button type="submit" className="btn btn-primary" disabled={!scannedUrlInput.trim()}>
                  Connect
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
