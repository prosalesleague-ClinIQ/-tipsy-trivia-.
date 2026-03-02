import type { Room, Question } from '@tipsy-trivia/shared';
import { getDB } from '../db/database';

interface DBQuestion {
    id: string;
    pack_id: string;
    category: string;
    difficulty: string;
    prompt: string;
    options: string;
    correct_index: number;
    explanation: string;
    tags: string;
    time_limit_seconds: number;
    question_type: string;
    hook_line: string;
    why_weird: string;
    source_title: string;
    source_url: string;
    source_title_2: string | null;
    source_url_2: string | null;
    verified_on: string;
    fact_hash: string;
    claim_strength: string;
    content_flags: string;
}

export class QuestionManager {
    private questionCache = new Map<string, Question>();

    pickQuestion(room: Room): Question | null {
        const db = getDB();
        const usedHashes = room.used_fact_hashes;
        const placeholders = usedHashes.length > 0
            ? usedHashes.map(() => '?').join(',')
            : "'__none__'";

        const statement = usedHashes.length > 0
            ? db.prepare(`
          SELECT * FROM questions
          WHERE fact_hash NOT IN (${placeholders})
          ORDER BY RANDOM()
          LIMIT 1
        `)
            : db.prepare(`SELECT * FROM questions ORDER BY RANDOM() LIMIT 1`);

        const row = usedHashes.length > 0
            ? statement.get(...usedHashes) as DBQuestion | undefined
            : statement.get() as DBQuestion | undefined;

        if (!row) return null;

        const q = this.deserialize(row);
        this.questionCache.set(q.id, q);
        return q;
    }

    pickQuestionByDifficulty(room: Room, difficulty: string): Question | null {
        const db = getDB();
        const usedHashes = room.used_fact_hashes;
        const placeholders = usedHashes.length > 0
            ? usedHashes.map(() => '?').join(',')
            : null;

        let row: DBQuestion | undefined;
        if (placeholders) {
            row = db.prepare(`
        SELECT * FROM questions
        WHERE difficulty = ?
        AND fact_hash NOT IN (${placeholders})
        ORDER BY RANDOM() LIMIT 1
      `).get(difficulty, ...usedHashes) as DBQuestion | undefined;
        } else {
            row = db.prepare(`
        SELECT * FROM questions WHERE difficulty = ? ORDER BY RANDOM() LIMIT 1
      `).get(difficulty) as DBQuestion | undefined;
        }

        if (!row) return null;
        const q = this.deserialize(row);
        this.questionCache.set(q.id, q);
        return q;
    }

    pickQuestionByCategory(room: Room, category: string, value: number): Question | null {
        const difficulty = this.valueToDifficulty(value);
        const db = getDB();
        const usedHashes = room.used_fact_hashes;

        let row: DBQuestion | undefined;
        if (usedHashes.length > 0) {
            const placeholders = usedHashes.map(() => '?').join(',');
            row = db.prepare(`
        SELECT * FROM questions
        WHERE category = ?
        AND difficulty = ?
        AND fact_hash NOT IN (${placeholders})
        ORDER BY RANDOM() LIMIT 1
      `).get(category, difficulty, ...usedHashes) as DBQuestion | undefined;
        } else {
            row = db.prepare(`
        SELECT * FROM questions WHERE category = ? AND difficulty = ? ORDER BY RANDOM() LIMIT 1
      `).get(category, difficulty) as DBQuestion | undefined;
        }

        if (!row) return null;
        const q = this.deserialize(row);
        this.questionCache.set(q.id, q);
        return q;
    }

    getQuestion(id: string): Question | null {
        if (this.questionCache.has(id)) return this.questionCache.get(id)!;
        const db = getDB();
        const row = db.prepare('SELECT * FROM questions WHERE id = ?').get(id) as DBQuestion | undefined;
        if (!row) return null;
        const q = this.deserialize(row);
        this.questionCache.set(q.id, q);
        return q;
    }

    getCategories(): string[] {
        const db = getDB();
        const rows = db.prepare('SELECT DISTINCT category FROM questions ORDER BY category').all() as { category: string }[];
        return rows.map(r => r.category);
    }

    private valueToDifficulty(value: number): string {
        if (value <= 200) return 'Easy';
        if (value === 300) return 'Medium';
        if (value === 400) return 'Hard';
        return 'Genius';
    }

    private deserialize(row: DBQuestion): Question {
        return {
            id: row.id,
            pack_id: row.pack_id,
            category: row.category,
            difficulty: row.difficulty as Question['difficulty'],
            prompt: row.prompt,
            options: JSON.parse(row.options),
            correct_index: row.correct_index,
            explanation: row.explanation,
            tags: JSON.parse(row.tags),
            time_limit_seconds: row.time_limit_seconds,
            question_type: row.question_type as Question['question_type'],
            hook_line: row.hook_line,
            why_weird: row.why_weird,
            source_title: row.source_title,
            source_url: row.source_url,
            source_title_2: row.source_title_2 ?? undefined,
            source_url_2: row.source_url_2 ?? undefined,
            verified_on: row.verified_on,
            fact_hash: row.fact_hash,
            claim_strength: row.claim_strength as Question['claim_strength'],
            content_flags: JSON.parse(row.content_flags),
        };
    }
}
