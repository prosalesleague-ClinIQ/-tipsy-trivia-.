import { describe, it, expect } from 'vitest';
import { computeFactHash } from '../questions/PackImporter';

describe('computeFactHash', () => {
    it('returns consistent hash for same prompt', () => {
        const h1 = computeFactHash('Elephants are the only mammals that cannot jump.');
        const h2 = computeFactHash('Elephants are the only mammals that cannot jump.');
        expect(h1).toBe(h2);
    });

    it('normalizes whitespace and case', () => {
        const h1 = computeFactHash('Honey never expires');
        const h2 = computeFactHash('  HONEY   NEVER   EXPIRES  ');
        expect(h1).toBe(h2);
    });

    it('returns different hashes for different prompts', () => {
        const h1 = computeFactHash('Fact one about dogs');
        const h2 = computeFactHash('Fact two about cats');
        expect(h1).not.toBe(h2);
    });

    it('returns a 64-character hex SHA-256 hash', () => {
        const h = computeFactHash('test prompt');
        expect(h).toMatch(/^[a-f0-9]{64}$/);
    });

    it('is idempotent on empty string', () => {
        const h1 = computeFactHash('');
        const h2 = computeFactHash('');
        expect(h1).toBe(h2);
    });
});
