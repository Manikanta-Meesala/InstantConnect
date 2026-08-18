import React from 'react';
import { LogOut, X } from 'lucide-react';

export default function LogoutConfirmModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card glass-panel animate-scale" style={{ maxWidth: '420px', padding: '24px' }}>
        <div className="modal-header" style={{ marginBottom: '16px' }}>
          <div className="modal-title-row">
            <LogOut size={22} className="modal-icon text-danger" />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Confirm Logout</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '8px 0 16px 0', textAlign: 'center' }}>
          <p style={{ fontSize: '1.05rem', color: 'var(--text-main)', marginBottom: '8px', lineHeight: '1.5' }}>
            Do you want to logout?
          </p>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            You will need to sign in again to access your temporary chats.
          </p>
        </div>

        <div className="modal-footer" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex: 1, padding: '10px 16px' }}>
            Cancel
          </button>
          <button type="button" className="btn btn-danger" onClick={onConfirm} style={{ flex: 1, padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>
    </div>
  );
}
