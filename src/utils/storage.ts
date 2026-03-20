import { Cluster, FROSTKeyGen } from '@/types';

const isClient = typeof window !== 'undefined';

// Generic storage helpers
function getItem<T>(key: string): T | null {
  if (!isClient) return null;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
}

function setItem<T>(key: string, value: T): void {
  if (!isClient) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Storage error:', error);
  }
}

// Cluster storage
export function getClusters(): Cluster[] {
  return getItem<Cluster[]>('zcash_clusters') ?? [];
}

export function saveClusters(clusters: Cluster[]): void {
  setItem('zcash_clusters', clusters);
}

export function addCluster(cluster: Cluster): void {
  const clusters = getClusters();
  clusters.push(cluster);
  saveClusters(clusters);
}

export function updateCluster(cluster: Cluster): void {
  const clusters = getClusters();
  const index = clusters.findIndex(c => c.id === cluster.id);
  if (index !== -1) {
    clusters[index] = { ...cluster, updatedAt: Date.now() };
    saveClusters(clusters);
  }
}

export function deleteCluster(clusterId: string): void {
  const clusters = getClusters();
  const filtered = clusters.filter(c => c.id !== clusterId);
  saveClusters(filtered);
}

// FROST key storage
export function getFROSTKeys(): FROSTKeyGen[] {
  return getItem<FROSTKeyGen[]>('zcash_frost_keys') ?? [];
}

export function saveFROSTKeys(keys: FROSTKeyGen[]): void {
  setItem('zcash_frost_keys', keys);
}

export function addFROSTKey(key: FROSTKeyGen): void {
  const keys = getFROSTKeys();
  keys.push(key);
  saveFROSTKeys(keys);
}

export function deleteFROSTKey(keyId: string): void {
  const keys = getFROSTKeys();
  const filtered = keys.filter(k => k.id !== keyId);
  saveFROSTKeys(filtered);
}

// Clear all storage
export function clearAllStorage(): void {
  if (!isClient) return;
  localStorage.removeItem('zcash_clusters');
  localStorage.removeItem('zcash_frost_keys');
  localStorage.removeItem('zcash_settings');
}