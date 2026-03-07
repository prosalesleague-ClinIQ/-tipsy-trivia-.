import type { ComedianPreset, HostConfig, HostScript, Player, GameMode, Room, Question } from '@tipsy-trivia/shared';

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

const MONOLOGUE_MILD = [
    "Welcome to Tipsy Trivia! We are so glad you're here. Let's have some fun and test our knowledge!",
    "Gather round, friends! It's time to see who's been holding out on us with secret trivia powers.",
    "Hello and welcome! Tonight is all about good times, great friends, and mildly challenging facts.",
    "Welcome everyone! Don't worry if you don't know the answers, we're just here to have a blast.",
    "Good evening! Ready to laugh, guess, and cheer each other on? Let's get this game started!",
    "It's trivia night! Kick back, relax, and let's see what random facts you've picked up over the years.",
    "Hey there, trivia fans! We have some great questions lined up. No pressure, just fun!",
    "Welcome to the stage, players! May the best guesser win, and may nobody take the score too seriously.",
    "Let the games begin! We're thrilled you could join us for a friendly night of trivia.",
    "Settle in, folks. It's time to test your brainpower in the friendliest competition in town!"
];

const MONOLOGUE_MEDIUM = [
    "Welcome to the most chaotic trivia night you'll ever survive! Tonight we find out who's actually bright and who's just pretending.",
    "Okay, gather round. One of you is about to validate years of being a know-it-all. The rest are here for humiliation.",
    "Good evening! Some of you Googled the rules on the way over. And some just paused Netflix to be here. Good luck.",
    "Welcome! You're here to prove which one of you absorbs the most useless information from the internet. Let's go.",
    "Tonight's game is simple: I ask questions, you answer them, and we pretend the scores don't reveal our insecurities.",
    "Get ready for trivia! Try not to embarrass yourselves too much, though I make no promises.",
    "Welcome to the battle of wits! Come unarmed at your own risk. Just kidding, sort of.",
    "It's time to see whose brain is functioning tonight. Hint: it might not be yours. Let's play!",
    "Welcome, warriors. Your pride is on the line, but mostly just your dignity. Don't blow it.",
    "Let the chaos commence! May the smartest player win, and everyone else provide quality entertainment."
];

const MONOLOGUE_SPICY = [
    "Welcome to the thunderdome of absolute stupidity. Look around the room. Most of you will fail tonight. Let's begin.",
    "Oh look, a room full of people who think they know things. This is going to be hilariously tragic.",
    "Good evening. I hope you're ready to have your ego absolutely demolished regarding your lack of basic knowledge.",
    "Welcome to trivia night, where friendships end over the wingspan of an albatross. Try not to cry.",
    "You all signed up for this willingly. When you inevitably humiliate yourselves, remember this moment. Let's play.",
    "I'd say 'may the best player win,' but looking at this group, 'best' is a very strong word.",
    "Gather your two remaining brain cells, folks. You're going to need them to even comprehend these questions.",
    "Welcome. If you're confident you're going to win, you're delusional. Let the devastation begin.",
    "Trivia Time! A brutal reminder that spending 6 hours a day on TikTok doesn't constitute an education.",
    "I'm your host, and I'm already disappointed in all of you. Prove me wrong, but I won't hold my breath."
];

const REACTION_CORRECT_MILD = [
    "Great job, {name}! That was spot on.",
    "Wow, {name} knows their stuff! Well done.",
    "{name} nailed it! What a fantastic answer.",
    "Look at {name} go! Getting it right with style.",
    "Correct! {name} is on fire today.",
    "Beautifully answered, {name}. Keep it up!",
    "That's absolutely right, {name}! Impressive.",
    "{name} comes through with the right answer! Cheers!",
    "Excellent work, {name}! That was a tricky one.",
    "{name} got it! A round of applause, please!"
];

const REACTION_CORRECT_MEDIUM = [
    "Boom! {name} got it! Someone actually read a book. Or saw it on TikTok.",
    "{name} with the speed! Faster than your last excuse.",
    "Correct! {name} is making everyone else feel personally attacked.",
    "Lock it in! {name} is playing like they have something to prove.",
    "There it is! {name} knew it. The silence from everyone else is deafening.",
    "{name} swoops in with the right answer! Flex on them.",
    "Look who decided to use their brain today! Nice job, {name}.",
    "{name} gets it right! The rest of you, take notes.",
    "A rare moment of brilliance from {name}! Just kidding, good job.",
    "{name} takes the point! Was it a guess? We'll never know."
];

const REACTION_CORRECT_SPICY = [
    "Wow, {name} got it right. Did hell freeze over while I wasn't looking?",
    "{name} answered correctly! Even a broken clock is right twice a day.",
    "Correct. {name} finally justifies the oxygen they're consuming.",
    "I'm shocked. {name} actually knew a fact. Mark your calendars.",
    "{name} gets the point! Sadly, it doesn't fix their personality.",
    "Correct, {name}. Don't let it go to your head, it was an easy one.",
    "{name} stumbled into the right answer! A statistical anomaly.",
    "Against all odds, {name} is correct. I demand a recount.",
    "Wow, {name}. You successfully read the question. Do you want a medal?",
    "{name} got it! The rest of you should be deeply ashamed."
];

const REACTION_WRONG_MILD = [
    "Oh no, {name}. That wasn't quite it. Better luck next time!",
    "Nice try, {name}! It was a tough question.",
    "Not the right answer this time, {name}. You'll get the next one!",
    "Good guess, {name}, but incorrect. Keep your head up!",
    "Aww, close but no cigar, {name}. It happens to the best of us.",
    "Incorrect, {name}. I appreciate the effort, though!",
    "Oops, that's a miss for {name}. Shake it off!",
    "Not exactly, {name}. We believe in your comeback!",
    "That wasn't the one, {name}, but I love the enthusiasm.",
    "Wrong answer, {name}. But we're all still rooting for you!"
];

const REACTION_WRONG_MEDIUM = [
    "Ooh. {name} went for it with the full confidence of someone never wrong. Until now.",
    "That was incorrect, but the commitment? Unmatched, {name}.",
    "Wrong! {name}, that answer has never been right in the history of questions.",
    "Oh no. {name} pressed that with such audacity. The answer was not it.",
    "Incorrect! {name}'s fingers typed faster than their brain could object.",
    "Swing and a miss from {name}. Did you even read the options?",
    "{name} gets it wrong! A tragic display of guessing.",
    "Nope! {name} confidently selected pure nonsense.",
    "Incorrect, {name}. At least you tried. Sort of.",
    "{name} proves that guessing doesn't always work out."
];

const REACTION_WRONG_SPICY = [
    "Wow, {name}. That was aggressively stupid. I'm embarrassed for you.",
    "Wrong. {name}, did you drop your phone or actually mean to pick that?",
    "Incorrect. {name}'s brain has officially left the chat.",
    "Are you kidding me, {name}? A toddler could have guessed better.",
    "Wrong, {name}. I can literally hear your brain cells dying from here.",
    "{name} missed it. Please, for the love of god, read a book.",
    "Incorrect. {name}, you bring shame to yourself and your ancestors.",
    "That was spectacularly wrong, {name}. It's honestly impressive how wrong.",
    "Nope. {name}, you might want to sit the rest of this round out.",
    "Wrong! {name}, why are you even playing if you're going to guess like that?"
];

const REACTION_CLOSE_MILD = [
    "So close, {name}! You were almost there.",
    "Oof, just a hair away, {name}! Next time for sure.",
    "You had the right idea, {name}! Just missed the mark.",
    "A valiant effort, {name}. You were right on the edge!",
    "{name} nearly had it! A noble attempt."
];

const REACTION_CLOSE_MEDIUM = [
    "SO CLOSE. {name} could smell the right answer. It just refused to be seen.",
    "That's a hair away from correct! {name} is going to replay that for weeks.",
    "Oof. {name} was right there. The answer waved goodbye on the way out.",
    "Heartbreak for {name}! So close, yet still completely wrong.",
    "{name} grazed the truth but failed to grab it. Tragic."
];

const REACTION_CLOSE_SPICY = [
    "Almost right is still completely wrong, {name}. Don't expect pity from me.",
    "Wow, {name}. You were so close, which makes your failure even funnier.",
    "You almost had it, {name}. But 'almost' is just a fancy word for 'loser'.",
    "{name} choked at the finish line. Classic.",
    "So close, {name}! It must hurt to be that incompetent."
];

const REACTION_BUZZER_WIN_MILD = [
    "Great reflexes, {name}! Let's hear your answer.",
    "First to buzz in is {name}! What have you got?",
    "{name} with the quick fingers! You have the floor.",
    "Speedy buzz from {name}! Let's see if it pays off.",
    "{name} takes the buzzer! Your time to shine."
];

const REACTION_BUZZER_WIN_MEDIUM = [
    "{name} SLAMMED that buzzer like a debt collector knocking on a door.",
    "FIRST BUZZ GOES TO {name}! Let's see if the brain caught up!",
    "{name} buzzed in with the urgency of someone late for a flight.",
    "Lightning fast buzz from {name}! Don't blow it.",
    "{name} snags the buzzer! Let the panic set in."
];

const REACTION_BUZZER_WIN_SPICY = [
    "{name} slapped that buzzer like it owed them money. Let's hear your pathetic guess.",
    "Oh, {name} buzzed in first. This should be a hilarious disaster.",
    "{name} took the buzzer! I prepare to be completely underwhelmed.",
    "Aggressive buzz from {name}. Let's hope your answer isn't as desperate.",
    "{name} claims the buzzer! Reveal your ignorance, please."
];

const PLAYER_INTRO_MILD = [
    "Say hello to {name}! Thanks for joining us tonight.",
    "{name} has arrived! Let's have a great game.",
    "Welcome, {name}! We're thrilled to have you here.",
    "Give a warm welcome to {name}! Good luck today.",
    "It's {name}! Ready to test some trivia knowledge?"
];

const PLAYER_INTRO_MEDIUM = [
    "Say hello to {name}! Showing up is half the battle, right?",
    "{name} is here! The enthusiasm is audible.",
    "Welcome {name}! Let's see if the trivia knowledge matches the confidence.",
    "{name} walked in knowing they'll win. Or they have unhealthy confidence.",
    "Give it up for {name}! We expect chaotic energy at the very least."
];

const PLAYER_INTRO_SPICY = [
    "{name} is in the building. A tragedy for the rest of us.",
    "Oh look, {name} joined. The average IQ of the room just plummeted.",
    "Welcome {name}, whose relationship with winning is strictly long-distance.",
    "{name} has arrived. Lower your expectations immediately.",
    "Behold {name}. Prepared to confidently shout wrong answers all night."
];


const END_GAME_MILD = [
    "And that's a wrap! Thank you all so much for playing, what a fantastic game!",
    "Trivia is over! You were all amazing. Have a wonderful rest of your evening!",
    "The final buzzer sounds! Great job everyone, it was a pleasure hosting you.",
    "That concludes our game! Give yourselves a round of applause for showing up and trying.",
    "Game over! Whether you won or lost, I hope you had a blast playing tonight!"
];

const END_GAME_MEDIUM = [
    "And THAT is a wrap! The scoreboard never lies. Statistically, one of you is lying.",
    "It's OVER! Your brains are stretched like taffy. Blame the questions if it helps.",
    "The final buzzer sounds! You survived. Mostly. Go nurse your bruised egos.",
    "Trivia conclude! The facts have been dispensed. Apologies to your pride.",
    "That's game! Feel free to argue about the answers on the ride home."
];

const END_GAME_SPICY = [
    "It's finally over. I can stop suffering through your agonizingly tragic answers.",
    "That's a wrap! If shame is a heavy burden, most of you must be exhausted.",
    "Game over! The scoreboard definitively proves who here is a profound disappointment.",
    "We are done. I recommend most of you use the rest of tonight to rethink your lives.",
    "Trivia is finished! Please leave immediately, I can't take the stupidity anymore."
];

const WINNER_ROAST_MILD = [
    "Congratulations to {name} on taking the crown! You earned it!",
    "Let's hear it for {name}! An incredible performance from our champion.",
    "The winner is {name}! Enjoy your victory, brilliantly played.",
    "{name} takes the win tonight! A fantastic display of knowledge.",
    "A massive round of applause for {name}! You really know your stuff!"
];

const WINNER_ROAST_MEDIUM = [
    "{name} wins! Look at that smug face. You earned this, out-trivia'ing everyone.",
    "The winner is {name}! Surprised? Don't be, they've been hoarding weird facts for years.",
    "{name} takes it home! If you want a rematch, {name} will be right here rejecting you.",
    "Bow down to {name}, today's monarch of useless trivia!",
    "Congratulations {name}. You are the smartest person in a room of very questionable people."
];

const WINNER_ROAST_SPICY = [
    "{name} somehow won. Must have been a clerical error. But whatever, take your hollow victory.",
    "The winner is {name}. Which proves my theory that today's questions were painfully easy.",
    "Congratulations {name}, you have peaked. It's all downhill for your life from here.",
    "{name} takes the crown. The king of fools is still a fool, but wear it with pride.",
    "{name} wins! Let's all pretend they didn't cheat. Seriously, I'm checking their phone."
];


export class ComedianHostEngine {
    generateScript(config: HostConfig, players: Player[], mode: GameMode): HostScript {
        const monologues = config.roast_level === 'mild' ? MONOLOGUE_MILD : config.roast_level === 'medium' ? MONOLOGUE_MEDIUM : MONOLOGUE_SPICY;
        const intros_pool = config.roast_level === 'mild' ? PLAYER_INTRO_MILD : config.roast_level === 'medium' ? PLAYER_INTRO_MEDIUM : PLAYER_INTRO_SPICY;
        const correct_pool = config.roast_level === 'mild' ? REACTION_CORRECT_MILD : config.roast_level === 'medium' ? REACTION_CORRECT_MEDIUM : REACTION_CORRECT_SPICY;
        const wrong_pool = config.roast_level === 'mild' ? REACTION_WRONG_MILD : config.roast_level === 'medium' ? REACTION_WRONG_MEDIUM : REACTION_WRONG_SPICY;
        const close_pool = config.roast_level === 'mild' ? REACTION_CLOSE_MILD : config.roast_level === 'medium' ? REACTION_CLOSE_MEDIUM : REACTION_CLOSE_SPICY;
        const buzzer_win = config.roast_level === 'mild' ? REACTION_BUZZER_WIN_MILD : config.roast_level === 'medium' ? REACTION_BUZZER_WIN_MEDIUM : REACTION_BUZZER_WIN_SPICY;
        const end_pool = config.roast_level === 'mild' ? END_GAME_MILD : config.roast_level === 'medium' ? END_GAME_MEDIUM : END_GAME_SPICY;
        const winner_pool = config.roast_level === 'mild' ? WINNER_ROAST_MILD : config.roast_level === 'medium' ? WINNER_ROAST_MEDIUM : WINNER_ROAST_SPICY;

        const player_intros: Record<string, string> = {};
        players.forEach(p => {
            let intro = this.pick(intros_pool);
            player_intros[p.id] = intro.replace(/{name}/g, p.name);
        });

        return {
            opening_monologue: this.pick(monologues),
            player_intros,
            mode_intro: this.getModeIntro(mode),
            reaction_correct: correct_pool,
            reaction_wrong: wrong_pool,
            reaction_close_call: close_pool,
            reaction_buzzer_win: buzzer_win,
            reaction_buzzer_fail: [
                "Buzzed first, said nothing. A strategy of champions.",
                "{name} buzzed and stared into the void. Outstanding."
            ],
            end_game_wrap: this.pick(end_pool),
            winner_roast: this.pick(winner_pool),
        };
    }

    getModeIntro(mode: GameMode): string {
        const intros: Record<GameMode, string> = {
            trivia_categories: "Three rounds. Three categories. Ten questions each. The facts are real, the timer is merciless, and the host is rooting for chaos.",
            rapid_fire: "RAPID FIRE. No pausing. No deliberating. No asking your neighbor. You have the time you have, you answer what you got.",
            jeopardy: "You are playing a board game where YOU pick the question. The board has categories, the categories have values, and the values have vibes.",
            legacy_ladder: "The Legacy Ladder. You climb or you fall. Wrong answers cost strikes. Lose all your strikes and the run is over.",
            plot_ladder: "Plot Ladder. I give you a clue. You guess the movie. Each stage reveals a little more.",
            cast_ladder: "Cast Ladder. I name actors. You name the film. It starts vague, it ends obvious.",
            fun_fact: "Fun Fact Mode. The facts are absurd, the choices are wild, but the truth is stranger than fiction."
        } as Record<GameMode, string>;
        return intros[mode] ?? "Let's play trivia!";
    }

    getRoundIntro(config: HostConfig, round: number, mode: GameMode): string {
        const labels = ['First', 'Second', 'Third', 'Fourth', 'Fifth'];
        return `${labels[round - 1] ?? 'Next'} round, coming at you! The questions are ready. The timer is hungry. Are you?`;
    }

    getReaction(config: HostConfig, room: Room, question: Question): string {
        const correct_pool = config.roast_level === 'mild' ? REACTION_CORRECT_MILD : config.roast_level === 'medium' ? REACTION_CORRECT_MEDIUM : REACTION_CORRECT_SPICY;

        const activePlayers = Object.values(room.players).filter(p => p.status === 'active');
        const correctPlayers = activePlayers.filter(p => p.answer_index === question.correct_index);

        if (correctPlayers.length === 0) {
            return config.roast_level === 'spicy'
                ? "Nobody got it! That is a profound display of collective ignorance."
                : "Nobody got it! That's impressive in the worst way. The fact has defeated everyone tonight.";
        }
        if (correctPlayers.length === activePlayers.length) {
            return config.roast_level === 'spicy'
                ? "EVERYONE got it! I demand an investigation into cheating."
                : "EVERYONE got it! Either this question was too easy or this is the smartest group ever assembled.";
        }

        const winner = correctPlayers.sort((a, b) => (a.answer_time_ms ?? 9999) - (b.answer_time_ms ?? 9999))[0];
        const template = this.pick(correct_pool);
        return template.replace(/{name}/g, winner.name);
    }

    getEndGameWrap(config: HostConfig, winnerName: string): string {
        const end_pool = config.roast_level === 'mild' ? END_GAME_MILD : config.roast_level === 'medium' ? END_GAME_MEDIUM : END_GAME_SPICY;
        return this.pick(end_pool).replace(/{name}/g, winnerName);
    }

    getWinnerRoast(config: HostConfig, winnerName: string): string {
        const winner_pool = config.roast_level === 'mild' ? WINNER_ROAST_MILD : config.roast_level === 'medium' ? WINNER_ROAST_MEDIUM : WINNER_ROAST_SPICY;
        return this.pick(winner_pool).replace(/{name}/g, winnerName);
    }

    private pick<T>(arr: T[]): T {
        return arr[Math.floor(Math.random() * arr.length)];
    }
}
