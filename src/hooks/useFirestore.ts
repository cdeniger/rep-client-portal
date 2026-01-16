import { useState, useEffect } from 'react';
import { doc, onSnapshot, getDoc, type DocumentData } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function useDocument<T = DocumentData>(collectionName: string, docId: string) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!docId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        const unsub = onSnapshot(doc(db, collectionName, docId),
            (docSnap) => {
                if (docSnap.exists()) {
                    setData(docSnap.data() as T);
                } else {
                    setData(null);
                }
                setLoading(false);
            },
            (err) => {
                console.error("Firestore Error:", err);
                setError(err);
                setLoading(false);
            }
        );

        return () => unsub();
    }, [collectionName, docId]);

    return { data, loading, error };
}

export async function fetchDocument<T = DocumentData>(collectionName: string, docId: string): Promise<T | null> {
    try {
        const docSnap = await getDoc(doc(db, collectionName, docId));
        if (docSnap.exists()) {
            return docSnap.data() as T;
        }
        return null;
    } catch (err) {
        console.error("Fetch Error:", err);
        throw err;
    }
}
