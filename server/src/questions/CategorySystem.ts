// ============================================================
// TIPSY TRIVIA — Category System
// D1–D5 difficulty levels + A0–A3 adult-appropriateness levels
// ============================================================

export const DIFFICULTY_LEVELS: Record<string, string> = {
    D1: 'Softball Season',
    D2: 'Barstool Scholar',
    D3: 'Trivia Assassin',
    D4: 'Brain Damage',
    D5: 'Final Boss',
};

export const ADULT_LEVELS: Record<string, string> = {
    A0: 'Family Friendly',
    A1: 'Spicy PG-13',
    A2: 'R-Rated Roast',
    A3: 'Adults Only',
};

export interface CategoryMeta {
    d: string;   // D1–D5
    a: string;   // A0–A3
    group: string; // 'core' | 'adults' | 'niche'
}

/** Per-category defaults. Any category NOT in this map falls back to D2 / A0 / 'core'. */
export const CATEGORY_DEFAULTS: Record<string, CategoryMeta> = {
    // ── Core (family-friendly) ──
    'Animals':            { d: 'D1', a: 'A0', group: 'core' },
    'Food':               { d: 'D1', a: 'A0', group: 'core' },
    'General Knowledge':  { d: 'D2', a: 'A0', group: 'core' },
    'Language':           { d: 'D2', a: 'A0', group: 'core' },
    'Maps & Borders':     { d: 'D2', a: 'A0', group: 'core' },
    'Sports':             { d: 'D2', a: 'A0', group: 'core' },
    'Technology':         { d: 'D2', a: 'A0', group: 'core' },
    'Art Heists':         { d: 'D2', a: 'A0', group: 'core' },
    'Space':              { d: 'D2', a: 'A0', group: 'core' },
    'History':            { d: 'D3', a: 'A0', group: 'core' },
    'Science':            { d: 'D3', a: 'A0', group: 'core' },
    'Engineering':        { d: 'D3', a: 'A0', group: 'core' },
    'Music':              { d: 'D2', a: 'A0', group: 'core' },
    'Movies':             { d: 'D2', a: 'A0', group: 'core' },
    'TV':                 { d: 'D2', a: 'A0', group: 'core' },
    'Geography':          { d: 'D2', a: 'A0', group: 'core' },
    'Pop Culture':        { d: 'D2', a: 'A0', group: 'core' },
    'Literature':         { d: 'D3', a: 'A0', group: 'core' },
    'Math':               { d: 'D3', a: 'A0', group: 'core' },

    // ── Spicy PG-13 ──
    'Bizarre But True':   { d: 'D2', a: 'A1', group: 'core' },
    'Human Body':         { d: 'D2', a: 'A1', group: 'core' },
    'Crime & Criminals':  { d: 'D2', a: 'A1', group: 'core' },
    'Conspiracy Theories':{ d: 'D2', a: 'A1', group: 'core' },
    'Dark History':       { d: 'D3', a: 'A1', group: 'core' },
    'Political Scandals': { d: 'D3', a: 'A1', group: 'core' },
    'Celebrity Gossip':   { d: 'D1', a: 'A1', group: 'core' },

    // ── Adults Only ──
    'Adults Only: Sex Stats and Surveys': { d: 'D2', a: 'A3', group: 'adults' },
    'Adults Only: Wild Laws':             { d: 'D2', a: 'A2', group: 'adults' },
    'Adults Only: Drinking Games':        { d: 'D1', a: 'A2', group: 'adults' },
    'Adults Only: NSFW Pop Culture':      { d: 'D2', a: 'A3', group: 'adults' },
    'Adults Only: Roast-Worthy Fails':    { d: 'D2', a: 'A2', group: 'adults' },
};

/**
 * Resolve category metadata, falling back to difficulty→D-level mapping
 * when a category isn't in CATEGORY_DEFAULTS.
 */
export function resolveCategoryMeta(
    category: string,
    oldDifficulty?: string,
): CategoryMeta {
    if (CATEGORY_DEFAULTS[category]) return CATEGORY_DEFAULTS[category];

    // Fall back to old difficulty level mapping
    const dMap: Record<string, string> = {
        Easy: 'D2', Medium: 'D3', Hard: 'D4', Genius: 'D5',
    };
    return {
        d: (oldDifficulty && dMap[oldDifficulty]) ?? 'D2',
        a: 'A0',
        group: 'core',
    };
}
