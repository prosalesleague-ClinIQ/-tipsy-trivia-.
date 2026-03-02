import type { Pack, PackValidationResult, PackValidationError } from '@tipsy-trivia/shared';
import { computeFactHash } from './PackImporter';
import { getDB } from '../db/database';

const BANNED_FLAGS = new Set(['politics', 'medical-advice', 'defamation', 'slur', 'violence']);

export class PackValidator {
    validate(pack: Pack): PackValidationResult {
        const errors: PackValidationError[] = [];
        const warnings: PackValidationError[] = [];
        const seenHashes = new Set<string>();
        const db = getDB();

        if (!pack.name) errors.push({ message: 'Pack name is required' });
        if (!pack.questions?.length) errors.push({ message: 'Pack has no questions' });

        for (const q of pack.questions ?? []) {
            const qid = q.id ?? '(unknown)';

            // Required fields
            if (!q.prompt) errors.push({ question_id: qid, field: 'prompt', message: 'Prompt is required' });
            if (!q.source_title) errors.push({ question_id: qid, field: 'source_title', message: 'Source title is required' });
            if (!q.source_url) errors.push({ question_id: qid, field: 'source_url', message: 'Source URL is required' });
            if (!q.verified_on) errors.push({ question_id: qid, field: 'verified_on', message: 'verified_on date is required' });

            // Two-source rule for Genius
            if (q.difficulty === 'Genius') {
                if (!q.source_title_2 || !q.source_url_2) {
                    errors.push({ question_id: qid, message: 'Genius questions require two sources' });
                }
            }

            // Explanation length
            if (q.explanation && q.explanation.length < 20) {
                warnings.push({ question_id: qid, field: 'explanation', message: 'Explanation is very short (<20 chars)' });
            }

            // Banned content flags
            for (const flag of q.content_flags ?? []) {
                if (BANNED_FLAGS.has(flag)) {
                    errors.push({ question_id: qid, field: 'content_flags', message: `Banned content flag: ${flag}` });
                }
            }

            // Duplicate hash check within this pack
            const hash = q.fact_hash ?? computeFactHash(q.prompt ?? '');
            if (seenHashes.has(hash)) {
                errors.push({ question_id: qid, message: 'Duplicate fact hash within this pack (same question exists)' });
            }
            seenHashes.add(hash);

            // Check against existing DB
            const existing = db.prepare('SELECT id FROM questions WHERE fact_hash = ?').get(hash) as { id: string } | undefined;
            if (existing && existing.id !== q.id) {
                warnings.push({ question_id: qid, message: `Fact hash already exists in DB (question ${existing.id})` });
            }

            // Options validation
            if (!q.options || q.options.length < 2) {
                errors.push({ question_id: qid, field: 'options', message: 'At least 2 options required' });
            }
            if (q.correct_index < 0 || q.correct_index >= (q.options?.length ?? 0)) {
                errors.push({ question_id: qid, field: 'correct_index', message: 'correct_index out of bounds' });
            }
        }

        return { valid: errors.length === 0, errors, warnings };
    }
}
