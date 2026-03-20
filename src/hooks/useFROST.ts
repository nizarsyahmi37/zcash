import { useState, useCallback, useEffect } from 'react';
import { useClusterStore } from '@/stores/clusterStore';
import { FROSTKeyGen, FROSTParticipant, KeyGenSession } from '@/types';
import {
  createKeyGenSession,
  addParticipant,
  createFROSTWallet,
  realFROSTSign,
  validateKeyGen,
  generateFROSTParticipantKeys,
} from '@/lib/frost-service';

export function useFROST() {
  const { frostKeys, loadFROSTKeys, addFROSTKey, deleteFROSTKey } = useClusterStore();
  const [currentSession, setCurrentSession] = useState<KeyGenSession | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadFROSTKeys();
  }, [loadFROSTKeys]);

  // Start a new key generation session
  const startKeyGen = useCallback(
    (threshold: number, totalParticipants: number, myIndex: number) => {
      const session = createKeyGenSession(threshold, totalParticipants, myIndex);
      setCurrentSession(session);
      return session;
    },
    []
  );

  // Add participant to session
  const addSessionParticipant = useCallback(
    (publicKey: string) => {
      if (!currentSession) return null;
      const participant = addParticipant(currentSession, publicKey);
      setCurrentSession({ ...currentSession });
      return participant;
    },
    [currentSession]
  );

  // Complete key generation and save - NOW WITH REAL KEYS
  const completeKeyGen = useCallback(async (name: string): Promise<FROSTKeyGen> => {
    if (!currentSession || currentSession.participants.length === 0) {
      throw new Error('No participants in session');
    }

    setIsProcessing(true);
    try {
      // Generate REAL cryptographic keys for each participant
      const participantKeys = await generateFROSTParticipantKeys(
        currentSession.participants.length
      );

      // Create real FROST wallet with actual keys
      const keyGen = await createFROSTWallet(
        currentSession.threshold,
        currentSession.participants
      );

      // Store the key pairs with proper indexing
      const keyGenWithKeys: FROSTKeyGen = {
        ...keyGen,
        id: name.toLowerCase().replace(/\s+/g, '-'),
        // We store the participant key data in the participants array
        participants: keyGen.participants.map((p, i) => ({
          ...p,
          publicKey: participantKeys[i]?.publicKey || p.publicKey,
          // Note: In production, NEVER store private keys like this
          // This is for demo purposes only
          privateKeyHex: participantKeys[i]?.privateKey || '',
        })),
      };

      addFROSTKey(keyGenWithKeys);
      setCurrentSession(null);
      return keyGenWithKeys;
    } finally {
      setIsProcessing(false);
    }
  }, [currentSession, addFROSTKey]);

  // Sign a message with threshold participants - NOW WITH REAL CRYPTO
  const sign = useCallback(
    async (keyGenId: string, signerIndices: number[], message: string): Promise<string> => {
      const keyGen = frostKeys.find(k => k.id === keyGenId);
      if (!keyGen) {
        throw new Error('FROST key not found');
      }

      if (!validateKeyGen(keyGen)) {
        throw new Error('Invalid FROST key configuration');
      }

      if (!message || message.trim().length === 0) {
        throw new Error('Message is required');
      }

      setIsProcessing(true);
      try {
        // Use REAL cryptographic signing
        const signature = await realFROSTSign(keyGen, signerIndices, message);
        return signature;
      } catch (err) {
        console.error('Signing error:', err);
        throw err;
      } finally {
        setIsProcessing(false);
      }
    },
    [frostKeys]
  );

  // Remove a FROST key
  const removeFROSTKey = useCallback(
    (keyId: string) => {
      deleteFROSTKey(keyId);
    },
    [deleteFROSTKey]
  );

  // Get a specific key by ID
  const getKey = useCallback(
    (keyId: string): FROSTKeyGen | undefined => {
      return frostKeys.find(k => k.id === keyId);
    },
    [frostKeys]
  );

  // Cancel current session
  const cancelSession = useCallback(() => {
    setCurrentSession(null);
  }, []);

  return {
    frostKeys,
    currentSession,
    isProcessing,
    startKeyGen,
    addSessionParticipant,
    completeKeyGen,
    sign,
    removeFROSTKey,
    getKey,
    cancelSession,
    addFROSTKey,
  };
}