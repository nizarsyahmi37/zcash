import { useEffect, useCallback } from 'react';
import { useClusterStore } from '@/stores/clusterStore';
import { Cluster, Wallet } from '@/types';

export function useClusters() {
  const {
    clusters,
    isLoading,
    error,
    loadClusters,
    createCluster,
    updateCluster,
    deleteCluster,
    addWallet,
    removeWallet,
    updateWallet,
  } = useClusterStore();

  useEffect(() => {
    loadClusters();
  }, [loadClusters]);

  const createNewCluster = useCallback(
    (name: string, description: string, color: string) => {
      return createCluster(name, description, color);
    },
    [createCluster]
  );

  const editCluster = useCallback(
    (cluster: Cluster) => {
      updateCluster(cluster);
    },
    [updateCluster]
  );

  const removeCluster = useCallback(
    (clusterId: string) => {
      deleteCluster(clusterId);
    },
    [deleteCluster]
  );

  const addWalletToCluster = useCallback(
    (clusterId: string, address: string, label: string, type: 't-address' | 'z-address') => {
      addWallet(clusterId, address, label, type);
    },
    [addWallet]
  );

  const removeWalletFromCluster = useCallback(
    (clusterId: string, walletId: string) => {
      removeWallet(clusterId, walletId);
    },
    [removeWallet]
  );

  const editWallet = useCallback(
    (clusterId: string, wallet: Wallet) => {
      updateWallet(clusterId, wallet);
    },
    [updateWallet]
  );

  const getCluster = useCallback(
    (clusterId: string): Cluster | undefined => {
      return clusters.find(c => c.id === clusterId);
    },
    [clusters]
  );

  const getTotalBalance = useCallback(
    (addresses: string[]): number => {
      // This will be handled by useZcash hook
      return 0;
    },
    []
  );

  return {
    clusters,
    isLoading,
    error,
    createNewCluster,
    editCluster,
    removeCluster,
    addWalletToCluster,
    removeWalletFromCluster,
    editWallet,
    getCluster,
    getTotalBalance,
  };
}