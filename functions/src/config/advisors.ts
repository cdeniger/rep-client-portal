
export interface Advisor {
    id: string;
    name: string;
    email: string; // The advisor's direct email (for Reply-To)
    title: string;
    avatarUrl?: string; // Optional: for email signature
}

// Pool of Advisors for Rotation
export const ADVISORS: Advisor[] = [
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
export const getActiveAdvisor = (): Advisor => {
    const randomIndex = Math.floor(Math.random() * ADVISORS.length);
    return ADVISORS[randomIndex];
};
