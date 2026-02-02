"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActiveAdvisor = exports.ADVISORS = void 0;
// Pool of Advisors for Rotation
exports.ADVISORS = [
    {
        id: 'patrick',
        name: 'Patrick Deniger',
        email: 'patrick@repteam.com',
        title: 'Head of Talent',
        avatarUrl: ''
    },
    // Add more advisors here as needed
    // {
    //     id: 'patrick',
    //     name: 'Patrick Deniger',
    //     email: 'patrick@rep.ai',
    //     title: 'Head of Talent',
    //     avatarUrl: '...'
    // }
];
// Helper to get an advisor (currently random, can be upgraded to round-robin)
const getActiveAdvisor = () => {
    const randomIndex = Math.floor(Math.random() * exports.ADVISORS.length);
    return exports.ADVISORS[randomIndex];
};
exports.getActiveAdvisor = getActiveAdvisor;
//# sourceMappingURL=advisors.js.map