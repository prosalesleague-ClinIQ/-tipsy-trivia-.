// ============================================================
// TIPSY TRIVIA — Shared Types: Questions + Packs
// ============================================================

export type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'Genius';

export type QuestionType =
    | 'multiple_choice'
    | 'true_false'
    | 'which_true'
    | 'what_next'
    | 'odd_one_out'
    | 'closest_wins'
    | 'real_law_or_fake';

export type ClaimStrength = 'Primary' | 'Secondary';

export interface Question {
    id: string;
    pack_id: string;
    category: string;
    difficulty: Difficulty;
    prompt: string;
    options: string[];
    correct_index: number;
    explanation: string;
    tags: string[];
    time_limit_seconds: number;
    question_type: QuestionType;

    // Fun fact fields
    hook_line: string;           // "Before we start: did you know…" (1 line)
    why_weird: string;           // Comedic punchline after reveal
    source_title: string;
    source_url: string;
    source_title_2?: string;     // Required for Genius difficulty
    source_url_2?: string;
    verified_on: string;         // YYYY-MM-DD
    fact_hash: string;           // SHA-256 of normalized claim
    claim_strength: ClaimStrength;
    content_flags: string[];     // e.g. ['no-politics','no-medical']
}

export interface Pack {
    id: string;
    name: string;
    description: string;
    author: string;
    version: string;
    created_at: string;
    questions: Question[];
}

export interface PackValidationError {
    question_id?: string;
    field?: string;
    message: string;
}

export interface PackValidationResult {
    valid: boolean;
    errors: PackValidationError[];
    warnings: PackValidationError[];
}
