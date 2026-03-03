import { getDB } from '../db/database';
import { resolveCategoryMeta } from '../questions/CategorySystem';

interface QuestionRow {
    id: string;
    category: string;
    difficulty: string;
    difficulty_level: string | null;
}

/**
 * One-time migration: populate difficulty_level, adult_level, category_group
 * on existing questions that haven't been tagged yet.
 * Guards itself — safe to call on every startup.
 */
export function migrateCategories(): void {
    const db = getDB();

    // Check if columns exist; if not, skip (database.ts migration will add them)
    const cols: { name: string }[] = db.pragma('table_info(questions)') as { name: string }[];
    const colNames = cols.map(c => c.name);
    if (!colNames.includes('difficulty_level')) {
        console.log('⚠️  difficulty_level column not found — skipping category migration');
        return;
    }

    const unmigratedCount = (
        db.prepare(`SELECT COUNT(*) as c FROM questions WHERE difficulty_level IS NULL OR difficulty_level = ''`).get() as { c: number }
    ).c;

    if (unmigratedCount === 0) {
        console.log('✅ Category migration already complete — skipping');
        return;
    }

    console.log(`🏷️  Migrating ${unmigratedCount} questions to new category system…`);

    const rows = db.prepare(
        `SELECT id, category, difficulty, difficulty_level FROM questions WHERE difficulty_level IS NULL OR difficulty_level = ''`
    ).all() as QuestionRow[];

    const update = db.prepare(
        `UPDATE questions SET difficulty_level = @d, adult_level = @a, category_group = @group WHERE id = @id`
    );

    const migrateAll = db.transaction(() => {
        for (const row of rows) {
            const meta = resolveCategoryMeta(row.category, row.difficulty);
            update.run({ id: row.id, d: meta.d, a: meta.a, group: meta.group });
        }
    });

    migrateAll();
    console.log(`✅ Category migration complete: ${rows.length} questions tagged`);
}
