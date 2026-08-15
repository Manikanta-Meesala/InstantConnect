import React, { useState } from 'react';
import { Lock, X, Check, User, Phone } from 'lucide-react';

export default function SavePermanentModal({ conversation, onClose, onSave }) {
  const [mode, setMode] = useState('alias'); // 'alias' or 'phone'
  const [aliasInput, setAliasInput] = useState(conversation.alias || '');
  const [customPhone, setCustomPhone] = useState(conversation.peerPhoneNumber || '');

  const handleSaveSubmit = (e) => {
    e?.preventDefault();
    const finalAlias = mode === 'alias'
      ? (aliasInput.trim() || conversation.peerPhoneNumber)
      : (customPhone.trim() || conversation.peerPhoneNumber);

    onSave(conversation.id, finalAlias);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card glass-panel animate-scale">
        <div className="modal-header">
          <div className="modal-title-row">
            <Lock size={20} className="modal-icon text-accent" />
            <h3>Save Contact Permanently</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSaveSubmit} className="modal-body">
          <p className="modal-description">
            Saving permanently disables the 30-day auto-deletion timer. This contact will stay in your tiles until you manually delete it.
          </p>

          <div className="save-option-selector">
            <button
              type="button"
              className={`selector-chip ${mode === 'alias' ? 'selected' : ''}`}
              onClick={() => setMode('alias')}
            >
              <User size={16} /> 1. Save with Alias / Nickname
            </button>
            <button
              type="button"
              className={`selector-chip ${mode === 'phone' ? 'selected' : ''}`}
              onClick={() => setMode('phone')}
            >
              <Phone size={16} /> 2. Save with Mobile Number
            </button>
          </div>

          {mode === 'alias' ? (
            <div className="form-group">
              <label className="form-label">Contact Name / Nickname</label>
              <input
                type="text"
                placeholder="e.g. Mani"
                value={aliasInput}
                onChange={(e) => setAliasInput(e.target.value)}
                className="text-input"
                autoFocus
                required
              />
              <span className="field-hint">Original Number: {conversation.peerPhoneNumber}</span>
            </div>
          ) : (
            <div className="form-group">
              <label className="form-label">Mobile Number Identifier</label>
              <input
                type="text"
                placeholder="e.g. +91 63009 12345"
                value={customPhone}
                onChange={(e) => setCustomPhone(e.target.value)}
                className="text-input"
                autoFocus
                required
              />
            </div>
          )}

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-save-perm">
              <Check size={18} /> Save Permanently 🔒
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
