import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, Timestamp, query, orderBy, limit } from 'firebase/firestore';
import { Grid, CityStats } from '../types';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export interface CitySnapshot {
  id?: string;
  grid: Grid;
  stats: CityStats;
  timestamp: Timestamp;
  author: string;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {},
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}

export const saveCitySnapshot = async (grid: Grid, stats: CityStats, author: string = "Anonymous Mayor") => {
  try {
    const docRef = await addDoc(collection(db, 'city_snapshots'), {
      grid: JSON.stringify(grid),
      stats,
      author,
      timestamp: Timestamp.now()
    });
    return docRef.id;
  } catch (e) {
    handleFirestoreError(e, OperationType.CREATE, 'city_snapshots');
    throw e;
  }
};

export const getCitySnapshots = async (): Promise<CitySnapshot[]> => {
  try {
    const q = query(collection(db, 'city_snapshots'), orderBy('timestamp', 'desc'), limit(10));
    const querySnapshot = await getDocs(q);
    const snapshots: CitySnapshot[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      snapshots.push({
        id: doc.id,
        grid: JSON.parse(data.grid),
        stats: data.stats,
        timestamp: data.timestamp,
        author: data.author
      });
    });
    return snapshots;
  } catch (e) {
    handleFirestoreError(e, OperationType.LIST, 'city_snapshots');
    console.error("Error fetching snapshots: ", e);
    return [];
  }
};
