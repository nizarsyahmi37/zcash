'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useClusters } from '@/hooks/useClusters';
import { useZcash } from '@/hooks/useZcash';
import { WalletList } from '@/components/WalletList';
import { AddWalletModal } from '@/components/AddWalletModal';
import { Wallet } from '@/types';

export default function ClusterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clusterId = params.id as string;

  const { clusters, addWalletToCluster, removeWalletFromCluster, editWallet } = useClusters();

  const [showAddWallet, setShowAddWallet] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);

  const cluster = clusters.find(c => c.id === clusterId);

  if (!cluster) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0d0d0d' }}>
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2" style={{ color: '#f5e6c8' }}>Cluster not found</h2>
          <button
            onClick={() => router.push('/')}
            className="transition-colors"
            style={{ color: '#ffd700' }}
          >
            Go back to dashboard
          </button>
        </div>
      </div>
    );
  }

  const handleAddWallet = (address: string, label: string, type: 't-address' | 'z-address') => {
    addWalletToCluster(cluster.id, address, label, type);
    setShowAddWallet(false);
  };

  const handleRemoveWallet = (walletId: string) => {
    removeWalletFromCluster(cluster.id, walletId);
  };

  const handleEditWallet = (wallet: Wallet) => {
    setEditingWallet(wallet);
  };

  const handleSaveWallet = () => {
    if (editingWallet) {
      editWallet(cluster.id, editingWallet);
      setEditingWallet(null);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'transparent' }}>
      {/* Header */}
      <header className="border-b" style={{ borderColor: '#2d2d2d', background: 'rgba(26, 26, 26, 0.8)' }}>
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="p-2 transition-colors"
              style={{ color: '#666' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold" style={{ borderLeft: `4px solid ${cluster.color}`, paddingLeft: '12px', color: '#f5e6c8' }}>
                {cluster.name}
              </h1>
              <p className="text-sm" style={{ color: '#888' }}>{cluster.description}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="rounded-xl p-6 mb-6 border" style={{ background: 'rgba(26, 26, 26, 0.6)', borderColor: '#2d2d2d' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold" style={{ color: '#f5e6c8' }}>Wallets</h2>
            <button
              onClick={() => setShowAddWallet(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all"
              style={{ background: 'linear-gradient(135deg, #ffd700 0%, #b8860b 100%)', color: '#000' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Wallet
            </button>
          </div>

          <WalletList
            wallets={cluster.wallets}
            clusterId={cluster.id}
            onRemove={handleRemoveWallet}
            onEdit={handleEditWallet}
          />
        </div>

        {/* Info Section */}
        <div className="rounded-xl p-6 border" style={{ background: 'rgba(59, 130, 246, 0.05)', borderColor: 'rgba(59, 130, 246, 0.2)' }}>
          <h3 className="font-medium mb-2" style={{ color: '#60a5fa' }}>About Zcash Mainnet</h3>
          <p className="text-sm" style={{ color: '#888' }}>
            This application connects to the Zcash mainnet. Use real ZEC addresses
            to view balances. WARNING: Real funds - be careful with your addresses.
          </p>
        </div>
      </main>

      {/* Modals */}
      {showAddWallet && (
        <AddWalletModal
          isOpen={showAddWallet}
          onClose={() => setShowAddWallet(false)}
          onAdd={handleAddWallet}
        />
      )}

      {/* Edit Wallet Modal */}
      {editingWallet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0, 0, 0, 0.8)' }}>
          <div className="relative rounded-xl shadow-2xl w-full max-w-md mx-4 p-5 border" style={{ background: '#1a1a1a', borderColor: '#2d2d2d' }}>
            <h2 className="text-xl font-semibold mb-4" style={{ color: '#f5e6c8' }}>Edit Wallet</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#999' }}>Label</label>
                <input
                  type="text"
                  value={editingWallet.label}
                  onChange={e => setEditingWallet({ ...editingWallet, label: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border"
                  style={{ background: '#0d0d0d', borderColor: '#333', color: '#f5e6c8' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#999' }}>Address</label>
                <input
                  type="text"
                  value={editingWallet.address}
                  readOnly
                  className="w-full px-3 py-2 rounded-lg border font-mono text-sm"
                  style={{ background: '#0d0d0d', borderColor: '#222', color: '#666' }}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSaveWallet}
                className="flex-1 py-2 px-4 rounded-lg font-medium transition-all"
                style={{ background: 'linear-gradient(135deg, #ffd700 0%, #b8860b 100%)', color: '#000' }}
              >
                Save
              </button>
              <button
                onClick={() => setEditingWallet(null)}
                className="px-4 py-2 rounded-lg border transition-colors"
                style={{ borderColor: '#333', color: '#999' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}