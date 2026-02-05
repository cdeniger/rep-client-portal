import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';

dotenv.config();


admin.initializeApp();

// Triggers
export { onIntakeCreated } from './triggers/onIntakeCreated';
export { provisionClient } from './provisionClient';
export { onApplicationCreate } from './triggers/onApplicationCreate';
export { sendApplicationResponse } from './triggers/sendApplicationResponse';
export { generateApplicationDraftTrigger as generateApplicationDraft } from './triggers/generateApplicationDraft';


export { onClientPlaced } from './triggers/onClientPlaced'; // Ensure this exists or was inline?
export { runAtsSimulation } from './triggers/runAtsSimulation';
