'use client';

import { useState, useEffect } from 'react';
import { Wallet, WalletBalance } from '@/types';
import { useZcash } from '@/hooks/useZcash';

interface WalletListProps {
  wallets: Wallet[];
  clusterId: string;
  onRemove: (walletId: string) => void;
  onEdit: (wallet: Wallet) => void;
}

export function WalletList({ wallets, clusterId, onRemove, onEdit }: WalletListProps) {
  const { fetchBalances, isLoading } = useZcash();
  const [balances, setBalances] = useState<Record<string, WalletBalance>>({});

  useEffect(() => {
    if (wallets.length > 0) {
      const addresses = wallets.map(w => w.address);
      fetchBalances(addresses).then(bals => {
        const balanceMap: Record<string, WalletBalance> = {};
        bals.forEach(b => {
          balanceMap[b.address] = b;
        });
        setBalances(balanceMap);
      });
    }
  }, [wallets, fetchBalances]);

  const formatAddress = (address: string) => {
    if (address.length <= 16) return address;
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  const formatBalance = (amount: number) => {
    return amount.toFixed(4);
  };

  if (wallets.length === 0) {
    return (
      <div className="text-center py-8" style={{ color: '#666' }}>
        <svg className="w-12 h-12 mx-auto mb-3" style={{ color: '#333' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        <p>No wallets in this cluster</p>
        <p className="text-sm mt-1" style={{ color: '#444' }}>Add a wallet to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {wallets.map(wallet => {
        const balance = balances[wallet.address];
        return (
          <div
            key={wallet.id}
            className="rounded-lg p-4 border transition-shadow hover:shadow-md"
            style={{ background: 'rgba(13, 13, 13, 0.5)', borderColor: '#2d2d2d' }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium truncate" style={{ color: '#f5e6c8' }}>{wallet.label}</h4>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      background: wallet.type === 'z-address' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                      color: wallet.type === 'z-address' ? '#8b5cf6' : '#3b82f6'
                    }}
                  >
                    {wallet.type === 'z-address' ? 'Shielded' : 'Transparent'}
                  </span>
                </div>
                <p className="text-sm font-mono" style={{ color: '#666' }}>{formatAddress(wallet.address)}</p>
              </div>

              <div className="text-right ml-4">
                <div className="font-semibold" style={{ color: '#ffd700' }}>
                  {balance ? formatBalance(balance.balance) : '0.0000'} ZEC
                </div>
                {balance && balance.unconfirmedBalance !== 0 && (
                  <div className="text-xs" style={{ color: '#f59e0b' }}>
                    {balance.unconfirmedBalance > 0 ? '+' : ''}
                    {formatBalance(balance.unconfirmedBalance)} pending
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 mt-3 pt-3 border-t" style={{ borderColor: '#2d2d2d' }}>
              <button
                onClick={() => onEdit(wallet)}
                className="text-sm transition-colors"
                style={{ color: '#666' }}
              >
                Edit
              </button>
              <button
                onClick={() => onRemove(wallet.id)}
                className="text-sm transition-colors hover:text-red-400"
                style={{ color: '#666' }}
              >
                Remove
              </button>
            </div>
          </div>
        );
      })}

      {isLoading && (
        <div className="text-center text-sm py-2" style={{ color: '#444' }}>
          Loading balances...
        </div>
      )}
    </div>
  );
}