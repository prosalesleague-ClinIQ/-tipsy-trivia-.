// Basic profanity filter for player names.
// Uses a built-in word list and custom additions.
// Returns a cleaned version of the name (replaces bad words with "Player").

const BLOCKED = new Set([
    'fuck', 'shit', 'bitch', 'asshole', 'cunt', 'dick', 'pussy', 'cock', 'bastard',
    'whore', 'slut', 'nigger', 'nigga', 'faggot', 'retard', 'tranny', 'spic', 'kike',
    'chink', 'wetback', 'cracker', 'rape', 'murder', 'kill', 'nazi', 'isis', 'jihad',
]);

export function filterName(name: string): string {
    const cleaned = name.trim().replace(/[^a-zA-Z0-9 _\-!?]/g, '');
    const lower = cleaned.toLowerCase();
    for (const word of BLOCKED) {
        if (lower.includes(word)) return 'Player';
    }
    return cleaned || 'Player';
}

export function containsProfanity(text: string): boolean {
    const lower = text.toLowerCase();
    return [...BLOCKED].some(word => lower.includes(word));
}
