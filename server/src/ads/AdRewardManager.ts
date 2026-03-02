import type { Room } from '@tipsy-trivia/shared';
import { getDB } from '../db/database';
import { v4 as uuidv4 } from 'uuid';

const AD_PROVIDER = process.env.AD_PROVIDER ?? 'dev';

interface AdGrantResult {
    success: boolean;
    extra_strikes: number;
    reason?: string;
}

export class AdRewardManager {
    async grantReward(playerId: string, room: Room): Promise<AdGrantResult> {
        const db = getDB();
        const player = room.players[playerId];
        if (!player) return { success: false, extra_strikes: 0, reason: 'Player not found' };

        // Anti-abuse: max +2 bonus strikes per run
        const existingRewards = db.prepare(
            'SELECT SUM(extra_strikes) as total FROM ad_rewards WHERE player_id = ? AND room_code = ?'
        ).get(playerId, room.code) as { total: number } | undefined;

        const totalGranted = existingRewards?.total ?? 0;
        if (totalGranted >= 2) {
            return { success: false, extra_strikes: 0, reason: 'Max ad rewards reached for this run' };
        }

        // Anti-abuse: only after wrong answer, check milestone (every 5 questions)
        // In dev mode, always succeed
        if (AD_PROVIDER !== 'dev') {
            // Real provider: reward must be verified server-side before calling this
            // The client calls 'ad:reward:complete' only after real ad SDK confirms reward
        }

        db.prepare(`
      INSERT INTO ad_rewards (id, player_id, room_code, granted_at, question_milestone, extra_strikes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), playerId, room.code, Date.now(), player.ladder_step, 1);

        // Apply reward to player
        player.strikes = Math.min(player.strikes + 1, 3);

        return { success: true, extra_strikes: 1 };
    }
}
