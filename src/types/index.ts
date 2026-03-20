// Wallet types
export interface Wallet {
  id: string;
  address: string;
  label: string;
  type: 't-address' | 'z-address';
  createdAt: number;
}

// Cluster types
export interface Cluster {
  id: string;
  name: string;
  description: string;
  color: string;
  wallets: Wallet[];
  createdAt: number;
  updatedAt: number;
}

// FROST Multi-sig types
export interface FROSTParticipant {
  id: string;
  index: number;
  publicKey: string;
  committedShares: string[];
}

export interface FROSTKeyGen {
  id: string;
  threshold: number;
  totalParticipants: number;
  participants: FROSTParticipant[];
  sharedPublicKey: string;
  createdAt: number;
}

// FROST Key Generation Session
export interface KeyGenSession {
  id: string;
  threshold: number;
  totalParticipants: number;
  phase: 'setup' | 'commitment' | 'keygen' | 'complete';
  participants: FROSTParticipant[];
  myIndex: number;
  myPrivateKey?: string;
  commitments: string[];
}

// Balance types
export interface WalletBalance {
  address: string;
  balance: number;
  shieldedBalance: number;
  transparentBalance: number;
  unconfirmedBalance: number;
}

export interface ClusterBalance {
  clusterId: string;
  totalBalance: number;
  walletBalances: WalletBalance[];
}

// Transaction types
export interface Transaction {
  txid: string;
  blockHeight: number;
  timestamp: number;
  amount: number;
  type: 'send' | 'receive';
  memo?: string;
}

// API Response types
export interface LightwalletdInfo {
  version: string;
  vendor: string;
 _testnet: boolean;
}

// Storage keys
export const STORAGE_KEYS = {
  CLUSTERS: 'zcash_clusters',
  FROST_KEYS: 'zcash_frost_keys',
  SETTINGS: 'zcash_settings',
} as const;

// Default colors for clusters
export const CLUSTER_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
] as const;