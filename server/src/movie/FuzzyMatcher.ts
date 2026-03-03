// ============================================================
// TIPSY TRIVIA — FuzzyMatcher
// Used for free-text movie title matching
// ============================================================

function levenshtein(a: string, b: string): number {
    const m = a.length, n = b.length;
    const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
        Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
    );
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            dp[i][j] = a[i - 1] === b[j - 1]
                ? dp[i - 1][j - 1]
                : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
    }
    return dp[m][n];
}

const ARTICLES = /^(the|a|an)\s+/i;
const PUNCTUATION = /[^\w\s]/g;

export function normalize(s: string): string {
    return s
        .toLowerCase()
        .replace(PUNCTUATION, '')
        .replace(ARTICLES, '')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Returns true if the player's free-text answer matches the canonical title.
 * Matching rules (applied after normalization):
 *  1. Exact match → ✓
 *  2. Levenshtein distance ≤ floor(title.length * 0.2), min 1, max 4 → ✓
 *  3. Normalized answer is a substring of normalized title (≥4 chars) → ✓
 */
export function matches(answer: string, title: string): boolean {
    const normAnswer = normalize(answer);
    const normTitle = normalize(title);

    if (normAnswer === normTitle) return true;

    const maxDist = Math.min(4, Math.max(1, Math.floor(normTitle.length * 0.2)));
    if (levenshtein(normAnswer, normTitle) <= maxDist) return true;

    if (normAnswer.length >= 4 && normTitle.includes(normAnswer)) return true;

    return false;
}
