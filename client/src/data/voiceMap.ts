// Maps comedian preset IDs to ElevenLabs voice IDs + per-voice settings.
// Voices chosen for energy/style match. All are ElevenLabs premade voices.
//
// Voice IDs reference:
//   Jeremy  bVMeCyTHy58xNoL34h3p  excited, young American-Irish
//   Patrick ODq5zmih8GrVes37Dizd  commanding, theatrical ("shouty")
//   Charlie IKne3meq5aSn9XLyUdCD  confident, energetic Australian
//   George  JBFqnCBsd6RMkjVDRZzb  raspy, character-rich British
//   Arnold  VR6AewLTigWG4xSOukaG  crisp, powerful American
//   Josh    TxGEqnHWrfWFTfGW9XjX  warm, deep American
//   Adam    pNInz6obpgDQGcFmaJgB  deep, deadpan authoritative

export interface VoiceConfig {
    voice_id: string;
    stability: number;
    similarity_boost: number;
    style: number;
}

export const COMEDIAN_VOICE_MAP: Record<string, VoiceConfig> = {
    kevin_hart:      { voice_id: 'bVMeCyTHy58xNoL34h3p', stability: 0.25, similarity_boost: 0.75, style: 0.72 }, // Jeremy — excited, hyperbolic
    dave_chappelle:  { voice_id: 'JBFqnCBsd6RMkjVDRZzb', stability: 0.45, similarity_boost: 0.78, style: 0.45 }, // George — dry, character-rich
    ali_wong:        { voice_id: 'ODq5zmih8GrVes37Dizd', stability: 0.28, similarity_boost: 0.75, style: 0.68 }, // Patrick — bold, commanding
    john_mulaney:    { voice_id: 'IKne3meq5aSn9XLyUdCD', stability: 0.42, similarity_boost: 0.76, style: 0.52 }, // Charlie — witty, clean
    tiffany_haddish: { voice_id: 'ODq5zmih8GrVes37Dizd', stability: 0.22, similarity_boost: 0.75, style: 0.75 }, // Patrick — loud, celebratory
    bill_burr:       { voice_id: 'VR6AewLTigWG4xSOukaG', stability: 0.30, similarity_boost: 0.76, style: 0.65 }, // Arnold — blunt, ranty
    conan_obrien:    { voice_id: 'bVMeCyTHy58xNoL34h3p', stability: 0.38, similarity_boost: 0.74, style: 0.58 }, // Jeremy — absurdist, self-aware
    trevor_noah:     { voice_id: 'IKne3meq5aSn9XLyUdCD', stability: 0.40, similarity_boost: 0.77, style: 0.50 }, // Charlie — sharp, observational
    jimmy_carr:      { voice_id: 'JBFqnCBsd6RMkjVDRZzb', stability: 0.33, similarity_boost: 0.78, style: 0.62 }, // George — British, rapid one-liners
    sarah_silverman: { voice_id: 'bVMeCyTHy58xNoL34h3p', stability: 0.35, similarity_boost: 0.74, style: 0.60 }, // Jeremy — playful, edgy
    jo_koy:          { voice_id: 'TxGEqnHWrfWFTfGW9XjX', stability: 0.40, similarity_boost: 0.76, style: 0.50 }, // Josh — warm, family-friendly
    hasan_minhaj:    { voice_id: 'bVMeCyTHy58xNoL34h3p', stability: 0.24, similarity_boost: 0.75, style: 0.73 }, // Jeremy — theatrical, high-energy
    nate_bargatze:   { voice_id: 'pNInz6obpgDQGcFmaJgB', stability: 0.62, similarity_boost: 0.80, style: 0.28 }, // Adam — deadpan, slow-burn
    bo_burnham:      { voice_id: 'IKne3meq5aSn9XLyUdCD', stability: 0.44, similarity_boost: 0.76, style: 0.48 }, // Charlie — cerebral, meta
    patton_oswalt:   { voice_id: 'TxGEqnHWrfWFTfGW9XjX', stability: 0.38, similarity_boost: 0.76, style: 0.55 }, // Josh — nerdy, passionate
};

// Default fallback if no preset is selected
export const DEFAULT_VOICE: VoiceConfig = {
    voice_id: 'bVMeCyTHy58xNoL34h3p', // Jeremy
    stability: 0.35,
    similarity_boost: 0.75,
    style: 0.60,
};
