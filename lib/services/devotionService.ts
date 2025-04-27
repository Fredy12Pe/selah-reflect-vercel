import {
  collection,
  doc,
  getDoc,
  setDoc,
  query,
  where,
  getDocs,
  Timestamp,
  orderBy,
  limit,
} from 'firebase/firestore';
import { getFirebaseDb, getFirebaseAuth } from '@/lib/firebase/firebase';
import { Devotion, DevotionInput, Meta, Hymn } from '@/lib/types/devotion';

const DEVOTIONS_COLLECTION = 'devotions';
const META_COLLECTION = 'meta';

export async function getDevotionByDate(date: string): Promise<Devotion | null> {
  try {
    console.log('Getting devotion for date:', date);
    
    const response = await fetch(`/api/devotions/${date}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      const data = await response.json();
      if (response.status === 401) {
        throw new Error('You must be signed in to access devotions');
      }
      throw new Error(data.error || 'Failed to fetch devotion');
    }

    const devotionData = await response.json();
    return devotionData as Devotion;
  } catch (error: any) {
    console.error('Error fetching devotion:', error);
    throw error;
  }
}

export async function createOrUpdateDevotion(devotionInput: DevotionInput): Promise<void> {
  try {
    const { date, ...devotionData } = devotionInput;
    const db = getFirebaseDb();
    if (!db) {
      throw new Error('Database not initialized');
    }

    const devotionRef = doc(db, DEVOTIONS_COLLECTION, date);
    await setDoc(devotionRef, devotionData, { merge: true });
  } catch (error: any) {
    console.error('Error saving devotion:', error);
    if (error.code === 'permission-denied') {
      throw new Error('You do not have permission to save devotions.');
    }
    throw new Error('Failed to save devotion. Please try again later.');
  }
}

export async function getHymnByMonth(month: string): Promise<Hymn | null> {
  try {
    const db = getFirebaseDb();
    if (!db) {
      console.log('Database not initialized');
      return null;
    }
    
    const metaRef = doc(db, META_COLLECTION, 'hymns');
    const metaSnap = await getDoc(metaRef);

    if (!metaSnap.exists()) {
      console.log('No hymns data found');
      return null;
    }

    const hymns = metaSnap.data() as { [month: string]: Hymn };
    return hymns[month] || null;
  } catch (error) {
    console.error('Error fetching hymn:', error);
    throw new Error('Failed to fetch hymn');
  }
}

export async function createOrUpdateMeta(meta: Meta): Promise<void> {
  try {
    const db = getFirebaseDb();
    if (!db) {
      throw new Error('Database not initialized');
    }
    
    const metaRef = doc(db, META_COLLECTION, 'hymns');
    await setDoc(metaRef, meta.hymns, { merge: true });
  } catch (error) {
    console.error('Error saving meta:', error);
    throw new Error('Failed to save meta');
  }
}

export async function getDevotionsInRange(startDate: string, endDate: string): Promise<Devotion[]> {
  try {
    const db = getFirebaseDb();
    if (!db) {
      console.log('Database not initialized');
      return [];
    }
    
    const q = query(
      collection(db, DEVOTIONS_COLLECTION),
      where('id', '>=', startDate),
      where('id', '<=', endDate),
      orderBy('id', 'asc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    })) as Devotion[];
  } catch (error) {
    console.error('Error getting devotions:', error);
    throw new Error('Failed to get devotions');
  }
}

export async function getLatestDevotion(): Promise<Devotion | null> {
  try {
    const db = getFirebaseDb();
    if (!db) {
      console.log('Database not initialized');
      return null;
    }
    
    const q = query(
      collection(db, DEVOTIONS_COLLECTION),
      orderBy('id', 'desc'),
      limit(1)
    );

    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    return {
      ...doc.data(),
      id: doc.id,
    } as Devotion;
  } catch (error) {
    console.error('Error getting latest devotion:', error);
    throw new Error('Failed to get latest devotion');
  }
} 