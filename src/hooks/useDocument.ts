import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const useDocument = (collectionName: string, id: string | undefined) => {
    const [document, setDocument] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) {
            setLoading(false);
            return;
        }

        const ref = doc(db, collectionName, id);

        const unsubscribe = onSnapshot(ref,
            (snapshot) => {
                if (snapshot.exists()) {
                    setDocument({ ...snapshot.data(), id: snapshot.id });
                    setError(null);
                } else {
                    setError("Document does not exist");
                    setDocument(null);
                }
                setLoading(false);
            },
            (err) => {
                console.error("useDocument Error:", err);
                setError(err.message);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [collectionName, id]);

    return { document, loading, error };
};
