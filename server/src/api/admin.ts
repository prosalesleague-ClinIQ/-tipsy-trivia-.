import { Router, type Request, type Response, type NextFunction } from 'express';
import { getDB } from '../db/database';
import { PackImporter } from '../questions/PackImporter';
import { PackValidator } from '../questions/PackValidator';
import { v4 as uuidv4 } from 'uuid';

export const adminRouter: import('express').Router = Router();

// Admin password middleware
function requireAdmin(req: Request, res: Response, next: NextFunction): void {
    const password = req.headers['x-admin-password'] ?? req.query.password;
    if (password !== (process.env.ADMIN_PASSWORD ?? 'changeme')) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    next();
}

adminRouter.use(requireAdmin);

// ─── Packs ───────────────────────────────────────────────────────────────────

adminRouter.get('/packs', (_req, res) => {
    const db = getDB();
    const packs = db.prepare('SELECT * FROM packs ORDER BY created_at DESC').all();
    res.json({ packs });
});

adminRouter.get('/packs/:id', (req, res) => {
    const db = getDB();
    const pack = db.prepare('SELECT * FROM packs WHERE id = ?').get(req.params.id);
    if (!pack) { res.status(404).json({ error: 'Pack not found' }); return; }
    const questions = db.prepare('SELECT * FROM questions WHERE pack_id = ?').all(req.params.id);
    res.json({ pack, questions });
});

adminRouter.delete('/packs/:id', (req, res) => {
    const db = getDB();
    db.prepare('DELETE FROM packs WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
});

// ─── Questions ───────────────────────────────────────────────────────────────

adminRouter.get('/questions', (req, res) => {
    const db = getDB();
    const { pack_id, category, difficulty, search } = req.query as Record<string, string>;
    let sql = 'SELECT * FROM questions WHERE 1=1';
    const params: string[] = [];
    if (pack_id) { sql += ' AND pack_id = ?'; params.push(pack_id); }
    if (category) { sql += ' AND category = ?'; params.push(category); }
    if (difficulty) { sql += ' AND difficulty = ?'; params.push(difficulty); }
    if (search) { sql += ' AND (prompt LIKE ? OR category LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    sql += ' ORDER BY category, difficulty LIMIT 200';
    const questions = db.prepare(sql).all(...params);
    res.json({ questions });
});

adminRouter.post('/questions', (req, res) => {
    const db = getDB();
    const q = req.body;
    try {
        db.prepare(`
      INSERT OR REPLACE INTO questions (
        id, pack_id, category, difficulty, prompt, options, correct_index,
        explanation, tags, time_limit_seconds, question_type, hook_line, why_weird,
        source_title, source_url, source_title_2, source_url_2, verified_on,
        fact_hash, claim_strength, content_flags
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(
            q.id ?? uuidv4(), q.pack_id, q.category, q.difficulty, q.prompt,
            JSON.stringify(q.options ?? []), q.correct_index, q.explanation ?? '',
            JSON.stringify(q.tags ?? []), q.time_limit_seconds ?? 12, q.question_type ?? 'multiple_choice',
            q.hook_line ?? '', q.why_weird ?? '', q.source_title ?? '', q.source_url ?? '',
            q.source_title_2 ?? null, q.source_url_2 ?? null, q.verified_on ?? '',
            q.fact_hash ?? '', q.claim_strength ?? 'Primary',
            JSON.stringify(q.content_flags ?? []),
        );
        res.json({ ok: true });
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});

adminRouter.delete('/questions/:id', (req, res) => {
    const db = getDB();
    db.prepare('DELETE FROM questions WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
});

// ─── Import ──────────────────────────────────────────────────────────────────

adminRouter.post('/import/json', async (req, res) => {
    try {
        const importer = new PackImporter();
        const result = await importer.importJSON(req.body);
        res.json(result);
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});

adminRouter.post('/import/csv', async (req, res) => {
    try {
        const importer = new PackImporter();
        const csv = req.body?.csv ?? '';
        const result = await importer.importCSV(csv);
        res.json(result);
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});

// ─── Validate ────────────────────────────────────────────────────────────────

adminRouter.post('/validate', (req, res) => {
    const validator = new PackValidator();
    const result = validator.validate(req.body);
    res.json(result);
});

// ─── Categories ──────────────────────────────────────────────────────────────

adminRouter.get('/categories', (_req, res) => {
    const db = getDB();
    const rows = db.prepare('SELECT DISTINCT category FROM questions ORDER BY category').all() as { category: string }[];
    res.json({ categories: rows.map(r => r.category) });
});
