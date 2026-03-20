import { WalletBalance, LightwalletdInfo } from '@/types';

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
function getSettings(): { endpoint?: string; useNownodes?: boolean; useLightwalletd?: boolean } {
  if (typeof window !== 'undefined') {
    return {
      endpoint: localStorage.getItem('zcash_custom_endpoint') || undefined,
      useNownodes: localStorage.getItem('zcash_use_nownodes') === 'true',
      useLightwalletd: localStorage.getItem('zcash_use_lightwalletd') === 'true'
    };
  }
  return {};
}

// Nownodes blockbook endpoint
const NOWNODES_BASE = 'https://zec.nownodes.io/api/v2';

// Multiple lightwalletd servers (no auth required for mainnet)
const LIGHTWALLETD_SERVERS = [
  'https://mainnet.zecwallet.co:443',
  'https://zcash.electriccoin.co:9067',
  'https://zec.lightwalletd.com:9067',
  'http://localhost:9067',
];

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

async function lightwalletdCall<T>(method: string, params: unknown[] = []): Promise<T> {
  for (const server of LIGHTWALLETD_SERVERS) {
    try {
      const response = await fetch(`${server}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
      });

      if (response.ok) {
        const data = await response.json();
        if (!data.error) return data.result;
      }
    } catch { continue; }
  }
  throw new Error('Could not connect to any Zcash server');
}

// Get balance - try multiple methods
export async function getBalance(address: string): Promise<WalletBalance> {
  const settings = getSettings();
  const apiKey = getApiKey();

  // 1. Try Nownodes if enabled and has API key
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

  // 2. Try lightwalletd servers (no auth needed)
  try {
    const result = await lightwalletdCall<any>('getbalance', [address]);
    return {
      address,
      balance: (result.balance || 0) / 100000000,
      shieldedBalance: (result.balance || 0) / 100000000,
      transparentBalance: 0,
      unconfirmedBalance: (result.unconfirmed_balance || 0) / 100000000,
    };
  } catch {
    // 3. Try getaddressbalance as fallback
    try {
      const result = await lightwalletdCall<any>('getaddressbalance', [{ address }]);
      return {
        address,
        balance: (result || 0) / 100000000,
        shieldedBalance: (result || 0) / 100000000,
        transparentBalance: 0,
        unconfirmedBalance: 0,
      };
    } catch (err) {
      console.error('All balance methods failed:', err);
      return {
        address, balance: 0, shieldedBalance: 0, transparentBalance: 0, unconfirmedBalance: 0
      };
    }
  }
}

export async function getBalances(addresses: string[]): Promise<WalletBalance[]> {
  return Promise.all(addresses.map(getBalance));
}

export async function getTotalBalance(addresses: string[]): Promise<number> {
  const balances = await getBalances(addresses);
  return balances.reduce((sum, b) => sum + b.balance, 0);
}

export async function getServerInfo(): Promise<LightwalletdInfo> {
  return lightwalletdCall<LightwalletdInfo>('getinfo');
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
  const settings = getSettings();
  const apiKey = getApiKey();

  // Try Nownodes
  if (settings.useNownodes && apiKey) {
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

  // Try lightwalletd
  try {
    await getServerInfo();
    return { connected: true, endpoint: 'Lightwalletd' };
  } catch (err) {
    return { connected: false, endpoint: 'Lightwalletd', error: 'Could not connect to any server' };
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