import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { initDB, getDB } from '../db/database';
import { PackImporter } from '../questions/PackImporter';

export async function seedDatabase(): Promise<void> {
    const db = getDB();
    const count = (db.prepare('SELECT COUNT(*) as c FROM questions').get() as { c: number }).c;
    if (count > 0) {
        console.log(`✅ Database already seeded (${count} questions). Skipping.`);
        return;
    }

    const packsDir = path.join(__dirname, '../../data/packs');
    if (!fs.existsSync(packsDir)) {
        console.warn('No packs directory found at', packsDir);
        return;
    }

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

// Run directly: pnpm --filter server seed
if (require.main === module) {
    initDB();
    seedDatabase().catch(console.error);
}
