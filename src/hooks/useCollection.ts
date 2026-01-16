import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, type QueryConstraint, type DocumentData } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function useCollection<T = DocumentData>(collectionName: string, ...queryConstraints: QueryConstraint[]) {
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        setLoading(true);
        const q = query(collection(db, collectionName), ...queryConstraints);

        const unsub = onSnapshot(q,
            (querySnapshot) => {
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
    }, [collectionName]); // Note: queryConstraints dependency handling is tricky in hooks, usually requires useMemo in consumer

    return { data, loading, error };
}
