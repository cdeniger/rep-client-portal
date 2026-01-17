import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, type QueryConstraint, type DocumentData } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function useCollection<T = DocumentData>(collectionName: string, ...queryConstraints: QueryConstraint[]) {
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        console.log(`[useCollection] Hook triggered for ${collectionName}`, queryConstraints);
        setLoading(true);
        const q = query(collection(db, collectionName), ...queryConstraints);

        const unsub = onSnapshot(q,
            (querySnapshot) => {
                console.log(`[useCollection] Snapshot received for ${collectionName}. Docs:`, querySnapshot.docs.length);
                const documents = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as T[];
                setData(documents);
                setLoading(false);
            },
            (err) => {
                console.error("Firestore Collection Error:", err);
                setError(err);
                setLoading(false);
            }
        );

        return () => unsub();
    }, [collectionName, JSON.stringify(queryConstraints)]); // Re-run when query parameters change

    return { data, loading, error };
}
