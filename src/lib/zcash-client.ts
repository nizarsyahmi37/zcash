import { WalletBalance } from '@/types';

// Get API key from env or localStorage
function getApiKey(): string {
  // First check environment variable
  if (process.env.NEXT_PUBLIC_NOWNODES_API_KEY) {
    return process.env.NEXT_PUBLIC_NOWNODES_API_KEY;
  }
  // Then check localStorage
  if (typeof window !== 'undefined') {
    return localStorage.getItem('zcash_api_key') || '';
  }
  return '';
}

// Get settings from localStorage
function getSettings(): { useNownodes?: boolean } {
  if (typeof window !== 'undefined') {
    return {
      useNownodes: localStorage.getItem('zcash_use_nownodes') === 'true'
    };
  }
  return {};
}

// Nownodes blockbook endpoint
const NOWNODES_BASE = 'https://zec.nownodes.io/api/v2';

async function nownodesCall<T>(path: string): Promise<T> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('API key required');

  const response = await fetch(`${NOWNODES_BASE}${path}`, {
    headers: {
      'api-key': apiKey,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP ${response.status}`);
  }

  return response.json();
}

// Get balance using Nownodes
export async function getBalance(address: string): Promise<WalletBalance> {
  const settings = getSettings();
  const apiKey = getApiKey();

  // Try Nownodes if enabled and has API key
  if (settings.useNownodes && apiKey) {
    try {
      const result = await nownodesCall<any>(`/address/${address}`);
      return {
        address,
        balance: parseFloat(result.balance) || 0,
        unconfirmedBalance: parseFloat(result.unconfirmedBalance) || 0,
        transparentBalance: parseFloat(result.balance) || 0,
        shieldedBalance: 0,
      };
    } catch (err) {
      console.error('Nownodes error:', err);
    }
  }

  return {
    address, balance: 0, shieldedBalance: 0, transparentBalance: 0, unconfirmedBalance: 0
  };
}

export async function getBalances(addresses: string[]): Promise<WalletBalance[]> {
  return Promise.all(addresses.map(getBalance));
}

export async function getTotalBalance(addresses: string[]): Promise<number> {
  const balances = await getBalances(addresses);
  return balances.reduce((sum, b) => sum + b.balance, 0);
}

export function isValidZcashAddress(address: string): boolean {
  if (!address || address.length < 20) return false;
  return /^[tz][a-zA-Z0-9]+$/.test(address);
}

export function getAddressType(address: string): 't-address' | 'z-address' | null {
  if (!address || address.length < 20) return null;
  if (/^t[a-zA-Z0-9]+$/.test(address)) return 't-address';
  if (/^z[a-zA-Z0-9]+$/.test(address)) return 'z-address';
  return null;
}

export async function checkConnection(): Promise<{ connected: boolean; endpoint: string; error?: string }> {
  const apiKey = getApiKey();

  if (!apiKey) {
    return { connected: false, endpoint: 'Nownodes', error: 'API key not configured' };
  }

  try {
    await nownodesCall<any>('/address/tmRs5wP4FHcyPLXKHDHWzV7a9R4oN6gV5oX');
    return { connected: true, endpoint: 'Nownodes' };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : '';
    if (errorMsg.includes('Unknown API_key')) {
      return { connected: false, endpoint: 'Nownodes', error: 'Invalid API key - check your Nownodes dashboard' };
    }
    return { connected: false, endpoint: 'Nownodes', error: errorMsg };
  }
}

export function getDemoBalance(address: string): WalletBalance {
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = ((hash << 5) - hash) + address.charCodeAt(i);
    hash = hash & hash;
  }
  return {
    address,
    balance: Math.abs(hash % 100) / 100,
    shieldedBalance: Math.abs(hash % 100) / 100 * 0.8,
    transparentBalance: Math.abs(hash % 100) / 100 * 0.2,
    unconfirmedBalance: 0,
  };
}

export async function getTransactions(address: string): Promise<any[]> {
  const settings = getSettings();
  const apiKey = getApiKey();
  if (settings.useNownodes && apiKey) {
    try {
      const result = await nownodesCall<any>(`/address/${address}`);
      return result.transactions || [];
    } catch { return []; }
  }
  return [];
}

export async function getUTXOs(address: string): Promise<any[]> {
  const settings = getSettings();
  const apiKey = getApiKey();
  if (settings.useNownodes && apiKey) {
    try {
      return await nownodesCall<any[]>(`/utxo/${address}`);
    } catch { return []; }
  }
  return [];
}