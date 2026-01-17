import { collection, query, where, getDocs, addDoc, doc, getDoc } from 'firebase/firestore';
import { db } from './firebase.ts'; // Assumes db is exported from here
import type { Company } from '../types/schema.ts';

const COMPANIES_COLLECTION = 'companies';

/**
 * Finds a company by name (case-insensitive) or creates a new one.
 * @param name The name of the company (e.g. "Stripe")
 * @returns The ID of the found or created company.
 */
export async function findOrCreateCompany(name: string): Promise<string> {
    const trimmedName = name.trim();
    if (!trimmedName) {
        throw new Error("Company name cannot be empty");
    }

    const nameLower = trimmedName.toLowerCase();
    const companiesRef = collection(db, COMPANIES_COLLECTION);

    // 1. Try to find by lower-case name (best for deduplication)
    const q = query(companiesRef, where('name_lower', '==', nameLower));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        // Found existing company
        return querySnapshot.docs[0].id;
    }

    // 2. Create new company
    const newCompany: Omit<Company, 'id'> = {
        name: trimmedName, // Store original casing for display
        name_lower: nameLower,
        createdAt: new Date().toISOString()
    };

    const docRef = await addDoc(companiesRef, newCompany);
    return docRef.id;
}

/**
 * Retrieves a company by ID.
 */
export async function getCompany(id: string): Promise<Company | null> {
    const docRef = doc(db, COMPANIES_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Company;
    } else {
        return null;
    }
}
