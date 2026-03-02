import { createHash } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { getDB } from '../db/database';
import type { Pack, Question } from '@tipsy-trivia/shared';

export class PackImporter {
    async importJSON(data: Pack): Promise<{ imported: number; skipped: number; errors: string[] }> {
        const db = getDB();
        let imported = 0;
        let skipped = 0;
        const errors: string[] = [];

        // Upsert pack
        db.prepare(`
      INSERT OR REPLACE INTO packs (id, name, description, author, version, created_at)
      VALUES (?,?,?,?,?,?)
    `).run(
            data.id ?? uuidv4(),
            data.name ?? 'Unnamed Pack',
            data.description ?? '',
            data.author ?? 'Unknown',
            data.version ?? '1.0',
            data.created_at ?? new Date().toISOString(),
        );

        const insertQ = db.prepare(`
      INSERT OR IGNORE INTO questions (
        id, pack_id, category, difficulty, prompt, options, correct_index,
        explanation, tags, time_limit_seconds, question_type, hook_line, why_weird,
        source_title, source_url, source_title_2, source_url_2, verified_on,
        fact_hash, claim_strength, content_flags
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `);

        for (const q of data.questions ?? []) {
            try {
                const hash = q.fact_hash ?? computeFactHash(q.prompt);
                const result = insertQ.run(
                    q.id ?? uuidv4(), data.id, q.category, q.difficulty, q.prompt,
                    JSON.stringify(q.options ?? []), q.correct_index, q.explanation ?? '',
                    JSON.stringify(q.tags ?? []), q.time_limit_seconds ?? 12,
                    q.question_type ?? 'multiple_choice',
                    q.hook_line ?? '', q.why_weird ?? '', q.source_title ?? '', q.source_url ?? '',
                    q.source_title_2 ?? null, q.source_url_2 ?? null, q.verified_on ?? '',
                    hash, q.claim_strength ?? 'Primary',
                    JSON.stringify(q.content_flags ?? []),
                );
                if (result.changes > 0) imported++;
                else skipped++;
            } catch (err: any) {
                errors.push(`Q[${q.id}]: ${err.message}`);
                skipped++;
            }
        }

        return { imported, skipped, errors };
    }

    async importCSV(csv: string): Promise<{ imported: number; skipped: number; errors: string[] }> {
        // Dynamic import of papaparse
        const Papa = (await import('papaparse')).default;
        const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true });

        const pack: Pack = {
            id: uuidv4(),
            name: 'Imported Pack',
            description: 'CSV Import',
            author: 'Import',
            version: '1.0',
            created_at: new Date().toISOString(),
            questions: parsed.data.map((row: any) => ({
                id: row.id ?? uuidv4(),
                pack_id: '',
                category: row.category ?? 'General',
                difficulty: row.difficulty ?? 'Medium',
                prompt: row.prompt ?? '',
                options: [row.option_a, row.option_b, row.option_c, row.option_d].filter(Boolean),
                correct_index: parseInt(row.correct_index ?? '0', 10),
                explanation: row.explanation ?? '',
                tags: (row.tags ?? '').split(',').map((t: string) => t.trim()).filter(Boolean),
                time_limit_seconds: parseInt(row.time_limit_seconds ?? '12', 10),
                question_type: row.question_type ?? 'multiple_choice',
                hook_line: row.hook_line ?? '',
                why_weird: row.why_weird ?? '',
                source_title: row.source_title ?? '',
                source_url: row.source_url ?? '',
                source_title_2: row.source_title_2 || undefined,
                source_url_2: row.source_url_2 || undefined,
                verified_on: row.verified_on ?? '',
                fact_hash: computeFactHash(row.prompt ?? ''),
                claim_strength: 'Primary',
                content_flags: [],
            })),
        };

        return this.importJSON(pack);
    }
}

export function computeFactHash(prompt: string): string {
    const normalized = prompt.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 200);
    return createHash('sha256').update(normalized).digest('hex');
}
