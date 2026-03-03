import { useCallback } from 'react';
import type { ComedianPreset } from '@tipsy-trivia/shared';

// Speak text using the browser's built-in SpeechSynthesis.
// Comedian style is expressed through the text content itself (generated
// server-side by the AI host engine) — no external voice API needed.
function browserSpeak(text: string, pace: 'slow' | 'normal' | 'fast') {
    if (!window.speechSynthesis || !text) return;
    const rateMap = { slow: 0.82, normal: 1.0, fast: 1.15 };
    window.speechSynthesis.cancel();

    function doSpeak() {
        const voices = window.speechSynthesis.getVoices();
        if (!voices.length) {
            window.speechSynthesis.onvoiceschanged = doSpeak;
            return;
        }
        const utt = new SpeechSynthesisUtterance(text);
        utt.rate = rateMap[pace];
        utt.pitch = 0.9; // slightly lower for a deeper male tone
        // Prefer high-quality male English voices
        const voice =
            voices.find(v => v.name === 'Google UK English Male') ??
            voices.find(v => v.name === 'Daniel') ??              // macOS high-quality male
            voices.find(v => v.name === 'Aaron') ??               // macOS male
            voices.find(v => v.name === 'Alex') ??                // macOS male
            voices.find(v => v.name === 'Tom') ??                 // macOS male
            voices.find(v => v.name === 'Microsoft David') ??     // Windows male
            voices.find(v => v.name === 'Microsoft Mark') ??      // Windows male
            voices.find(v => v.name === 'Google US English') ??
            voices.find(v => /male/i.test(v.name) && /en/i.test(v.lang)) ??
            voices.find(v => /en[-_]US/i.test(v.lang)) ??
            voices.find(v => v.lang.startsWith('en')) ??
            voices[0] ??
            null;
        if (voice) utt.voice = voice;
        utt.onerror = (e) => console.error('TTS error:', e.error);
        window.speechSynthesis.speak(utt);
    }
    doSpeak();
}

export function useSpeech(
    pace: 'slow' | 'normal' | 'fast' = 'normal',
    _presets?: ComedianPreset[], // reserved for future ElevenLabs integration
) {
    const speak = useCallback((text: string) => {
        if (!text) return;
        console.log('Host speaking:', text.slice(0, 60));
        browserSpeak(text, pace);
    }, [pace]);

    const stop = useCallback(() => {
        window.speechSynthesis?.cancel();
    }, []);

    return { speak, stop };
}
