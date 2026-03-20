import { create } from 'zustand';
import { Cluster, Wallet, FROSTKeyGen } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import {
  getClusters,
  saveClusters,
  addCluster as addClusterToStorage,
  updateCluster as updateClusterInStorage,
  deleteCluster as deleteClusterFromStorage,
  getFROSTKeys,
  saveFROSTKeys,
} from '@/utils/storage';

interface ClusterState {
  clusters: Cluster[];
  frostKeys: FROSTKeyGen[];
  isLoading: boolean;
  error: string | null;

  // Cluster actions
  loadClusters: () => void;
  createCluster: (name: string, description: string, color: string) => Cluster;
  updateCluster: (cluster: Cluster) => void;
  deleteCluster: (clusterId: string) => void;

  // Wallet actions
  addWallet: (clusterId: string, address: string, label: string, type: 't-address' | 'z-address') => void;
  removeWallet: (clusterId: string, walletId: string) => void;
  updateWallet: (clusterId: string, wallet: Wallet) => void;

  // FROST actions
  loadFROSTKeys: () => void;
  addFROSTKey: (key: FROSTKeyGen) => void;
  deleteFROSTKey: (keyId: string) => void;
}

export const useClusterStore = create<ClusterState>((set, get) => ({
  clusters: [],
  frostKeys: [],
  isLoading: false,
  error: null,

  loadClusters: () => {
    set({ isLoading: true });
    try {
      const clusters = getClusters();
      set({ clusters, isLoading: false, error: null });
    } catch (error) {
      set({ isLoading: false, error: 'Failed to load clusters' });
    }
  },

  createCluster: (name, description, color) => {
    const newCluster: Cluster = {
      id: uuidv4(),
      name,
      description,
      color,
      wallets: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    addClusterToStorage(newCluster);
    set(state => ({ clusters: [...state.clusters, newCluster] }));
    return newCluster;
  },

  updateCluster: (cluster) => {
    updateClusterInStorage(cluster);
    set(state => ({
      clusters: state.clusters.map(c => c.id === cluster.id ? { ...cluster, updatedAt: Date.now() } : c),
    }));
  },

  deleteCluster: (clusterId) => {
    deleteClusterFromStorage(clusterId);
    set(state => ({
      clusters: state.clusters.filter(c => c.id !== clusterId),
    }));
  },

  addWallet: (clusterId, address, label, type) => {
    const newWallet: Wallet = {
      id: uuidv4(),
      address,
      label,
      type,
      createdAt: Date.now(),
    };
    const clusters = getClusters();
    const cluster = clusters.find(c => c.id === clusterId);
    if (cluster) {
      cluster.wallets.push(newWallet);
      cluster.updatedAt = Date.now();
      saveClusters(clusters);
      set({ clusters: [...clusters] });
    }
  },

  removeWallet: (clusterId, walletId) => {
    const clusters = getClusters();
    const cluster = clusters.find(c => c.id === clusterId);
    if (cluster) {
      cluster.wallets = cluster.wallets.filter(w => w.id !== walletId);
      cluster.updatedAt = Date.now();
      saveClusters(clusters);
      set({ clusters: [...clusters] });
    }
  },

  updateWallet: (clusterId, wallet) => {
    const clusters = getClusters();
    const cluster = clusters.find(c => c.id === clusterId);
    if (cluster) {
      const index = cluster.wallets.findIndex(w => w.id === wallet.id);
      if (index !== -1) {
        cluster.wallets[index] = wallet;
        cluster.updatedAt = Date.now();
        saveClusters(clusters);
        set({ clusters: [...clusters] });
      }
    }
  },

  loadFROSTKeys: () => {
    const keys = getFROSTKeys();
    set({ frostKeys: keys });
  },

  addFROSTKey: (key) => {
    const keys = getFROSTKeys();
    keys.push(key);
    saveFROSTKeys(keys);
    set({ frostKeys: [...keys] });
  },

  deleteFROSTKey: (keyId) => {
    const keys = getFROSTKeys();
    const filtered = keys.filter(k => k.id !== keyId);
    saveFROSTKeys(filtered);
    set({ frostKeys: filtered });
  },
}));