import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let db: Database.Database;

export function getDB(): Database.Database {
    return db;
}

export function initDB(): void {
    const dbPath = process.env.DATABASE_URL ?? './data/tipsy-trivia.db';
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    runMigrations(db);
    console.log('✅ Database initialized at', dbPath);
}

function runMigrations(db: Database.Database): void {
    db.exec(`
    CREATE TABLE IF NOT EXISTS packs (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      author     TEXT NOT NULL DEFAULT 'Tipsy Trivia',
      version    TEXT NOT NULL DEFAULT '1.0',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS questions (
      id                TEXT PRIMARY KEY,
      pack_id           TEXT NOT NULL REFERENCES packs(id) ON DELETE CASCADE,
      category          TEXT NOT NULL,
      difficulty        TEXT NOT NULL CHECK(difficulty IN ('Easy','Medium','Hard','Genius')),
      prompt            TEXT NOT NULL,
      options           TEXT NOT NULL,   -- JSON array
      correct_index     INTEGER NOT NULL,
      explanation       TEXT NOT NULL DEFAULT '',
      tags              TEXT NOT NULL DEFAULT '[]',
      time_limit_seconds INTEGER NOT NULL DEFAULT 12,
      question_type     TEXT NOT NULL DEFAULT 'multiple_choice',
      hook_line         TEXT NOT NULL DEFAULT '',
      why_weird         TEXT NOT NULL DEFAULT '',
      source_title      TEXT NOT NULL DEFAULT '',
      source_url        TEXT NOT NULL DEFAULT '',
      source_title_2    TEXT,
      source_url_2      TEXT,
      verified_on       TEXT NOT NULL DEFAULT '',
      fact_hash         TEXT NOT NULL DEFAULT '',
      claim_strength    TEXT NOT NULL DEFAULT 'Primary',
      content_flags     TEXT NOT NULL DEFAULT '[]',
      UNIQUE(fact_hash)
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token      TEXT PRIMARY KEY,
      player_id  TEXT NOT NULL,
      room_code  TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      last_seen  INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ad_rewards (
      id          TEXT PRIMARY KEY,
      player_id   TEXT NOT NULL,
      room_code   TEXT NOT NULL,
      granted_at  INTEGER NOT NULL,
      question_milestone INTEGER NOT NULL,
      extra_strikes INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS movie_questions (
      id TEXT PRIMARY KEY,
      mode TEXT NOT NULL CHECK(mode IN ('plot_ladder','cast_ladder')),
      title TEXT NOT NULL,
      year INTEGER NOT NULL,
      mpaa TEXT NOT NULL,
      genres TEXT NOT NULL,   -- JSON array
      plot_clue TEXT,
      actor_top TEXT NOT NULL,
      actor_2nd TEXT NOT NULL,
      actor_3rd TEXT NOT NULL,
      role_tag_stage TEXT,
      role_tag_text TEXT,
      choices TEXT NOT NULL,  -- JSON array[4]
      answer TEXT NOT NULL,
      explain TEXT NOT NULL,
      tmdb_id INTEGER,
      fetched_at TEXT,
      UNIQUE(tmdb_id, mode)
    );

    CREATE TABLE IF NOT EXISTS tmdb_cache (
      tmdb_id INTEGER PRIMARY KEY,
      data TEXT NOT NULL,
      cached_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_questions_pack ON questions(pack_id);
    CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category, difficulty);
    CREATE INDEX IF NOT EXISTS idx_questions_hash ON questions(fact_hash);
    CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
    CREATE INDEX IF NOT EXISTS idx_ad_rewards_player ON ad_rewards(player_id, room_code);
    CREATE INDEX IF NOT EXISTS idx_movie_mode ON movie_questions(mode);
    CREATE INDEX IF NOT EXISTS idx_movie_year ON movie_questions(year);
  `);

    // Add category system columns if they don't already exist (ALTER TABLE is not idempotent in older SQLite)
    const existingCols: { name: string }[] = db.pragma('table_info(questions)') as { name: string }[];
    const colNames = new Set(existingCols.map(c => c.name));
    if (!colNames.has('difficulty_level')) db.exec(`ALTER TABLE questions ADD COLUMN difficulty_level TEXT DEFAULT 'D2'`);
    if (!colNames.has('adult_level'))      db.exec(`ALTER TABLE questions ADD COLUMN adult_level TEXT DEFAULT 'A0'`);
    if (!colNames.has('category_group'))   db.exec(`ALTER TABLE questions ADD COLUMN category_group TEXT DEFAULT 'core'`);
}
