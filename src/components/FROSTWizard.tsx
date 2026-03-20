'use client';

import { useState } from 'react';
import { FROSTParticipant } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { generateKeyPair, exportPublicKey } from '@/lib/frost-service';

interface FROSTWizardProps {
  onComplete: (name: string, threshold: number, participants: FROSTParticipant[]) => void;
  onCancel: () => void;
}

type Step = 'config' | 'review';

export function FROSTWizard({ onComplete, onCancel }: FROSTWizardProps) {
  const [step, setStep] = useState<Step>('config');
  const [threshold, setThreshold] = useState(2);
  const [totalParticipants, setTotalParticipants] = useState(3);
  const [walletName, setWalletName] = useState('');
  const [participantNames, setParticipantNames] = useState<string[]>([]);
  const [generatedKeys, setGeneratedKeys] = useState<{ index: number; publicKey: string }[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Generate cryptographic keys automatically
  const generateParticipantKeys = async () => {
    setIsGenerating(true);
    try {
      const keys: { index: number; publicKey: string }[] = [];
      for (let i = 0; i < totalParticipants; i++) {
        const keyPair = await generateKeyPair();
        const publicKey = await exportPublicKey(keyPair);
        keys.push({ index: i, publicKey });
      }
      setGeneratedKeys(keys);
      // Set default names
      setParticipantNames(Array.from({ length: totalParticipants }, (_, i) => `Participant ${i + 1}`));
      setStep('review');
    } catch (err) {
      console.error('Failed to generate keys:', err);
      alert('Failed to generate cryptographic keys');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNameChange = (index: number, name: string) => {
    const newNames = [...participantNames];
    newNames[index] = name;
    setParticipantNames(newNames);
  };

  const handleComplete = () => {
    if (!walletName.trim()) {
      alert('Please enter a wallet name');
      return;
    }

    // Always use auto-generated keys
    if (generatedKeys.length !== totalParticipants) {
      alert('Please generate keys first');
      return;
    }

    const participants: FROSTParticipant[] = generatedKeys.map((key, i) => ({
      id: uuidv4(),
      index: i + 1,
      publicKey: key.publicKey,
      name: participantNames[i] || `Participant ${i + 1}`,
      committedShares: [],
    }));

    onComplete(walletName.trim(), threshold, participants);
  };

  const canProceedFromConfig = threshold > 0 && threshold <= totalParticipants && totalParticipants >= 2;

  return (
    <div className="rounded-xl shadow-2xl w-full max-w-lg mx-4 border" style={{ background: '#1a1a1a', borderColor: '#2d2d2d' }}>
      <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: '#2d2d2d' }}>
        <h2 className="text-xl font-semibold" style={{ color: '#ffd700' }}>Create FROST Multi-Sig Wallet</h2>
        <button onClick={onCancel} className="p-1 transition-colors" style={{ color: '#666' }}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2 py-4 border-b" style={{ borderColor: '#2d2d2d' }}>
        {['config', 'review'].map((s, i) => (
          <div key={s} className="flex items-center">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
              style={{
                background: step === s ? 'linear-gradient(135deg, #ffd700 0%, #b8860b 100%)' : (['config', 'review'].indexOf(step) > i ? '#10b981' : '#333'),
                color: step === s || ['config', 'review'].indexOf(step) > i ? '#000' : '#666'
              }}
            >
              {i + 1}
            </div>
            {i < 1 && <div className="w-8 h-0.5" style={{ background: '#333' }} />}
          </div>
        ))}
      </div>

      <div className="p-5">
        {step === 'config' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium" style={{ color: '#f5e6c8' }}>Configuration</h3>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#999' }}>
                Wallet Name
              </label>
              <input
                type="text"
                value={walletName}
                onChange={e => setWalletName(e.target.value)}
                placeholder="e.g., Family Savings"
                className="w-full px-3 py-2 rounded-lg border"
                style={{ background: '#0d0d0d', borderColor: '#333', color: '#f5e6c8' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#999' }}>
                Total Participants (N)
              </label>
              <input
                type="number"
                min={2}
                max={10}
                value={totalParticipants}
                onChange={e => {
                  setTotalParticipants(parseInt(e.target.value) || 2);
                  if (threshold > parseInt(e.target.value)) {
                    setThreshold(parseInt(e.target.value));
                  }
                }}
                className="w-full px-3 py-2 rounded-lg border"
                style={{ background: '#0d0d0d', borderColor: '#333', color: '#f5e6c8' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#999' }}>
                Threshold (K) - Signatures Required
              </label>
              <input
                type="number"
                min={1}
                max={totalParticipants}
                value={threshold}
                onChange={e => setThreshold(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 rounded-lg border"
                style={{ background: '#0d0d0d', borderColor: '#333', color: '#f5e6c8' }}
              />
              <p className="text-xs mt-1" style={{ color: '#666' }}>
                {threshold} of {totalParticipants} signatures needed to authorize transactions
              </p>
            </div>

            {/* Explanation */}
            <div className="p-3 rounded-lg" style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
              <h4 className="text-sm font-medium mb-1" style={{ color: '#60a5fa' }}>How FROST Multi-Sig Works</h4>
              <ul className="text-xs space-y-1" style={{ color: '#888' }}>
                <li>• Each participant gets a unique cryptographic key pair</li>
                <li>• The wallet has a shared address derived from all public keys</li>
                <li>• Any {threshold} of {totalParticipants} participants can sign a transaction</li>
                <li>• Private keys are generated locally - never shared</li>
              </ul>
            </div>

            <button
              onClick={generateParticipantKeys}
              disabled={!canProceedFromConfig || !walletName.trim() || isGenerating}
              className="w-full py-2 px-4 rounded-lg font-medium transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #ffd700 0%, #b8860b 100%)', color: '#000' }}
            >
              {isGenerating ? 'Generating Keys...' : 'Generate Cryptographic Keys'}
            </button>
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium" style={{ color: '#f5e6c8' }}>Review & Name Participants</h3>

            <div className="rounded-lg p-4 space-y-2" style={{ background: 'rgba(13, 13, 13, 0.5)' }}>
              <div className="flex justify-between">
                <span style={{ color: '#888' }}>Wallet Name:</span>
                <span style={{ color: '#f5e6c8' }}>{walletName}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#888' }}>Threshold:</span>
                <span style={{ color: '#f5e6c8' }}>{threshold} of {totalParticipants}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#888' }}>Keys Generated:</span>
                <span style={{ color: '#10b981' }}>✓ ECDSA P-256</span>
              </div>
            </div>

            {/* Name participants */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#999' }}>
                Name Each Participant (optional)
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {participantNames.map((name, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: '#666', width: '30px' }}>#{i + 1}</span>
                    <input
                      type="text"
                      value={name}
                      onChange={e => handleNameChange(i, e.target.value)}
                      placeholder={`Participant ${i + 1}`}
                      className="flex-1 px-2 py-1 rounded border text-sm"
                      style={{ background: '#0d0d0d', borderColor: '#333', color: '#f5e6c8' }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Show public keys */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#999' }}>
                Public Keys (share these with other participants)
              </label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {generatedKeys.map((key, i) => (
                  <div key={key.index} className="p-2 rounded text-xs font-mono" style={{ background: 'rgba(13, 13, 13, 0.5)', color: '#666' }}>
                    {participantNames[i] || `Participant ${i + 1}`}: {key.publicKey.slice(0, 24)}...
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-lg" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
              <p className="text-sm" style={{ color: '#10b981' }}>
                ✓ Keys generated using ECDSA P-256 cryptography
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setStep('config')}
                className="flex-1 px-4 py-2 rounded-lg border transition-colors"
                style={{ borderColor: '#333', color: '#999' }}
              >
                Back
              </button>
              <button
                onClick={handleComplete}
                className="flex-1 py-2 px-4 rounded-lg font-medium transition-all"
                style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff' }}
              >
                Create FROST Wallet
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}