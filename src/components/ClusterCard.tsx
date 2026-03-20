'use client';

import { useState, useEffect } from 'react';
import { Cluster, WalletBalance } from '@/types';
import { useZcash } from '@/hooks/useZcash';
import Link from 'next/link';

interface ClusterCardProps {
  cluster: Cluster;
  onDelete: (clusterId: string) => void;
  onAddWallet: (clusterId: string) => void;
}

export function ClusterCard({ cluster, onDelete, onAddWallet }: ClusterCardProps) {
  const { fetchBalances, isLoading: isLoadingBalances } = useZcash();
  const [balances, setBalances] = useState<WalletBalance[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);

  useEffect(() => {
    const addresses = cluster.wallets.map(w => w.address);
    if (addresses.length > 0) {
      fetchBalances(addresses).then(bals => {
        setBalances(bals);
        setTotalBalance(bals.reduce((sum, b) => sum + b.balance, 0));
      });
    }
  }, [cluster.wallets, fetchBalances]);

  const formatBalance = (amount: number) => {
    return amount.toFixed(4);
  };

  return (
    <div
      className="rounded-xl overflow-hidden transition-all hover:shadow-lg"
      style={{
        background: 'rgba(26, 26, 26, 0.6)',
        border: `1px solid ${cluster.color}40`,
        borderTop: `4px solid ${cluster.color}`
      }}
    >
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold" style={{ color: '#f5e6c8' }}>{cluster.name}</h3>
            <p className="text-sm mt-1" style={{ color: '#888' }}>{cluster.description}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onAddWallet(cluster.id)}
              className="p-2 transition-colors"
              style={{ color: '#888' }}
              title="Add wallet"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <button
              onClick={() => onDelete(cluster.id)}
              className="p-2 transition-colors hover:text-red-400"
              style={{ color: '#888' }}
              title="Delete cluster"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        <div className="rounded-lg p-4 mb-4" style={{ background: 'rgba(13, 13, 13, 0.5)' }}>
          <div className="text-sm" style={{ color: '#888' }}>Total Balance</div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold" style={{ color: '#ffd700' }}>{formatBalance(totalBalance)}</span>
            <span className="text-sm" style={{ color: '#888' }}>ZEC</span>
          </div>
          {isLoadingBalances && (
            <div className="text-xs" style={{ color: '#666' }}>Fetching balances...</div>
          )}
        </div>

        <div className="flex items-center justify-between text-sm">
          <span style={{ color: '#888' }}>
            {cluster.wallets.length} wallet{cluster.wallets.length !== 1 ? 's' : ''}
          </span>
          <Link
            href={`/cluster/${cluster.id}`}
            style={{ color: '#ffd700' }}
            className="hover:opacity-80 font-medium"
          >
            View Details →
          </Link>
        </div>
      </div>

      {cluster.wallets.length > 0 && (
        <div className="px-5 py-3 border-t" style={{ borderColor: '#2d2d2d', background: 'rgba(13, 13, 13, 0.3)' }}>
          <div className="space-y-2">
            {cluster.wallets.slice(0, 2).map(wallet => {
              const walletBalance = balances.find(b => b.address === wallet.address);
              return (
                <div key={wallet.id} className="flex justify-between text-sm">
                  <span style={{ color: '#999' }} className="truncate max-w-[150px]">{wallet.label}</span>
                  <span style={{ color: '#f5e6c8' }}>
                    {walletBalance ? formatBalance(walletBalance.balance) : '0.0000'} ZEC
                  </span>
                </div>
              );
            })}
            {cluster.wallets.length > 2 && (
              <div className="text-xs" style={{ color: '#666' }}>
                +{cluster.wallets.length - 2} more wallets
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}