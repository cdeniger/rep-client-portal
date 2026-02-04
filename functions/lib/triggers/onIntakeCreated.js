"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onIntakeCreated = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
exports.onIntakeCreated = functions.firestore
    .document('intake_responses/{intakeId}')
    .onCreate(async (snap, context) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2;
    const intakeData = snap.data();
    const userId = intakeData.userId; // Assuming userId is on the intake doc
    if (!userId) {
        console.log('No userId on intake document, skipping hydration.');
        return;
    }
    console.log(`Processing Intake ${context.params.intakeId} for User ${userId}`);
    try {
        // 1. Check if Engagement already exists
        const engagementQuery = await db.collection('engagements')
            .where('userId', '==', userId)
            .limit(1)
            .get();
        if (!engagementQuery.empty) {
            console.log(`Engagement already exists for user ${userId}. Skipping auto-creation.`);
            return;
        }
        // 2. Map Data (Strict schema alignment)
        // We assume intakeData matches the expected IntakeResponse structure
        const newEngagement = {
            userId: userId,
            status: 'active',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            // Profile Mapping
            profile: {
                firstName: (_a = intakeData.profile) === null || _a === void 0 ? void 0 : _a.firstName,
                lastName: (_b = intakeData.profile) === null || _b === void 0 ? void 0 : _b.lastName,
                headline: ((_c = intakeData.profile) === null || _c === void 0 ? void 0 : _c.headline) || ((_d = intakeData.profile) === null || _d === void 0 ? void 0 : _d.currentTitle),
                pod: ((_e = intakeData.profile) === null || _e === void 0 ? void 0 : _e.industry) || 'General',
                // Direct Hydration
                currentTitle: (_f = intakeData.profile) === null || _f === void 0 ? void 0 : _f.currentTitle,
                currentCompany: (_g = intakeData.profile) === null || _g === void 0 ? void 0 : _g.currentCompany,
                industry: (_h = intakeData.profile) === null || _h === void 0 ? void 0 : _h.industry,
                experienceBand: (_j = intakeData.profile) === null || _j === void 0 ? void 0 : _j.experienceBand,
                marketIdentity: intakeData.marketIdentity
            },
            // Strategy Mapping (Direct copy of buckets)
            strategy: {
                trajectory: intakeData.trajectory,
                horizon: intakeData.horizon,
                ownership: intakeData.ownership,
                authority: intakeData.authority,
                comp: intakeData.comp
            },
            // Target Parameters (Hard & Soft Constraints)
            targetParameters: {
                // Hard Constraints
                minBase: (_l = (_k = intakeData.filters) === null || _k === void 0 ? void 0 : _k.hardConstraints) === null || _l === void 0 ? void 0 : _l.minBase,
                minTotalComp: (_o = (_m = intakeData.filters) === null || _m === void 0 ? void 0 : _m.hardConstraints) === null || _o === void 0 ? void 0 : _o.minTotalComp,
                minLevel: (_q = (_p = intakeData.filters) === null || _p === void 0 ? void 0 : _p.hardConstraints) === null || _q === void 0 ? void 0 : _q.minLevel,
                maxCommuteMinutes: (_s = (_r = intakeData.filters) === null || _r === void 0 ? void 0 : _r.hardConstraints) === null || _s === void 0 ? void 0 : _s.maxCommuteMinutes,
                relocationWillingness: (_u = (_t = intakeData.filters) === null || _t === void 0 ? void 0 : _t.hardConstraints) === null || _u === void 0 ? void 0 : _u.relocationWillingness,
                // Soft Preferences
                preferredIndustries: (_w = (_v = intakeData.filters) === null || _v === void 0 ? void 0 : _v.softPreferences) === null || _w === void 0 ? void 0 : _w.preferredIndustries,
                avoidIndustries: (_y = (_x = intakeData.filters) === null || _x === void 0 ? void 0 : _x.softPreferences) === null || _y === void 0 ? void 0 : _y.avoidIndustries,
                preferredFunctions: (_0 = (_z = intakeData.filters) === null || _z === void 0 ? void 0 : _z.softPreferences) === null || _0 === void 0 ? void 0 : _0.preferredFunctions,
                workStyle: (_2 = (_1 = intakeData.filters) === null || _1 === void 0 ? void 0 : _1.softPreferences) === null || _2 === void 0 ? void 0 : _2.workStyle
            }
        };
        // 3. Create Engagement
        await db.collection('engagements').add(newEngagement);
        console.log(`Created new Engagement for user ${userId} from Intake.`);
    }
    catch (error) {
        console.error('Error hydrating engagement from intake:', error);
    }
});
//# sourceMappingURL=onIntakeCreated.js.map