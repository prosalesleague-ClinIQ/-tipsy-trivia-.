import { useCallback, useRef } from 'react';
import type { ComedianPreset } from '@tipsy-trivia/shared';

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? '';

// Default ElevenLabs voice — "Adam" deep male voice, great for a game show host
const DEFAULT_VOICE_ID = 'pNInz6obpgDQGcFmaJgB';
const DEFAULT_MODEL_ID = 'eleven_monolingual_v1';

// Try ElevenLabs server proxy first, returns true if successful
async function elevenLabsSpeak(
    text: string,
    pace: 'slow' | 'normal' | 'fast',
    audioRef: React.MutableRefObject<HTMLAudioElement | null>,
): Promise<boolean> {
    const stabilityMap = { slow: 0.7, normal: 0.5, fast: 0.35 };
    try {
        const res = await fetch(`${SERVER_URL}/tts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text,
                voice_id: DEFAULT_VOICE_ID,
                model_id: DEFAULT_MODEL_ID,
                voice_settings: {
                    stability: stabilityMap[pace],
                    similarity_boost: 0.75,
                    style: 0.3,
                    use_speaker_boost: true,
                },
            }),
        });

        if (!res.ok) return false;

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);

        // Stop any currently playing audio
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }

        const audio = new Audio(url);
        audioRef.current = audio;
        audio.playbackRate = pace === 'slow' ? 0.9 : pace === 'fast' ? 1.1 : 1.0;
        audio.onended = () => URL.revokeObjectURL(url);
        audio.onerror = () => URL.revokeObjectURL(url);
        await audio.play();
        return true;
    } catch {
        return false;
    }
}

// Fallback: browser's built-in SpeechSynthesis
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
    _presets?: ComedianPreset[],
) {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    // Track whether ElevenLabs is available (avoid repeated 503 calls)
    const elevenLabsAvailable = useRef<boolean | null>(null);

    const speak = useCallback(async (text: string) => {
        if (!text) return;
        console.log('Host speaking:', text.slice(0, 60));

        // If we haven't tried ElevenLabs yet, or it was previously available, try it
        if (elevenLabsAvailable.current !== false) {
            const success = await elevenLabsSpeak(text, pace, audioRef);
            elevenLabsAvailable.current = success;
            if (success) return;
        }

        // Fallback to browser speech
        browserSpeak(text, pace);
    }, [pace]);

    const stop = useCallback(() => {
        // Stop ElevenLabs audio
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current = null;
        }
        // Stop browser speech
        window.speechSynthesis?.cancel();
    }, []);

    return { speak, stop };
}
