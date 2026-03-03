import { getDB } from '../db/database';
import type { MovieQuestion, MovieModeSettings } from '@tipsy-trivia/shared';

interface MovieQuestionRow {
    id: string;
    mode: string;
    title: string;
    year: number;
    mpaa: string;
    genres: string;        // JSON
    plot_clue: string | null;
    actor_top: string;
    actor_2nd: string;
    actor_3rd: string;
    role_tag_stage: string | null;
    role_tag_text: string | null;
    choices: string;       // JSON
    answer: string;
    explain: string;
    tmdb_id: number | null;
    fetched_at: string | null;
}

function rowToQuestion(row: MovieQuestionRow): MovieQuestion {
    return {
        id: row.id,
        mode: row.mode as MovieQuestion['mode'],
        title: row.title,
        year: row.year,
        mpaa: row.mpaa,
        genres: JSON.parse(row.genres) as string[],
        plot_clue: row.plot_clue ?? undefined,
        hints: {
            actor_top: row.actor_top,
            actor_2nd: row.actor_2nd,
            actor_3rd: row.actor_3rd,
            role_tag_optional: row.role_tag_stage && row.role_tag_text
                ? { stage: row.role_tag_stage as 'A' | 'B', text: row.role_tag_text }
                : undefined,
        },
        choices: JSON.parse(row.choices) as string[],
        answer: row.answer,
        explain: row.explain,
        source_meta: {
            provider: 'tmdb',
            provider_id: row.tmdb_id ?? 0,
            fetched_at: row.fetched_at ?? '',
        },
    };
}

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

export class MovieQuestionManager {
    /**
     * Load and filter questions for a game session.
     * Returns shuffled list capped to settings.question_count.
     */
    loadForGame(settings: MovieModeSettings, excludeTmdbIds: number[] = []): MovieQuestion[] {
        const db = getDB();

        let sql = `SELECT * FROM movie_questions WHERE mode = ?`;
        const params: (string | number)[] = [settings.variant];

        if (settings.year_min) {
            sql += ` AND year >= ?`;
            params.push(settings.year_min);
        }
        if (settings.year_max) {
            sql += ` AND year <= ?`;
            params.push(settings.year_max);
        }
        if (settings.mpaa.length > 0) {
            sql += ` AND mpaa IN (${settings.mpaa.map(() => '?').join(',')})`;
            params.push(...settings.mpaa);
        }
        if (excludeTmdbIds.length > 0) {
            sql += ` AND (tmdb_id IS NULL OR tmdb_id NOT IN (${excludeTmdbIds.map(() => '?').join(',')}))`;
            params.push(...excludeTmdbIds);
        }

        const rows = db.prepare(sql).all(...params) as MovieQuestionRow[];
        let questions = rows.map(rowToQuestion);

        // Genre filter (in-memory since genres stored as JSON array)
        if (settings.genres.length > 0) {
            const wantedGenres = new Set(settings.genres.map(g => g.toLowerCase()));
            questions = questions.filter(q =>
                q.genres.some(g => wantedGenres.has(g.toLowerCase()))
            );
        }

        return shuffle(questions).slice(0, settings.question_count);
    }

    getById(id: string): MovieQuestion | null {
        const db = getDB();
        const row = db.prepare(`SELECT * FROM movie_questions WHERE id = ?`).get(id) as MovieQuestionRow | undefined;
        return row ? rowToQuestion(row) : null;
    }

    /** Shuffle the choices array, moving the correct answer (index 0) to a random slot.
     *  Returns { shuffled, correctIndex } */
    static shuffleChoices(choices: string[]): { shuffled: string[]; correctIndex: number } {
        const shuffled = shuffle(choices);
        const correctIndex = shuffled.indexOf(choices[0]);
        return { shuffled, correctIndex };
    }
}
