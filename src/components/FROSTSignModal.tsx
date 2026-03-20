'use client';

import { useState } from 'react';
import { useFROST } from '@/hooks/useFROST';
import { importPublicKey, verifySignature } from '@/lib/frost-service';

interface FROSTSignModalProps {
  keyId: string;
  onClose: () => void;
}

export function FROSTSignModal({ keyId, onClose }: FROSTSignModalProps) {
  const { getKey, sign } = useFROST();
  const [message, setMessage] = useState('');
  const [selectedSigners, setSelectedSigners] = useState<number[]>([]);
  const [signature, setSignature] = useState<string | null>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{ valid: boolean; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const key = getKey(keyId);

  if (!key) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0, 0, 0, 0.8)' }}>
        <div className="relative rounded-xl shadow-2xl w-full max-w-md mx-4 p-5 border" style={{ background: '#1a1a1a', borderColor: '#2d2d2d' }}>
          <h2 className="text-xl font-semibold mb-4" style={{ color: '#f5e6c8' }}>FROST Sign</h2>
          <p style={{ color: '#888' }}>Key not found</p>
          <button onClick={onClose} className="mt-4 w-full py-2 rounded-lg" style={{ background: '#333', color: '#fff' }}>Close</button>
        </div>
      </div>
    );
  }

  const toggleSigner = (index: number) => {
    setSelectedSigners(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      }
      return [...prev, index];
    });
  };

  const handleSign = async () => {
    if (selectedSigners.length < key.threshold) {
      setError(`Need at least ${key.threshold} signers`);
      return;
    }

    setIsSigning(true);
    setError(null);
    setVerificationResult(null);

    try {
      const sig = await sign(keyId, selectedSigners, message);
      setSignature(sig);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signing failed');
    } finally {
      setIsSigning(false);
    }
  };

  const handleVerify = async () => {
    if (!signature || !message) return;

    setIsVerifying(true);
    setVerificationResult(null);

    try {
      // Verify each individual signature
      let allValid = true;
      const results: string[] = [];

      // Get stored private keys for verification
      const storedKeysStr = localStorage.getItem(`frost_keys_${key.sharedPublicKey}`);
      if (storedKeysStr) {
        const participantKeys = JSON.parse(storedKeysStr);

        for (const signerIndex of selectedSigners) {
          const keyData = participantKeys[signerIndex];
          if (keyData) {
            try {
              const publicKey = await importPublicKey(keyData.publicKey);
              const isValid = await verifySignature(publicKey, message, signature);
              results.push(`Signer ${signerIndex + 1}: ${isValid ? '✓ VALID' : '✗ INVALID'}`);
              if (!isValid) allValid = false;
            } catch (e) {
              results.push(`Signer ${signerIndex + 1}: ⚠ ERROR`);
            }
          }
        }
      }

      setVerificationResult({
        valid: allValid,
        message: results.join('\n')
      });
    } catch (err) {
      setVerificationResult({
        valid: false,
        message: err instanceof Error ? err.message : 'Verification failed'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0, 0, 0, 0.8)' }}>
      <div className="relative rounded-xl shadow-2xl w-full max-w-lg mx-4 border" style={{ background: '#1a1a1a', borderColor: '#2d2d2d' }}>
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: '#2d2d2d' }}>
          <h2 className="text-xl font-semibold" style={{ color: '#ffd700' }}>Sign with FROST Wallet</h2>
          <button onClick={onClose} className="p-1 transition-colors" style={{ color: '#666' }}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Wallet Info */}
          <div className="rounded-lg p-4" style={{ background: 'rgba(13, 13, 13, 0.5)' }}>
            <div className="flex justify-between mb-2">
              <span style={{ color: '#888' }}>Wallet:</span>
              <span style={{ color: '#f5e6c8' }}>{key.id}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span style={{ color: '#888' }}>Threshold:</span>
              <span style={{ color: '#f5e6c8' }}>{key.threshold}-of-{key.totalParticipants}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: '#888' }}>Shared Public Key:</span>
              <span className="font-mono text-xs" style={{ color: '#666' }}>{key.sharedPublicKey.slice(0, 24)}...</span>
            </div>
          </div>

          {/* Message Input */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#999' }}>
              Message to Sign
            </label>
            <textarea
              value={message}
              onChange={e => {
                setMessage(e.target.value);
                setSignature(null);
                setVerificationResult(null);
              }}
              placeholder="Enter transaction message or data to sign..."
              className="w-full px-3 py-2 rounded-lg border resize-none"
              style={{ background: '#0d0d0d', borderColor: '#333', color: '#f5e6c8', minHeight: '80px' }}
            />
            <p className="text-xs mt-1" style={{ color: '#666' }}>
              This message will be signed using real ECDSA (P-256) cryptography
            </p>
          </div>

          {/* Participant Selection */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#999' }}>
              Select Signers ({key.threshold} required)
            </label>
            <div className="space-y-2">
              {key.participants.map((participant, index) => (
                <button
                  key={participant.id}
                  onClick={() => toggleSigner(index)}
                  className="w-full flex items-center justify-between p-3 rounded-lg border transition-all"
                  style={{
                    background: selectedSigners.includes(index) ? 'rgba(16, 185, 129, 0.1)' : 'rgba(13, 13, 13, 0.5)',
                    borderColor: selectedSigners.includes(index) ? '#10b981' : '#333'
                  }}
                >
                  <div className="text-left">
                    <div style={{ color: '#f5e6c8' }}>Participant {index + 1}</div>
                    <div className="text-xs font-mono" style={{ color: '#666' }}>
                      {participant.publicKey.slice(0, 16)}...
                    </div>
                  </div>
                  {selectedSigners.includes(index) && (
                    <svg className="w-5 h-5" style={{ color: '#10b981' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
            <p className="text-xs mt-2" style={{ color: '#666' }}>
              Selected: {selectedSigners.length} / {key.threshold} required
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="px-4 py-2 rounded-lg text-sm" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
              {error}
            </div>
          )}

          {/* Signature Result */}
          {signature && (
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#10b981' }}>
                ✓ Cryptographic Signature Generated
              </label>
              <div className="p-3 rounded-lg font-mono text-xs break-all" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                {signature}
              </div>
              <p className="text-xs mt-2" style={{ color: '#666' }}>
                This signature was generated using real ECDSA P-256 keys stored for each participant
              </p>

              <button
                onClick={handleVerify}
                disabled={isVerifying}
                className="mt-3 w-full py-2 rounded-lg font-medium transition-all"
                style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', border: '1px solid #3b82f6' }}
              >
                {isVerifying ? 'Verifying...' : 'Verify Signature'}
              </button>
            </div>
          )}

          {/* Verification Result */}
          {verificationResult && (
            <div className="p-3 rounded-lg" style={{
              background: verificationResult.valid ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${verificationResult.valid ? '#10b981' : '#ef4444'}`
            }}>
              <div className="text-sm font-medium mb-2" style={{ color: verificationResult.valid ? '#10b981' : '#ef4444' }}>
                {verificationResult.valid ? '✓ Signature Verified' : '✗ Verification Failed'}
              </div>
              <pre className="text-xs font-mono whitespace-pre-wrap" style={{ color: '#888' }}>
                {verificationResult.message}
              </pre>
            </div>
          )}
        </div>

        <div className="flex gap-3 p-5 border-t" style={{ borderColor: '#2d2d2d' }}>
          <button
            onClick={handleSign}
            disabled={isSigning || selectedSigners.length < key.threshold || !message}
            className="flex-1 py-2 px-4 rounded-lg font-medium transition-all disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff' }}
          >
            {isSigning ? 'Signing with ECDSA...' : 'Generate Signature'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border transition-colors"
            style={{ borderColor: '#333', color: '#999' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}