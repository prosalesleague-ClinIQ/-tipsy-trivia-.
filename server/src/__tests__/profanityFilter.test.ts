import { describe, it, expect } from 'vitest';
import { filterName, containsProfanity } from '../filters/ProfanityFilter';

describe('ProfanityFilter', () => {
    it('allows clean names', () => {
        expect(filterName('Alice')).toBe('Alice');
        expect(filterName('Bob123')).toBe('Bob123');
        expect(filterName('Cool_Player!')).toBe('Cool_Player!');
    });

    it('replaces blocked names with Player', () => {
        expect(filterName('shithead')).toBe('Player');
        expect(filterName('FUCK')).toBe('Player');
    });

    it('trims leading/trailing whitespace', () => {
        expect(filterName('  Alice  ')).toBe('Alice');
    });

    it('strips non-allowed characters', () => {
        const result = filterName('Al<>ice');
        expect(result).not.toContain('<');
        expect(result).not.toContain('>');
    });

    it('returns Player for empty name', () => {
        expect(filterName('')).toBe('Player');
        expect(filterName('   ')).toBe('Player');
    });

    it('containsProfanity detects blocked words', () => {
        expect(containsProfanity('this is shit')).toBe(true);
        expect(containsProfanity('this is fine')).toBe(false);
    });
});
