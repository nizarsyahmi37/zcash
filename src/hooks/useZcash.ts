import { useState, useCallback, useEffect } from 'react';
import { WalletBalance, ClusterBalance } from '@/types';
import { getBalance, getBalances, checkConnection, getDemoBalance } from '@/lib/zcash-client';

export function useZcash() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [endpoint, setEndpoint] = useState<string>('');
  const [demoMode, setDemoMode] = useState(false);

  // Check connection on mount
  const checkServerConnection = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await checkConnection();
      setIsConnected(result.connected);
      setEndpoint(result.endpoint);
      if (result.error) {
        setError(result.error);
      }
      return result.connected;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Connection failed';
      setError(message);
      setIsConnected(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch single wallet balance
  const fetchBalance = useCallback(async (address: string, useDemoFallback = true): Promise<WalletBalance> => {
    setIsLoading(true);
    setError(null);
    try {
      const balance = await getBalance(address);
      if (balance.balance === 0 && useDemoFallback) {
        // Try demo mode if real balance is 0
        setDemoMode(true);
      }
      return balance;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch balance';
      setError(message);

      // Fallback to demo mode
      if (useDemoFallback) {
        setDemoMode(true);
        return getDemoBalance(address);
      }

      return {
        address,
        balance: 0,
        shieldedBalance: 0,
        transparentBalance: 0,
        unconfirmedBalance: 0,
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch balances for multiple addresses
  const fetchBalances = useCallback(async (addresses: string[], useDemoFallback = true): Promise<WalletBalance[]> => {
    if (addresses.length === 0) return [];

    setIsLoading(true);
    setError(null);
    try {
      const balances = await getBalances(addresses);

      // If all balances are 0, switch to demo mode
      if (useDemoFallback && balances.every(b => b.balance === 0)) {
        setDemoMode(true);
        return addresses.map(addr => getDemoBalance(addr));
      }

      return balances;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch balances';
      setError(message);

      // Fallback to demo mode
      if (useDemoFallback) {
        setDemoMode(true);
        return addresses.map(addr => getDemoBalance(addr));
      }

      return addresses.map(address => ({
        address,
        balance: 0,
        shieldedBalance: 0,
        transparentBalance: 0,
        unconfirmedBalance: 0,
      }));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Calculate cluster totals
  const calculateClusterBalance = useCallback(
    (clusterId: string, addresses: string[]): Promise<ClusterBalance> => {
      return fetchBalances(addresses).then(walletBalances => ({
        clusterId,
        totalBalance: walletBalances.reduce((sum, b) => sum + b.balance, 0),
        walletBalances,
      }));
    },
    [fetchBalances]
  );

  // Calculate total across all clusters
  const calculateTotalBalance = useCallback(
    async (clusterAddressLists: Record<string, string[]>): Promise<number> => {
      const allAddresses = Object.values(clusterAddressLists).flat();
      if (allAddresses.length === 0) return 0;

      try {
        const balances = await getBalances(allAddresses);
        return balances.reduce((sum, b) => sum + b.balance, 0);
      } catch {
        // Fallback to demo mode
        return allAddresses.reduce((sum, addr) => sum + getDemoBalance(addr).balance, 0);
      }
    },
    []
  );

  return {
    isConnected,
    isLoading,
    error,
    endpoint,
    demoMode,
    checkServerConnection,
    fetchBalance,
    fetchBalances,
    calculateClusterBalance,
    calculateTotalBalance,
  };
}