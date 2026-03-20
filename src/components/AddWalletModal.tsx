'use client';

import { useState } from 'react';
import { isValidZcashAddress, getAddressType } from '@/lib/zcash-client';

interface AddWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (address: string, label: string, type: 't-address' | 'z-address') => void;
}

export function AddWalletModal({ isOpen, onClose, onAdd }: AddWalletModalProps) {
  const [address, setAddress] = useState('');
  const [label, setLabel] = useState('');
  const [error, setError] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!address.trim()) {
      setError('Address is required');
      return;
    }

    if (!label.trim()) {
      setError('Label is required');
      return;
    }

    const addressType = getAddressType(address.trim());
    if (!addressType) {
      setError('Invalid Zcash address format');
      return;
    }

    setIsValidating(true);
    setTimeout(() => {
      onAdd(address.trim(), label.trim(), addressType);
      setAddress('');
      setLabel('');
      setIsValidating(false);
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0, 0, 0, 0.8)' }}>
      <div className="relative rounded-xl shadow-2xl w-full max-w-md mx-4 border" style={{ background: '#1a1a1a', borderColor: '#2d2d2d' }}>
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: '#2d2d2d' }}>
          <h2 className="text-xl font-semibold" style={{ color: '#f5e6c8' }}>Add Wallet</h2>
          <button
            onClick={onClose}
            className="p-1 transition-colors"
            style={{ color: '#666' }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#999' }}>
                Wallet Address
              </label>
              <input
                type="text"
                value={address}
                onChange={e => {
                  setAddress(e.target.value);
                  setError('');
                }}
                placeholder="t-address or z-address"
                className="w-full px-3 py-2 rounded-lg border font-mono text-sm"
                style={{ background: '#0d0d0d', borderColor: '#333', color: '#f5e6c8' }}
              />
              <p className="text-xs mt-1" style={{ color: '#666' }}>
                Supports t-address (transparent) and z-address (shielded)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#999' }}>
                Label
              </label>
              <input
                type="text"
                value={label}
                onChange={e => {
                  setLabel(e.target.value);
                  setError('');
                }}
                placeholder="e.g., My cold wallet"
                className="w-full px-3 py-2 rounded-lg border"
                style={{ background: '#0d0d0d', borderColor: '#333', color: '#f5e6c8' }}
              />
            </div>

            {error && (
              <div className="px-4 py-2 rounded-lg text-sm" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                {error}
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              disabled={isValidating}
              className="flex-1 py-2 px-4 rounded-lg font-medium transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #ffd700 0%, #b8860b 100%)', color: '#000' }}
            >
              {isValidating ? 'Validating...' : 'Add Wallet'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border transition-colors"
              style={{ borderColor: '#333', color: '#999' }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}