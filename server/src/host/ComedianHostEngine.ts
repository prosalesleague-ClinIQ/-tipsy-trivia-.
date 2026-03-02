import type { ComedianPreset, HostConfig, HostScript, Player, GameMode } from '@tipsy-trivia/shared';
import type { Room, Question } from '@tipsy-trivia/shared';

export const COMEDIAN_PRESETS: ComedianPreset[] = [
    { id: 'kevin_hart', name: 'Kevin Hart', style_tags: ['energetic', 'self-deprecating', 'hyperbolic'], energy: 'high' },
    { id: 'dave_chappelle', name: 'Dave Chappelle', style_tags: ['dry', 'observational', 'storytelling'], energy: 'medium' },
    { id: 'ali_wong', name: 'Ali Wong', style_tags: ['bold', 'confessional', 'unfiltered'], energy: 'high' },
    { id: 'john_mulaney', name: 'John Mulaney', style_tags: ['storytelling', 'clean', 'witty'], energy: 'medium' },
    { id: 'tiffany_haddish', name: 'Tiffany Haddish', style_tags: ['loud', 'celebratory', 'raw'], energy: 'high' },
    { id: 'bill_burr', name: 'Bill Burr', style_tags: ['ranty', 'sarcastic', 'blunt'], energy: 'high' },
    { id: 'conan_obrien', name: "Conan O'Brien", style_tags: ['absurdist', 'self-aware', 'clever'], energy: 'medium' },
    { id: 'trevor_noah', name: 'Trevor Noah', style_tags: ['global', 'observational', 'sharp'], energy: 'medium' },
    { id: 'jimmy_carr', name: 'Jimmy Carr', style_tags: ['dark', 'one-liner', 'rapid'], energy: 'high' },
    { id: 'sarah_silverman', name: 'Sarah Silverman', style_tags: ['edgy', 'confessional', 'playful'], energy: 'medium' },
    { id: 'jo_koy', name: 'Jo Koy', style_tags: ['family', 'observational', 'warm'], energy: 'high' },
    { id: 'hasan_minhaj', name: 'Hasan Minhaj', style_tags: ['high-energy', 'current-events', 'theatrical'], energy: 'high' },
    { id: 'nate_bargatze', name: 'Nate Bargatze', style_tags: ['deadpan', 'slow-burn', 'everyday'], energy: 'low' },
    { id: 'bo_burnham', name: 'Bo Burnham', style_tags: ['meta', 'musical', 'cerebral'], energy: 'medium' },
    { id: 'patton_oswalt', name: 'Patton Oswalt', style_tags: ['nerdy', 'passionate', 'wordy'], energy: 'medium' },
];

// Safety-checked reaction templates. All roasts target game behavior only.
const MONOLOGUE_TEMPLATES = [
    "Welcome to the most chaotic trivia night you'll ever survive! Tonight we're going to find out who among you is actually smart, versus who just confidently guesses and gets lucky. Spoiler alert: both strategies will fail spectacularly.",
    "Okay, gather 'round, because tonight is the night one of you validates years of being called a know-it-all at family dinners. The rest of you are here for the free confidence destruction. Either way, let's get weird with facts.",
    "Good evening, trivia warriors. Some of you came here prepared. Some of you Googled the rules on the way over. And some of you — and you know who you are — paused Netflix to be here. Tonight, all of you will regret those choices equally.",
    "Welcome, welcome! You have gathered here tonight to prove, once and for all, which one of you has been absorbing the most absurd information from the internet. This is not a test of intelligence. This is a test of what your brain decided was worth keeping.",
    "Tonight's game is simple: I ask questions, you answer them, and we all pretend the scores don't reveal our deepest insecurities. Ready? Great. Let's make this weird.",
];

const REACTION_CORRECT = [
    "Boom! {name} got it! Someone actually read a book! Just kidding — they probably saw it on TikTok.",
    "{name} with the speed! That answer came in faster than your last excuse.",
    "Correct! {name} is currently making everyone else in this room feel personally attacked.",
    "LOCK. IT. IN. {name} is playing like they have something to prove, and it is glorious.",
    "There it is! {name} knew that. The silence from everyone else is deafening.",
];

const REACTION_WRONG = [
    "Ooh. {name} went for it with the full confidence of someone who has never been wrong — until now.",
    "That was incorrect, but the commitment? Unmatched. {name} believed. We respected it.",
    "Wrong! {name}, that answer has never been right in the history of this question.",
    "Oh no. {name} pressed that with such certainty. The audacity was inspiring. The answer was not.",
    "Incorrect! {name}'s fingers typed that faster than their brain could object. Classic.",
];

const REACTION_CLOSE_CALL = [
    "SO CLOSE. {name} could smell the right answer. It just refused to be seen.",
    "That's a hair away from correct! {name} is going to replay that for weeks.",
    "Oof. {name} was right there. The answer waved goodbye on the way out.",
];

const REACTION_BUZZER_WIN = [
    "{name} SLAMMED that buzzer like a debt collector knocking on a door.",
    "FIRST BUZZ GOES TO {name}! The energy! The chaos! Let's see if the brain caught up!",
    "{name} buzzed in with the urgency of someone who just remembered something embarrassing at 2am.",
];

const REACTION_BUZZER_FAIL = [
    "{name} buzzed first and then just… stared into the void. Respect.",
    "Buzzed in first. Delivered silence. {name} is playing 4D chess and losing spectacularly.",
];

const END_GAME_TEMPLATES = [
    "And THAT is a wrap on tonight's trivia showdown! You all showed up, you all tried, and some of you even got questions right! The scoreboard does not lie. The scoreboard has never lied. The scoreboard is the only honest thing in this room.",
    "It is OVER! The facts have been dispensed. Your brains have been stretched like taffy. One of you has emerged victorious, and the rest of you can blame the questions, the timer, your thumbs — whatever helps.",
    "The final buzzer sounds and tonight's game goes in the books! You survived. Mostly. Statistically at least one of you is pretending you did better than you did.",
];

const WINNER_ROASTS = [
    "{name} wins! Look at that scoreboard! Look at that smug face! You earned this, {name}. You out-trivia'd everyone in this room tonight.",
    "The winner is {name}! And if you're surprised, don't be — {name} has been quietly getting every question right while the rest of you were busy having a crisis.",
    "{name} takes it home! If you want a rematch, {name} will be right here, not offering one.",
];

export class ComedianHostEngine {
    generateScript(config: HostConfig, players: Player[], mode: GameMode): HostScript {
        const monologue = this.pick(MONOLOGUE_TEMPLATES);
        const player_intros: Record<string, string> = {};
        players.forEach(p => {
            player_intros[p.id] = this.generatePlayerIntro(p.name, config.roast_level);
        });

        return {
            opening_monologue: monologue,
            player_intros,
            mode_intro: this.getModeIntro(mode),
            reaction_correct: REACTION_CORRECT,
            reaction_wrong: REACTION_WRONG,
            reaction_close_call: REACTION_CLOSE_CALL,
            reaction_buzzer_win: REACTION_BUZZER_WIN,
            reaction_buzzer_fail: REACTION_BUZZER_FAIL,
            end_game_wrap: this.pick(END_GAME_TEMPLATES),
            winner_roast: this.pick(WINNER_ROASTS),
        };
    }

    generatePlayerIntro(name: string, roast_level: HostConfig['roast_level']): string {
        const mild = [
            `Say hello to ${name}! ${name} showed up tonight, which is already doing better than the person who said they'd come and then "forgot".`,
            `${name} is here! The enthusiasm is audible. Let's see if the trivia knowledge matches it.`,
            `Please welcome ${name}! ${name} has prepared for tonight by existing. That's the kind of preparation I respect.`,
        ];
        const medium = [
            `${name} has arrived! ${name} walked in here like they already know they're going to win, which either means they've been studying or they have an unhealthy amount of confidence. Both are valid.`,
            `Give it up for ${name}! I looked at ${name}'s track record in this game and the word "chaotic" came up a suspicious number of times.`,
            `${name}! ${name} answered a question so fast last round that nobody checked whether it was correct. It wasn't. But the energy? Excellent.`,
        ];
        const spicy = [
            `${name} is in the building! ${name} once answered a question with the wrong answer so fast that I thought it might actually be a new, realer answer. It was not.`,
            `${name}! ${name}'s strategy appears to be tapping the screen before reading the question. Bold. Incredibly bold. Historically incorrect.`,
            `Welcome ${name}, whose relationship with the answer timer can only be described as "unaware it exists." Let's go!`,
        ];

        const pool = roast_level === 'mild' ? mild : roast_level === 'medium' ? medium : spicy;
        return this.pick(pool);
    }

    getModeIntro(mode: GameMode): string {
        const intros: Record<GameMode, string> = {
            trivia_categories: "Three rounds. Three categories. Ten questions each. The facts are real, the timer is merciless, and the host — that's me — is rooting for chaos.",
            rapid_fire: "RAPID FIRE. No pausing. No deliberating. No asking your neighbor. You have the time you have, you answer what you got. Hesitate and the points leave you.",
            jeopardy: "You are playing a board game where YOU pick the question. The board has categories, the categories have values, and the values have vibes. Pick wisely.",
            legacy_ladder: "The Legacy Ladder. You climb or you fall. Wrong answers cost strikes. Lose all your strikes and the run is over. There is no shame in falling on step four. There is a little shame. Not much.",
        };
        return intros[mode] ?? "Let's play trivia!";
    }

    getRoundIntro(config: HostConfig, round: number, mode: GameMode): string {
        const labels = ['First', 'Second', 'Third', 'Fourth', 'Fifth'];
        return `${labels[round - 1] ?? 'Next'} round, coming at you! The questions are ready. The timer is hungry. Are you?`;
    }

    getReaction(config: HostConfig, room: Room, question: Question): string {
        const activePlayers = Object.values(room.players).filter(p => p.status === 'active');
        const correctPlayers = activePlayers.filter(p => p.answer_index === question.correct_index);

        if (correctPlayers.length === 0) {
            return "Nobody got it! That's impressive in the worst way. The fact has defeated everyone tonight.";
        }
        if (correctPlayers.length === activePlayers.length) {
            return "EVERYONE got it! Either this question was too easy or this is the smartest group ever assembled. The scoreboard will tell the truth.";
        }

        const winner = correctPlayers.sort((a, b) => (a.answer_time_ms ?? 9999) - (b.answer_time_ms ?? 9999))[0];
        const template = this.pick(REACTION_CORRECT);
        return template.replace(/{name}/g, winner.name);
    }

    getEndGameWrap(config: HostConfig, winnerName: string): string {
        return this.pick(END_GAME_TEMPLATES);
    }

    getWinnerRoast(config: HostConfig, winnerName: string): string {
        return this.pick(WINNER_ROASTS).replace(/{name}/g, winnerName);
    }

    private pick<T>(arr: T[]): T {
        return arr[Math.floor(Math.random() * arr.length)];
    }
}
