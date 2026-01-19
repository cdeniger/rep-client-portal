import { db } from '../lib/firebase';
import { collection, getDocs, deleteDoc, query, where, writeBatch } from 'firebase/firestore';

const cleanupMockData = async () => {
    console.log("Starting Cleanup Process (Preserving Alex Mercer)...");

    const batch = writeBatch(db);
    let operationCount = 0;

    // 1. Delete Mock Engagements (eng_mock_client_*)
    const engSnapshot = await getDocs(query(collection(db, 'engagements'), where('id', '>=', 'eng_mock_client_')));
    engSnapshot.docs.forEach(doc => {
        if (doc.id.startsWith('eng_mock_client_')) {
            batch.delete(doc.ref);
            operationCount++;
        }
    });

    // 2. Delete Mock Contacts (contact_mock_client_*)
    const contactSnapshot = await getDocs(query(collection(db, 'contacts'), where('id', '>=', 'contact_mock_client_')));
    contactSnapshot.docs.forEach(doc => {
        if (doc.id.startsWith('contact_mock_client_')) {
            batch.delete(doc.ref);
            operationCount++;
        }
    });

    // 3. Delete Mock Companies (comp_mock_client_*)
    const compSnapshot = await getDocs(query(collection(db, 'companies'), where('id', '>=', 'comp_mock_client_')));
    compSnapshot.docs.forEach(doc => {
        if (doc.id.startsWith('comp_mock_client_')) {
            batch.delete(doc.ref);
            operationCount++;
        }
    });

    // 4. Delete Mock Opportunities (opp_eng_mock_client_*)
    const oppSnapshot = await getDocs(collection(db, 'opportunities'));
    oppSnapshot.docs.forEach(doc => {
        // Checking ID pattern for opps linked to mock engagements
        if (doc.id.includes('eng_mock_client_')) {
            batch.delete(doc.ref);
            operationCount++;
        }
    });

    if (operationCount > 0) {
        await batch.commit();
        console.log(`Cleanup Complete! Deleted ${operationCount} mock records.`);
    } else {
        console.log("No mock records found to delete.");
    }
    process.exit(0);
};

cleanupMockData().catch(console.error);
