'use client';

import { FROSTKeyGen } from '@/types';
import { useState } from 'react';
import { useFROST } from '@/hooks/useFROST';

interface FROSTWalletCardProps {
  keyData: FROSTKeyGen;
  onSign: (keyId: string) => void;
}

export function FROSTWalletCard({ keyData, onSign }: FROSTWalletCardProps) {
  const { removeFROSTKey } = useFROST();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = () => {
    if (showConfirm) {
      removeFROSTKey(keyData.id);
      setShowConfirm(false);
    } else {
      setShowConfirm(true);
      // Auto-hide confirm after 3 seconds
      setTimeout(() => setShowConfirm(false), 3000);
    }
  };

  return (
    <div className="rounded-xl p-5 border" style={{ background: 'rgba(26, 26, 26, 0.6)', borderColor: '#2d2d2d' }}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-medium" style={{ color: '#f5e6c8' }}>{keyData.id}</h3>
          <p className="text-xs" style={{ color: '#888' }}>
            {keyData.threshold}-of-{keyData.totalParticipants} threshold
          </p>
        </div>
        <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}>
          FROST
        </span>
      </div>

      <div className="text-xs font-mono mb-3" style={{ color: '#666' }}>
        PK: {keyData.sharedPublicKey.slice(0, 20)}...
      </div>

      {/* Participants info */}
      <div className="text-xs mb-3" style={{ color: '#666' }}>
        <div style={{ color: '#888' }}>Participants:</div>
        {keyData.participants.slice(0, 2).map((p, i) => (
          <div key={p.id} className="truncate">
            #{i + 1}: {p.publicKey.slice(0, 12)}...
          </div>
        ))}
        {keyData.participants.length > 2 && (
          <div style={{ color: '#555' }}>+{keyData.participants.length - 2} more</div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onSign(keyData.id)}
          className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
          style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', border: '1px solid #10b981' }}
        >
          Sign
        </button>
        <button
          onClick={handleDelete}
          className="py-2 px-3 rounded-lg text-sm transition-all"
          style={{
            background: showConfirm ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
            color: showConfirm ? '#ef4444' : '#666',
            border: `1px solid ${showConfirm ? '#ef4444' : '#333'}`
          }}
        >
          {showConfirm ? 'Confirm?' : 'Delete'}
        </button>
      </div>

      {showConfirm && (
        <p className="text-xs mt-2" style={{ color: '#ef4444' }}>
          Click again to delete this wallet
        </p>
      )}
    </div>
  );
}