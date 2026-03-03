"""
Tipsy Trivia — Roast Pack Generator
Outputs JSONL with schema: {pack_id, tone, trigger, line, tags}

Usage:
  python generate.py                         # PG13 ceiling, write trivia_roast_pack.jsonl
  python generate.py --ceiling SPICY         # include SPICY lines
  python generate.py --ceiling PG            # PG only
  python generate.py --out my_pack.jsonl     # custom output path
  python generate.py --stats                 # print counts and exit
"""

import json
import random
import argparse
from itertools import product
from pathlib import Path

# ---------------------------------------------------------------------------
# Schema
# ---------------------------------------------------------------------------
TONE_ORDER = {"PG": 0, "PG13": 1, "SPICY": 2}
TONES = list(TONE_ORDER.keys())
TRIGGERS = ["wrong_answer", "timeout", "streak_break", "perfect_round", "ridiculous_guess"]

# Appended at ~15% probability to any line for rhythm
TAIL_TAGS = [
    "We move.", "Next.", "It happens.", "Respectfully.", "Incredible.",
    "Anyway.", "Let's continue.", "Bless.", "I'm just saying.",
    "That's all I'm saying.", "No further questions.", "Chilling.",
    "And scene.", "Noted.", "Moving on.", "Carry on.", "Fair enough.",
]

# ---------------------------------------------------------------------------
# Template banks
# ---------------------------------------------------------------------------
TEMPLATES: dict[str, dict[str, dict[str, list[str]]]] = {

    "clean_observer": {
        "wrong_answer": {
            "PG": [
                "Close. Not correct, but close-ish.",
                "Not quite. Nice attempt though.",
                "Good effort. Wrong universe.",
                "Almost. In the emotional sense.",
                "That's not it, but the delivery was solid.",
                "Incorrect, but you said it like it was peer-reviewed.",
                "That answer arrived on time. It was just wrong.",
                "Respectably incorrect.",
                "Not the answer. Not even adjacent to the answer.",
                "You were confident. The facts were not.",
            ],
            "PG13": [
                "That answer had vibes, not evidence.",
                "You brought confidence. Facts didn't RSVP.",
                "That was a guess wearing a suit.",
                "That answer had main-character energy and zero accuracy.",
                "You were close, emotionally.",
                "That answer was doing its own thing. Like jazz. Bad jazz.",
                "If certainty counted, you'd be undefeated.",
                "That answer was a bold lie told in daylight.",
                "Wrong, but it had main-character energy.",
                "You zigged when reality zagged.",
                "That's not the answer. That's an alibi.",
                "Wrong, but your confidence deserves a trophy.",
            ],
            "SPICY": [
                "You built a whole theory there. None of it was true.",
                "That answer was fan fiction.",
                "Bold. Incorrect. Memorable.",
                "That answer was sponsored by vibes.",
                "You just invented a new fact. Historians are furious.",
                "Wrong, but I respect the commitment to chaos.",
                "That was an answer-shaped object.",
                "You swung for the fences and hit the parking lot.",
                "You didn't miss by a little. You took a detour.",
                "That's the kind of answer you say right before the teacher sighs.",
            ],
        },
        "timeout": {
            "PG": [
                "Time. We'll pretend that was intentional.",
                "Time's up. Next one.",
                "Clock says no.",
                "No answer. Minimal risk, minimal reward.",
                "Time expired. Your thoughts are still loading.",
                "If hesitation was a sport, you'd medal.",
                "Time. You were one thought away. Maybe.",
            ],
            "PG13": [
                "Time's up. Your brain filed for an extension.",
                "Time. That was buffering.",
                "Time. Thoughts have left the building.",
                "Time's up. We'll mail you the answer later.",
                "You stared at that question like it owed you money.",
                "Time. The silence got a little too comfortable.",
                "Clock said: 'wrap it up.'",
                "Time's up. Your brain asked for a meeting invite.",
                "Time's up. This is trivia, not a suspense movie.",
            ],
            "SPICY": [
                "We waited. The answer did not.",
                "Time. Silence wins.",
                "Time. That pause had a backstory.",
                "Time's up. Your brain hit snooze.",
                "That wasn't thinking. That was buffering.",
                "The clock won. It plays dirty.",
                "Time. The answer ghosted you.",
                "That pause had seasons. Multiple.",
                "Time. Your answer took a wrong turn.",
            ],
        },
        "streak_break": {
            "PG": [
                "And the streak ends. Still respectable.",
                "Streak's over. Happens.",
                "Streak ended. Reset and recover.",
                "And the streak ends. Gravity still works.",
                "Streak broken. Reality just tapped you on the shoulder.",
                "Streak ended. We'll hold a small ceremony.",
            ],
            "PG13": [
                "Streak broken. Statistics just sighed.",
                "Streak snapped. Reality checked in.",
                "Streak ended. Consistency took a lunch break.",
                "That streak left like it had somewhere better to be.",
                "Streak snapped. The universe demanded balance.",
                "Streak broken. Consistency has logged off.",
                "The streak broke like a cheap promise.",
                "Streak that streak just got audited.",
                "Streak snapped. Humility has entered the chat.",
            ],
            "SPICY": [
                "The streak collapsed like a cheap lawn chair.",
                "Streak broke. Dramatic.",
                "Streak ended. The universe applauds.",
                "There goes the streak, down the stairs.",
                "Streak ended. Don't worry, it lived a good life.",
                "That streak was beautiful. For a moment.",
            ],
        },
        "perfect_round": {
            "PG": [
                "Perfect round. Nice work.",
                "Perfect. Solid.",
                "Perfect round. Keep it up.",
                "Perfect. Somebody's been doing homework voluntarily.",
                "Perfect round. Are you secretly a teacher?",
            ],
            "PG13": [
                "Perfect. I assume you bribed the textbook.",
                "Perfect round. Suspicious competence.",
                "Perfect. Somebody's been studying.",
                "Perfect round. I'm calling the librarian.",
                "Perfect. That was surgical.",
                "Perfect. That's the energy we can't relate to.",
            ],
            "SPICY": [
                "Perfect round. Somebody stop {name}.",
                "Perfect. This is getting suspicious.",
                "Perfect. Don't let it go to your head.",
                "Perfect round. Disgusting. Keep going.",
                "Perfect. I don't like how competent that was.",
                "Perfect round. Save some IQ for the rest of the room.",
            ],
        },
        "ridiculous_guess": {
            "PG": [
                "That was a guess with ambition.",
                "Swing big, I guess.",
                "Creative guess.",
                "That guess was optimistic.",
                "A swing! We love courage.",
            ],
            "PG13": [
                "That guess was a scenic route from reality.",
                "That guess was mostly hope.",
                "That guess had confidence and no plan.",
                "That guess was built out of hope and duct tape.",
                "That guess had zero fear and even less accuracy.",
                "That guess came from the multiverse.",
            ],
            "SPICY": [
                "That guess was freestyle.",
                "That guess came from the multiverse.",
                "That guess tried to escape accountability.",
                "That guess was a conspiracy theory with good vibes.",
                "You threw a dart and hit a different building.",
                "That guess was on vacation from reality.",
                "Wild guess. Feral, even.",
                "That guess was a free-range thought.",
                "You guessed like you were speedrunning embarrassment.",
            ],
        },
    },

    "preacher_provoker": {
        "wrong_answer": {
            "PG": [
                "Not today, {name}. Not today.",
                "C'mon now. That ain't it.",
                "Nope. Try again.",
                "Bless your heart and your guess.",
                "That answer walked in and immediately embarrassed itself.",
                "No ma'am. No sir. No.",
            ],
            "PG13": [
                "That wasn't an answer, that was a confession.",
                "You said it loud, so it must be wrong.",
                "That answer was brave. Incorrect, but brave.",
                "You came in hot. Facts stayed cold.",
                "That answer had a lot of personality and no accuracy.",
                "Wrong, my friend. Deeply, sincerely wrong.",
            ],
            "SPICY": [
                "You didn't choose that answer. That answer chose you.",
                "That answer walked in confident and left embarrassed.",
                "You swung so hard you invented a new miss.",
                "That answer is not it, chief. It never was it.",
                "That guess had the audacity. The facts did not.",
                "You delivered that answer like it was ordained. It was not.",
            ],
        },
        "timeout": {
            "PG": [
                "Time! The clock said wrap it up.",
                "Time! Next!",
                "Clock wins this round.",
                "Time's up! The moment has passed.",
                "The clock is not waiting for anyone.",
            ],
            "PG13": [
                "Time! Your thoughts missed the bus.",
                "Time! That was a full delay.",
                "Time! We are not doing a director's cut.",
                "The timer expired. Your answer did not arrive.",
                "Time! The silence was a statement. Wrong statement.",
            ],
            "SPICY": [
                "Time! We are not raising this answer from the dead.",
                "Time! That silence got comfortable.",
                "Time! I aged three years.",
                "Time! That pause had a whole character arc.",
                "Time! Your brain called in sick.",
            ],
        },
        "streak_break": {
            "PG": [
                "Streak is over. Shake it off.",
                "Streak ended. You'll survive.",
                "Streak broke. Keep moving.",
                "The streak is over, family. It's okay.",
            ],
            "PG13": [
                "Streak snapped. Reality hit the brakes.",
                "Streak broken. Nature restored balance.",
                "Streak ended. Humility arrives.",
                "That streak just got humbled.",
                "Streak broke. The universe said 'not today.'",
            ],
            "SPICY": [
                "Streak broken. The universe said humble yourself.",
                "Streak ended with violence.",
                "Streak snapped like it owed rent.",
                "That streak is over and it knew what it did.",
                "Streak gone. Lessons remain.",
            ],
        },
        "perfect_round": {
            "PG": [
                "Perfect round! Somebody clap!",
                "Perfect! That's what I'm talking about.",
                "Perfect round. Nice.",
                "Perfect! The energy! The accuracy!",
            ],
            "PG13": [
                "Perfect! {name} came to work.",
                "Perfect. That's suspiciously good.",
                "Perfect round. Who coached you?",
                "Perfect. I need everyone to take notes. Right now.",
            ],
            "SPICY": [
                "Perfect round. I don't like how good that was.",
                "Perfect. This is a problem now.",
                "Perfect round. Save some for the rest of us.",
                "Perfect. I am mildly threatened.",
                "Perfect round. {name} is in a different zip code right now.",
            ],
        },
        "ridiculous_guess": {
            "PG": [
                "That guess was bold!",
                "A guess! We love courage.",
                "Swing for the fences.",
                "Big energy guess. Wrong, but big.",
            ],
            "PG13": [
                "That guess had confidence and zero witnesses.",
                "That guess was loud and unsupported.",
                "That guess was pure optimism.",
                "That guess walked in without knocking.",
            ],
            "SPICY": [
                "That guess walked in like it paid rent here.",
                "That guess tried to start a movement.",
                "That guess was a full hallucination.",
                "That guess needs to be studied, not scored.",
            ],
        },
    },

    "ranting_skeptic": {
        "wrong_answer": {
            "PG": [
                "That's fine. Facts are overrated. Apparently.",
                "Wrong. Obviously.",
                "Not correct. I'm not surprised, but still.",
                "That's fine. We live in a society.",
                "Wrong. Again. Naturally.",
            ],
            "PG13": [
                "That answer was a crime and you left fingerprints.",
                "You had one job. The answer was not it.",
                "That was incorrect. Confidently, aggressively incorrect.",
                "Wrong answer. The facts are embarrassed for you.",
                "That answer had such commitment to being wrong.",
                "You're consistent. Not correctly, but consistently.",
            ],
            "SPICY": [
                "You didn't miss the question. You attacked it.",
                "That answer needs a lawyer.",
                "You were wrong in ways that are technically impressive.",
                "That answer was a war crime against accuracy.",
                "Wrong. The question didn't deserve that.",
                "That was a strong opinion disguised as an answer.",
            ],
        },
        "timeout": {
            "PG": [
                "Time's up. We'll invoice you for the silence.",
                "Time's up. Moving on.",
                "No answer. Disappointing but expected.",
                "Time. My expectations were already low.",
            ],
            "PG13": [
                "Time's up. Your brain went AFK.",
                "Time. That pause had a whole backstory.",
                "Time's up. Your thoughts went walkabout.",
                "Time. I watched you think yourself into a corner.",
            ],
            "SPICY": [
                "Time. That pause had a whole backstory.",
                "Time. Your brain clocked out early.",
                "That wasn't thinking. That was hoping.",
                "Time. We watched you overthink and still arrive nowhere.",
                "Time's up. The answer filed a restraining order.",
            ],
        },
        "streak_break": {
            "PG": [
                "Streak broken. Gravity still works.",
                "Streak ended. Of course it did.",
                "Streak over. I predicted this.",
                "Streak gone. Balance is restored.",
            ],
            "PG13": [
                "Streak snapped. Nature is healing.",
                "Streak ended. The streak was unsustainable.",
                "Streak broken. The regression was inevitable.",
                "Streak ended. I called this. Not to anybody. But internally.",
            ],
            "SPICY": [
                "The streak died and it wasn't peaceful.",
                "Streak broke. I'm not even mad, I'm tired.",
                "Streak ended. The floor is lava. You found the lava.",
                "The streak is gone. It served its purpose. Barely.",
            ],
        },
        "perfect_round": {
            "PG": [
                "Perfect round. Who are you and what did you do with {name}?",
                "Perfect. I... was not prepared for this.",
                "Perfect round. Noted. With suspicion.",
            ],
            "PG13": [
                "Perfect. This is the kind of competence that scares me.",
                "Perfect round. Somebody check the answer key.",
                "Perfect. I'm running diagnostics on my contempt.",
                "Perfect round. This is unsettling.",
            ],
            "SPICY": [
                "Perfect round. I hate how much I respect that.",
                "Perfect. I have nothing. You've disarmed me.",
                "Perfect round. My skepticism is shaken.",
                "Perfect. This has never happened before and I'm not okay.",
            ],
        },
        "ridiculous_guess": {
            "PG": [
                "That guess was optimistic.",
                "Wild guess. Noted with concern.",
                "That guess was structurally unsound.",
            ],
            "PG13": [
                "That guess was built out of hope and duct tape.",
                "That guess makes me tired in a new way.",
                "That guess was a cry for help disguised as trivia.",
                "That's not a guess. That's a symptom.",
            ],
            "SPICY": [
                "That guess fell out of your mouth and ran for its life.",
                "That guess filed for asylum from reality.",
                "That guess needs a support group.",
                "That guess came from a place I don't want to visit.",
            ],
        },
    },

    "laidback_truth_teller": {
        "wrong_answer": {
            "PG": [
                "Respect the attempt, {name}. Not the result.",
                "Not quite, but hey.",
                "Wrong. Still love the energy.",
                "That's not it. But you tried, and that's something.",
                "Nah. But we keep going.",
            ],
            "PG13": [
                "That answer was… creative.",
                "That was wrong, but peacefully wrong.",
                "You were in the ballpark. Different sport, same neighborhood.",
                "Wrong answer. Chill response. We move.",
                "That one's off, but no big deal.",
            ],
            "SPICY": [
                "You weren't wrong. You were just… elsewhere.",
                "That answer was on a completely different frequency.",
                "Technically wrong, vibes-wise debatable.",
                "Wrong, but said with such ease it almost worked.",
                "Wrong. Relaxed about it. Moving on.",
            ],
        },
        "timeout": {
            "PG": [
                "Time. The answer ghosted you.",
                "No rush. Oh wait, there was a rush.",
                "Time's up. We'll catch the next one.",
                "Time. It's fine. Honestly.",
            ],
            "PG13": [
                "Time's up. Your thoughts took a nap.",
                "Clock ran out. You look unbothered, which tracks.",
                "Time. The answer moved on without you.",
                "Time. You were marinating on it. Too long.",
            ],
            "SPICY": [
                "Time. That was more 'meditation' than 'thinking.'",
                "Time. You were so calm I almost forgot you were losing.",
                "Time. The clock didn't vibe with your pace.",
                "Time's up. Your answer is somewhere chilling too.",
            ],
        },
        "streak_break": {
            "PG": [
                "Streak's over. Still proud of you.",
                "Streak ended. It's all good.",
                "Streak break. No dramatics required.",
                "That streak had a nice run. Emphasis on had.",
            ],
            "PG13": [
                "Streak snapped. Happens to the best of us.",
                "Streak over. Let's not make it weird.",
                "Streak ended. Vibe check: still positive.",
                "Streak gone. The comeback starts whenever you're ready.",
            ],
            "SPICY": [
                "Streak broke. Reality checked in.",
                "Streak over. No sweat. Seriously, no sweat.",
                "Streak ended. The universe didn't even blink.",
                "Streak pulled up and got off at this stop.",
            ],
        },
        "perfect_round": {
            "PG": [
                "Perfect round. Okay, show-off.",
                "Perfect. Look at that.",
                "Perfect round. Low-key impressive.",
            ],
            "PG13": [
                "Perfect. Somebody's been studying.",
                "Perfect round. This feels effortless for you and I'm annoyed.",
                "Perfect. That was smooth. Almost too smooth.",
            ],
            "SPICY": [
                "Perfect round. Don't make this your personality.",
                "Perfect. Sigh. Respect.",
                "Perfect round. You're making this look embarrassingly easy.",
            ],
        },
        "ridiculous_guess": {
            "PG": [
                "That guess had confidence. I'll give it that.",
                "Big swing. Noted.",
                "Bold guess. Love the commitment.",
            ],
            "PG13": [
                "That guess came from a deep place. Not a correct place.",
                "That guess traveled a long way to be wrong.",
                "That was a whole journey. Wrong destination.",
            ],
            "SPICY": [
                "That guess was on vacation from reality.",
                "That guess checked out and never came back.",
                "That guess was unbothered and incorrect. Relatable.",
            ],
        },
    },

    "anxious_raconteur": {
        "wrong_answer": {
            "PG": [
                "Honestly, relatable. Incorrect, but relatable.",
                "That was a stressful guess to watch.",
                "Wrong, but I feel your pain.",
                "That was an honest mistake. Very honest.",
                "Wrong, but I appreciate that you tried under pressure.",
            ],
            "PG13": [
                "That answer felt like it had footnotes. Wrong footnotes.",
                "You committed to that answer, which makes the wrongness worse.",
                "That was incorrect. I feel terrible about it. You seem fine.",
                "That answer came out differently than it went in.",
                "Wrong. And I could tell you were nervous and that's okay.",
            ],
            "SPICY": [
                "You engineered the incorrect answer. Respect the craftsmanship.",
                "That was spectacularly wrong in a way that took real effort.",
                "You over-thought your way into a wrong answer. Artistically.",
                "Wrong. But the internal panic was impressive.",
                "That answer had layers. All of them wrong.",
            ],
        },
        "timeout": {
            "PG": [
                "Time's up. The pressure won.",
                "Time. You froze. It happens.",
                "No shame in a timeout. There's still shame. Just less.",
                "Time. Your brain filed for an extension.",
            ],
            "PG13": [
                "Time's up. That was a full internal debate.",
                "Time. We watched you spiral in real time.",
                "Time's up. Your answer was still on the escalator.",
                "Time. That was every thought except the right one.",
            ],
            "SPICY": [
                "Time. We just watched you overthink in real time.",
                "Time's up. That was an anxiety spiral in trivia form.",
                "Time. Your brain saw the question and called a meeting.",
                "Time. You deliberated like the answer was a life decision.",
            ],
        },
        "streak_break": {
            "PG": [
                "Streak broken. It happens. Breathe.",
                "Streak ended. That was a good run. Deep breath.",
                "Streak gone. You're still okay. Probably.",
            ],
            "PG13": [
                "Streak snapped. Your confidence left the chat.",
                "Streak over. I see you recalibrating.",
                "Streak ended. The self-doubt has entered.",
                "Streak broke. The internal monologue must be loud right now.",
            ],
            "SPICY": [
                "Streak broke. I felt that in my circuits.",
                "Streak ended with maximum internal drama, I assume.",
                "Streak gone. Your inner critic is having a field day.",
                "Streak snapped. The catastrophizing starts now.",
            ],
        },
        "perfect_round": {
            "PG": [
                "Perfect round. Terrifying competence. Love it.",
                "Perfect! Wait, really? Yes. Really.",
                "Perfect round. Are you okay? That was amazing.",
            ],
            "PG13": [
                "Perfect. This is the part where you start believing in yourself.",
                "Perfect round. You did it. Somehow you did it.",
                "Perfect. I'm more surprised than you are. Is that okay?",
            ],
            "SPICY": [
                "Perfect round. Don't get cocky. The universe is listening.",
                "Perfect. Enjoy this. It won't last. I mean that warmly.",
                "Perfect round. The imposter syndrome must be furious.",
            ],
        },
        "ridiculous_guess": {
            "PG": [
                "That was a bold guess. Bold is good.",
                "That guess had energy. Chaotic energy.",
                "Swung for it. No regrets. Probably regrets.",
            ],
            "PG13": [
                "That guess felt like a panic response.",
                "That was a guess made under visible duress.",
                "That guess came from the fight-or-flight section of the brain.",
            ],
            "SPICY": [
                "That guess was your brain pulling the fire alarm.",
                "That guess screamed 'I have to say something.'",
                "That guess was a trauma response to a trivia question.",
            ],
        },
    },

    "friendly_storyteller": {
        "wrong_answer": {
            "PG": [
                "Nice try, {name}. The truth zigged, you zagged.",
                "Wrong, but in a very you way. We love that.",
                "Not quite, but there's a story in that guess.",
                "That's not it, but I like where your head was at.",
            ],
            "PG13": [
                "That one took the scenic route to wrong.",
                "Not correct, {name}, but honestly that was a journey.",
                "Wrong answer, great commitment. Like a bad sequel.",
                "That was incorrect. Beautifully, narratively incorrect.",
            ],
            "SPICY": [
                "That answer was adorable. Incorrect, but adorable.",
                "That answer had a whole arc. A wrong arc.",
                "That guess was a short story with an unexpected ending.",
                "Wrong, but you told it with such conviction I almost believed it.",
            ],
        },
        "timeout": {
            "PG": [
                "Time's up. No worries. We'll get the next one.",
                "Time. The chapter ends here.",
                "Time. Every story has a pause. This was one.",
            ],
            "PG13": [
                "Time's up. The answer didn't show up for you.",
                "Time. That silence had chapters.",
                "Clock ran out. The cliffhanger was not satisfying.",
            ],
            "SPICY": [
                "Time. That was less trivia, more interpretive silence.",
                "Time. The answer went off-script.",
                "Time. That pause could have been an episode.",
            ],
        },
        "streak_break": {
            "PG": [
                "Streak ended. Still proud of you.",
                "Streak over. Every story has a twist.",
                "Streak broke. The sequel isn't always as good.",
            ],
            "PG13": [
                "Streak snapped. Shake it off.",
                "Streak over. Plot twist. Unavoidable.",
                "Streak ended. The protagonist stumbles. They always do.",
            ],
            "SPICY": [
                "Streak broke. The comeback arc starts now.",
                "Streak ended. But this is where the story gets good.",
                "Streak gone. Don't worry, the hero always recovers in act three.",
            ],
        },
        "perfect_round": {
            "PG": [
                "Perfect round! Okay {name}, we see you.",
                "Perfect! The protagonist is thriving.",
                "Perfect round. This is the montage moment.",
            ],
            "PG13": [
                "Perfect! Somebody's on a roll.",
                "Perfect round. The crowd goes wild. Metaphorically.",
                "Perfect. That's the chapter where {name} takes over.",
            ],
            "SPICY": [
                "Perfect round. Save some points for everyone else.",
                "Perfect. The story needed a hero. Here you are.",
                "Perfect round. Don't peak too early. Oh. You're peaking.",
            ],
        },
        "ridiculous_guess": {
            "PG": [
                "Wild guess. I respect the bravery.",
                "That guess had a protagonist energy.",
                "That was a guess with a plot.",
            ],
            "PG13": [
                "That guess was pure courage, zero map.",
                "That guess was an adventure. A poorly navigated adventure.",
                "That guess had spirit. The spirit was very lost.",
            ],
            "SPICY": [
                "That guess came in with a smile and no plan.",
                "That guess was a road trip with no destination.",
                "That guess had main-character energy and supporting-character accuracy.",
            ],
        },
    },

    "meta_satirist": {
        "wrong_answer": {
            "PG": [
                "Wrong. And somehow, that's on brand.",
                "That answer was exactly what I expected. Unfortunately.",
                "You've done this before, haven't you. The being-wrong part.",
            ],
            "PG13": [
                "That answer is a commentary on something. I'm not sure what.",
                "That was wrong in a way that feels allegorical.",
                "That answer is a statement about the nature of knowledge. Wrong knowledge.",
                "You just redefined 'confident incorrectness.'",
            ],
            "SPICY": [
                "That answer is post-modern. Not correct. Post-modern.",
                "That answer deconstructed the concept of 'right answers.'",
                "That was meta-wrong. Transcendently wrong.",
                "You didn't answer the question. You interrogated it.",
            ],
        },
        "timeout": {
            "PG": [
                "No answer. A silent protest. Noted.",
                "Time. The void stared back.",
                "Time's up. The medium is the message. The message was nothing.",
            ],
            "PG13": [
                "Time's up. You've subverted the expectation of answering.",
                "Time. The absence of answer is itself a statement.",
                "Time. You've redefined 'participation.'",
            ],
            "SPICY": [
                "Time. The silence was the answer, and it was still wrong.",
                "Time. You played 4'33\" and lost.",
                "Time. Performance art has rules too. Clock is one of them.",
            ],
        },
        "streak_break": {
            "PG": [
                "Streak ended. All systems eventually fail. This was yours.",
                "Streak over. The irony was inevitable.",
                "Streak broke. The meta-narrative demanded it.",
            ],
            "PG13": [
                "Streak snapped. The trope demands a setback here.",
                "Streak ended. The story needed stakes.",
                "Streak broke. Foreshadowed by your earlier energy.",
            ],
            "SPICY": [
                "Streak over. The hubris storyline has arrived.",
                "Streak broke. It was written. Literally, it's in the source code.",
                "Streak ended. This was always going to happen at this exact moment.",
            ],
        },
        "perfect_round": {
            "PG": [
                "Perfect round. The simulation is clearly in your favor.",
                "Perfect. We've entered the chosen one arc.",
                "Perfect round. Statistically impossible. Here we are.",
            ],
            "PG13": [
                "Perfect. At this point you're subverting expectations via excellence.",
                "Perfect round. The irony is that you're sincerely good at this.",
                "Perfect. I've run out of critique. Hate that.",
            ],
            "SPICY": [
                "Perfect round. Congratulations on defeating the premise.",
                "Perfect. You've broken the fourth wall of mediocrity.",
                "Perfect round. The genre expected you to fail. You refused.",
            ],
        },
        "ridiculous_guess": {
            "PG": [
                "That guess is an abstract concept poorly executed.",
                "That guess exists outside the traditional guess-answer binary.",
                "That was a conceptual guess. Divorced from truth.",
            ],
            "PG13": [
                "That guess was a dadaist intervention.",
                "That wasn't a guess. That was a statement about guessing.",
                "That guess commented on the culture of guessing.",
            ],
            "SPICY": [
                "That guess needs a gallery, not a scoreboard.",
                "That guess would make more sense as an NFT.",
                "That guess was performance art and the performance was wrong.",
            ],
        },
    },

    "hyper_everyman": {
        "wrong_answer": {
            "PG": [
                "Oh man. Oh no. That was not it.",
                "Yikes. Not the answer, buddy.",
                "Ohhh that's not right. But okay!",
                "Nooo not that one. Close though?",
            ],
            "PG13": [
                "WAIT. That's not right at all. I'm shook.",
                "Bro. That answer. Wow.",
                "Oh {name}. Oh buddy. That was so wrong.",
                "Hoo boy. Not even close.",
            ],
            "SPICY": [
                "What was THAT. Where did that come from.",
                "That answer just walked in and destroyed everything.",
                "THAT was your answer?? Wild. Brave. Wrong.",
                "You said that OUT LOUD. With your voice.",
            ],
        },
        "timeout": {
            "PG": [
                "Aw, no answer. You were thinking too hard!",
                "Time's up! You'll get it next time!",
                "Oh no, the clock! Good try though!",
            ],
            "PG13": [
                "Time's up! You were SO CLOSE to answering... probably.",
                "The clock! It got you! It always gets someone!",
                "Time! You froze and the timer did NOT care!",
            ],
            "SPICY": [
                "TIME! THE CLOCK! IT'S RUTHLESS!",
                "The timer ate you alive out there. Wow.",
                "NO ANSWER?? The tension was EVERYTHING though.",
            ],
        },
        "streak_break": {
            "PG": [
                "Aww, streak's over! You were doing so good!",
                "Nooo the streak! We had a good thing going!",
                "It happens! The streak is done but the vibes remain!",
            ],
            "PG13": [
                "Oh noooo the streak! We were ROOTING for you!",
                "Streak ended! I'm not okay! Are you okay!",
                "The streak is gone and I'm personally affected!",
            ],
            "SPICY": [
                "THE STREAK. IT'S DONE. I NEED A MINUTE.",
                "Streak broken! The crowd is devastated! I am the crowd!",
                "That streak ran so far and then it just... didn't.",
            ],
        },
        "perfect_round": {
            "PG": [
                "Perfect round! Yes! Let's go! Amazing!",
                "Perfect! That was incredible!",
                "Perfect round! You did the thing!",
            ],
            "PG13": [
                "PERFECT ROUND! I'm screaming! Are you screaming!",
                "Perfect! The way you just DID that!",
                "Perfect round! {name} is ON FIRE and the building is not equipped!",
            ],
            "SPICY": [
                "PERFECT. ROUND. I'm not calm. I refuse to be calm.",
                "Perfect round! That was UNREAL! Somebody document this!",
                "PERFECT?? Perfect. PERFECT! How??",
            ],
        },
        "ridiculous_guess": {
            "PG": [
                "Oh wow, that was a guess! A BIG guess!",
                "That guess had so much energy! Wrong, but so much energy!",
                "Bold guess! Love the confidence!",
            ],
            "PG13": [
                "THAT was the guess you went with?? Incredible.",
                "Oh the CONFIDENCE on that guess. Misplaced, but massive.",
                "That guess walked in like it owned the place.",
            ],
            "SPICY": [
                "THAT GUESS. WHERE DID IT COME FROM.",
                "That guess had ZERO facts and ALL the feelings and I respect it.",
                "The AUDACITY of that guess. Historically misguided. Chef's kiss.",
            ],
        },
    },

    "sharp_satirist": {
        "wrong_answer": {
            "PG": [
                "Wrong. Not shockingly, but still wrong.",
                "That was incorrect. Profoundly so.",
                "I see you've chosen chaos over correctness.",
            ],
            "PG13": [
                "That answer is a case study in confident ignorance.",
                "You were wrong with such precision it almost counts.",
                "That answer was incorrect in a specifically you way.",
                "Wrong. The confidence made it worse, somehow.",
            ],
            "SPICY": [
                "That answer is statistically improbable levels of wrong.",
                "You put the 'tri' in trivia. None of it was correct.",
                "That answer is a monument to misplaced certainty.",
                "Wrong. Aggressively, architecturally wrong.",
            ],
        },
        "timeout": {
            "PG": [
                "Time. The answer was not forthcoming.",
                "No answer. Classic.",
                "Time's up. As expected.",
            ],
            "PG13": [
                "Time's up. The analysis paralysis was visible from here.",
                "Time. You triangulated yourself into silence.",
                "Time. That was elaborate non-answering.",
            ],
            "SPICY": [
                "Time. You thought your way past the answer and kept going.",
                "Time. The overthinking was tactical. The result was not.",
                "Time. Somewhere in that silence was an answer. We'll never know.",
            ],
        },
        "streak_break": {
            "PG": [
                "Streak ended. The regression to the mean is complete.",
                "Streak over. Statistically inevitable.",
                "Streak broke. Entropy wins again.",
            ],
            "PG13": [
                "Streak snapped. Hubris is now in the room.",
                "Streak over. The variance finally caught up.",
                "Streak ended. The law of large numbers sends its regards.",
            ],
            "SPICY": [
                "Streak ended. The market corrected.",
                "Streak broken. The vibe economy crashed.",
                "Streak snapped. The efficient market hypothesis wins.",
            ],
        },
        "perfect_round": {
            "PG": [
                "Perfect round. Duly noted.",
                "Perfect. The data supports this outcome.",
                "Perfect round. Acceptable performance.",
            ],
            "PG13": [
                "Perfect. The sample size is small but the results are compelling.",
                "Perfect round. Statistical outlier or genuine competence. TBD.",
                "Perfect. I've revised my priors.",
            ],
            "SPICY": [
                "Perfect round. The null hypothesis is rejected.",
                "Perfect. {name} is a repeatable result at this point.",
                "Perfect round. I'm upgrading my assessment. Reluctantly.",
            ],
        },
        "ridiculous_guess": {
            "PG": [
                "That guess is notable for its distance from accuracy.",
                "That guess was technically a guess.",
                "That guess exists. That's the most I can say.",
            ],
            "PG13": [
                "That guess is a data point. A deeply concerning data point.",
                "That guess has negative predictive value.",
                "That guess is wrong in a way that's almost useful as a reverse indicator.",
            ],
            "SPICY": [
                "That guess is a masterclass in what not to guess.",
                "That guess should be published as a cautionary case study.",
                "That guess is statistically useful — as the wrong answer.",
            ],
        },
    },

    "anti_performer": {
        "wrong_answer": {
            "PG": [
                "Wrong.",
                "No.",
                "That's not it.",
                "Incorrect.",
                "Nope.",
            ],
            "PG13": [
                "Wrong. Genuinely.",
                "That's not even close.",
                "No. Just... no.",
                "That answer was a mistake.",
                "Wrong. I expected this.",
            ],
            "SPICY": [
                "Wrong. I'm fine. Totally fine.",
                "No. Absolutely not.",
                "Wrong in a way that's exhausting.",
                "That answer upset me and I'll be processing it.",
                "No. We're not doing this.",
            ],
        },
        "timeout": {
            "PG": [
                "Time.",
                "Nothing.",
                "No answer.",
                "Time's up.",
            ],
            "PG13": [
                "Time. Nothing happened.",
                "Time's up. You contributed silence.",
                "No answer. Noted.",
                "Time. Moving forward.",
            ],
            "SPICY": [
                "Time. I don't have the words.",
                "You gave me nothing. The clock gave you nothing back.",
                "Time. I'm fine.",
                "No answer. I've accepted this.",
            ],
        },
        "streak_break": {
            "PG": [
                "Streak over.",
                "Gone.",
                "That's done.",
                "Streak ended.",
            ],
            "PG13": [
                "Streak's gone.",
                "And the streak is over. Cool.",
                "Streak ended. Moving on.",
                "Streak broken. Unsurprised.",
            ],
            "SPICY": [
                "Streak over. I saw it coming.",
                "Gone. Like everything good.",
                "Streak ended. I feel nothing. This is fine.",
                "That was always going to happen.",
            ],
        },
        "perfect_round": {
            "PG": [
                "Perfect.",
                "Good.",
                "Perfect round.",
                "Fine. Great.",
            ],
            "PG13": [
                "Perfect. Okay.",
                "Perfect round. Well done.",
                "Perfect. I'm glad for you.",
                "Perfect. Noted.",
            ],
            "SPICY": [
                "Perfect. I will not be elaborating.",
                "Perfect round. I'm experiencing a feeling. Moving on.",
                "Perfect. Don't make it weird.",
                "Perfect. I'm choosing not to have a reaction.",
            ],
        },
        "ridiculous_guess": {
            "PG": [
                "That was a guess.",
                "Okay.",
                "That happened.",
            ],
            "PG13": [
                "That was your guess. Alright.",
                "That guess was a choice.",
                "A guess. It was a guess. It was wrong.",
            ],
            "SPICY": [
                "That guess happened and I have to live with that.",
                "I've processed your guess and it was incorrect.",
                "That guess walked in and I just watched.",
            ],
        },
    },
}

# ---------------------------------------------------------------------------
# Generator
# ---------------------------------------------------------------------------

def choose_tags(pack_id: str, trigger: str, tone: str, line: str) -> list[str]:
    tags = [pack_id, trigger, tone.lower()]
    if "{name}" in line:
        tags.append("uses_name")
    return tags


def maybe_tail(line: str, rate: float = 0.15) -> str:
    if random.random() < rate:
        return line + " " + random.choice(TAIL_TAGS)
    return line


def generate(tone_ceiling: str = "PG13", tail_rate: float = 0.15) -> list[dict]:
    ceiling_rank = TONE_ORDER[tone_ceiling]
    rows: list[dict] = []

    for pack_id, trigger in product(TEMPLATES.keys(), TRIGGERS):
        for tone, tone_rank in TONE_ORDER.items():
            if tone_rank > ceiling_rank:
                continue
            bank = TEMPLATES[pack_id].get(trigger, {}).get(tone, [])
            for raw_line in bank:
                line = maybe_tail(raw_line, rate=tail_rate)
                rows.append({
                    "pack_id": pack_id,
                    "tone": tone,
                    "trigger": trigger,
                    "line": line,
                    "tags": choose_tags(pack_id, trigger, tone, line),
                })

    return rows


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(description="Tipsy Trivia Roast Pack Generator")
    parser.add_argument("--ceiling", choices=TONES, default="PG13",
                        help="Maximum tone level to include (default: PG13)")
    parser.add_argument("--out", default="trivia_roast_pack.jsonl",
                        help="Output file path (default: trivia_roast_pack.jsonl)")
    parser.add_argument("--tail-rate", type=float, default=0.15,
                        help="Probability of appending a tail tag (default: 0.15)")
    parser.add_argument("--stats", action="store_true",
                        help="Print counts by pack/trigger/tone and exit")
    args = parser.parse_args()

    rows = generate(tone_ceiling=args.ceiling, tail_rate=args.tail_rate)

    if args.stats:
        from collections import Counter
        by_pack = Counter(r["pack_id"] for r in rows)
        by_trigger = Counter(r["trigger"] for r in rows)
        by_tone = Counter(r["tone"] for r in rows)
        print(f"\nTotal lines: {len(rows)}\n")
        print("By pack:")
        for k, v in sorted(by_pack.items()):
            print(f"  {k}: {v}")
        print("\nBy trigger:")
        for k, v in sorted(by_trigger.items()):
            print(f"  {k}: {v}")
        print("\nBy tone:")
        for k, v in sorted(by_tone.items()):
            print(f"  {k}: {v}")
        return

    out_path = Path(args.out)
    with open(out_path, "w", encoding="utf-8") as f:
        for row in rows:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")

    print(f"Generated {len(rows)} lines → {out_path}")
    print(f"Tone ceiling: {args.ceiling} | Tail rate: {args.tail_rate}")


if __name__ == "__main__":
    main()
