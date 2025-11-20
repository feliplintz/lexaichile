import { Case, NormativeDoc } from '../types';

const DB_NAME = 'LexChileDB';
const VERSION = 1;
const STORES = { CASES: 'cases', NORMS: 'norms' };

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error("IndexedDB not supported"));
      return;
    }
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORES.CASES)) {
        db.createObjectStore(STORES.CASES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.NORMS)) {
        db.createObjectStore(STORES.NORMS, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
};

export const dbService = {
  async getAllCases(): Promise<Case[]> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORES.CASES, 'readonly');
        const req = tx.objectStore(STORES.CASES).getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } catch (error) {
      console.error("Error getting cases from DB:", error);
      return [];
    }
  },
  async saveCase(data: Case): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.CASES, 'readwrite');
      tx.objectStore(STORES.CASES).put(data);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },
  async deleteCase(id: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.CASES, 'readwrite');
      tx.objectStore(STORES.CASES).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },
  async getAllNorms(): Promise<NormativeDoc[]> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORES.NORMS, 'readonly');
        const req = tx.objectStore(STORES.NORMS).getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } catch (error) {
      console.error("Error getting norms from DB:", error);
      return [];
    }
  },
  async saveNorm(data: NormativeDoc): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.NORMS, 'readwrite');
      tx.objectStore(STORES.NORMS).put(data);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },
  async deleteNorm(id: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.NORMS, 'readwrite');
      tx.objectStore(STORES.NORMS).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
};