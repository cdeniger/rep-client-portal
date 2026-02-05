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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAtsSimulation = exports.onClientPlaced = exports.generateApplicationDraft = exports.sendApplicationResponse = exports.onApplicationCreate = exports.provisionClient = exports.onIntakeCreated = void 0;
const admin = __importStar(require("firebase-admin"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
admin.initializeApp();
// Triggers
var onIntakeCreated_1 = require("./triggers/onIntakeCreated");
Object.defineProperty(exports, "onIntakeCreated", { enumerable: true, get: function () { return onIntakeCreated_1.onIntakeCreated; } });
var provisionClient_1 = require("./provisionClient");
Object.defineProperty(exports, "provisionClient", { enumerable: true, get: function () { return provisionClient_1.provisionClient; } });
var onApplicationCreate_1 = require("./triggers/onApplicationCreate");
Object.defineProperty(exports, "onApplicationCreate", { enumerable: true, get: function () { return onApplicationCreate_1.onApplicationCreate; } });
var sendApplicationResponse_1 = require("./triggers/sendApplicationResponse");
Object.defineProperty(exports, "sendApplicationResponse", { enumerable: true, get: function () { return sendApplicationResponse_1.sendApplicationResponse; } });
var generateApplicationDraft_1 = require("./triggers/generateApplicationDraft");
Object.defineProperty(exports, "generateApplicationDraft", { enumerable: true, get: function () { return generateApplicationDraft_1.generateApplicationDraftTrigger; } });
var onClientPlaced_1 = require("./triggers/onClientPlaced"); // Ensure this exists or was inline?
Object.defineProperty(exports, "onClientPlaced", { enumerable: true, get: function () { return onClientPlaced_1.onClientPlaced; } });
var runAtsSimulation_1 = require("./triggers/runAtsSimulation");
Object.defineProperty(exports, "runAtsSimulation", { enumerable: true, get: function () { return runAtsSimulation_1.runAtsSimulation; } });
//# sourceMappingURL=index.js.map