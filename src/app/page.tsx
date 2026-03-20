'use client';

import { useState, useEffect } from 'react';
import { useClusters } from '@/hooks/useClusters';
import { useZcash } from '@/hooks/useZcash';
import { useFROST } from '@/hooks/useFROST';
import { ClusterCard } from '@/components/ClusterCard';
import { ClusterForm } from '@/components/ClusterForm';
import { AddWalletModal } from '@/components/AddWalletModal';
import { FROSTWizard } from '@/components/FROSTWizard';
import { FROSTSignModal } from '@/components/FROSTSignModal';
import { FROSTWalletCard } from '@/components/FROSTWalletCard';

export default function Dashboard() {
  const { clusters, createNewCluster, removeCluster, addWalletToCluster } = useClusters();
  const { isConnected, checkServerConnection, fetchBalances, demoMode, error } = useZcash();
  const { frostKeys, addFROSTKey } = useFROST();

  const [showAddWallet, setShowAddWallet] = useState(false);
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null);
  const [showFROSTWizard, setShowFROSTWizard] = useState(false);
  const [showFROSTSign, setShowFROSTSign] = useState(false);
  const [selectedFROSTKey, setSelectedFROSTKey] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [customEndpoint, setCustomEndpoint] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [useNownodes, setUseNownodes] = useState(false);
  const [totalBalance, setTotalBalance] = useState(0);

  useEffect(() => {
    checkServerConnection();
    // Load settings from localStorage
    const savedEndpoint = localStorage.getItem('zcash_custom_endpoint');
    const savedUseNownodes = localStorage.getItem('zcash_use_nownodes');
    if (savedEndpoint) setCustomEndpoint(savedEndpoint);
    // API key - prioritize env variable, fallback to localStorage (for dev only)
    const envApiKey = process.env.NEXT_PUBLIC_NOWNODES_API_KEY;
    if (envApiKey) {
      setApiKey(envApiKey);
    } else {
      const savedApiKey = localStorage.getItem('zcash_api_key');
      if (savedApiKey) setApiKey(savedApiKey);
    }
    if (savedUseNownodes) setUseNownodes(savedUseNownodes === 'true');
  }, [checkServerConnection]);

  useEffect(() => {
    const allAddresses = clusters.flatMap(c => c.wallets.map(w => w.address));
    if (allAddresses.length > 0) {
      fetchBalances(allAddresses).then(bals => {
        setTotalBalance(bals.reduce((sum, b) => sum + b.balance, 0));
      });
    }
  }, [clusters, fetchBalances]);

  const handleCreateCluster = (name: string, description: string, color: string) => {
    createNewCluster(name, description, color);
  };

  const handleAddWallet = (address: string, label: string, type: 't-address' | 'z-address') => {
    if (selectedClusterId) {
      addWalletToCluster(selectedClusterId, address, label, type);
    }
  };

  const handleFROSTComplete = async (name: string, threshold: number, participants: any[]) => {
    // Generate new keys and create FROST wallet directly
    const { createFROSTWallet, generateFROSTParticipantKeys } = await import('@/lib/frost-service');

    // Generate real cryptographic keys for each participant
    const participantKeys = await generateFROSTParticipantKeys(participants.length);

    // Map the generated keys to the participants
    const keyGen = await createFROSTWallet(threshold, participants);

    // Add key pairs to participants
    const keyGenWithKeys = {
      ...keyGen,
      id: name.toLowerCase().replace(/\s+/g, '-'),
      participants: keyGen.participants.map((p, i) => ({
        ...p,
        name: participants[i].name || `Participant ${i + 1}`,
        publicKey: participantKeys[i]?.publicKey || p.publicKey,
        privateKeyHex: participantKeys[i]?.privateKey || '',
      })),
    };

    addFROSTKey(keyGenWithKeys);
    setShowFROSTWizard(false);
  };

  const handleSignFROST = (keyId: string) => {
    setSelectedFROSTKey(keyId);
    setShowFROSTSign(true);
  };

  const handleSaveSettings = () => {
    if (customEndpoint) localStorage.setItem('zcash_custom_endpoint', customEndpoint);
    localStorage.setItem('zcash_api_key', apiKey);
    localStorage.setItem('zcash_use_nownodes', useNownodes ? 'true' : 'false');
    window.location.reload();
  };

  const handleClearSettings = () => {
    localStorage.removeItem('zcash_custom_endpoint');
    localStorage.removeItem('zcash_api_key');
    localStorage.removeItem('zcash_use_nownodes');
    setCustomEndpoint('');
    setApiKey('');
    setUseNownodes(false);
    window.location.reload();
  };

  return (
    <div className="min-h-screen" style={{ background: 'transparent' }}>
      {/* Header */}
      <header className="border-b" style={{ borderColor: '#2d2d2d', background: 'rgba(26, 26, 26, 0.8)' }}>
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #ffd700 0%, #b8860b 100%)' }}>
                <span className="text-black font-bold text-xl">Z</span>
              </div>
              <div>
                <h1 className="text-xl font-bold" style={{ color: '#ffd700' }}>Wallet Cluster Manager</h1>
                <p className="text-sm" style={{ color: '#888' }}>Zcash Mainnet</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Settings button */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 rounded-lg transition-colors"
                style={{ color: '#666' }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>

              {demoMode && (
                <div className="flex items-center gap-2 px-3 py-1 rounded-full text-sm" style={{
                  background: 'rgba(245, 158, 11, 0.1)',
                  color: '#f59e0b',
                  border: '1px solid #f59e0b'
                }}>
                  Demo Mode
                </div>
              )}
              <div className="flex items-center gap-2 px-3 py-1 rounded-full text-sm" style={{
                background: isConnected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                color: isConnected ? '#10b981' : '#ef4444',
                border: `1px solid ${isConnected ? '#10b981' : '#ef4444'}`
              }}>
                <div className="w-2 h-2 rounded-full" style={{ background: isConnected ? '#10b981' : '#ef4444' }} />
                {isConnected ? 'Connected' : 'Offline'}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Settings Panel */}
      {showSettings && (
        <div className="border-b" style={{ borderColor: '#2d2d2d', background: 'rgba(20, 20, 20, 0.9)' }}>
          <div className="max-w-6xl mx-auto px-4 py-4 space-y-4">
            <h3 className="font-medium" style={{ color: '#f5e6c8' }}>Connection Settings</h3>

            {/* Nownodes Option */}
            <div className="p-3 rounded-lg" style={{ background: 'rgba(13, 13, 13, 0.5)' }}>
              <div className="flex items-center gap-3 mb-3">
                <input
                  type="checkbox"
                  id="useNownodes"
                  checked={useNownodes}
                  onChange={e => setUseNownodes(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="useNownodes" className="text-sm font-medium" style={{ color: '#f5e6c8' }}>
                  Use Nownodes API
                </label>
              </div>
              {useNownodes && (
                <div>
                  <input
                    type="text"
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    placeholder="Enter your Nownodes API key"
                    className="w-full px-3 py-2 rounded-lg border mb-2"
                    style={{ background: '#0d0d0d', borderColor: '#333', color: '#f5e6c8' }}
                  />
                  <p className="text-xs" style={{ color: '#666' }}>
                    Get API key at <a href="https://nownodes.io" target="_blank" style={{ color: '#ffd700' }}>nownodes.io</a>
                  </p>
                </div>
              )}
            </div>

            {/* Custom Endpoint */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#999' }}>
                Custom Lightwalletd Endpoint
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customEndpoint}
                  onChange={e => setCustomEndpoint(e.target.value)}
                  placeholder="https://your-node:9067"
                  className="flex-1 px-3 py-2 rounded-lg border"
                  style={{ background: '#0d0d0d', borderColor: '#333', color: '#f5e6c8' }}
                  disabled={useNownodes}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSaveSettings}
                className="px-4 py-2 rounded-lg font-medium"
                style={{ background: 'linear-gradient(135deg, #ffd700 0%, #b8860b 100%)', color: '#000' }}
              >
                Save Settings
              </button>
              <button
                onClick={handleClearSettings}
                className="px-4 py-2 rounded-lg border"
                style={{ borderColor: '#333', color: '#666' }}
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="rounded-xl p-5 border" style={{ background: 'rgba(26, 26, 26, 0.6)', borderColor: '#2d2d2d' }}>
            <div className="text-sm" style={{ color: '#888' }}>Total Balance</div>
            <div className="text-2xl font-bold" style={{ color: '#ffd700' }}>{totalBalance.toFixed(4)} ZEC</div>
          </div>
          <div className="rounded-xl p-5 border" style={{ background: 'rgba(26, 26, 26, 0.6)', borderColor: '#2d2d2d' }}>
            <div className="text-sm" style={{ color: '#888' }}>Clusters</div>
            <div className="text-2xl font-bold" style={{ color: '#f5e6c8' }}>{clusters.length}</div>
          </div>
          <div className="rounded-xl p-5 border" style={{ background: 'rgba(26, 26, 26, 0.6)', borderColor: '#2d2d2d' }}>
            <div className="text-sm" style={{ color: '#888' }}>Total Wallets</div>
            <div className="text-2xl font-bold" style={{ color: '#f5e6c8' }}>{clusters.reduce((sum, c) => sum + c.wallets.length, 0)}</div>
          </div>
          <div className="rounded-xl p-5 border" style={{ background: 'rgba(26, 26, 26, 0.6)', borderColor: '#2d2d2d' }}>
            <div className="text-sm" style={{ color: '#888' }}>FROST Wallets</div>
            <div className="text-2xl font-bold" style={{ color: '#f5e6c8' }}>{frostKeys.length}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setShowFROSTWizard(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg"
            style={{ background: 'linear-gradient(135deg, #ffd700 0%, #b8860b 100%)', color: '#000' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Create FROST Multi-Sig
          </button>
        </div>

        {/* FROST Wallets Section */}
        {frostKeys.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4" style={{ color: '#f5e6c8' }}>FROST Multi-Sig Wallets</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {frostKeys.map(key => (
                <FROSTWalletCard
                  key={key.id}
                  keyData={key}
                  onSign={handleSignFROST}
                />
              ))}
            </div>
          </div>
        )}

        {/* Clusters Section */}
        <div>
          <h2 className="text-lg font-semibold mb-4" style={{ color: '#f5e6c8' }}>Wallet Clusters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clusters.map(cluster => (
              <ClusterCard
                key={cluster.id}
                cluster={cluster}
                onDelete={removeCluster}
                onAddWallet={(id) => {
                  setSelectedClusterId(id);
                  setShowAddWallet(true);
                }}
              />
            ))}

            <ClusterForm onSubmit={handleCreateCluster} />
          </div>

          {clusters.length === 0 && (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto mb-4" style={{ color: '#333' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 className="text-lg font-medium mb-2" style={{ color: '#f5e6c8' }}>No clusters yet</h3>
              <p className="text-gray-500 mb-4">Create your first cluster to organize your wallets</p>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {showAddWallet && (
        <AddWalletModal
          isOpen={showAddWallet}
          onClose={() => {
            setShowAddWallet(false);
            setSelectedClusterId(null);
          }}
          onAdd={handleAddWallet}
        />
      )}

      {showFROSTWizard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0, 0, 0, 0.8)' }}>
          <FROSTWizard
            onComplete={handleFROSTComplete}
            onCancel={() => setShowFROSTWizard(false)}
          />
        </div>
      )}

      {showFROSTSign && selectedFROSTKey && (
        <FROSTSignModal
          keyId={selectedFROSTKey}
          onClose={() => {
            setShowFROSTSign(false);
            setSelectedFROSTKey(null);
          }}
        />
      )}
    </div>
  );
}