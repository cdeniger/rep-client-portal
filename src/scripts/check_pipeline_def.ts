import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

const checkPipeline = async () => {
    const docRef = doc(db, 'pipeline_definitions', 'delivery_v1');
    const snap = await getDoc(docRef);

    if (snap.exists()) {
        const data = snap.data();
        const hasShadow = data.stages.find((s: any) => s.id === 'the_shadow');
        console.log(`Pipeline 'delivery_v1' found.`);
        console.log(`Contains 'the_shadow' stage? ${!!hasShadow}`);
        if (hasShadow) {
            console.log("The 'the_shadow' stage persists in Firestore!");
        } else {
            console.log("The 'the_shadow' stage is ABSENT from Firestore (Clean).");
        }
    } else {
        console.log("Pipeline 'delivery_v1' does not exist in Firestore.");
    }
    process.exit(0);
};

checkPipeline().catch(console.error);
