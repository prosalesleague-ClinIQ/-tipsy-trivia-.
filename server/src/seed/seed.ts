import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { initDB, getDB } from '../db/database';
import { PackImporter } from '../questions/PackImporter';
import { migrateCategories } from './migrateCategories';

export async function seedDatabase(): Promise<void> {
    const db = getDB();
    const count = (db.prepare('SELECT COUNT(*) as c FROM questions').get() as { c: number }).c;
    if (count > 0) {
        console.log(`✅ Database already seeded (${count} questions). Skipping.`);
    } else {
        const packsDir = path.join(__dirname, '../../data/packs');
        if (!fs.existsSync(packsDir)) {
            console.warn('No packs directory found at', packsDir);
        } else {
            const files = fs.readdirSync(packsDir).filter(f => f.endsWith('.json'));
            console.log(`📦 Seeding ${files.length} question packs...`);

            const importer = new PackImporter();
            let totalImported = 0;

            for (const file of files) {
                const fullPath = path.join(packsDir, file);
                const raw = fs.readFileSync(fullPath, 'utf-8');
                const pack = JSON.parse(raw);
                const result = await importer.importJSON(pack);
                console.log(`  ${file}: +${result.imported} imported, ${result.skipped} skipped`);
                if (result.errors.length > 0) {
                    console.warn(`  Errors: ${result.errors.join(', ')}`);
                }
                totalImported += result.imported;
            }

            console.log(`✅ Seed complete: ${totalImported} questions imported.`);
        }
    }

    // Always run category migration (it guards itself)
    migrateCategories();

    // Seed movie questions
    seedMovieQuestions(db);
}

function seedMovieQuestions(db: ReturnType<typeof getDB>): void {
    const existing = (db.prepare('SELECT COUNT(*) as c FROM movie_questions').get() as { c: number }).c;
    if (existing > 0) {
        console.log(`✅ Movie questions already seeded (${existing} questions). Skipping.`);
        return;
    }

    const dataDir = path.join(__dirname, '../../data');
    const seedFiles = ['movie_seed_plot_ladder.json', 'movie_seed_cast_ladder.json'];
    let total = 0;

    const insert = db.prepare(`
        INSERT OR IGNORE INTO movie_questions
            (id, mode, title, year, mpaa, genres, plot_clue,
             actor_top, actor_2nd, actor_3rd,
             role_tag_stage, role_tag_text,
             choices, answer, explain, tmdb_id, fetched_at)
        VALUES
            (@id, @mode, @title, @year, @mpaa, @genres, @plot_clue,
             @actor_top, @actor_2nd, @actor_3rd,
             @role_tag_stage, @role_tag_text,
             @choices, @answer, @explain, @tmdb_id, @fetched_at)
    `);

    const insertAll = db.transaction((rows: object[]) => {
        for (const row of rows) insert.run(row);
    });

    for (const file of seedFiles) {
        const fullPath = path.join(dataDir, file);
        if (!fs.existsSync(fullPath)) {
            console.warn(`⚠️  Movie seed file not found: ${file}`);
            continue;
        }
        const rows = JSON.parse(fs.readFileSync(fullPath, 'utf-8')) as object[];
        const normalized = rows.map((r: any) => ({
            ...r,
            genres: JSON.stringify(r.genres),
            choices: JSON.stringify(r.choices),
        }));
        insertAll(normalized);
        total += normalized.length;
        console.log(`  🎬 ${file}: ${normalized.length} movie questions seeded`);
    }

    console.log(`✅ Movie seed complete: ${total} questions imported.`);
}

// Run directly: pnpm --filter server seed
if (require.main === module) {
    initDB();
    seedDatabase().catch(console.error);
}
