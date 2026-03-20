import { WalletBalance } from '@/types';

// Get API key from env or localStorage
function getApiKey(): string {
  if (process.env.NEXT_PUBLIC_NOWNODES_API_KEY) {
    return process.env.NEXT_PUBLIC_NOWNODES_API_KEY;
  }
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

// Zcash mainnet lightwalletd
const MAINNET_SERVER = 'https://mainnet.zecwallet.co';

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

async function mainnetCall<T>(method: string, params: unknown[] = []): Promise<T> {
  const response = await fetch(`${MAINNET_SERVER}/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error.message || 'RPC error');
  }
  return data.result;
}

// Get balance from mainnet
export async function getBalance(address: string): Promise<WalletBalance> {
  try {
    const result = await mainnetCall<any>('getaddressbalance', [{ address }]);
    const satoshis = result || 0;
    return {
      address,
      balance: satoshis / 100000000,
      shieldedBalance: satoshis / 100000000,
      transparentBalance: 0,
      unconfirmedBalance: 0,
    };
  } catch (err) {
    console.error('Mainnet error:', err);
    return {
      address, balance: 0, shieldedBalance: 0, transparentBalance: 0, unconfirmedBalance: 0
    };
  }
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
  try {
    await mainnetCall<any>('getinfo');
    return { connected: true, endpoint: 'Zcash Mainnet' };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Connection failed';
    return { connected: false, endpoint: 'Zcash Mainnet', error: errorMsg };
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
  try {
    return await mainnetCall<any[]>('getaddresstransactions', [{ address }]);
  } catch { return []; }
}

export async function getUTXOs(address: string): Promise<any[]> {
  try {
    return await mainnetCall<any[]>('getaddressutxos', [{ address }]);
  } catch { return []; }
}